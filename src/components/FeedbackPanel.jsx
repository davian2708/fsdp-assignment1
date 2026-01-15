import React, { useState } from "react";
import { FiThumbsUp, FiThumbsDown, FiAlertCircle } from "react-icons/fi";
import { submitFeedback } from "../api";
import "../styles/feedbackpanel.css";

export default function FeedbackPanel({ messageId, agentId, onFeedbackSubmitted }) {
  const [feedbackType, setFeedbackType] = useState(null);
  const [submittedFeedback, setSubmittedFeedback] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (type) => {
    setFeedbackType(type);
    if (type === "flag_incorrect") {
      setShowComment(true);
    } else {
      await submitFeedbackToAPI(type);
    }
  };

  const submitFeedbackToAPI = async (type) => {
    setLoading(true);
    try {
      await submitFeedback(
        "chat_session_id",
        messageId,
        agentId,
        type,
        comment
      );
      setSubmittedFeedback(type);
      setFeedbackType(null);
      setShowComment(false);
      setComment("");
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-panel">
      <button
        className={`feedback-btn thumbs-up ${submittedFeedback === "thumbs_up" ? "submitted" : ""}`}
        onClick={() => handleFeedback("thumbs_up")}
        title="This response was helpful"
        disabled={loading || submittedFeedback !== null}
      >
        <FiThumbsUp size={18} />
      </button>

      <button
        className={`feedback-btn thumbs-down ${submittedFeedback === "thumbs_down" ? "submitted" : ""}`}
        onClick={() => handleFeedback("thumbs_down")}
        title="This response was not helpful"
        disabled={loading || submittedFeedback !== null}
      >
        <FiThumbsDown size={18} />
      </button>

      <button
        className={`feedback-btn flag ${submittedFeedback === "flag_incorrect" ? "submitted" : ""}`}
        onClick={() => handleFeedback("flag_incorrect")}
        title="Flag as incorrect"
        disabled={loading || submittedFeedback !== null}
      >
        <FiAlertCircle size={18} />
      </button>

      {showComment && (
        <div className="comment-box">
          <textarea
            placeholder="Tell us what's wrong..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength="500"
          />
          <div className="comment-actions">
            <button
              onClick={() => submitFeedbackToAPI("flag_incorrect")}
              disabled={loading}
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowComment(false);
                setComment("");
                setFeedbackType(null);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
