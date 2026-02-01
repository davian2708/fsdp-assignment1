import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import "../styles/homepage.css";

// Firebase
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function UsageChart() {
  const [data, setData] = useState([]);
  const [peakDay, setPeakDay] = useState(null);

  const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay() || 7; // Sunday = 7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

  const endOfWeek = (date) => {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};
  // 🔐 Logged-in user
  const currentUser = localStorage.getItem("currentUser");

  useEffect(() => {
    if (!currentUser) return;

    const fetchQuestionsPerDay = async () => {
      // 1️⃣ Get user’s agents
      const agentsSnap = await getDocs(collection(db, "agents"));
      const userAgentIds = agentsSnap.docs
        .filter((doc) => doc.data().owner === currentUser)
        .map((doc) => doc.id);

      // 🚫 No agents → empty chart
      if (userAgentIds.length === 0) {
        const empty = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (day) => ({
            day,
            questions: 0,
            lastWeek: 0,
            trend: "—",
          })
        );
        setData(empty);
        setPeakDay(null);
        return;
      }

      // 2️⃣ Get messages
      const snap = await getDocs(collection(db, "messages"));

      const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const currentWeek = {};
      const lastWeek = {};

      orderedDays.forEach((d) => {
        currentWeek[d] = 0;
        lastWeek[d] = 0;
      });

      const now = new Date();

      const currentWeekStart = startOfWeek(now);
      const currentWeekEnd = endOfWeek(now);

      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const lastWeekEnd = new Date(currentWeekEnd);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      snap.docs.forEach((doc) => {
        const { sender, createdAt, agentId } = doc.data();

        if (
          sender !== "user" ||
          !createdAt ||
          !userAgentIds.includes(agentId)
        )
          return;

        const date = createdAt.toDate();
        const dayIndex = (date.getDay() + 6) % 7;
        const day = orderedDays[dayIndex];

        const today = startOfDay(new Date());
        const msgDate = startOfDay(date);

        if (msgDate >= currentWeekStart && msgDate <= currentWeekEnd) {
          currentWeek[day]++;
        } else if (msgDate >= lastWeekStart && msgDate <= lastWeekEnd) {
          lastWeek[day]++;
        }
      });

      const chartData = orderedDays.map((day) => ({
        day,
        questions: currentWeek[day],
        lastWeek: lastWeek[day],
        trend:
          lastWeek[day] === 0
            ? "—"
            : currentWeek[day] > lastWeek[day]
            ? "↑"
            : currentWeek[day] < lastWeek[day]
            ? "↓"
            : "→",
      }));

      const peak = chartData.reduce((max, d) =>
        d.questions > max.questions ? d : max
      );

      // 🧠 If all zeros, no peak
      const hasData = chartData.some((d) => d.questions > 0);

      setPeakDay(hasData ? peak : null);
      setData(chartData);
    };

    fetchQuestionsPerDay();
  }, [currentUser]);

  return (
    <div className="usage-card">
      <h3>Weekly Usage</h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;

            const { questions, lastWeek } = payload[0].payload;

            return (
              <div className="custom-tooltip">
                <strong>{label}</strong>
                <div>This week: {questions}</div>
                <div>Last week: {lastWeek}</div>
              </div>
            );
          }}
        />


          <Line
            type="monotone"
            dataKey="questions"
            stroke="#4a4a4a"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />

          {peakDay && (
            <ReferenceDot
              x={peakDay.day}
              y={peakDay.questions}
              r={8}
              fill="#0022ff"
              stroke="none"
              label={{
                value: "Peak",
                position: "top",
                fill: "#0022ff",
                fontWeight: 600,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
