import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import TutorialOverlay from "../components/TutorialOverlay";
import logo from "../assets/Flying Bot Logo.png";
import { FiSettings } from "react-icons/fi";
import "../styles/help.css";
import { routeHelpRequest } from "../api";

export default function HelpPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogoClick = () => navigate("/home");

  const tutorialSteps = useMemo(
    () => [
      {
        selector: '[data-tutorial="help-header"]',
        title: "Help header",
        content:
          "This top bar keeps the logo and settings within easy reach.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="help-logo"]',
        title: "Logo shortcut",
        content: "Click the logo to go back to the Home screen.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="help-card"]',
        title: "Help card",
        content:
          "Tell us what you need, and we will connect you to the right agent.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="help-input"]',
        title: "Your request",
        content:
          "Type your question or topic here. Press Enter to send.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="help-browse"]',
        title: "Browse agents",
        content:
          "Browse and pick an agent yourself instead of auto-matching.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="help-continue"]',
        title: "Continue",
        content:
          "Click Continue to start a chat with the best agent for your request.",
        placement: "top",
      },
    ],
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const result = await routeHelpRequest(trimmed);
      if (!result?.agentId) throw new Error("No agentId returned");
      navigate(`/agent-chat/${result.agentId}`, {
      state: { initialPrompt: trimmed },
    });

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
        <div className="help-header" data-tutorial="help-header">
          <div
            className="logo-container"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            data-tutorial="help-logo"
          >
            <img src={logo} alt="Logo" className="logo" />
          </div>

          <button className="settings-btn" aria-label="Settings">
            <FiSettings className="settings-icon" />
          </button>
        </div>

        <div className="help-card" data-tutorial="help-card">
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={4}
            disabled={loading}
            data-tutorial="help-input"
          />


            <div className="help-actions">
              <button
                type="button"
                className="help-secondary"
                onClick={() => navigate("/view-agents")}
                disabled={loading}
                data-tutorial="help-browse"
              >
                Browse agents
              </button>

              <button
                type="submit"
                className="help-primary"
                disabled={loading}
                data-tutorial="help-continue"
              >
                {loading ? "Finding an agent..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <TutorialOverlay steps={tutorialSteps} tutorialKey="help" />
    </div>
  );
}
