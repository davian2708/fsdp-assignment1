import React, { useEffect, useMemo, useState } from "react";
import { FiSettings, FiX } from "react-icons/fi";
import Sidebar from "../components/SideBar";
import TutorialOverlay from "../components/TutorialOverlay";
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

  // Logged-in user (email from SignIn.jsx)
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

  const tutorialSteps = useMemo(
    () => [
      {
        selector: '[data-tutorial="create-header"]',
        title: "Create Agent header",
        content:
          "Use the logo to go back Home. The settings button opens app preferences.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="create-logo"]',
        title: "Logo shortcut",
        content: "Click the logo to return to the Home screen.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="create-identity"]',
        title: "Agent identity",
        content:
          "Give your agent a clear name and choose an icon so you can recognize it later.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="create-summary"]',
        title: "Quick summary",
        content:
          "Write a short one-line summary of what this agent helps with.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="create-specialties"]',
        title: "Specialties",
        content:
          "Add keywords like Finance or Travel so the system can match this agent to users.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="create-guidelines"]',
        title: "Behavior guidelines",
        content:
          "Explain how the agent should behave and respond. This keeps answers consistent.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="create-tools"]',
        title: "Tools",
        content:
          "Choose any tools the agent is allowed to use (optional).",
        placement: "top",
      },
      {
        selector: '[data-tutorial="create-submit"]',
        title: "Create agent",
        content:
          "Click Create Agent to save it and start chatting right away.",
        placement: "top",
      },
    ],
    []
  );

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

        // This fixes "owned agents"
        owner: currentUser,

        // optional metadata
        tools: selectedTool ? [selectedTool] : [],
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
        isActive: true,
      };

      // Save agent
      const agentDocRef = await addDoc(collection(db, "agents"), agentData);

      // If created from a group: add this agent to that group's aiAgents + set activeAgentId
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
        <div className="dashboard-header" data-tutorial="create-header">
          <div
            className="logo-container"
            onClick={handleLogoClick}
            data-tutorial="create-logo"
          >
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
          <div className="row" data-tutorial="create-identity">
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
          <div className="input-with-counter" data-tutorial="create-summary">
            <input
              type="text"
              maxLength="100"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter agent summary..."
            />
            <span className="char-counter">{summary.length}/100</span>
          </div>

          <label>Configure your agent’s behavior and preferences.</label>
          <div className="specialize-row" data-tutorial="create-specialties">
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
          <div
            className="input-with-counter textarea-wrapper"
            data-tutorial="create-guidelines"
          >
            <textarea
              maxLength="500"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Write here..."
            />
            <span className="char-counter">{guidelines.length}/500</span>
          </div>

          <label>Assign tools that your agent can access.</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            data-tutorial="create-tools"
          >
            <option value="">Select tool...</option>
            <option value="Database">Database</option>
            <option value="Chat Interface">Chat Interface</option>
            <option value="Web Scraper">Web Scraper</option>
          </select>

          <button
            className="create-btn"
            onClick={handleCreateAgent}
            type="button"
            data-tutorial="create-submit"
          >
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
      <TutorialOverlay steps={tutorialSteps} tutorialKey="create-agent" />
    </div>
  );
}
