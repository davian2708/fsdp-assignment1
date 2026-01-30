# backend/db.py
from typing import Optional, List, Dict
from datetime import datetime
from .firebase_admin_init import db

COLLECTION_AGENTS = "agents"
COLLECTION_FEEDBACK = "feedback"
COLLECTION_KB = "knowledge_base"
COLLECTION_SAVED_RESPONSES = "saved_responses"
COLLECTION_AGENT_CHAINS = "agent_chains"

# ===== AGENT FUNCTIONS =====

def create_agent_doc(doc: Dict):
    """
    Create a new agent document in Firestore.
    """
    agent_id = doc.get("id")
    if not agent_id:
        raise ValueError("Document must have an 'id' field")
    db.collection(COLLECTION_AGENTS).document(agent_id).set(doc)

def get_agent_by_id(agent_id: str) -> Optional[Dict]:
    snap = db.collection(COLLECTION_AGENTS).document(agent_id).get()
    if not snap.exists:
        return None

    data = snap.to_dict()
    data["id"] = snap.id  #  REQUIRED
    return data

def list_agents() -> List[Dict]:
    docs = db.collection(COLLECTION_AGENTS).stream()
    agents = []

    for d in docs:
        data = d.to_dict()
        data["id"] = d.id  #  REQUIRED
        agents.append(data)

    return agents

# ===== FEEDBACK FUNCTIONS =====

def save_feedback(feedback_data: Dict):
    """
    Save user feedback (thumbs up/down, comments, flagged responses).
    """
    feedback_data["created_at"] = datetime.now().isoformat()
    doc_id = f"{feedback_data.get('chat_id')}_{feedback_data.get('message_id')}"
    db.collection(COLLECTION_FEEDBACK).document(doc_id).set(feedback_data)
    return doc_id

def get_feedback_for_agent(agent_id: str) -> List[Dict]:
    """
    Get all feedback for a specific agent.
    """
    docs = db.collection(COLLECTION_FEEDBACK).where("agent_id", "==", agent_id).stream()
    return [d.to_dict() for d in docs]

def get_feedback_stats(agent_id: str) -> Dict:
    """
    Get feedback statistics (thumbs up/down counts, flagged responses).
    """
    feedback = get_feedback_for_agent(agent_id)
    stats = {
        "thumbs_up": 0,
        "thumbs_down": 0,
        "flagged": 0,
        "total_comments": 0,
    }
    for item in feedback:
        feedback_type = item.get("feedback_type")
        if feedback_type == "thumbs_up":
            stats["thumbs_up"] += 1
        elif feedback_type == "thumbs_down":
            stats["thumbs_down"] += 1
        elif feedback_type == "flag_incorrect":
            stats["flagged"] += 1
        if item.get("user_comment"):
            stats["total_comments"] += 1
    return stats

# ===== KNOWLEDGE BASE FUNCTIONS =====

def save_kb_document(agent_id: str, content: str, metadata: Dict):
    """
    Save a knowledge base document for an agent.
    """
    doc_data = {
        "agent_id": agent_id,
        "content": content,
        "metadata": metadata,
        "created_at": datetime.now().isoformat(),
    }
    doc_ref = db.collection(COLLECTION_KB).document()
    doc_ref.set(doc_data)
    return doc_ref.id

def get_kb_documents(agent_id: str) -> List[Dict]:
    """
    Get all knowledge base documents for an agent.
    """
    docs = db.collection(COLLECTION_KB).where("agent_id", "==", agent_id).stream()
    return [d.to_dict() for d in docs]

def save_faq(agent_id: str, faq_entries: List[Dict]):
    """
    Save FAQ entries for an agent.
    """
    for entry in faq_entries:
        faq_doc = {
            "agent_id": agent_id,
            "question": entry.get("question"),
            "answer": entry.get("answer"),
            "category": entry.get("category", ""),
            "created_at": datetime.now().isoformat(),
        }
        db.collection(COLLECTION_KB).document().set(faq_doc)

# ===== RESPONSE SAVING FUNCTIONS =====

def save_response(agent_id: str, user_message: str, bot_response: str, tags: List[str] = None):
    """
    Save a bot response for later reference/bookmarking.
    """
    response_data = {
        "agent_id": agent_id,
        "user_message": user_message,
        "bot_response": bot_response,
        "tags": tags or [],
        "created_at": datetime.now().isoformat(),
        "likes": 0,  # for users to rate saved responses
    }
    doc_ref = db.collection(COLLECTION_SAVED_RESPONSES).document()
    doc_ref.set(response_data)
    return doc_ref.id

def get_saved_responses(agent_id: str, tags: List[str] = None) -> List[Dict]:
    """
    Get saved responses for an agent, optionally filtered by tags.
    """
    query = db.collection(COLLECTION_SAVED_RESPONSES).where("agent_id", "==", agent_id)
    if tags:
        query = query.where("tags", "array-contains-any", tags)
    docs = query.stream()
    return [d.to_dict() for d in docs]

# ===== MULTI-BOT LINKING FUNCTIONS =====

def create_agent_chain(primary_agent_id: str, secondary_agent_id: str):
    """
    Create a link between two agents for chaining responses.
    """
    chain_data = {
        "primary_agent_id": primary_agent_id,
        "secondary_agent_id": secondary_agent_id,
        "created_at": datetime.now().isoformat(),
    }
    doc_ref = db.collection(COLLECTION_AGENT_CHAINS).document()
    doc_ref.set(chain_data)
    return doc_ref.id

def get_agent_chains(agent_id: str) -> List[Dict]:
    """
    Get all agents linked to this agent (primary or secondary).
    """
    try:
        primary_docs = list(db.collection(COLLECTION_AGENT_CHAINS).where("primary_agent_id", "==", agent_id).stream())
        secondary_docs = list(db.collection(COLLECTION_AGENT_CHAINS).where("secondary_agent_id", "==", agent_id).stream())
        all_chains = [d.to_dict() for d in primary_docs + secondary_docs]
        return all_chains
    except Exception as e:
        return []

def save_chain_conversation(primary_agent_id: str, secondary_agent_id: str, user_message: str, primary_response: str, secondary_response: str):
    """
    Save a multi-agent conversation chain.
    """
    chain_data = {
        "primary_agent_id": primary_agent_id,
        "secondary_agent_id": secondary_agent_id,
        "user_message": user_message,
        "primary_response": primary_response,
        "secondary_response": secondary_response,
        "created_at": datetime.now().isoformat(),
    }
    db.collection("chain_conversations").document().set(chain_data)

# ===== AGENT MEMORY FUNCTIONS =====

def get_agent_memory(agent_id: str) -> List[str]:
    """
    Retrieve long-term memory entries for an agent.
    """
    agent = get_agent_by_id(agent_id)
    if not agent:
        return []

    return agent.get("memory", [])


def add_agent_memory(agent_id: str, memory_item: str):
    """
    Append a new memory entry to an agent.
    """
    ref = db.collection(COLLECTION_AGENTS).document(agent_id)
    snap = ref.get()

    if not snap.exists:
        return False

    data = snap.to_dict()
    memory = data.get("memory", [])

    if memory_item not in memory:
        memory.append(memory_item)
        ref.update({"memory": memory})

    return True
