import React, { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import UsageChart from "../components/UsageChart";
import AgentList from "../components/AgentList";
import logo from "../assets/Flying Bot Logo.png";
import { FiSettings } from "react-icons/fi";
import "../styles/homepage.css";

// Firebase
import { db } from "../firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    userSatisfaction: 0,
  });

  const [agentActivity, setAgentActivity] = useState({
  active: 0,
  inactive: 0,
});

  useEffect(() => {
    const fetchStats = async () => {
      //  TOTAL AGENTS
      const agentsSnap = await getDocs(collection(db, "agents"));
      const totalAgents = agentsSnap.size;

      //  ACTIVE AGENTS (LAST 7 DAYS)
      const sevenDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const activeAgents = agentsSnap.docs.filter((doc) => {
        const lastUsedAt = doc.data().lastUsedAt;
        return lastUsedAt && lastUsedAt.toDate() >= sevenDaysAgo.toDate();
      }).length;

      const inactiveAgents = totalAgents - activeAgents;

      setAgentActivity({
        active: activeAgents,
        inactive: inactiveAgents,
      });

      //  USER SATISFACTION
      const feedbackSnap = await getDocs(collection(db, "feedback"));
      const totalFeedback = feedbackSnap.size;

      const positive = feedbackSnap.docs.filter(
        (doc) => doc.data().satisfied === true
      ).length;

      const userSatisfaction =
        totalFeedback === 0
          ? 0
          : Math.round((positive / totalFeedback) * 100);

      setStats({
        totalAgents,
        activeAgents,
        userSatisfaction,
      });
    };

    fetchStats();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div className="main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="logo" />
          </div>
          <button className="settings-btn">
            <FiSettings className="settings-icon" />
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="card">
            <h3>Total Agents</h3>
            <p>{stats.totalAgents}</p>
          </div>

          <div className="card highlight">
            <h3>Active Agents (7 days)</h3>
            <p>{stats.activeAgents}</p>
          </div>

          <div className="card highlight">
            <h3>User Satisfaction</h3>
            <p>{stats.userSatisfaction}%</p>
          </div>
        </div>

        {/* Chart */}
        <UsageChart data={agentActivity}/>

        {/* Agent List */}
        <AgentList />
      </div>
    </div>
  );
}
