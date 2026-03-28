from typing import TypedDict, Optional

class GraphState(TypedDict):
    subject: Optional[str]
    message: Optional[str]
    intent: Optional[str]
    response: Optional[str]
    step: str