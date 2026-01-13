import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

// Firebase
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export default function AgentList() {
  const [agents, setAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentAgents = async () => {
      const q = query(
        collection(db, "agents"),
        orderBy("lastUsedAt", "desc"),
        limit(5)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAgents(data);
    };

    fetchRecentAgents();
  }, []);

  return (
    <div className="agent-list">
      <h3 className="section-title">Recent AI Agents</h3>

      {agents.length === 0 ? (
        <p className="empty-text">No agents found.</p>
      ) : (
        agents.map((agent) => (
          <div
            key={agent.id}
            className="agent-row"
            onClick={() => navigate(`/agent-chat/${agent.id}`)}
          >
            <div className="agent-left">
              <div
                className="agent-avatar"
                style={{ backgroundColor: agent.color }}
              >
                {agent.icon || "🤖"}
              </div>

              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-last-used">
                  Last used{" "}
                  {agent.lastUsedAt
                    ? agent.lastUsedAt.toDate().toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {agents.length > 0 && (
        <div className="more" onClick={() => navigate("/agents")}>
          View all agents
        </div>
      )}
    </div>
  );
}