import React, { useEffect, useMemo, useState } from "react";
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
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { FiSettings, FiTrash2 } from "react-icons/fi";

export default function ViewAgents() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser"); // email

  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!currentUser) navigate("/signin");
  }, [currentUser, navigate]);

  // ✅ Load only THIS USER’S agents (Firestore query)
  useEffect(() => {
    if (!currentUser) return;

    async function loadAgents() {
      try {
        // If you don't have createdAt on older docs, orderBy may error.
        // If it does, remove orderBy line.
        const q = query(
          collection(db, "agents"),
          where("owner", "==", currentUser),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setAgents(list);
      } catch (err) {
        console.error("Failed to load agents:", err);

        // fallback: fetch all then filter (in case missing index/orderBy)
        const snapshot = await getDocs(collection(db, "agents"));
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.owner === currentUser);

        setAgents(list);
      }
    }

    loadAgents();
  }, [currentUser]);

  const handleLogoClick = () => navigate("/home");

  // Enable / Disable (OWNER ONLY)
  const toggleAgentStatus = async (agentId, currentStatus) => {
    // ✅ treat undefined as active
    const isActive = currentStatus !== false;

    await updateDoc(doc(db, "agents", agentId), {
      isActive: !isActive,
    });

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, isActive: !isActive } : a))
    );
  };

  // ❌ PERMANENT DELETE (OWNER ONLY)
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

  // ✅ Search + filter (fixed specialties matching)
  const filteredAgents = useMemo(() => {
    const s = search.trim().toLowerCase();
    const f = filter.trim().toLowerCase();

    return agents.filter((a) => {
      if (s && !(a.name || "").toLowerCase().includes(s)) return false;

      if (filter !== "All") {
        const specs = (a.specialties || []).map((x) => String(x).toLowerCase());
        if (!specs.includes(f)) return false;
      }

      return true;
    });
  }, [agents, search, filter]);

  const activeAgents = filteredAgents.filter((a) => a.isActive !== false);
  const disabledAgents = filteredAgents.filter((a) => a.isActive === false);

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
          {["All", "Created", "Saved", "Education", "Creativity"].map((cat) => (
            <button
              key={cat}
              className={filter === cat ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
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
  const isActive = agent.isActive !== false;

  return (
    <div
      className={`agent-card ${!isActive ? "disabled" : ""}`}
      onClick={() => {
        if (isActive) navigate(`/agent-chat/${agent.id}`);
      }}
    >
      <div className="agent-image-box">
        <span className="agent-img" style={{ backgroundColor: agent.color }}>
          {agent.icon || "🤖"}
        </span>
      </div>

      <div className="agent-info">
        <h3>{agent.name}</h3>
        <p>{agent.summary}</p>
        <span className="agent-created">Created by you</span>
      </div>

      <span
        className={`status-badge ${isActive ? "active" : "disabled"}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(agent.id, agent.isActive);
        }}
      >
        {isActive ? "Active" : "Disabled"}
      </span>

      {!isActive && (
        <FiTrash2
          className="agent-delete"
          title="Delete permanently"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(agent.id);
          }}
        />
      )}

      <FiSettings className="agent-settings" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
