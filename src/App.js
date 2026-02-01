import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import CreateAgentPage from "./pages/CreateAgent";
import ChatInterface from "./pages/ChatInterface";
import ViewAgents from "./pages/ViewAgents";
import HelpPage from "./pages/HelpPage";
import UserForm from "./components/UserForm";

import CameraEmotionToggle from "./components/CameraEmotionToggle";

function App() {
  return (
    <Router>
      {/* Global camera toggle available everywhere */}
      <CameraEmotionToggle />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-agent" element={<CreateAgentPage />} />
        <Route path="/agent-chat/:agentId" element={<ChatInterface />} />
        <Route path="/view-agents" element={<ViewAgents />} />
        <Route path="/agents" element={<ViewAgents />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/test" element={<UserForm />} />
      </Routes>
    </Router>
  );
}

export default App;
