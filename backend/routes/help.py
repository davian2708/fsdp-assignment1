from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import re
import asyncio
from dotenv import load_dotenv
from openai import OpenAI
from firebase_admin import firestore

from .. import db as db_layer

load_dotenv()
router = APIRouter()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=10
)

class HelpRouteRequest(BaseModel):
    prompt: str

class HelpRouteResponse(BaseModel):
    agentId: str
    created: bool
    tags: List[str]

def _normalize_tag(t: str) -> Optional[str]:
    if not t:
        return None
    t = t.strip().lower()
    t = re.sub(r"[^a-z0-9 _-]+", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t or None

def _best_match_agent(active_agents: List[Dict[str, Any]], tags: List[str]) -> Optional[Dict[str, Any]]:
    if not tags:
        return None

    tag_set = set([t.lower() for t in tags])

    best = None
    best_score = 0

    for a in active_agents:
        specs = a.get("specialties") or []
        specs_norm = set([str(s).lower() for s in specs if s is not None])

        score = len(tag_set.intersection(specs_norm))
        if score > best_score:
            best_score = score
            best = a

    return best if best_score > 0 else None

def _next_created_agent_number(all_agents: List[Dict[str, Any]]) -> int:
    # Looks for names like "Created Agent (3)"
    pattern = re.compile(r"^Created Agent \((\d+)\)$", re.IGNORECASE)
    nums = []
    for a in all_agents:
        name = (a.get("name") or "").strip()
        m = pattern.match(name)
        if m:
            try:
                nums.append(int(m.group(1)))
            except:
                pass
    return (max(nums) + 1) if nums else 1

def _extract_tags_with_ai(prompt: str, known_tags: List[str]) -> List[str]:
    known_tags = [t for t in (known_tags or []) if t]
    known_tags = list(dict.fromkeys([_normalize_tag(t) for t in known_tags if _normalize_tag(t)]))

    sys = (
        "You extract short topic tags from user prompts.\n"
        "Return ONLY valid JSON with this exact shape: {\"tags\": [\"tag1\", \"tag2\"]}.\n"
        "Rules:\n"
        "- tags must be short (1-2 words)\n"
        "- tags must be lowercase\n"
        "- dedupe tags\n"
        "- prefer using tags from known_tags when they fit\n"
        "- if none fit, invent up to 2 reasonable tags\n"
        f"known_tags: {known_tags}\n"
    )

    resp = client.responses.create(
        model="gpt-4.1",
        input=[
            {"role": "system", "content": [{"type": "input_text", "text": sys}]},
            {"role": "user", "content": [{"type": "input_text", "text": prompt}]},
        ],
        max_output_tokens=120,
    )

    text = (resp.output_text or "").strip()

    try:
        data = __import__("json").loads(text)
        tags = data.get("tags") if isinstance(data, dict) else []
    except Exception:
        # Fallback: try to find something that looks like a JSON array
        m = re.search(r"\[(.*?)\]", text, re.DOTALL)
        if not m:
            return []
        chunk = "[" + m.group(1) + "]"
        try:
            tags = __import__("json").loads(chunk)
        except Exception:
            return []

    if not isinstance(tags, list):
        return []

    out = []
    for t in tags:
        nt = _normalize_tag(str(t))
        if nt and nt not in out:
            out.append(nt)
    return out[:5]

@router.post("/route", response_model=HelpRouteResponse)
async def route_help(req: HelpRouteRequest):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")

    # Load agents from Firestore (same collection frontend uses)
    all_agents = await asyncio.to_thread(db_layer.list_agents)

    active_agents = [a for a in all_agents if a.get("isActive") is not False]

    # Gather tags currently in use (helps the model snap to your existing taxonomy)
    known_tags = []
    for a in active_agents:
        for s in (a.get("specialties") or []):
            if s is None:
                continue
            known_tags.append(str(s))

    try:
        tags = await asyncio.to_thread(_extract_tags_with_ai, prompt, known_tags)
    except Exception as e:
        # AI failure shouldn't brick UX; fallback to simple keywording
        low = prompt.lower()
        tags = []
        for t in set([_normalize_tag(x) for x in known_tags if _normalize_tag(x)]):
            if t and t in low:
                tags.append(t)
        tags = tags[:3]

    # Match
    match = _best_match_agent(active_agents, tags)
    if match:
        return {"agentId": match["id"], "created": False, "tags": tags}

    # Create new agent
    n = _next_created_agent_number(all_agents)
    name = f"Created Agent ({n})"

    if tags:
        summary = f"Helps with {', '.join(tags[:2])}."
        persona = f"You are a helpful assistant specialized in {', '.join(tags)}. Be clear, friendly, and practical."
    else:
        summary = "Helps with user questions."
        persona = "You are a helpful assistant. Be clear, friendly, and practical."

    # Use auto-id document so it matches frontend expectations
    from ..firebase_admin_init import db as admin_db
    doc_ref = admin_db.collection("agents").document()
    agent_id = doc_ref.id

    doc = {
        "name": name,
        "summary": summary,
        "persona": persona,
        "specialties": tags,
        "icon": "🤖",
        "color": "#3a3a3a",
        "tools": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "isActive": True,
    }

    doc_ref.set(doc)

    return {"agentId": agent_id, "created": True, "tags": tags}
