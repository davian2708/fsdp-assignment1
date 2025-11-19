import json
import os
from typing import Optional, List, Dict
from typing import Dict, Optional, List
from backend.firebase_admin_init import db

COLLECTION = "agents"

def create_agent_doc(doc: Dict):
    agent_id = doc["id"]
    db.collection(COLLECTION).document(agent_id).set(doc)

def get_agent_by_id(agent_id: str) -> Optional[Dict]:
    snap = db.collection(COLLECTION).document(agent_id).get()
    return snap.to_dict() if snap.exists else None

def list_agents() -> List[Dict]:
    docs = db.collection(COLLECTION).stream()
    return [d.to_dict() for d in docs]