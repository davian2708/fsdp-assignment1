from fastapi import APIRouter, HTTPException
from models import AgentChainRequest
import db
import openai
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

openai.api_key = os.getenv("OPENAI_API_KEY")

def build_system_prompt(agent: dict) -> str:
    """Build system prompt for agent (copied from chat.py)."""
    specialties = ", ".join(agent.get("specialties", [])) or "general knowledge"
    guidelines = agent.get("guidelines", "")
    return f"""
You are {agent.get('name')} — Role: {agent.get('role')}.
Persona / guidelines: {guidelines}
Specialties: {specialties}

Always follow the persona and role above.
If asked something outside your specialties, politely say you can only discuss your specialty.
"""

def query_agent_openai(agent: dict, user_message: str) -> str:
    """Query an agent via OpenAI API."""
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key missing")
    
    messages = [
        {"role": "system", "content": build_system_prompt(agent)},
        {"role": "user", "content": user_message},
    ]
    
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )
        return resp["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")

@router.post("/link")
async def create_agent_link(primary_agent_id: str, secondary_agent_id: str):
    """
    Create a link between two agents for chaining.
    """
    try:
        # Verify both agents exist
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
            "message": "Agents linked successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Query primary agent
        primary_response = query_agent_openai(primary, req.user_message)
        
        # Query secondary agent with context from primary
        if req.pass_context:
            context_message = f"""
The primary agent ({primary.get('name')}) responded:

"{primary_response}"

Now, as {secondary.get('name')}, please enhance, expand, or refine this response. Add your perspective:
Original user query: {req.user_message}
"""
            secondary_response = query_agent_openai(secondary, context_message)
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
        
        return {
            "user_message": req.user_message,
            "primary_agent": {
                "name": primary.get("name"),
                "response": primary_response,
            },
            "secondary_agent": {
                "name": secondary.get("name"),
                "response": secondary_response,
            },
            "combined_response": f"{primary.get('name')}: {primary_response}\n\n{secondary.get('name')}: {secondary_response}"
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
