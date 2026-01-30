import React from "react";
import HelpPage from "./pages/HelpPage";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

import HomePage from "./pages/HomePage";
import CreateAgentPage from "./pages/CreateAgent";
import CreateGroupChat from "./pages/CreateGroupChat"; 
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
        <Route path="/create-group" element={<CreateGroupChat />} />
        <Route path="/agent-chat/:agentId" element={<ChatInterface />} />
        <Route path="/view-agents" element={<ViewAgents />} />
        <Route path="/agents" element={<ViewAgents />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/group-chat/:groupId" element={<ChatInterface />} />

        {/* Testing */}
        <Route path="/test" element={<UserForm />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;