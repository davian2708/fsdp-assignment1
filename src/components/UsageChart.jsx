import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../styles/homepage.css";

const data = [
  { day: "Mon", usage: 30 },
  { day: "Tue", usage: 50 },
  { day: "Wed", usage: 40 },
  { day: "Thu", usage: 70 },
  { day: "Fri", usage: 20 },
  { day: "Sat", usage: 45 },
  { day: "Sun", usage: 60 },
];

export default function UsageChart() {
  return (
    <div className="usage-card">
      <h3>Usage Overview</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <XAxis
              dataKey="day"
              stroke="#555"
              tickLine={false}
              tick={{ fontSize: 13, fill: "#555" }}
            />
            <YAxis
              stroke="#555"
              tickLine={false}
              axisLine={{ stroke: "#ddd" }}
              tick={{ fontSize: 13, fill: "#555" }}
            />

            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #ddd",
                color: "#111",
                padding: "8px 12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              itemStyle={{ color: "#111" }}
              labelStyle={{ fontWeight: 600, color: "#333" }}
            />


            <Bar
              dataKey="usage"
              fill="#888" 
              radius={[6, 6, 0, 0]}
              activeBar={{ fill: "#000" }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}