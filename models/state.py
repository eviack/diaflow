from typing import List, Optional, Annotated, Sequence, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import operator

from typing_extensions import TypedDict

class ChatState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    concepts_to_find: List[str]
    few_shot_examples: List[str]
    generated_code: str
    error_message: Optional[str]
    generation_count: int