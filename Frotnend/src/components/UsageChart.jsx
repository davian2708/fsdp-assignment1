import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
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
  // Logged-in user
  const currentUser = localStorage.getItem("currentUser");

  useEffect(() => {
    if (!currentUser) return;

    const fetchQuestionsPerDay = async () => {
      // Get user’s agents
      const agentsSnap = await getDocs(collection(db, "agents"));
      const userAgentIds = agentsSnap.docs
        .filter((doc) => doc.data().owner === currentUser)
        .map((doc) => doc.id);

      // No agents → empty chart
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

      // Get messages
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

      // If all zeros, no peak
      const hasData = chartData.some((d) => d.questions > 0);

      setPeakDay(hasData ? peak : null);
      setData(chartData);
    };

    fetchQuestionsPerDay();
  }, [currentUser]);

  const maxQuestions = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((max, d) => (d.questions > max ? d.questions : max), 0);
  }, [data]);

  const getIntensity = (value) => {
    if (!maxQuestions) return 0;
    return value / maxQuestions;
  };

  return (
    <div className="usage-card">
      <h3>Weekly Usage</h3>

      <div style={{ width: "100%", height: 240 }}>
        <BarChartWrapper
          data={data}
          peakDay={peakDay}
          getIntensity={getIntensity}
        />
      </div>
    </div>
  );
}

function BarChartWrapper({ data, peakDay, getIntensity }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <pattern
            id="peak-stripe"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="rgba(var(--heat-rgb), 0.15)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(var(--heat-rgb), 0.55)" strokeWidth="2" />
          </pattern>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={16} barGap={6}>
          <CartesianGrid strokeDasharray="4 6" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="var(--chart-axis)"
            tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-axis)" }}
          />
          <YAxis
            allowDecimals={false}
            stroke="var(--chart-axis)"
            tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-axis)" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0)" }}
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
          <Bar dataKey="questions" radius={[10, 10, 6, 6]}>
            {data.map((entry) => {
              const intensity = getIntensity(entry.questions);
              const alpha = entry.questions === 0 ? 0.12 : 0.2 + intensity * 0.5;
              const isPeak = peakDay && peakDay.day === entry.day;
              return (
                <Cell
                  key={entry.day}
                  fill={isPeak ? "url(#peak-stripe)" : `rgba(var(--heat-rgb), ${alpha})`}
                  stroke="var(--heat-border)"
                  strokeWidth={1}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
