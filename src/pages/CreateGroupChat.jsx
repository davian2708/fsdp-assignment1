import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../styles/createagent.css";

export default function CreateGroupChat() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser");

  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [members, setMembers] = useState([]);

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
        <div className="form-container">
          <h2>Create Group Chat</h2>

          <label>Group Name</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <label>Add Members (by email)</label>
          <div className="row">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button className="add-btn" onClick={handleAddMember}>Add</button>
          </div>

          <div className="tag-container">
            {members.map((email, i) => (
              <div key={i} className="tag">
                <span>{email}</span>
                <span className="remove-tag" onClick={() => handleRemoveMember(i)}>✕</span>
              </div>
            ))}
          </div>

          <button className="create-btn" onClick={handleCreateGroup}>
            Create Group Chat
          </button>
        </div>
      </div>
    </div>
  );
}
