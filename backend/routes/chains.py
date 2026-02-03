from fastapi import APIRouter, HTTPException
from models import AgentChainRequest, AgentLinkRequest
import db
from openai import OpenAI
import os
from dotenv import load_dotenv
from langdetect import detect, LangDetectException

load_dotenv()
router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _language_name(lang_code: str) -> str:
    mapping = {
        "en": "English",
        "es": "Spanish",
        "zh-cn": "Chinese",
        "zh": "Chinese",
        "fr": "French",
        "de": "German",
        "ja": "Japanese",
        "ko": "Korean",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian",
        "ar": "Arabic",
        "hi": "Hindi",
        "th": "Thai",
        "vi": "Vietnamese",
        "id": "Indonesian",
        "ms": "Malay",
        "tr": "Turkish",
        "nl": "Dutch",
        "sv": "Swedish",
        "no": "Norwegian",
        "da": "Danish",
        "fi": "Finnish",
        "pl": "Polish",
        "uk": "Ukrainian",
        "el": "Greek",
        "he": "Hebrew",
    }
    return mapping.get(lang_code, lang_code or "English")


def detect_language(text: str) -> str:
    if not text:
        return "English"
    cleaned = " ".join(text.strip().split())
    lowered = cleaned.lower()

    # Short greeting heuristics (langdetect is unreliable for very short text)
    greeting_map = {
        "hello": "English",
        "hi": "English",
        "hey": "English",
        "yo": "English",
        "sup": "English",
        "hola": "Spanish",
        "bonjour": "French",
        "salut": "French",
        "ciao": "Italian",
        "hallo": "German",
        "guten tag": "German",
        "ola": "Portuguese",
        "oi": "Portuguese",
        "hej": "Swedish",
        "hei": "English",
    }

    if len(lowered) <= 20:
        if lowered in greeting_map:
            return greeting_map[lowered]

        # If it's short ASCII-only text and not a known greeting, default to English
        if all(ord(ch) < 128 for ch in lowered):
            return "English"

    # Unicode script heuristics for CJK languages (more reliable for short text)
    for ch in text:
        code = ord(ch)
        # Hangul Syllables/Hangul Jamo -> Korean
        if 0xAC00 <= code <= 0xD7AF or 0x1100 <= code <= 0x11FF or 0x3130 <= code <= 0x318F:
            return "Korean"
        # Hiragana/Katakana -> Japanese
        if 0x3040 <= code <= 0x309F or 0x30A0 <= code <= 0x30FF:
            return "Japanese"
        # CJK Unified Ideographs -> Chinese (default)
        if 0x4E00 <= code <= 0x9FFF:
            return "Chinese"
    try:
        code = detect(text)
        return _language_name(code)
    except LangDetectException:
        return "English"

def build_system_prompt(agent: dict) -> str:
    specialties = ", ".join(agent.get("specialties", [])) or "general knowledge"
    guidelines = agent.get("guidelines", "")

    return f"""
You are {agent.get('name')}.

LANGUAGE RULE:
- Respond in the SAME language as the user's question
- Do NOT translate unless the user asks


Role:
{agent.get('role')}

Specialties:
{specialties}

Guidelines:
{guidelines}

IMPORTANT RULES (STRICT MODE):
- You MUST ONLY answer questions directly related to your specialties
- If the question is outside your specialties:
  - You MUST refuse
  - You MUST NOT give partial answers
  - You MUST NOT give related tips
- Do NOT speculate
- Do NOT be helpful outside your domain
"""

def build_chain_system_prompt(agent: dict) -> str:
    specialties = ", ".join(agent.get("specialties", [])) or "general knowledge"

    return f"""
You are {agent.get('name')} in a multi-agent collaboration.

Your specialties:
{specialties}

LANGUAGE RULE (VERY IMPORTANT):
- Respond in the SAME language as the user's question
- If the user switches languages, switch with them
- Do NOT mention language detection

CHAIN MODE RULES:
- Answer ONLY the parts of the question related to your specialties
- IGNORE parts outside your specialties (do NOT refuse)
- Do NOT mention limitations or scope
- Do NOT ask follow-up questions
- Provide ONLY information within your domain
- It is OK to give a PARTIAL answer
"""



def query_agent_openai(agent: dict, user_message: str) -> str:
    messages = [
        {"role": "system", "content": build_system_prompt(agent)},
        {"role": "user", "content": user_message},
    ]

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        return resp.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

def query_agent_openai_chain(agent: dict, user_message: str) -> str:
    messages = [
        {"role": "system", "content": build_chain_system_prompt(agent)},
        {"role": "user", "content": user_message},
    ]

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        return resp.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")


def build_chain_confidence(user_message: str, primary_response: str, secondary_response: str) -> dict:
    score = 70
    reasons = ["Chained response from multiple agents"]

    user_len = len((user_message or "").strip())
    primary_len = len((primary_response or "").strip())
    secondary_len = len((secondary_response or "").strip())

    if user_len < 10:
        score -= 20
        reasons.append("Insufficient input detail")

    if primary_len < 40 or secondary_len < 40:
        score -= 15
        reasons.append("Limited detail from one or more agents")

    if score >= 60:
        level = "high"
    elif score >= 30:
        level = "medium"
    else:
        level = "low"

    return {
        "score": max(0, min(score, 100)),
        "level": level,
        "reasons": reasons,
    }


@router.post("/link")
async def create_agent_link(req: AgentLinkRequest):
    print("LINK REQUEST RECEIVED")
    print("Primary:", req.primary_agent_id)
    print("Secondary:", req.secondary_agent_id)

    primary = db.get_agent_by_id(req.primary_agent_id)
    secondary = db.get_agent_by_id(req.secondary_agent_id)

    print("Primary exists:", bool(primary))
    print("Secondary exists:", bool(secondary))

    if not primary or not secondary:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    chain_id = db.create_agent_chain(req.primary_agent_id, req.secondary_agent_id)

    return {
        "status": "success",
        "chain_id": chain_id,
    }

    primary_agent_id = req.primary_agent_id
    secondary_agent_id = req.secondary_agent_id

    primary = db.get_agent_by_id(primary_agent_id)
    secondary = db.get_agent_by_id(secondary_agent_id)

    if not primary or not secondary:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    chain_id = db.create_agent_chain(primary_agent_id, secondary_agent_id)

    return {
        "status": "success",
        "chain_id": chain_id,
        "primary_agent": primary.get("name"),
        "secondary_agent": secondary.get("name"),
    }

@router.post("/query")
async def query_agent_chain(req: AgentChainRequest):
    """
    Query two agents in sequence (chain).
    - Primary agent answers user query
    - Secondary agent refines/enhances primary response (if pass_context=True)
    """
    try:
        # Get both agents
        primary = db.get_agent_by_id(req.primary_agent_id)
        secondary = db.get_agent_by_id(req.secondary_agent_id)
        
        if not primary or not secondary:
            raise HTTPException(status_code=404, detail="One or both agents not found")
        
        # Detect user language for strict enforcement
        user_language = detect_language(req.user_message)

        # Query primary agent
        primary_prompt = f"""
        The user asked:

        "{req.user_message}"

        Your task:
        - ONLY provide information related to your specialties
        - Ignore parts of the question outside your domain
        - Do NOT refuse just because other domains are involved
        - Respond with information strictly within your expertise
        - Respond ONLY in this language: {user_language}
        """


        primary_response = query_agent_openai_chain(primary, primary_prompt)

        
        # Query secondary agent with context from primary
        if req.pass_context:
            context_message = f"""
The primary agent ({primary.get('name')}) responded:

"{primary_response}"

Now, as {secondary.get('name')}, please enhance, expand, or refine this response. Add your perspective:
Original user query: {req.user_message}

IMPORTANT:
- Respond ONLY in this language: {user_language}
"""
            secondary_response = query_agent_openai_chain(secondary, context_message)
        else:
            secondary_response = query_agent_openai(secondary, req.user_message)
            
        
        # Save chain conversation to database
        db.save_chain_conversation(
            req.primary_agent_id,
            req.secondary_agent_id,
            req.user_message,
            primary_response,
            secondary_response
        )
        merge_prompt = f"""
        You are a final response synthesizer.

        You are given two agent responses. Each agent strictly follows its own specialty
        and may refuse if the question is outside its scope.

        LANGUAGE RULE:
        - The final response MUST be in this language: {user_language}
        - If the user switches languages, switch with them
        - Do NOT mention language detection

        Response A:
        {primary_response}

        Response B:
        {secondary_response}

        Your task:
        - Produce ONE final answer for the user
        - If one agent refused but the other gave useful info, use the useful info
        - If both agents refused, politely explain the limitation and suggest chaining with a relevant agent
        - Do NOT mention agents, roles, or refusals explicitly
        - Do NOT say "outside my scope"
        - Sound like a single helpful assistant
        """
        final_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"You merge multiple responses into one coherent answer. Respond ONLY in this language: {user_language}."
                },
                {
                    "role": "user",
                    "content": merge_prompt
                },
            ],
            max_tokens=512,
            temperature=0.6,
        ).choices[0].message.content

        confidence = build_chain_confidence(
            req.user_message,
            primary_response,
            secondary_response,
        )

        return {
            "reply": final_response,
            "confidence": confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/chains/{agent_id}")
async def get_agent_chains(agent_id: str):
    """
    Get all agents linked to this agent.
    """
    try:
        chains = db.get_agent_chains(agent_id)
        return {
            "agent_id": agent_id,
            "chain_count": len(chains),
            "chains": chains,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
