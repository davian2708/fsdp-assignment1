from fastapi import APIRouter, HTTPException
from .. import db
import os
import openai
from openai import OpenAI
from ..models import ChatRequest
from dotenv import load_dotenv
import asyncio
from fastapi import Response
import json

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CONF_PATH = os.path.join(BASE_DIR, "confidence_rules.json")

with open(CONF_PATH, "r") as f:
    CONF_RULES = json.load(f)

load_dotenv()
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

    return f"""
    You are an AI assistant named {name}.

    LANGUAGE RULE (VERY IMPORTANT):
    - Always respond in the SAME language as the user's question
    - If the user switches languages, switch with them
    - Do NOT mention language detection

    Persona:
    {persona}

    Summary:
    {summary}

    Specialties:
    {specialties}

    STRICT DOMAIN RULES (VERY IMPORTANT):
    - You MUST ONLY answer questions directly related to your specialties.
    - If a question is NOT related to your specialties:
    - You MUST politely refuse.
    - You MUST NOT answer the question.
    - You MUST NOT give tips, examples, or partial help.
    - You MUST suggest what you CAN help with instead.
    - Do NOT guess.
    - Do NOT stretch your expertise.
    - Do NOT answer "just to be helpful".

    Response style rules:
    - Sound like a friendly human, not a robot.
    - Keep responses short and conversational.
    - Do NOT use bullet points unless explicitly asked.
    - Use at most ONE emoji if it feels natural.
    - Always end with exactly ONE gentle follow-up question.
    - The follow-up question must be on its own line.

    If the user uploads an image:
    - Describe what you see first.
    - ONLY continue if the image is related to your specialties.
    """

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
    # 1. Get agent
    agent = await asyncio.to_thread(get_agent_sync, req.agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. Detect greeting (config-driven)
    user_text = req.user_message.lower().strip()
    is_greeting = user_text in CONF_RULES["greetings"]

    # 3. Generate AI reply FIRST
    reply = await asyncio.to_thread(
        call_openai_sync,
        build_system_prompt(agent),
        req.user_message,
        req.image_base64
    )

    # 4. Skip confidence for greetings
    if is_greeting:
        return {
            "reply": reply,
            "confidence": None
        }

    # CONFIDENCE SIGNALS
    # Long-term memory
    agent_memory = agent.get("memory", []) if isinstance(agent, dict) else []
    used_long_term_memory = len(agent_memory) > 0

    # External knowledge (future extension)
    used_external_knowledge = False

    # Vague question detection (config-driven)
    is_vague = len(req.user_message.strip()) < CONF_RULES["min_length"]

    if not is_vague:
        for phrase in CONF_RULES["vague_keywords"]:
            if phrase in user_text:
                is_vague = True
                break

    # Override: long, structured questions are not vague
    if len(req.user_message.strip()) > CONF_RULES["clear_length"]:
        is_vague = False

    # Conflicting memory (simple heuristic)
    has_conflict = False
    for mem in agent_memory:
        if "short" in mem.lower() and "detailed" in user_text:
            has_conflict = True

    # CONFIDENCE SCORING
    score = 100
    reasons = []

    if not used_long_term_memory:
        score -= 25
        reasons.append("Limited long-term memory available")

    if not used_external_knowledge:
        score -= 20
        reasons.append("No external knowledge enabled")

    if is_vague:
        score -= 30
        reasons.append("User question is vague")

    if len(req.user_message.strip()) < 10:
        score -= 20
        reasons.append("Insufficient input detail")

    if has_conflict:
        score -= 20
        reasons.append("Conflicting memory detected")

    # Positive signal: clear & specific input
    if len(req.user_message.strip()) > CONF_RULES["clear_length"] and not is_vague:
        score += 10
        reasons.append("Clear and specific question")

    score = min(score, 100)

    if score >= 60:
        level = "high"
    elif score >= 30:
        level = "medium"
    else:
        level = "low"

    return {
        "reply": reply,
        "confidence": {
            "score": score,
            "level": level,
            "reasons": reasons
        }
    }
