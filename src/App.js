import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

import HomePage from "./pages/HomePage";
import CreateAgentPage from "./pages/CreateAgent";
import ChatInterface from "./pages/ChatInterface";
import ViewAgents from "./pages/ViewAgents";

import UserForm from "./components/UserForm";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default entry */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Main app */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-agent" element={<CreateAgentPage />} />
        <Route path="/agent-chat/:agentId" element={<ChatInterface />} />
        <Route path="/view-agents" element={<ViewAgents />} />
        <Route path="/agents" element={<ViewAgents />} />

        {/* Testing */}
        <Route path="/test" element={<UserForm />} />

        {/* Catch-all (optional safety net) */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

