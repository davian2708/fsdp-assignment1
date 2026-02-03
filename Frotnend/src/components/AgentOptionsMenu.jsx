import React from "react";
import "./AgentOptionsMenu.css";

export default function AgentOptionsMenu({ onDelete, onEdit, onSave }) {
  return (
    <div className="agent-options-menu">
      <button onClick={onEdit}>Edit Agent</button>
      <button onClick={onSave}>Save Agent</button>
      <button className="danger" onClick={onDelete}>Delete Agent</button>
    </div>
  );
}
