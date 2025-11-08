import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

const SideBar = () => {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <div className="user-profile">
        <div className="user-icon">👤</div>
        <p>User xx2f0</p>
      </div>

      <button className="create-agent-btn" onClick={() => navigate("/create-agent")}>
        + Create New Agent
      </button>

      <div className="menu">
        <button className="menu-btn" onClick={() => navigate("/explore")}>
          Explore
        </button>

        <button className="menu-btn" onClick={() => navigate("/view-agents")}>
          View AI Agents
        </button>
      </div>
    </div>
  );
};

export default SideBar;