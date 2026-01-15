from fastapi import APIRouter, HTTPException
import db
import os
import openai
from models import ChatRequest
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

router = APIRouter()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=10
)

def build_system_prompt(agent: dict) -> str:
    specialties = ", ".join(agent.get("specialties", []))
    persona = agent.get("persona", "")
    summary = agent.get("summary", "")
    name = agent.get("name", "AI Assistant")

    return (
        f"You are {name}.\n"
        f"Persona: {persona}\n"
        f"Summary: {summary}\n"
        f"Specialties: {specialties}\n\n"

        "IMPORTANT RESPONSE BEHAVIOR:\n"
        "You are having a natural chat with a human.\n"
        "Speak like a friendly person, not a bot.\n\n"

        "Formatting rules you MUST follow:\n"
        "Casual conversation, jokes, encouragement, and stories must be written as normal sentences and short paragraphs.\n"
        "Do NOT use bullet points, dashes, stars, or lists for these responses.\n"
        "Bullet points are allowed ONLY when the user explicitly asks for tips, steps, or advice.\n"
        "If bullet points are used, limit them to at most two items.\n\n"

        "Style rules:\n"
        "Keep responses short and easy to read.\n"
        "Avoid long paragraphs.\n"
        "Do not sound academic, clinical, or instructional unless asked.\n"
        "Use at most one emoji, and only when it feels natural.\n"
        "Always end with exactly one gentle follow-up question.\n"
        "The follow-up question must always be placed on its own line, separated by a blank line from the main response.\n"

        "If an image is provided:\n"
        "- You must look at the image carefully.\n"
        "- Identify the drink or ingredients shown.\n"
        "- Describe what you see before giving advice.\n\n"
    )

@router.options("/query")
async def chat_options():
    return Response(status_code=200)

def get_agent_sync(agent_id: str):
    return db.get_agent_by_id(agent_id)

def call_openai_sync(system_prompt, user_text, image_base64=None):
    content = []

    if user_text:
        content.append({
            "type": "input_text",
            "text": user_text
        })

    if image_base64:
        content.append({
            "type": "input_image",
            "image_url": image_base64
        })

    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "input_text",
                        "text": system_prompt
                    }
                ]
            },
            {
                "role": "user",
                "content": content
            }
        ],
        max_output_tokens=300,
    )

    return response.output_text

@router.post("/query")
async def chat(req: ChatRequest):
    print("Chat endpoint hit")
    print("Incoming request:", req.agent_id, req.user_message)
    print("IMAGE RECEIVED:", bool(req.image_base64))

    try:
        agent = await asyncio.to_thread(get_agent_sync, req.agent_id)
    except Exception as e:
        print("Firestore error:", e)
        raise HTTPException(status_code=500, detail="Firestore error")

    print("Agent fetched:", agent)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        reply = await asyncio.wait_for(
            asyncio.to_thread(
                call_openai_sync,
                build_system_prompt(agent),
                req.user_message,
                req.image_base64
            ),
            timeout=25
        )
        print("OpenAI replied")
        return {"reply": reply}

    except asyncio.TimeoutError:
        return {"reply": "AI response timed out. Please try again."}

    except Exception as e:
        print("OPENAI ERROR:", e)
        raise HTTPException(status_code=500, detail="AI service error")
