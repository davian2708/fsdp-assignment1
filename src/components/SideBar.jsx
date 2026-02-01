import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { FiMenu, FiX, FiMoreHorizontal } from "react-icons/fi";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import "../styles/sidebar.css";

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // ✅ show real user email
  const currentUser = useMemo(
    () => localStorage.getItem("currentUser") || "",
    []
  );

  // ✅ dropdown for logout
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isAgentChat = location.pathname.startsWith("/agent-chat/");
  const agentId = isAgentChat ? location.pathname.split("/")[2] : null;

  const activeConversationId =
    new URLSearchParams(location.search).get("conversationId");

  // Close user dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load chat history (only for agent chat)
  useEffect(() => {
    if (!isAgentChat || !agentId) {
      setConversations([]);
      return;
    }

    async function loadHistory() {
      const q = query(
        collection(db, "conversations"),
        where("agentId", "==", agentId),
        // NOTE: keeping "user" because your ChatInterface stores userId: "user"
        where("userId", "==", "user"),
        orderBy("updatedAt", "desc")
      );

      const snap = await getDocs(q);

      setConversations(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "New chat",
          agentId,
        }))
      );
    }

    loadHistory();
  }, [isAgentChat, agentId]);

  // ✏️ Rename chat
  const renameConversation = async (id, currentTitle) => {
    const newTitle = prompt("Rename chat", currentTitle);
    if (!newTitle) return;

    await updateDoc(doc(db, "conversations", id), { title: newTitle });

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // 🗑 Delete chat
  const deleteConversation = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this chat? This cannot be undone."
    );
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "conversations", id));

    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (id === activeConversationId) {
      navigate(`/agent-chat/${agentId}`);
    }
  };

  // ✅ Logout
  const logout = () => {
    const ok = window.confirm("Log out?");
    if (!ok) return;

    localStorage.removeItem("currentUser");
    setUserMenuOpen(false);
    setOpen(false);
    navigate("/signin");
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* BACKDROP */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => {
            setOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => {
            setOpen(false);
            setUserMenuOpen(false);
          }}
          aria-label="Close sidebar"
        >
          <FiX size={20} />
        </button>

        {/* USER */}
        <div className="user-profile" ref={userMenuRef}>
          <div className="user-icon">👤</div>

          <button
            type="button"
            className="user-email-btn"
            onClick={() => setUserMenuOpen((v) => !v)}
            title="Account"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <p style={{ margin: 0 }}>
              {currentUser ? currentUser : "Not signed in"}
            </p>
          </button>

          {userMenuOpen && (
            <div className="user-dropdown">
              <button className="user-dropdown-item danger" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* CREATE AGENT */}
        <button
          className="create-agent-btn"
          onClick={() => {
            navigate("/create-agent");
            setOpen(false);
          }}
        >
          + Create New Agent
        </button>

        {/* ✅ CREATE GROUP (same style as create agent) */}
        <button
          className="create-agent-btn"
          onClick={() => {
            navigate("/create-group");
            setOpen(false);
          }}
        >
          + Create New Group
        </button>

        {/* MAIN MENU */}
        <div className="menu">
          {/* ❌ Removed Explore */}

          <button
            className="menu-btn"
            onClick={() => {
              navigate("/view-agents");
              setOpen(false);
            }}
          >
            View AI Agents
          </button>

          <button
            className="menu-btn"
            onClick={() => {
              navigate("/help");
              setOpen(false);
            }}
          >
            Help
          </button>
        </div>

        {/* CHAT HISTORY */}
        {isAgentChat && conversations.length > 0 && (
          <div className="chat-history">
            <h4 className="history-title">Your chats</h4>

            {conversations.map((c) => (
              <div
                key={c.id}
                className={`history-item ${
                  c.id === activeConversationId ? "active" : ""
                }`}
                onClick={() =>
                  navigate(`/agent-chat/${c.agentId}?conversationId=${c.id}`)
                }
              >
                <span className="history-text">{c.title}</span>

                <div
                  className="history-more"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === c.id ? null : c.id);
                  }}
                >
                  <FiMoreHorizontal />

                  {menuOpenId === c.id && (
                    <div className="history-dropdown">
                      <button onClick={() => renameConversation(c.id, c.title)}>
                        Rename
                      </button>
                      <button
                        className="danger"
                        onClick={() => deleteConversation(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* THEME */}
        <div className="menu bottom">
          <button className="menu-btn" onClick={toggleTheme}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </aside>
    </>
  );
}
