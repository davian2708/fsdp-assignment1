import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/sidebar.css";
import { useTheme } from "../context/ThemeContext";
import { FiMenu, FiX } from "react-icons/fi";

const SideBar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* BACKDROP */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        {/* Mobile close button */}
        <button
          className="sidebar-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <FiX size={20} />
        </button>

        <div className="user-profile">
          <div className="user-icon">👤</div>
          <p>User xx2f0</p>
        </div>

        <button
          className="create-agent-btn"
          onClick={() => {
            navigate("/create-agent");
            setOpen(false);
          }}
        >
          + Create New Agent
        </button>

        <div className="menu">
          <button
            className="menu-btn"
            onClick={() => {
              navigate("/explore");
              setOpen(false);
            }}
          >
            Explore
          </button>

          <button
            className="menu-btn"
            onClick={() => {
              navigate("/view-agents");
              setOpen(false);
            }}
          >
            View AI Agents
          </button>
        </div>

        {/* Theme toggle at bottom */}
        <div
          className="menu"
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <button
            className="menu-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </div>
    </>
  );
};

export default SideBar;