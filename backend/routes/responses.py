from fastapi import APIRouter, HTTPException
from models import SaveResponseRequest
import db

router = APIRouter()

@router.post("/save")
async def save_response(req: SaveResponseRequest):
    """
    Save/bookmark a bot response for later reference.
    """
    try:
        response_id = db.save_response(
            agent_id=req.agent_id,
            user_message=req.user_message,
            bot_response=req.bot_response,
            tags=req.tags
        )
        return {
            "status": "success",
            "response_id": response_id,
            "message": "Response saved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}")
async def get_saved_responses(agent_id: str, tags: str = None):
    """
    Get all saved responses for an agent.
    Optionally filter by tags (comma-separated).
    """
    try:
        tag_list = tags.split(",") if tags else None
        responses = db.get_saved_responses(agent_id, tag_list)
        return {
            "agent_id": agent_id,
            "count": len(responses),
            "responses": responses,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
