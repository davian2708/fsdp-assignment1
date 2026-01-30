import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import logo from "../assets/Flying Bot Logo.png";
import { FiSettings } from "react-icons/fi";
import "../styles/help.css";
import { routeHelpRequest } from "../api";

export default function HelpPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogoClick = () => navigate("/");

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const result = await routeHelpRequest(trimmed);
      if (!result?.agentId) throw new Error("No agentId returned");
      navigate(`/agent-chat/${result.agentId}`);
    } catch (err) {
      console.error(err);
      alert("Could not route your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-layout">
      <Sidebar />

      <div className="help-panel">
        <div className="help-header">
          <div className="logo-container" onClick={handleLogoClick} role="button" tabIndex={0}>
            <img src={logo} alt="Logo" className="logo" />
          </div>

          <button className="settings-btn" aria-label="Settings">
            <FiSettings className="settings-icon" />
          </button>
        </div>

        <div className="help-card">
          <h1 className="help-title">What would you like to know?</h1>
          <p className="help-subtitle">
            Tell us your topic (e.g. food, skincare, fitness). We’ll connect you to the best agent — or create one.
          </p>

          <form onSubmit={onSubmit} className="help-form">
            <textarea
              className="help-input"
              placeholder="Type your question here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={loading}
            />

            <div className="help-actions">
              <button
                type="button"
                className="help-secondary"
                onClick={() => navigate("/view-agents")}
                disabled={loading}
              >
                Browse agents
              </button>

              <button type="submit" className="help-primary" disabled={loading}>
                {loading ? "Finding an agent..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
