# backend/db.py
from typing import Optional, List, Dict
from .firebase_admin_init import db  # use relative import if this is inside backend/

COLLECTION = "agents"

# ----- Database functions -----

def create_agent_doc(doc: Dict):
    """
    Create a new agent document in Firestore.
    """
    agent_id = doc.get("id")
    if not agent_id:
        raise ValueError("Document must have an 'id' field")
    db.collection(COLLECTION).document(agent_id).set(doc)

def get_agent_by_id(agent_id: str) -> Optional[Dict]:
    """
    Retrieve an agent by its Firestore document ID.
    """
    snap = db.collection(COLLECTION).document(agent_id).get()
    return snap.to_dict() if snap.exists else None

def list_agents() -> List[Dict]:
    """
    List all agents in the Firestore collection.
    """
    docs = db.collection(COLLECTION).stream()
    return [d.to_dict() for d in docs]
