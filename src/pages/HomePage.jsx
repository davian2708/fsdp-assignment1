// src/pages/HomePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/SideBar";
import UsageChart from "../components/UsageChart";
import AgentList from "../components/AgentList";
import InviteInbox from "../components/InviteInbox";
import GroupChatList from "../components/GroupChatList";
import TutorialOverlay from "../components/TutorialOverlay";

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

  // Logged-in user
  const currentUser = localStorage.getItem("currentUser"); // email

  // Mailbox toggle
  const [showInbox, setShowInbox] = useState(false);

  // Invite count for badge
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

  const tutorialSteps = useMemo(
    () => [
      {
        selector: '[data-tutorial="home-header"]',
        title: "Dashboard header",
        content:
          "This top bar is your control center. The logo brings you home, and the icons on the right open invites and settings.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="home-logo"]',
        title: "Logo shortcut",
        content:
          "Click the logo to go back to the Home screen. It’s a quick way to start over from the top.",
        placement: "bottom",
      },
      {
        selector: '[data-tutorial="home-mailbox"]',
        title: "Group invites",
        content:
          "Click the mail icon to see group chat invites. Choose Accept to join or Decline to ignore.",
        placement: "left",
      },
      {
        selector: '[data-tutorial="home-stats"]',
        title: "Agent stats cards",
        content:
          "These cards summarize your AI activity: how many agents you have, how many were used this week, and how happy users are.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="home-usage"]',
        title: "Weekly usage",
        content:
          "This chart shows how often your agents were used each day. Higher points mean more activity.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="home-agents"]',
        title: "Recent agents",
        content:
          "This list shows your recent agents. Click one to open a chat with that agent.",
        placement: "top",
      },
      {
        selector: '[data-tutorial="home-groups"]',
        title: "Group chats",
        content:
          "Your group chats appear here. Click a group to open the conversation.",
        placement: "top",
      },
    ],
    []
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
    }
  }, [currentUser, navigate]);

  // Live invite count for badge on homepage icon
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

  // Fetch user-scoped dashboard stats
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
        <div className="dashboard-header" data-tutorial="home-header">
          <div
            className="logo-container"
            onClick={() => navigate("/home")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/home");
            }}
            data-tutorial="home-logo"
          >
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
            {/* Mailbox with badge */}
            <button
              className="mailbox-btn"
              onClick={() => setShowInbox((prev) => !prev)}
              title="Group Invites"
              style={{ position: "relative" }} // allow badge overlay
            >
              <FiMail size={22} />

              {inviteCount > 0 && (
                <span className="mailbox-badge">
                  {inviteCount > 99 ? "99+" : inviteCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button className="settings-btn" title="Settings">
              <FiSettings className="settings-icon" />
            </button>
          </div>
        </div>

        {/* Invite Inbox */}
        {showInbox && <InviteInbox />}

        {/* Stats */}
        <div className="stats-grid" data-tutorial="home-stats">
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
        <div data-tutorial="home-usage">
          <UsageChart />
        </div>

        {/* Recent AI Agents */}
        <div data-tutorial="home-agents">
          <AgentList />
        </div>

        {/* Group Chat List */}
        <div data-tutorial="home-groups">
          <GroupChatList />
        </div>
      </div>

      <TutorialOverlay steps={tutorialSteps} tutorialKey="home" />
    </div>
  );
}
