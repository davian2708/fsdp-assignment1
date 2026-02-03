from fastapi import APIRouter, HTTPException
from uuid import uuid4
from models import AgentCreateRequest
import db

router = APIRouter()

@router.post("/", status_code=201)
async def create_agent(req: AgentCreateRequest):
    agent_id = str(uuid4())

    doc = {
        "id": agent_id,
        "name": req.name,
        "role": req.role,
        "persona": req.persona or "",
        "specialties": req.specialties or [],
        "guidelines": req.guidelines or "",
        "color": req.color,
        "icon": req.icon,
    }

    db.create_agent_doc(doc)
    return doc


@router.get("/")
async def get_agents():
    return db.list_agents()


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    agent = db.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/from_persona", status_code=201)
async def create_agent_from_persona(payload: dict):
    agent_id = str(uuid4())
    name = payload.get("name") or f"agent_{agent_id[:8]}"
    role = payload.get("role") or ""
    persona = payload.get("persona") or ""

    doc = {
        "id": agent_id,
        "name": name,
        "role": role,
        "persona": persona,
        "specialties": [],
        "guidelines": "",
        "color": "#3a3a3a",
        "icon": "🤖",
    }

    db.create_agent_doc(doc)
    return doc
