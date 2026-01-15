from fastapi import APIRouter, HTTPException
from models import FeedbackRequest
import db

router = APIRouter()

@router.post("/")
async def submit_feedback(req: FeedbackRequest):
    """
    Submit feedback on a bot response (thumbs up/down, flag, comment).
    """
    try:
        feedback_data = {
            "chat_id": req.chat_id,
            "message_id": req.message_id,
            "agent_id": req.agent_id,
            "feedback_type": req.feedback_type,
            "user_comment": req.user_comment,
        }
        feedback_id = db.save_feedback(feedback_data)
        return {
            "status": "success",
            "feedback_id": feedback_id,
            "message": "Feedback submitted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}")
async def get_agent_feedback(agent_id: str):
    """
    Get all feedback for a specific agent.
    """
    try:
        feedback = db.get_feedback_for_agent(agent_id)
        stats = db.get_feedback_stats(agent_id)
        return {
            "agent_id": agent_id,
            "feedback": feedback,
            "stats": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{agent_id}")
async def get_feedback_stats(agent_id: str):
    """
    Get feedback statistics for an agent (thumbs up/down counts, etc.).
    """
    try:
        stats = db.get_feedback_stats(agent_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
