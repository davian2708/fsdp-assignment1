import React, { useEffect, useState } from "react";
import { FiSettings, FiX } from "react-icons/fi";
import Sidebar from "../components/SideBar";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { HexColorPicker } from "react-colorful";
import "../styles/createagent.css";
import logo from "../assets/Flying Bot Logo.png";

import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function CreateAgentPage() {
  const navigate = useNavigate();

  // 🔐 Logged-in user (email from SignIn.jsx)
  const currentUser = localStorage.getItem("currentUser");

  const [showModal, setShowModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("🤖");
  const [selectedColor, setSelectedColor] = useState("#3a3a3a");
  const [specialties, setSpecialties] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [summary, setSummary] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [agentName, setAgentName] = useState("");

  // tools dropdown (your original select didn't save anything)
  const [selectedTool, setSelectedTool] = useState("");

  // If user came from GroupAISelector "Create new AI"
  const pendingGroupId = localStorage.getItem("pendingGroupForNewAI") || null;

  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
    }
  }, [currentUser, navigate]);

  const handleLogoClick = () => navigate("/home");

  const handleAddSpecialty = () => {
    const clean = newSpecialty.trim();
    if (!clean) return;

    // prevent duplicates (case-insensitive)
    const exists = specialties.some((s) => s.toLowerCase() === clean.toLowerCase());
    if (exists) {
      setNewSpecialty("");
      setShowInput(false);
      return;
    }

    setSpecialties([...specialties, clean]);
    setNewSpecialty("");
    setShowInput(false);
  };

  const handleRemoveSpecialty = (index) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleCreateAgent = async () => {
    if (!currentUser) {
      alert("Please sign in first.");
      navigate("/signin");
      return;
    }

    if (!agentName.trim() || !summary.trim() || !guidelines.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const agentData = {
        name: agentName.trim(),
        summary: summary.trim(),
        persona: guidelines.trim(),
        specialties,
        icon: selectedEmoji,
        color: selectedColor,

        // ✅ THIS FIXES "owned agents"
        owner: currentUser,

        // optional metadata
        tools: selectedTool ? [selectedTool] : [],
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
        isActive: true,
      };

      // Save agent
      const agentDocRef = await addDoc(collection(db, "agents"), agentData);

      // ✅ If created from a group: add this agent to that group's aiAgents + set activeAgentId
      if (pendingGroupId) {
        const groupRef = doc(db, "groupChats", pendingGroupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const existing = groupData.aiAgents || [];

          const updatedAiAgents = Array.from(new Set([...existing, agentDocRef.id]));

          await updateDoc(groupRef, {
            aiAgents: updatedAiAgents,
            activeAgentId: agentDocRef.id,
            updatedAt: serverTimestamp(),
          });
        }

        // clear the pending flag and go back to the group
        localStorage.removeItem("pendingGroupForNewAI");

        alert("Agent created and added to group!");
        setShowModal(false);
        navigate(`/group-chat/${pendingGroupId}`);
        return;
      }

      // normal flow: go to 1-1 chat
      alert("Agent created successfully!");
      setShowModal(false);
      navigate(`/agent-chat/${agentDocRef.id}`);
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Failed to create agent.");
    }
  };

  return (
    <div className="create-agent-page">
      <Sidebar />

      <div className="main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="logo-container" onClick={handleLogoClick}>
            <img src={logo} alt="Logo" className="logo" />
          </div>

          <button className="settings-btn" type="button">
            <FiSettings className="settings-icon" />
          </button>
        </div>

        {/* Form */}
        <div className="form-container">
          <h2>Make your own Agent</h2>

          <label>Create your agent’s identity: Add a name and icon.</label>
          <div className="row">
            <input
              type="text"
              placeholder="Agent Name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
            <button
              className="icon-preview-btn"
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowModal(true)}
              type="button"
            >
              <span className="icon-symbol">{selectedEmoji}</span>
            </button>
          </div>

          <label>Write a quick summary of your agent’s function.</label>
          <div className="input-with-counter">
            <input
              type="text"
              maxLength="30"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter agent summary..."
            />
            <span className="char-counter">{summary.length}/30</span>
          </div>

          <label>Configure your agent’s behavior and preferences.</label>
          <div className="specialize-row">
            <p>This agent specializes in</p>

            {!showInput ? (
              <button className="add-btn" onClick={() => setShowInput(true)} type="button">
                + Add
              </button>
            ) : (
              <div className="add-specialty-box">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="e.g. Cooking"
                />
                <button className="save-tag-btn" onClick={handleAddSpecialty} type="button">
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="tag-container">
            {specialties.map((item, index) => (
              <div key={index} className="tag">
                <span>{item}</span>
                <FiX className="remove-tag" onClick={() => handleRemoveSpecialty(index)} />
              </div>
            ))}
          </div>

          <label>Define your agent’s role, personality, and behavior guidelines.</label>
          <div className="input-with-counter textarea-wrapper">
            <textarea
              maxLength="500"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Write here..."
            />
            <span className="char-counter">{guidelines.length}/500</span>
          </div>

          <label>Assign tools that your agent can access.</label>
          <select value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)}>
            <option value="">Select tool...</option>
            <option value="Database">Database</option>
            <option value="Chat Interface">Chat Interface</option>
            <option value="Web Scraper">Web Scraper</option>
          </select>

          <button className="create-btn" onClick={handleCreateAgent} type="button">
            Create Agent
          </button>
        </div>

        {/* ICON PICKER MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Select Icon & Colour</h3>

              <EmojiPicker
                onEmojiClick={(emoji) => setSelectedEmoji(emoji.emoji)}
                theme="auto"
                width="100%"
                height={320}
                className="dark-picker"
              />

              <div className="color-picker">
                <p>Pick a background color:</p>
                <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
              </div>

              <button className="save-btn" onClick={() => setShowModal(false)} type="button">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
