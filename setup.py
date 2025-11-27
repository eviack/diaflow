import os
import re
import json
import asyncio
import traceback
from dotenv import load_dotenv
from functools import partial
load_dotenv()

import os
import json
import re
import operator
from typing import List, Optional, Annotated, Sequence, Dict, Any

from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_neo4j import Neo4jGraph  # <-- CORRECTED IMPORT
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser

from models.state import ChatState


llm = ChatGroq(temperature=0, model_name="moonshotai/kimi-k2-instruct-0905")

try: 
    graph = Neo4jGraph() 
    print("Neo4j connected.") 
except Exception as e: 
    print("Neo4j connection failed:", e) 
    graph = None


def _llm_to_text(llm_response) -> str:
    """
    Convert common LLM response objects to a text string.
    Handles:
      - plain str
      - objects with .content or .text attributes (e.g. AIMessage)
      - lists/tuples of messages (take first)
      - dicts with 'content' or 'text' keys
      - LangChain LLMResult-like objects with .generations or .generations[0][0].text
    """
    if llm_response is None:
        return ""
    if isinstance(llm_response, str):
        return llm_response
    if isinstance(llm_response, (list, tuple)) and len(llm_response) > 0:
        return _llm_to_text(llm_response[0])
    if hasattr(llm_response, "content"):
        return getattr(llm_response, "content") or ""
    if hasattr(llm_response, "text"):
        return getattr(llm_response, "text") or ""
    try:
        gens = getattr(llm_response, "generations", None)
        if gens:
            first = gens[0]
            if isinstance(first, (list, tuple)):
                cand = first[0]
            else:
                cand = first
            if hasattr(cand, "text"):
                return cand.text or ""
            if isinstance(cand, str):
                return cand
    except Exception:
        pass
    if isinstance(llm_response, dict):
        for key in ("content", "text", "response"):
            if key in llm_response and isinstance(llm_response[key], str):
                return llm_response[key]
    return str(llm_response)

def _extract_first_json_object(text: str) -> Dict:
    """Find and return the first JSON object in `text`."""
    if not text:
        raise ValueError("Empty LLM response.")
    text = re.sub(r"```(?:json|js|python|text)?\n?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON-like object found.")
    depth = 0
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:i+1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    cand2 = re.sub(r",\s*}", "}", candidate)
                    cand2 = re.sub(r",\s*]", "]", cand2)
                    cand2 = cand2.replace("\n", " ")
                    try:
                        return json.loads(cand2)
                    except json.JSONDecodeError:
                        break
    raise ValueError("Could not parse JSON object from LLM response.")

# ---------- Analyst agent ----------
def analyst_agent(state: Dict, llm: Any) -> Dict:
    print("--- 1. Analyst Agent (stable prompt) ---")
    try:
        user_request = state["messages"][-1].content
    except Exception:
        user_request = state.get("user_request") or str(state.get("messages", [""])[-1])

    ALL_CONCEPTS = [
        "Flowchart", "UNet", "Encoder_Block", "Decoder_Block", "Skip_Connection",
        "Bottleneck_Layer", "Data_Flow", "Layout_Horizontal", "Layout_Vertical",
        "Attention_Mechanism", "Residual_Connection", "Transformer"
    ]

    prompt = f"""
You are an expert analyst for a diagram generation system. Your job:
 - Read the user's request below.
 - Choose the most relevant concepts from the list and return a single JSON object like:
   {{ "concepts_to_find": ["UNet", "Encoder_Block", "Decoder_Block"] }}

Available concepts:
{', '.join(ALL_CONCEPTS)}

User Request:
\"\"\"{user_request}\"\"\"

IMPORTANT: Respond with ONLY one JSON object and nothing else.
"""

    try:
        if hasattr(llm, "invoke"):
            raw = llm.invoke(prompt)
        elif callable(llm):
            raw = llm(prompt)
        elif hasattr(llm, "generate"):
            raw = llm.generate([prompt])
        else:
            raw = llm(prompt)
    except TypeError:
        try:
            raw = llm(prompt)
        except Exception as e:
            raw = f"LLM call failed: {e}"

    text = _llm_to_text(raw)

    concepts_to_find: List[str] = []
    try:
        parsed = _extract_first_json_object(text)
        maybe = parsed.get("concepts_to_find") if isinstance(parsed, dict) else None
        if isinstance(maybe, list):
            concepts_to_find = maybe
        else:
            if isinstance(parsed, list):
                concepts_to_find = parsed
            elif isinstance(parsed, str):
                concepts_to_find = [parsed]
    except Exception as e:
        print(f"[Analyst] Failed to parse LLM output as JSON: {e}")
        lowered = user_request.lower() if isinstance(user_request, str) else ""
        for c in ALL_CONCEPTS:
            if c.lower() in lowered:
                concepts_to_find.append(c)
    print(f"Concepts to find: {concepts_to_find}")
    return {"concepts_to_find": concepts_to_find, "generation_count": 1}



def retriever_agent(state: ChatState):
    print("--- 2. Retriever Agent ---")
    concepts_to_find = state["concepts_to_find"]
    if not concepts_to_find:
        print("No concepts found, skipping retrieval.")
        return {"few_shot_examples": []}

    cypher_query = """
    UNWIND $concepts_to_find AS concept_name
    MATCH (sc:SemanticConcept {name: concept_name})
    MATCH (d:Diagram)-[*1..3]->(sc)
    WITH d, COUNT(DISTINCT sc) AS score
    RETURN d.full_code AS code
    ORDER BY score DESC
    LIMIT 2
    """

    print(f"Running Cypher query...")
    results = graph.query(cypher_query, params={"concepts_to_find": concepts_to_find})
    few_shot_examples = [r["code"] for r in results if r.get("code")]
    print(f"Retrieved {len(few_shot_examples)} few-shot examples.")
    return {"few_shot_examples": few_shot_examples}


def _extract_graphviz_from_text(text: str) -> str:
    """Locate the first 'digraph' and try to extract a balanced digraph block."""
    if not text:
        return ""
    # remove markdown fences
    text = re.sub(r"```(?:graphviz)?\n?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)
    idx = text.find("digraph")
    if idx == -1:
        # fallback: return full text
        return text.strip()
    start = idx
    depth = 0
    found = False
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            depth += 1
            found = True
        elif ch == "}":
            depth -= 1
            if depth == 0 and found:
                return text[start:i+1].strip()
    # if we didn't find balanced, return everything from 'digraph'
    return text[start:].strip()

def generator_agent(state: ChatState):
    print(f"--- 3. Generator Agent (Attempt {state['generation_count']}) ---")
    try:
        user_request = state["messages"][-1].content
    except Exception:
        user_request = state.get("user_request", "")

    few_shot_examples = state.get("few_shot_examples", [])
    error_message = state.get("error_message")

    prompt_lines = [
        "You are a world-class Graphviz/dot designing expert.",
        "Generate a complete Graphviz DOT code snippet based on the user's request.",
        "You MUST follow the style (colors, shapes, layout) of the provided 'Few-Shot Examples'. Take inspiration.",
        "Do not add any comments or explanations. Respond *only* with the complete `digraph ... { ... }` code block.",
        "Ensure the code is 100% syntactically correct."
    ]

    if error_message:
        print(f"Retrying with error: {error_message}")
        prompt_lines.append("\n--- IMPORTANT ---")
        prompt_lines.append(f"Your previous attempt failed. Fix this error: {error_message}")
        prompt_lines.append(f"-----------------\n")

    if few_shot_examples:
        prompt_lines.append("Here are high-quality examples to learn from:\n")
        for i, example in enumerate(few_shot_examples):
            prompt_lines.append(f"--- FEW-SHOT EXAMPLE {i+1} ---")
            prompt_lines.append(example)
            prompt_lines.append(f"--- END EXAMPLE {i+1} ---\n")

    prompt_lines.append(f"Now, generate the code for this user request:")
    prompt_lines.append(f"USER REQUEST: \"{user_request}\"")
    prompt_lines.append("\nFINAL CODE:")

    final_prompt = "\n".join(prompt_lines)

    try:
        raw = llm.invoke(final_prompt) if hasattr(llm, "invoke") else llm(final_prompt)
    except Exception as e:
        raw = f"LLM invocation failed: {e}"

    response_text = _llm_to_text(raw)
    generated_code = _extract_graphviz_from_text(response_text)

    print("Code generated.")
    return {"generated_code": generated_code, "error_message": None}


def validator_node(state: ChatState):
    print("--- 4. Validator Node ---")
    code = state.get("generated_code", "")
    if not code.strip().startswith("digraph"):
        error_msg = "Validation Failed: Code does not start with 'digraph'."
        print(error_msg)
        return {"error_message": error_msg, "generation_count": state["generation_count"] + 1}
    if code.count("{") != code.count("}"):
        error_msg = "Validation Failed: Mismatched curly braces."
        print(error_msg)
        return {"error_message": error_msg, "generation_count": state["generation_count"] + 1}
    print("Validation Passed!")
    return {"error_message": None, "generated_code": code}


def format_response_node(state: ChatState):
    print("--- 5. Formatting Response ---")
    code = state.get("generated_code", "")
    error = state.get("error_message")
    if error:
        response_content = f"Sorry, I tried to generate the code but failed after {state['generation_count'] - 1} attempts.\nLast error: {error}"
    else:
        response_content = f"Here is the generated Graphviz code:\n\n```graphviz\n{code}\n```"
    return {"messages": [AIMessage(content=response_content)]}



# ---------- Reflect / Repair Agent ----------
def reflect_agent(state: ChatState, llm: Any):
    """
    When validation fails, ask the LLM to reflect on the validator error and
    return a corrected Graphviz `digraph { ... }` block.
    Returns: dict with 'generated_code' and optionally 'error_message'.
    """
    print("--- REFLECT Agent: analyzing failure and proposing fix ---")
    prev_code = state.get("generated_code", "")
    last_error = state.get("error_message", "Unknown validation error")

    prompt = f"""
You are a Graphviz expert and code repair assistant.
A previous generated Graphviz DOT failed validation with the error:
{last_error}

Here is the previous DOT that failed (do not output anything else besides the fixed code):
---
{prev_code}
---

Please FIX the DOT to be syntactically correct and preserve the original diagram intent:
- Ensure it starts with `digraph` and has balanced braces.
- Remove any invalid tokens or attributes.
- If you change attribute names or node ids, keep them semantically similar.

Respond ONLY with the corrected `digraph ... {{ ... }}` content and nothing else.
"""
    # Call LLM (use same flexible call pattern as elsewhere)
    try:
        raw = llm.invoke(prompt) if hasattr(llm, "invoke") else (llm(prompt) if callable(llm) else llm.generate([prompt]))
    except Exception as e:
        print(f"[REFLECT] LLM call failed: {e}")
        return {"generated_code": prev_code, "error_message": f"Reflect LLM error: {e}"}

    text = _llm_to_text(raw)
    fixed = _extract_graphviz_from_text(text)
    if not fixed.strip():
        return {"generated_code": prev_code, "error_message": "Reflect failed to return a digraph block."}

    print("[REFLECT] Produced a candidate fix.")
    # Increase generation_count so validator knows it's a retry
    return {"generated_code": fixed, "error_message": None, "generation_count": state.get("generation_count", 1) + 1}


def route_after_validation(state: ChatState):
    """
    If there is an error and we haven't exceeded retries, route to 'reflect'
    which will attempt to repair; otherwise end and format response.
    """
    if state.get("error_message"):
        if state.get("generation_count", 0) >= 3:
            print("Max retries reached. Formatting error response.")
            return "end"
        else:
            print("Routing to reflector for automated repairs.")
            return "reflect"
    return "end"


# ---- Build the agent graph ----
print("Building the agent graph...")
workflow = StateGraph(ChatState)

# Nodes
workflow.add_node("analyst", partial(analyst_agent, llm=llm))
workflow.add_node("retriever", retriever_agent)
workflow.add_node("generator", generator_agent)
workflow.add_node("validator", validator_node)
workflow.add_node("reflect", partial(reflect_agent, llm=llm))
workflow.add_node("format_response", format_response_node)

# Entry point
workflow.set_entry_point("analyst")

# Core edges
workflow.add_edge("analyst", "retriever")
workflow.add_edge("retriever", "generator")
workflow.add_edge("generator", "validator")


workflow.add_conditional_edges(
    "validator",
    route_after_validation,
    {"reflect": "reflect", "end": "format_response"}
)

# After reflection, retry generation
workflow.add_edge("reflect", "generator")

# Final edge: when formatting done → END
workflow.add_edge("format_response", END)

# Compile
agent_app = workflow.compile()


