import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/SideBar";
import FeedbackPanel from "../components/FeedbackPanel";
import ResponseSaver from "../components/ResponseSaver";
import KnowledgeBase from "../components/KnowledgeBase";
import AgentChaining from "../components/AgentChaining";
import "../styles/chatinterface.css";
import {
  FiArrowLeft,
  FiEdit2,
  FiSend,
  FiUpload,
  FiMic,
  FiThumbsUp,
  FiThumbsDown
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import logo from '../assets/Flying Bot Logo.png';
import ReactMarkdown from "react-markdown";


import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { queryAgent } from "../api"; // <-- backend chat call

export default function ChatInterface() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const handleLogoClick = () => navigate("/");

  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch agent metadata from Firestore
  useEffect(() => {
    async function loadAgent() {
      try {
        const snap = await getDoc(doc(db, "agents", agentId));
        if (snap.exists()) {
          const data = snap.data();
          setAgent(data);

          await updateDoc(doc(db, "agents", agentId), {
            lastUsedAt: serverTimestamp(),
          });

          // Initial greeting message from bot
          setMessages([
            {
              sender: "bot",
              text: `Hi User, I am ${data.name}. How can I help you today?`,
            },
          ]);
        } else {
          alert("Agent not found in database.");
        }
      } catch (err) {
        console.error("Error fetching agent:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

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
    previewType: file.type.startsWith("image/")
      ? "image"
      : "file",
  };
};

  // Send message to backend and get AI response
  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMessage = input;
    setInput("");
      let fileData = null;

    if (selectedFile) {
      fileData = await prepareFileForFirestore(selectedFile);
      setSelectedFile(null);
      setFilePreview(null);
    }
    // Show user's message in chat
    setMessages((prev) => [...prev, { sender: "user", text: userMessage, file: fileData}]);

    //  AUTO-SAVE USER QUESTION
  await addDoc(collection(db, "messages"), {
    agentId,
    sender: "user",
    sessionId,
    text: userMessage,
    file: fileData,
    createdAt: serverTimestamp(),
  });

    try {
      // Send message + agentId to backend
      const res = await queryAgent(agentId, userMessage, fileData?.base64 ? fileData.base64 : null);

      const aiDocRef = await addDoc(collection(db, "messages"), {
        agentId,
        sender: "ai",
        sessionId,
        text: res.reply,
        createdAt: serverTimestamp(),
      });

      // Append AI response
      setMessages((prev) => [...prev, {id:aiDocRef.id, sender: "bot", text: res.reply }]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }
  };

    const submitFeedback = async (messageId, satisfied) => {
    await addDoc(collection(db, "feedback"), {
      messageId,
      agentId,
      sessionId,
      satisfied,
      createdAt: serverTimestamp(),
    });
  };

  const hasFeedback = async (messageId) => {
    const q = query(
      collection(db, "feedback"),
      where("messageId", "==", messageId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  if (loading) return <div>Loading agent...</div>;
  if (!agent) return <div>Agent not found.</div>;

  return (
    <div className="chat-layout">
      <Sidebar />

      <div className="chat-panel">
        {/* === AGENT HEADER === */}
        <div className="agent-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft size={20} />
          </button>

          <div className="agent-header-info">
            <div
              className="agent-avatar"
              style={{ backgroundColor: agent.color }}
            >
              {agent.icon || "🤖"}
            </div>

            <div className="agent-meta">
              <h2>{agent.name}</h2>
              <p>Created by User</p>
            </div>
          </div>

          <div className="agent-header-actions">
            <button 
              className="edit-btn"
              onClick={() => alert("Edit feature coming soon!")}
              title="Edit agent"
            >
              <FiEdit2 size={18} /> Edit
            </button>
            <button
              className="kb-btn"
              onClick={() => setShowKB(!showKB)}
              title="Manage Knowledge Base"
            >
              📚 KB
            </button>
            <AgentChaining primaryAgentId={agentId} />
            <button className="chat-btn">
              <FiSend size={18} /> Chat
            </button>
          </div>
        </div>

        {/* === KNOWLEDGE BASE PANEL === */}
        {showKB && <KnowledgeBase agentId={agentId} />}

        {/* === CHAT MESSAGES === */}
                <div className="messages-container">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              msg={msg}
              submitFeedback={submitFeedback}
              hasFeedback={hasFeedback}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* === INPUT BOX === */}
        <div className="input-area">

        {selectedFile && (
          <div className="file-preview-card">
            {filePreview?.type === "image" ? (
              <img src={filePreview.url} alt="preview" />
            ) : (
              <div className="file-card">
                <div className="file-icon">
                  {getFileIcon(selectedFile.type)}
                </div>

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
            {/* 📎 File upload */}
            <label className="input-icon upload-icon">
              <FiUpload size={20} />
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setSelectedFile(file);

                  if (file.type.startsWith("image/")) {
                    setFilePreview({
                      type: "image",
                      url: URL.createObjectURL(file),
                    });
                  } else {
                    setFilePreview({
                      type: "file",
                    });
                  }
                }}
              />
            </label>

            {/* Text input */}
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            {/* Send button */}
            <button className="send-btn" onClick={sendMessage}>
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, submitFeedback, hasFeedback }) {
  const [rated, setRated] = useState(false);

  useEffect(() => {
    if (msg.id) {
      hasFeedback(msg.id).then(setRated);
    }
  }, [msg.id]);

  return (
    <div className={`message ${msg.sender === "user" ? "user" : "bot"}`}>
      {/*TEXT MESSAGE*/}
      {msg.text && (
        <ReactMarkdown>
          {msg.text}
        </ReactMarkdown>
      )}

      {/*FILE MESSAGE*/}
      {msg.file && (
        <div className="file-card">
          {msg.file.previewType === "image" ? (
            <img
              src={msg.file.base64}
              alt={msg.file.name}
              className="file-image"
            />
          ) : (
            <>
              <div className="file-icon">📎</div>
              <div className="file-meta">
                <div className="file-name">{msg.file.name}</div>
                <div className="file-size">
                  {(msg.file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/*FEEDBACK (AI ONLY)*/}
      {msg.sender === "bot" && msg.id && !rated && (
        <div className="feedback">
          <button
            className="feedback-btn"
            title="Helpful"
            onClick={() => {
              submitFeedback(msg.id, true);
              setRated(true);
            }}
          >
            <FiThumbsUp />
          </button>

          <button
            className="feedback-btn"
            title="Not helpful"
            onClick={() => {
              submitFeedback(msg.id, false);
              setRated(true);
            }}
          >
            <FiThumbsDown />
          </button>
        </div>
      )}

      {rated && msg.sender === "bot" && (
        <small className="feedback-done">Thanks for your feedback!</small>
      )}
    </div>
  );
}
