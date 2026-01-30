import React, { useEffect, useState } from "react";
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

  const isAgentChat = location.pathname.startsWith("/agent-chat/");
  const agentId = isAgentChat ? location.pathname.split("/")[2] : null;

  const activeConversationId =
    new URLSearchParams(location.search).get("conversationId");

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
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <FiX size={20} />
        </button>

        {/* USER */}
        <div className="user-profile">
          <div className="user-icon">👤</div>
          <p>User xx2f0</p>
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

        {/* MAIN MENU */}
        <div className="menu">
          <button
            className="menu-btn"
            onClick={() => {
              navigate("/explore");
              setOpen(false);
            }}
          >
            Explore
          </button>

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
                      <button
                        onClick={() =>
                          renameConversation(c.id, c.title)
                        }
                      >
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
