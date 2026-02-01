import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

import HomePage from "./pages/HomePage";
import CreateAgentPage from "./pages/CreateAgent";
import CreateGroupChat from "./pages/CreateGroupChat";
import ChatInterface from "./pages/ChatInterface";
import ViewAgents from "./pages/ViewAgents";
import HelpPage from "./pages/HelpPage";
import GroupChatInterface from "./pages/GroupChatInterface"; // ✅ add this

import UserForm from "./components/UserForm";

import CameraEmotionToggle from "./components/CameraEmotionToggle";

function App() {
  return (
    <Router>
      {/* Global camera toggle available everywhere */}
      <CameraEmotionToggle />

      <Routes>
        {/* Default entry */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Main app */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-agent" element={<CreateAgentPage />} />
        <Route path="/create-group" element={<CreateGroupChat />} />

        {/* 1-1 chat */}
        <Route path="/agent-chat/:agentId" element={<ChatInterface />} />

        {/* Agents */}
        <Route path="/view-agents" element={<ViewAgents />} />
        <Route path="/agents" element={<ViewAgents />} />

        {/* Group chat */}
        <Route path="/group-chat/:groupId" element={<GroupChatInterface />} /> {/* ✅ keep only this */}

        {/* Help */}
        <Route path="/help" element={<HelpPage />} />

        {/* Testing */}
        <Route path="/test" element={<UserForm />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
