from fastapi import APIRouter, HTTPException, Response
from backend.models import ChatRequest
from backend import db
import os
import openai
from dotenv import load_dotenv

load_dotenv()  # Load OPENAI_API_KEY from .env

router = APIRouter()
openai.api_key = os.getenv("OPENAI_API_KEY")


# ===== HELPER =====
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


# ===== CORS PRE-FLIGHT =====
@router.options("/query")
async def chat_options():
    return Response(status_code=200)


# ===== CHAT ENDPOINT =====
@router.post("/query")
async def chat(req: ChatRequest):
    try:
        # Fetch agent from DB
        agent = db.get_agent_by_id(req.agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Ensure OpenAI API key is loaded
        if not openai.api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key missing. Set OPENAI_API_KEY in .env."
            )

        # Build messages for OpenAI ChatCompletion
        messages = [
            {"role": "system", "content": build_system_prompt(agent)},
            {"role": "user", "content": req.user_message},
        ]

        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": build_system_prompt(agent)},
                {"role": "user", "content": req.user_message},
            ],
            max_tokens=512,
            temperature=0.7,
        )
        answer = resp.choices[0].message.content

        return {"reply": answer}

    except Exception as e:
        # Print full error to terminal for debugging
        print("Error in /agent/query:", e)
        raise HTTPException(status_code=500, detail=str(e))
