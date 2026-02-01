import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/groupAiSelector.css";

export default function GroupAISelector({ groupId, groupName, onDone }) {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser");

  const [userAgents, setUserAgents] = useState([]);
  const [savedAgents, setSavedAgents] = useState([]);
  const [addMode, setAddMode] = useState("");

  const [members, setMembers] = useState([]);
  const [creator, setCreator] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [groupNameState, setGroupNameState] = useState("");
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  const isCreator = currentUser === creator;

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    async function loadData() {
      const agentSnap = await getDocs(collection(db, "agents"));
      const agents = agentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserAgents(agents);

      const groupSnap = await getDoc(doc(db, "groupChats", groupId));
      if (!groupSnap.exists()) return;

      const data = groupSnap.data();
      setCreator(data.createdBy);
      setGroupNameState(data.name || groupName || "");

      const mergedMembers = Array.from(
        new Set([data.createdBy, ...(data.members || [])])
      );
      setMembers(mergedMembers);

      const agentIds = data.aiAgents || [];
      setSavedAgents(agents.filter(a => agentIds.includes(a.id)));
    }

    loadData();
  }, [groupId, groupName]);

  /* ================= AGENTS ================= */
  const selectAgent = async (agentId) => {
    await updateDoc(doc(db, "groupChats", groupId), {
      activeAgentId: agentId,
    });
    onDone?.(agentId);
  };

  const addAgentToGroup = async (agentId) => {
    const updated = Array.from(
      new Set([...savedAgents.map(a => a.id), agentId])
    );

    await updateDoc(doc(db, "groupChats", groupId), {
      aiAgents: updated,
      activeAgentId: agentId,
    });

    const agent = userAgents.find(a => a.id === agentId);
    if (agent) setSavedAgents(prev => [...prev, agent]);

    onDone?.(agentId);
  };

  const removeAgent = async (agentId) => {
    const updated = savedAgents.filter(a => a.id !== agentId);
    await updateDoc(doc(db, "groupChats", groupId), {
      aiAgents: updated.map(a => a.id),
    });
    setSavedAgents(updated);
  };

  /* ================= MEMBERS ================= */
  const inviteUser = async () => {
    if (!newEmail) return;

    await addDoc(collection(db, "groupInvites"), {
      groupId,
      groupName: groupNameState,
      toEmail: newEmail,
      status: "pending",
      invitedBy: currentUser,
      createdAt: serverTimestamp(),
    });

    setNewEmail("");
    alert("Invite sent");
  };

  const kickUser = async (email) => {
    if (!isCreator) return;

    const confirmKick = window.confirm(
      `Remove ${email} from the group?`
    );
    if (!confirmKick) return;

    const updatedMembers = members.filter(
      m => m !== email && m !== creator
    );

    await updateDoc(doc(db, "groupChats", groupId), {
      members: updatedMembers,
    });

    setMembers([creator, ...updatedMembers]);
    setMenuOpenFor(null);
  };

  /* ================= GROUP ACTIONS ================= */
  const deleteGroup = async () => {
    const confirmDelete = window.confirm(
      "Delete this group permanently? This cannot be undone."
    );
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "groupChats", groupId));
    navigate("/home");
  };

  const leaveGroup = async () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this group?"
    );
    if (!confirmLeave) return;

    const updatedMembers = members.filter(
      m => m !== currentUser && m !== creator
    );

    await updateDoc(doc(db, "groupChats", groupId), {
      members: updatedMembers,
    });

    navigate("/home");
  };

  /* ================= RENDER ================= */
  return (
    <>
      <div className="ai-selector-overlay">
        <div className="ai-selector-card">

          {/* HEADER */}
          <div className="header-row">
            <div className="header-left">
              <h2 className="title">{groupNameState}</h2>

              <button
                className="members-btn"
                onClick={() => setShowMembers(true)}
                title="View members"
              >
                👥
              </button>

              {isCreator ? (
                <button
                  className="danger-btn"
                  onClick={deleteGroup}
                  title="Delete group"
                >
                  🗑️
                </button>
              ) : (
                <button
                  className="leave-btn"
                  onClick={leaveGroup}
                  title="Leave group"
                >
                  ↩️
                </button>
              )}
            </div>

            {/* ❌ ALWAYS just exit */}
            <button
              className="close-group-btn"
              onClick={() => navigate("/home")}
              title="Exit group"
            >
              ✕
            </button>
          </div>

          {/* SAVED AGENTS */}
          <div className="saved-section">
            <h4>Saved Agents</h4>

            {savedAgents.length === 0 ? (
              <p className="empty-text">No agents added yet</p>
            ) : (
              <div className="agent-grid">
                {savedAgents.map(a => (
                  <div key={a.id} className="agent-card">
                    <div
                      className="agent-main"
                      onClick={() => selectAgent(a.id)}
                    >
                      <div className="agent-icon">{a.icon || "🤖"}</div>
                      <div className="agent-name">{a.name}</div>
                    </div>

                    {isCreator && (
                      <button
                        className="remove-agent"
                        onClick={() => removeAgent(a.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD AGENT */}
          <div className="add-section">
            <h4>Add / Use Another AI</h4>

            <div className="add-controls">
              <select onChange={(e) => setAddMode(e.target.value)}>
                <option value="">Choose action</option>
                <option value="select">Add existing AI</option>
                <option value="create">Create new AI</option>
              </select>

              {addMode === "select" && (
                <select onChange={(e) => addAgentToGroup(e.target.value)}>
                  <option value="">Select AI</option>
                  {userAgents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}

              {addMode === "create" && (
                <button
                  className="create-ai-btn"
                  onClick={() => {
                    localStorage.setItem("pendingGroupForNewAI", groupId);
                    window.location.href = "/create-agent";
                  }}
                >
                  + Create New AI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MEMBERS MODAL */}
      {showMembers && (
        <div className="members-overlay">
          <div className="members-card">
            <div className="members-header">
              <h3>Group Members</h3>
              <button onClick={() => setShowMembers(false)}>✕</button>
            </div>

            <ul className="members-list">
              {members.map(email => (
                <li key={email} className="member-item">
                  <span>
                    {email}{email === creator ? " (Creator)" : ""}
                  </span>

                  {isCreator && email !== creator && (
                    <div className="member-menu">
                      <button
                        className="menu-btn"
                        onClick={() =>
                          setMenuOpenFor(menuOpenFor === email ? null : email)
                        }
                      >
                        ⋯
                      </button>

                      {menuOpenFor === email && (
                        <div className="menu-dropdown">
                          <button onClick={() => kickUser(email)}>
                            Kick user
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {isCreator && (
              <div className="add-user-row">
                <input
                  type="email"
                  placeholder="user@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button onClick={inviteUser}>+ Add User</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
