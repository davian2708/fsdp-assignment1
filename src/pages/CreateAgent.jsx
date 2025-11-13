import React, { useState } from "react";
import { FiSettings, FiX } from "react-icons/fi";
import Sidebar from "../components/SideBar";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { HexColorPicker } from "react-colorful";
import "../styles/createagent.css";

import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CreateAgentPage() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("🤖");
  const [selectedColor, setSelectedColor] = useState("#3a3a3a");
  const [specialties, setSpecialties] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [summary, setSummary] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [agentName, setAgentName] = useState("");

  const handleLogoClick = () => navigate("/");

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
      setShowInput(false);
    }
  };

  const handleRemoveSpecialty = (index) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  // 🚀 Create agent in FIREBASE (NOT FastAPI)
  const handleCreateAgent = async () => {
    if (!agentName || !summary || !guidelines) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const agentData = {
        name: agentName,
        summary: summary,
        persona: guidelines,
        specialties: specialties,
        icon: selectedEmoji,
        color: selectedColor,
        tools: [],
        createdAt: serverTimestamp(),
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, "agents"), agentData);

      alert("Agent created successfully!");
      setShowModal(false);

      // Redirect to chat with Firestore agent ID
      navigate(`/agent-chat/${docRef.id}`);
    } catch (error) {
      console.error("🔥 Error creating agent:", error);
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
            <img
              src="/src/assets/Flying Bot Logo.png"
              alt="Logo"
              className="logo"
            />
          </div>
          <button className="settings-btn">
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
              <button className="add-btn" onClick={() => setShowInput(true)}>
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
                <button className="save-tag-btn" onClick={handleAddSpecialty}>
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="tag-container">
            {specialties.map((item, index) => (
              <div key={index} className="tag">
                <span>{item}</span>
                <FiX
                  className="remove-tag"
                  onClick={() => handleRemoveSpecialty(index)}
                />
              </div>
            ))}
          </div>

          <label>
            Define your agent’s role, personality, and behavior guidelines.
          </label>
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
          <select>
            <option>Select tool...</option>
            <option>Database</option>
            <option>Chat Interface</option>
            <option>Web Scraper</option>
          </select>

          <button className="create-btn" onClick={handleCreateAgent}>
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
                <HexColorPicker
                  color={selectedColor}
                  onChange={setSelectedColor}
                />
              </div>

              <button className="create-btn" onClick={handleCreateAgent}>
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
