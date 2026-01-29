from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os, re, asyncio, json
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import firestore

from .. import db as db_layer
from ..firebase_admin_init import db as admin_db

load_dotenv()
router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class HelpRouteRequest(BaseModel):
    prompt: str

class HelpRouteResponse(BaseModel):
    agentId: str
    created: bool
    tags: List[str]

def _norm(t: str):
    t = re.sub(r"[^a-z0-9 ]", "", t.lower()).strip()
    return t or None

def _best_match(agents, tags):
    tagset = set(tags)
    best, score = None, 0
    for a in agents:
        specs = set(map(str.lower, a.get("specialties", [])))
        s = len(tagset & specs)
        if s > score:
            best, score = a, s
    return best if score else None

def _extract_tags(prompt, known):
    sys = (
        'Extract up to 2 short lowercase topic tags.\n'
        'Return ONLY valid JSON like {"tags": ["food"]}.\n'
        f"known_tags: {known}"
    )

    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": sys},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )

    try:
        return json.loads(r.choices[0].message.content)["tags"]
    except:
        return []

@router.post("/route", response_model=HelpRouteResponse)
async def route_help(req: HelpRouteRequest):
    agents = await asyncio.to_thread(db_layer.list_agents)
    active = [a for a in agents if a.get("isActive") is not False]

    known = list({s for a in active for s in a.get("specialties", []) if s})
    tags = [_norm(t) for t in _extract_tags(req.prompt, known) if _norm(t)]

    match = _best_match(active, tags)
    if match:
        agent_id = match.get("id") or match.get("agentId")
        return {"agentId": agent_id, "created": False, "tags": tags}

    doc = admin_db.collection("agents").document()
    doc.set({
        "name": "Created Agent",
        "specialties": tags,
        "persona": f"You help with {', '.join(tags)}.",
        "summary": "Auto-created from Help",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "isActive": True,
    })

    return {"agentId": doc.id, "created": True, "tags": tags}
