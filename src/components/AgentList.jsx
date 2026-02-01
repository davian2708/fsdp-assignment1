import React, { useEffect, useState } from "react";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AgentList() {
  const navigate = useNavigate();

  const currentUser = localStorage.getItem("currentUser"); // email
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    async function fetchAgents() {
      const snapshot = await getDocs(collection(db, "agents"));

      // Match against multiple possible owner fields
      const userAgents = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((agent) => {
          const ownerLike =
            agent.owner ||
            agent.createdBy ||
            agent.userEmail ||
            agent.email ||
            agent.userId;
          return ownerLike === currentUser;
        });

      // Show recent active 5 (if you have createdAt, you can sort)
      const activeAgents = userAgents.filter((agent) => agent.isActive !== false);
      setAgents(activeAgents.slice(0, 5));
    }

    fetchAgents();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <p className="empty-text">
        Please sign in to view your agents.
      </p>
    );
  }

  return (
    <div className="agent-section">
      <div className="section-header">
        <h3>Recent AI Agents</h3>
        <button
          className="view-all-btn"
          onClick={() => navigate("/view-agents")}
          type="button"
        >
          See all agents
        </button>
      </div>

      {agents.length === 0 ? (
        <p className="empty-text">No agents created yet.</p>
      ) : (
        <div className="agent-list">
          {agents.map((agent) => {
            const isActive = agent.isActive !== false;
            const icon = agent.icon || "🤖";
            const bg = agent.color || "#e5e7eb";

            // Your CSS calls it "last used" — we’ll show summary if present
            const subtitle =
              agent.summary ||
              (Array.isArray(agent.specialties) && agent.specialties.length
                ? agent.specialties.join(", ")
                : "Created by you");

            return (
              <div
                key={agent.id}
                className="agent-row"
                onClick={() => navigate(`/agent-chat/${agent.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/agent-chat/${agent.id}`);
                  }
                }}
              >
                {/* LEFT: ICON + TEXT */}
                <div className="agent-left">
                  <div
                    className="agent-avatar"
                    style={{ backgroundColor: bg }}
                    aria-label="Agent avatar"
                  >
                    {icon}
                  </div>

                  <div className="agent-info">
                    <div className="agent-name">
                      {agent.name || "(Unnamed Agent)"}
                    </div>
                    <div className="agent-last-used">{subtitle}</div>
                  </div>
                </div>

                {/* RIGHT: STATUS */}
                <span className="agent-status active">Active</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
