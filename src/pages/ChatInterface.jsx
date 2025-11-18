import React, { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import "../styles/chatinterface.css";
import { FiArrowLeft, FiEdit2, FiSend, FiUpload, FiMic } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import logo from '../assets/Flying Bot Logo.png';

import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ChatInterface() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const handleLogoClick = () => navigate("/");
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    async function loadAgent() {
      const snap = await getDoc(doc(db, "agents", agentId));
      if (snap.exists()) {
        const data = snap.data();
        setAgent(data);

        setMessages([
          {
            sender: "agent",
            text: `Hi User xx2f0, I am ${data.name}. How can I help you today?`,
          },
        ]);
      }
    }
    loadAgent();
  }, [agentId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
  };

  if (!agent) return null;

  return (
    <div className="chat-layout">
      <Sidebar />

      <div className="chat-panel">
        {/* === AGENT HEADER CARD === */}
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
              <p>Created by User xx2f0</p>
            </div>
          </div>

          <div className="agent-header-actions">
            <button className="edit-btn">
              <FiEdit2 size={18} /> Edit
            </button>
            <button className="chat-btn">
              <FiSend size={18} /> Chat
            </button>
          </div>
        </div>

        {/* === BIG WELCOME MESSAGE === */}
        <div className="welcome-message">
          <h1>
            Hi User xx2f0, I am {agent.name}
            <br />
            How can I help you today?
          </h1>
        </div>

        {/* === INPUT BOX SECTION === */}
        <div className="input-area">
          <div className="input-box">
            <FiUpload className="input-icon" size={24} />

            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <FiMic className="input-icon" size={24} />
            <button className="send-btn" onClick={sendMessage}>
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
