from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum

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
    user_message: str
    image_base64: Optional[str] = None
    chain: Optional[Dict] = None

# === FEEDBACK SYSTEM ===
class FeedbackType(str, Enum):
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    FLAG_INCORRECT = "flag_incorrect"

class FeedbackRequest(BaseModel):
    chat_id: str
    message_id: str
    agent_id: str
    feedback_type: FeedbackType
    user_comment: Optional[str] = ""

# === KNOWLEDGE BASE ===
class DocumentMetadata(BaseModel):
    source_type: str
    source_url: Optional[str] = None
    file_name: Optional[str] = None

class KnowledgeBaseUploadRequest(BaseModel):
    agent_id: str
    content: str
    metadata: DocumentMetadata

class FaqEntry(BaseModel):
    question: str
    answer: str
    category: Optional[str] = ""

class FaqBuilderRequest(BaseModel):
    agent_id: str
    faq_entries: List[FaqEntry]

# === RESPONSE SAVING ===
class SaveResponseRequest(BaseModel):
    agent_id: str
    user_message: str
    bot_response: str
    chat_id: Optional[str] = None
    tags: Optional[List[str]] = []

# === MULTI-BOT LINKING ===
class AgentLinkRequest(BaseModel):
    primary_agent_id: str
    secondary_agent_id: str
class AgentChainRequest(BaseModel):
    primary_agent_id: str
    secondary_agent_id: str
    user_message: str
    pass_context: bool = True