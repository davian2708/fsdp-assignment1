import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import "../styles/viewagents.css";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { FiSettings } from "react-icons/fi";

export default function ViewAgents() {
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function loadAgents() {
      const snapshot = await getDocs(collection(db, "agents"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAgents(list);
    }
    loadAgents();
  }, []);

  const filteredAgents = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter !== "All" && !a.specialties?.includes(filter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="view-layout">
      <Sidebar />

      <div className="view-panel">
        {/* Top logo area */}
        <div className="view-logo">LOGO</div>

        <h1 className="view-title">Your AI Agents</h1>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search agents..."
          className="view-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER BUTTONS */}
        <div className="view-filters">
          {["All", "Created", "Saved", "Education", "Creativity"].map(
            (cat) => (
              <button
                key={cat}
                className={filter === cat ? "filter-btn active" : "filter-btn"}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* GRID OF AGENTS */}
        <div className="agents-grid">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="agent-card"
              onClick={() => navigate(`/agent-chat/${agent.id}`)}
            >
              <div className="agent-image-box">
                <span
                  className="agent-img"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.icon || "🤖"}
                </span>
              </div>

              <div className="agent-info">
                <h3>{agent.name}</h3>
                <p>{agent.summary}</p>
                <span className="agent-created">Created by User</span>
              </div>

              <FiSettings className="agent-settings" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
