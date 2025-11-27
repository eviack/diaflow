# main.py
import asyncio
from typing import Any, Dict, List, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import json
from fastapi.middleware.cors import CORSMiddleware

from setup import agent_app, graph

app = FastAPI(title="Graphviz Agent API (ChatState)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from models.state import ChatState

class DrawRequest(BaseModel):
    prompt: str


@app.get("/health")
async def health():
    """
    Basic health check. Returns neo4j connectivity info and whether agent_app is present.
    """
    status = {"status": "ok", "neo4j": "disconnected", "agent": "ok"}
    if graph:
        try:
            
            loop = asyncio.get_running_loop()
            res = await loop.run_in_executor(None, lambda: graph.query("RETURN 1"))
            status["neo4j"] = "connected"
            status["neo4j_result"] = res
        except Exception as e:
            status["neo4j"] = "error"
            status["neo4j_error"] = str(e)
    else:
        status["neo4j"] = "not_configured"

    # agent_app presence
    if not hasattr(agent_app, "invoke") and not hasattr(agent_app, "ainvoke"):
        status["agent"] = "missing_invoke_api"

    return status


@app.post("/draw", response_model=ChatState)
async def draw_diagram(request: DrawRequest):
    """
    Main endpoint: Accepts a natural language prompt and returns Graphviz DOT code.
    """
    try:
        # Initialize state
        initial_state = {
            "messages": [HumanMessage(content=request.prompt)],
            "generation_count": 0,
            "concepts_to_find": [],
            "few_shot_examples": [],
            "generated_code": "",
            "error_message": None
        }
        
        if hasattr(agent_app, "ainvoke"):
            final_state = await agent_app.ainvoke(initial_state)
        else:
            final_state = agent_app.invoke(initial_state)
        

        return final_state

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")



@app.post("/draw/stream")
async def draw_diagram(request: DrawRequest):
    """
    Streams agent progress and the final result using Server-Sent Events (SSE).
    """
    async def stream_graph():
        # Initialize state
        initial_state = {
            "messages": [HumanMessage(content=request.prompt)],
            "generation_count": 0,
            "concepts_to_find": [],
            "few_shot_examples": [],
            "generated_code": "",
            "error_message": None
        }

    
        async for event in agent_app.astream(initial_state):
            for node_name, node_state in event.items():
                # Create a user-friendly message based on the active node
                message = f"Agent step completed: {node_name}"
                if node_name == "analyst":
                    concepts = node_state.get("concepts_to_find", [])
                    message = f"Analyst identified concepts: {', '.join(concepts)}"
                elif node_name == "retriever":
                    count = len(node_state.get("few_shot_examples", []))
                    message = f"Retriever found {count} relevant examples."
                elif node_name == "generator":
                    message = "Generator creates initial diagram"
                elif node_name == "validator":
                    err = node_state.get("error_message")
                    message = f"Validator found issues: {err}" if err else "Validation passed."
                elif node_name == "reflect":
                    message = "Reflect agent is attempting to fix errors..."

                # Yield progress event
                progress_data = {
                    "type": "progress", 
                    "node": node_name, 
                    "message": message
                }
                yield f"data: {json.dumps(progress_data)}\n\n"

        final_state = await agent_app.ainvoke(initial_state)
        
        dot_code = final_state.get("generated_code", "")
        error = final_state.get("error_message")
        final_msg_content = final_state["messages"][-1].content if final_state["messages"] else ""

        # Construct final response payload
        status = "success"
        if error and not dot_code:
            status = "error"

        result_payload = {
            "type": "result",
            "dot_code": dot_code,
            "status": status,
            "final_message": final_msg_content
        }
        
        yield f"data: {json.dumps(result_payload)}\n\n"
        
        # Signal end of stream
        yield "event: close\ndata: \n\n"

    return StreamingResponse(stream_graph(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
