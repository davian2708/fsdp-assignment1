import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/SideBar";
import GroupAISelector from "../components/GroupAISelector";
import KnowledgeBase from "../components/KnowledgeBase";
import "../styles/chatinterface.css";

import { FiArrowLeft, FiSend, FiUpload } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  updateDoc,
} from "firebase/firestore";

import { queryAgent } from "../api"; // backend chat call

export default function GroupChatInterface() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const currentUser = localStorage.getItem("currentUser") || "user";

  const [loading, setLoading] = useState(true);

  const [group, setGroup] = useState(null);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [agent, setAgent] = useState(null);

  // requirement: show selector first when entering group
  const [showSelector, setShowSelector] = useState(true);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [showKB, setShowKB] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [showAllConfidence, setShowAllConfidence] = useState(false);

  const messagesEndRef = useRef(null);

  /* =========================
     Helpers for file upload
  ========================= */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const prepareFileForFirestore = async (file) => {
    if (file.size > 1024 * 1024) {
      alert("File too large (max 1MB)");
      return null;
    }
    const base64 = await fileToBase64(file);
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      base64,
      previewType: file.type.startsWith("image/") ? "image" : "file",
    };
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return "📎";
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType === "application/pdf") return "📄";
    return "📎";
  };

  /* =========================
     Load group + membership check
  ========================= */
  useEffect(() => {
    let unsubGroup = null;

    // on route enter: selector shows first
    setShowSelector(true);

    async function loadGroup() {
      setLoading(true);

      unsubGroup = onSnapshot(doc(db, "groupChats", groupId), async (snap) => {
        if (!snap.exists()) {
          setGroup(null);
          setLoading(false);
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        setGroup(data);

        const members = Array.from(
          new Set([data.createdBy, ...(data.members || [])].filter(Boolean))
        );

        if (!members.includes(currentUser)) {
          alert("You are not a member of this group.");
          navigate("/home");
          return;
        }

        const nextAgentId = data.activeAgentId || null;
        setActiveAgentId(nextAgentId);

        // Only force selector if no agent selected yet.
        // If user already has an active agent and closes selector, it won't reopen.
        if (!nextAgentId) {
          setShowSelector(true);
        }

        setLoading(false);
      });
    }

    loadGroup();

    return () => {
      if (unsubGroup) unsubGroup();
    };
  }, [groupId, currentUser, navigate]);

  /* =========================
     Load active agent details
  ========================= */
  useEffect(() => {
    if (!activeAgentId) {
      setAgent(null);
      return;
    }

    async function loadAgent() {
      try {
        const snap = await getDoc(doc(db, "agents", activeAgentId));
        if (snap.exists()) setAgent({ id: snap.id, ...snap.data() });
        else setAgent(null);
      } catch (e) {
        console.error("Failed to load active agent:", e);
      }
    }

    loadAgent();
  }, [activeAgentId]);

  /* =========================
     Live messages for group
     Collection: groupMessages
     Fields: groupId, sender, text, agentId, createdAt, file, confidence
  ========================= */
  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "groupMessages"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            sender: data.sender,
            text: data.text || "",
            file: data.file || null,
            confidence: data.confidence || null,
            agentId: data.agentId || null,
            createdAt: data.createdAt || null,
          };
        });

        setMessages(list);
      },
      (err) => {
        console.error("Failed to load group messages:", err);
      }
    );

    return () => unsub();
  }, [groupId]);

  /* =========================
     Auto-scroll
  ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canChat = useMemo(() => !!activeAgentId, [activeAgentId]);

  /* =========================
     Selector -> Done
  ========================= */
  const handleSelectorDone = async (selectedAgentId) => {
    setActiveAgentId(selectedAgentId);
    setShowSelector(false);

    // safe redundancy: selector already updates activeAgentId too
    try {
      await updateDoc(doc(db, "groupChats", groupId), {
        activeAgentId: selectedAgentId,
      });
    } catch (e) {
      console.warn("activeAgentId update fallback failed:", e);
    }
  };

  /* =========================
     Send message
  ========================= */
  const sendMessage = async () => {
    if (!canChat) {
      alert("Please select an AI agent first.");
      return;
    }

    if (!input.trim() && !selectedFile) return;

    const userMessage = input;
    setInput("");

    let fileData = null;
    if (selectedFile) {
      fileData = await prepareFileForFirestore(selectedFile);
      setSelectedFile(null);
      setFilePreview(null);
    }

    const imageBase64 = fileData?.base64 || null;

    // write user message to Firestore
    await addDoc(collection(db, "groupMessages"), {
      groupId,
      agentId: activeAgentId,
      sender: currentUser,
      text: userMessage,
      file: fileData,
      createdAt: serverTimestamp(),
    });

    try {
      const res = await queryAgent(activeAgentId, userMessage, imageBase64);

      const aiText = res?.reply ?? "No reply received.";
      const aiConfidence = res?.confidence ?? null;

      await addDoc(collection(db, "groupMessages"), {
        groupId,
        agentId: activeAgentId,
        sender: "assistant",
        text: aiText,
        confidence: aiConfidence,
        createdAt: serverTimestamp(),
      });

      // optional: update group updatedAt for sorting in your group list
      try {
        await updateDoc(doc(db, "groupChats", groupId), {
          updatedAt: serverTimestamp(),
          lastMessage: aiText.slice(0, 80),
        });
      } catch (e) {
        // ignore if fields don't exist / rules deny
      }
    } catch (err) {
      console.error("Group chat AI failed:", err);

      await addDoc(collection(db, "groupMessages"), {
        groupId,
        agentId: activeAgentId,
        sender: "assistant",
        text: "Something went wrong.",
        createdAt: serverTimestamp(),
      });
    }
  };

  if (loading) return <div>Loading group...</div>;
  if (!group) return <div>Group not found.</div>;

  return (
    <div className="chat-layout">
      <Sidebar />

      {/* Selector must appear first when entering the group */}
      {showSelector && (
        <GroupAISelector
          groupId={groupId}
          groupName={group.name}
          onDone={handleSelectorDone}
        />
      )}

      <div className="chat-panel">
        {/* === GROUP HEADER === */}
        <div className="agent-header">
          <button className="back-btn" onClick={() => navigate("/home")}>
            <FiArrowLeft size={20} />
          </button>

          <div className="agent-header-info">
            <div
              className="agent-avatar"
              style={{ backgroundColor: agent?.color || "#ddd" }}
            >
              {agent?.icon || "👥"}
            </div>

            <div className="agent-meta">
              <h2>{group.name}</h2>
              <p>
                {agent ? (
                  <>
                    Using <strong>{agent.name}</strong>
                  </>
                ) : (
                  "Select an AI to start chatting"
                )}
              </p>
            </div>
          </div>

          <div className="agent-header-actions">
            <button
              className="kb-btn"
              onClick={() => setShowKB((p) => !p)}
              title="Manage Knowledge Base"
              disabled={!activeAgentId}
              style={{ opacity: activeAgentId ? 1 : 0.5 }}
            >
              📚 KB
            </button>

            <button
              className="edit-btn"
              onClick={() => setShowSelector(true)}
              title="Change AI"
            >
              Change AI
            </button>
          </div>
        </div>

        {/* === KB PANEL === */}
        {showKB && activeAgentId && <KnowledgeBase agentId={activeAgentId} />}

        {/* === MESSAGES === */}
        <div className="messages-container">
          {!activeAgentId && (
            <div className="empty-chat">
              <div className="empty-avatar" style={{ backgroundColor: "#e6e6e6" }}>
                👥
              </div>
              <h3>Choose an AI for this group</h3>
              <p>The selector opens first. Pick a saved agent to start.</p>
            </div>
          )}

          {messages.map((msg) => (
            <GroupMessageBubble
              key={msg.id}
              msg={msg}
              currentUser={currentUser}
              agentName={agent?.name || "AI"}
              showAllConfidence={showAllConfidence}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* CONFIDENCE DISCLAIMER and TOGGLE */}
        <div className="confidence-footer">
          <small className="confidence-disclaimer">
            Confidence reflects system context availability, not factual accuracy.
          </small>

          <button
            className="confidence-toggle-link"
            onClick={() => setShowAllConfidence((prev) => !prev)}
          >
            {showAllConfidence ? "Hide confidence details" : "Show confidence details"}
          </button>
        </div>

        {/* === INPUT BOX === */}
        <div className="input-area">
          {selectedFile && (
            <div className="file-preview-card">
              {filePreview?.type === "image" ? (
                <img src={filePreview.url} alt="preview" />
              ) : (
                <div className="file-card">
                  <div className="file-icon">{getFileIcon(selectedFile.type)}</div>
                  <div className="file-meta">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              )}

              <button
                className="remove-file"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="input-box">
            {/* File upload */}
            <label
              className="input-icon upload-icon"
              style={{ opacity: canChat ? 1 : 0.5 }}
            >
              <FiUpload size={20} />
              <input
                type="file"
                hidden
                disabled={!canChat}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setSelectedFile(file);

                  if (file.type.startsWith("image/")) {
                    setFilePreview({
                      type: "image",
                      url: URL.createObjectURL(file),
                    });
                  } else {
                    setFilePreview({ type: "file" });
                  }
                }}
              />
            </label>

            {/* Text input */}
            <input
              type="text"
              placeholder={canChat ? "Type your message..." : "Select an AI first..."}
              value={input}
              disabled={!canChat}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            {/* Send button */}
            <button className="send-btn" onClick={sendMessage} disabled={!canChat}>
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupMessageBubble({ msg, currentUser, agentName, showAllConfidence }) {
  const isAssistant = msg.sender === "assistant";
  const isMine = msg.sender === currentUser;

  // Distinguish other members from "you"
  const bubbleClass = isAssistant ? "bot" : isMine ? "user" : "other";

  const senderLabel = isAssistant
    ? `AI (${agentName})`
    : isMine
    ? "You"
    : msg.sender;

  return (
    <div className={`message ${bubbleClass}`}>
      <div
        className="group-sender-label"
        style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}
      >
        {senderLabel}
      </div>

      {msg.text && isAssistant && (
        <>
          <div className="bot-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>

          {showAllConfidence && msg.confidence && (
            <div className={`confidence-badge ${msg.confidence.level}`}>
              <strong>{String(msg.confidence.level).toUpperCase()} confidence</strong>
              <ul className="confidence-reasons">
                {(msg.confidence.reasons || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {msg.text && !isAssistant && <span>{msg.text}</span>}

      {msg.file && (
        <div className="file-card">
          {msg.file.previewType === "image" ? (
            <img src={msg.file.base64} alt={msg.file.name} className="file-image" />
          ) : (
            <>
              <div className="file-icon">📎</div>
              <div className="file-meta">
                <div className="file-name">{msg.file.name}</div>
                <div className="file-size">{(msg.file.size / 1024).toFixed(1)} KB</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
