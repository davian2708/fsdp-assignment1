import React, { useState } from "react";
import { FiBookmark, FiX } from "react-icons/fi";
import { saveResponse, getSavedResponses } from "../api";
import "../styles/responsesaver.css";

export default function ResponseSaver({ agentId, userMessage, botResponse }) {
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSaveResponse = async () => {
    setLoading(true);
    try {
      await saveResponse(agentId, userMessage, botResponse, tags);
      alert("Response saved successfully!");
      setShowSaveMenu(false);
      setTags([]);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="response-saver">
      <button
        className="save-btn"
        onClick={() => setShowSaveMenu(!showSaveMenu)}
        title="Save this response"
      >
        <FiBookmark size={18} />
      </button>

      {showSaveMenu && (
        <div className="save-menu">
          <h4>Save Response</h4>
          
          <div className="tag-input-area">
            <input
              type="text"
              placeholder="Add tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTag(tagInput);
                }
              }}
            />
          </div>

          <div className="tags-display">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <FiX size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="save-actions">
            <button
              className="save-confirm"
              onClick={handleSaveResponse}
              disabled={loading}
            >
              Save
            </button>
            <button
              className="save-cancel"
              onClick={() => {
                setShowSaveMenu(false);
                setTags([]);
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
