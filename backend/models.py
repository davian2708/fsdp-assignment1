from pydantic import BaseModel
from typing import List, Optional

class AgentCreateRequest(BaseModel):
    name: str
    role: str
    persona: Optional[str] = ""
    specialties: Optional[List[str]] = []
    guidelines: Optional[str] = ""
    color: Optional[str] = "#3a3a3a"
    icon: Optional[str] = "🤖"

class ChatRequest(BaseModel):
    agent_id: str
    user_message: Optional[str] = None
    image_base64: Optional[str] = None