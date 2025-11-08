import React, { useEffect, useState } from "react";
import "../styles/homepage.css";

export default function AgentList() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    //fetch("http://127.0.0.1:8000/api/agents")
      //.then((res) => res.json())
      //.then((data) => setAgents(data))
      //.catch((err) => console.error("Error fetching agents:", err));
  }, []);

  return (
    <div className="agent-list">
      <h2>Recent AI Agents</h2>

      {agents.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No agents found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "10px" }}>
          {agents.map((agent) => (
            <li key={agent.id} className="agent-item">
              <span>{agent.name}</span>
              <span
                className={
                  agent.status === "Active"
                    ? "agent-status active"
                    : "agent-status idle"
                }
              >
                {agent.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}