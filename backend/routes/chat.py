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

def build_system_prompt(agent: dict, relevant_memory=None) -> str:
    specialties = ", ".join(agent.get("specialties", []))
    persona = agent.get("persona", "")
    summary = agent.get("summary", "")
    name = agent.get("name", "AI Assistant")

    memory_block = ""
    if relevant_memory:
        memory_block = "\nRelevant memory:\n" + "\n".join(
            f"- {m}" for m in relevant_memory
        )

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

    {memory_block}

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

def get_relevant_memory(agent_id: str, user_message: str):
    """
    Simple relevance-based memory retrieval.
    """
    memory = db.get_agent_memory(agent_id)
    if not memory:
        return []

    user_words = set(user_message.lower().split())
    relevant = []

    for mem in memory:
        for word in user_words:
            if word in mem.lower():
                relevant.append(mem)
                break

    return relevant[:5]  # LIMIT to keep prompt small


def extract_memory_from_message(user_message: str):
    """
    Extract simple long-term memory facts from user input.
    Rule-based for now (safe & explainable for presentation).
    """
    memories = []
    text = user_message.lower()

    if "student" in text:
        memories.append("User is a student")

    if "save" in text or "saving" in text:
        memories.append("User is saving money")

    if "car" in text:
        memories.append("User is saving money for a car")

    if "budget" in text:
        memories.append("User is budget-conscious")

    return memories


def is_refusal_reply(reply: str) -> bool:
    reply_lower = reply.lower()

    refusal_patterns = [
        "outside my area of expertise",
        "outside my expertise",
        "outside my scope",
        "i can't help with",
        "i cannot help with",
        "i can't offer",
        "i cannot offer",
        "i only help with",
        "i'm here to help with",
        "i focus on",
        "i specialize in",
        "not related to",
        "not my area"
    ]

    return any(p in reply_lower for p in refusal_patterns)


@router.post("/query")
async def chat(req: ChatRequest):
    # 1. Get agent
    agent = await asyncio.to_thread(get_agent_sync, req.agent_id)

    # Retrieve relevant long-term memory
    relevant_memory = get_relevant_memory(
        req.agent_id,
        req.user_message
    )

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. Detect greeting (config-driven)
    user_text = req.user_message.lower().strip()
    is_greeting = user_text in CONF_RULES["greetings"]

    # 3. Generate AI reply FIRST
    reply = await asyncio.to_thread(
        call_openai_sync,
        build_system_prompt(agent, relevant_memory),
        req.user_message,
        req.image_base64
    )

    
    refusal = is_refusal_reply(reply)

    # 3.5 Save long-term memory (only if NOT a refusal)
    if not refusal:
        new_memories = extract_memory_from_message(req.user_message)

        for mem in new_memories:
            await asyncio.to_thread(
                db.add_agent_memory,
                req.agent_id,
                mem
            )


    # 4. Skip confidence for greetings
    if is_greeting:
        return {
            "reply": reply,
            "confidence": None
        }
    
    # Skip confidence for refusals
    if refusal:
        return {
            "reply": reply,
            "confidence": None
        }

    # CONFIDENCE SIGNALS
    # Long-term memory
    agent_memory = db.get_agent_memory(req.agent_id) or []
    used_long_term_memory = len(relevant_memory) > 0

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
