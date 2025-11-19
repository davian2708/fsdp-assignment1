import React, { useState, useEffect } from "react";
import Sidebar from "../components/SideBar";
import "../styles/chatinterface.css";
import { FiArrowLeft, FiEdit2, FiSend, FiUpload, FiMic } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import logo from '../assets/Flying Bot Logo.png';

import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
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

  // Send message to backend and get AI response
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    // Show user's message in chat
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    try {
      // Send message + agentId to backend
      const res = await queryAgent(agentId, userMessage);

      // Append AI response
      setMessages((prev) => [...prev, { sender: "bot", text: res.reply }]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }
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
            <button className="edit-btn">
              <FiEdit2 size={18} /> Edit
            </button>
            <button className="chat-btn">
              <FiSend size={18} /> Chat
            </button>
          </div>
        </div>

        {/* === CHAT MESSAGES === */}
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender === "user" ? "user" : "bot"}`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* === INPUT BOX === */}
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
