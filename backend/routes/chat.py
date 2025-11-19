from fastapi import APIRouter, HTTPException
from pydantic import BaseModel  # <- add this
from backend import db
import os
import openai
from ..models import ChatRequest
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

openai.api_key = os.getenv("OPENAI_API_KEY")

def build_system_prompt(agent: dict) -> str:
    specialties = ", ".join(agent.get("specialties", [])) or "general knowledge"
    guidelines = agent.get("guidelines", "")

    return f"""
You are {agent.get('name')} — Role: {agent.get('role')}.
Persona / guidelines: {guidelines}
Specialties: {specialties}

Always follow the persona and role above.
If asked something outside your specialties, politely say you can only discuss your specialty.
"""


@router.post("/")
async def chat(req: ChatRequest):
    agent = db.get_agent_by_id(req.agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not openai.api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key missing. Set OPENAI_API_KEY environment variable."
        )

    messages = [
        {"role": "system", "content": build_system_prompt(agent)},
        {"role": "user", "content": req.user_message},
    ]

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )
        answer = resp["choices"][0]["message"]["content"]
        return {"reply": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))