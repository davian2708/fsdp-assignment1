import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import "../styles/viewagents.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Flying Bot Logo.png";

import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { FiSettings, FiTrash2 } from "react-icons/fi";

export default function ViewAgents() {
  const navigate = useNavigate();
  const handleLogoClick = () => navigate("/");

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

  // Enable / Disable
  const toggleAgentStatus = async (agentId, currentStatus) => {
    await updateDoc(doc(db, "agents", agentId), {
      isActive: !currentStatus,
    });

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, isActive: !currentStatus } : a
      )
    );
  };

  // ❌ PERMANENT DELETE (disabled agents only)
  const deleteAgent = async (agentId) => {
    const confirmDelete = window.confirm(
      "This will permanently delete the agent. This action cannot be undone. Continue?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "agents", agentId));
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  };

  // Search + filter
  const filteredAgents = agents.filter((a) => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filter !== "All" && !a.specialties?.includes(filter.toLowerCase()))
      return false;
    return true;
  });

  const activeAgents = filteredAgents.filter(
    (a) => a.isActive !== false
  );

  const disabledAgents = filteredAgents.filter(
    (a) => a.isActive === false
  );

  return (
    <div className="view-layout">
      <Sidebar />

      <div className="view-panel">
        <div className="view-logo" onClick={handleLogoClick}>
          <img src={logo} alt="Logo" className="logo" />
        </div>

        <h1 className="view-title">Your AI Agents</h1>

        <input
          type="text"
          placeholder="Search agents..."
          className="view-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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

        {/* ACTIVE AGENTS */}
        <div className="agents-grid">
          {activeAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={toggleAgentStatus}
              onDelete={deleteAgent}
              navigate={navigate}
            />
          ))}
        </div>

        {/* DISABLED AGENTS */}
        {disabledAgents.length > 0 && (
          <>
            <h2 className="disabled-title">Disabled Agents</h2>
            <div className="agents-grid disabled-section">
              {disabledAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onToggle={toggleAgentStatus}
                  onDelete={deleteAgent}
                  navigate={navigate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= CARD ================= */

function AgentCard({ agent, onToggle, onDelete, navigate }) {
  return (
    <div
      className={`agent-card ${agent.isActive === false ? "disabled" : ""}`}
      onClick={() => {
        if (agent.isActive !== false) {
          navigate(`/agent-chat/${agent.id}`);
        }
      }}
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

      {/* STATUS BADGE */}
      <span
        className={`status-badge ${
          agent.isActive ? "active" : "disabled"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(agent.id, agent.isActive);
        }}
      >
        {agent.isActive ? "Active" : "Disabled"}
      </span>

      {/* DELETE ICON (ONLY WHEN DISABLED) */}
      {agent.isActive === false && (
        <FiTrash2
          className="agent-delete"
          title="Delete permanently"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(agent.id);
          }}
        />
      )}

      {/* Settings icon reserved */}
      <FiSettings
        className="agent-settings"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
