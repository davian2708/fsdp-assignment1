import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import TutorialOverlay from "../components/TutorialOverlay";
import logo from "../assets/Flying Bot Logo.png";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../styles/createagent.css";

export default function CreateGroupChat() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser");

  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [members, setMembers] = useState([]);

  const handleLogoClick = () => navigate("/home");

  const tutorialSteps = useMemo(
    () => [
      {
        selector: '[data-tutorial="group-title"]',
        title: "Create a group chat",
        content:
          "Start a shared chat with multiple people here.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="group-logo"]',
        title: "Logo shortcut",
        content: "Click the logo to return to the Home screen.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="group-name"]',
        title: "Group name",
        content:
          "Give your group a clear name so members recognize it easily.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="group-members"]',
        title: "Add members",
        content:
          "Type an email address and click Add. Repeat for each person you want to invite.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="group-tags"]',
        title: "Member list",
        content:
          "All invited emails appear here. Remove any name before creating the group.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="group-submit"]',
        title: "Create group",
        content:
          "Click Create Group Chat to save the group and return Home.",
        placement: "top",
      },
    ],
    []
  );

  const handleAddMember = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (members.includes(email)) return alert("User already added");
    setMembers([...members, email]);
    setEmailInput("");
  };

  const handleRemoveMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      alert("Please provide a group name");
      return;
    }

    try {
      await addDoc(collection(db, "groupChats"), {
        name: groupName,
        members: Array.from(new Set([currentUser, ...members])),
        createdBy: currentUser,
        createdAt: serverTimestamp(),
      });

      alert("Group chat created!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      alert("Failed to create group chat");
    }
  };

  return (
    <div className="create-agent-page">
      <Sidebar />
      <div className="main">
        <div className="dashboard-header" data-tutorial="group-header">
          <div
            className="logo-container"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            data-tutorial="group-logo"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogoClick();
            }}
          >
            <img src={logo} alt="Logo" className="logo" />
          </div>
        </div>

        <div className="form-container">
          <h2 data-tutorial="group-title">Create Group Chat</h2>

          <label>Group Name</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            data-tutorial="group-name"
          />

          <label>Add Members (by email)</label>
          <div className="row" data-tutorial="group-members">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button className="add-btn" onClick={handleAddMember}>Add</button>
          </div>

          <div className="tag-container" data-tutorial="group-tags">
            {members.map((email, i) => (
              <div key={i} className="tag">
                <span>{email}</span>
                <span className="remove-tag" onClick={() => handleRemoveMember(i)}>✕</span>
              </div>
            ))}
          </div>

          <button
            className="create-btn"
            onClick={handleCreateGroup}
            data-tutorial="group-submit"
          >
            Create Group Chat
          </button>
        </div>
      </div>

      <TutorialOverlay steps={tutorialSteps} tutorialKey="create-group" />
    </div>
  );
}
