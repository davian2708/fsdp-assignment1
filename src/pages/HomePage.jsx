import React from "react";
import Sidebar from "../components/SideBar";
import UsageChart from "../components/UsageChart";
import AgentList from "../components/AgentList";
import logo from "../assets/Flying Bot Logo.png";
import { FiSettings } from "react-icons/fi";
import "../styles/homepage.css";

export default function HomePage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div className="main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
          </div>
          <div>
            <button className="settings-btn">
              <FiSettings className="settings-icon" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="card">
            <h3>Perm Agents</h3>
            <p>12</p>
          </div>
          <div className="card">
            <h3>Temp Agents</h3>
            <p>7</p>
          </div>
          <div className="card">
            <h3>Views</h3>
            <p>480</p>
          </div>
        </div>

        {/* Chart */}
        <UsageChart />

        {/* Agent List */}
        <AgentList />
      </div>
    </div>
  );
}