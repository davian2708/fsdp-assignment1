import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { routeHelpRequest } from "../api";
import "../styles/help.css";

export default function HelpPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      const res = await routeHelpRequest(prompt);
      navigate(`/agent-chat/${res.agentId}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not route your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="help-page">
      <h1>What would you like to know?</h1>

      <form onSubmit={onSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything…"
        />
        <button disabled={loading}>
          {loading ? "Thinking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
