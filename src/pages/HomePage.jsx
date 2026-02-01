// src/pages/HomePage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/SideBar";
import UsageChart from "../components/UsageChart";
import AgentList from "../components/AgentList";
import InviteInbox from "../components/InviteInbox";
import GroupChatList from "../components/GroupChatList";

import logo from "../assets/Flying Bot Logo.png";
import { FiSettings, FiMail } from "react-icons/fi";

import "../styles/homepage.css";

// Firebase
import { db } from "../firebase";
import {
  collection,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function HomePage() {
  const navigate = useNavigate();

  // 🔐 Logged-in user
  const currentUser = localStorage.getItem("currentUser"); // email

  // 📬 Mailbox toggle
  const [showInbox, setShowInbox] = useState(false);

  // 🔴 Invite count for badge
  const [inviteCount, setInviteCount] = useState(0);

  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    userSatisfaction: 0,
  });

  const [agentActivity, setAgentActivity] = useState({
    active: 0,
    inactive: 0,
  });

  // 🚫 Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
    }
  }, [currentUser, navigate]);

  // ✅ LIVE invite count for badge on homepage icon
  useEffect(() => {
    if (!currentUser) return;

    const qInvites = query(
      collection(db, "groupInvites"),
      where("toEmail", "==", currentUser),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      qInvites,
      (snap) => {
        setInviteCount(snap.size);
      },
      (err) => {
        console.error("Invite count listener error:", err);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 📊 Fetch USER-SCOPED dashboard stats
  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        // ===== Agents (user-scoped) =====
        const agentsSnap = await getDocs(collection(db, "agents"));

        const userAgents = agentsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((agent) => agent.owner === currentUser);

        const totalAgents = userAgents.length;

        // Active agents in last 7 days
        const sevenDaysAgo = Timestamp.fromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        const activeAgents = userAgents.filter((agent) => {
          if (!agent.lastUsedAt) return false;
          return agent.lastUsedAt.toDate() >= sevenDaysAgo.toDate();
        }).length;

        setAgentActivity({
          active: activeAgents,
          inactive: totalAgents - activeAgents,
        });

        // ===== Feedback satisfaction (userEmail-scoped) =====
        // IMPORTANT: This requires each feedback doc to include `userEmail`.
        // (Add it when writing feedback from ChatInterface)
        const feedbackQ = query(
          collection(db, "feedback"),
          where("userEmail", "==", currentUser)
        );

        const feedbackSnap = await getDocs(feedbackQ);
        const userFeedback = feedbackSnap.docs.map((d) => d.data());

        const totalFeedback = userFeedback.length;
        const positive = userFeedback.filter((f) => f.satisfied === true).length;

        const userSatisfaction =
          totalFeedback === 0 ? 0 : Math.round((positive / totalFeedback) * 100);

        setStats({
          totalAgents,
          activeAgents,
          userSatisfaction,
        });
      } catch (err) {
        console.error("Failed to fetch homepage stats:", err);
        // keep UI stable if something fails
        setStats((prev) => ({ ...prev, userSatisfaction: prev.userSatisfaction ?? 0 }));
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      <Sidebar />

      <div className="main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="logo" />
          </div>

          {/* Top-right icons */}
          <div
            style={{
              position: "absolute",
              right: "40px",
              display: "flex",
              gap: "14px",
              alignItems: "center",
            }}
          >
            {/* 📬 Mailbox with 🔴 badge */}
            <button
              className="mailbox-btn"
              onClick={() => setShowInbox((prev) => !prev)}
              title="Group Invites"
              style={{ position: "relative" }}
            >
              <FiMail size={22} />

              {inviteCount > 0 && (
                <span className="mailbox-badge">
                  {inviteCount > 99 ? "99+" : inviteCount}
                </span>
              )}
            </button>

            {/* ⚙️ Settings */}
            <button className="settings-btn" title="Settings">
              <FiSettings className="settings-icon" />
            </button>
          </div>
        </div>

        {/* 📬 Invite Inbox */}
        {showInbox && <InviteInbox />}

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

        {/* Weekly Usage Chart */}
        <UsageChart />

        {/* Recent AI Agents */}
        <AgentList />

        {/* Group Chat List */}
        <GroupChatList />
      </div>
    </div>
  );
}
