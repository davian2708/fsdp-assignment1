const API_BASE_URL = "http://localhost:8000"; // backend running locally
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0ZXIiLCJleHAiOjE3OTQ1NzU5ODN9.baZmdIL7LBNHU34uAokJ5j-D563yJbWu_VwY8iMjDGM";

export async function createAgent(agentData) {
  const res = await fetch(`${API_BASE_URL}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(agentData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create agent");
  }

  return res.json();
}

export async function listAgents() {
  const res = await fetch(`${API_BASE_URL}/agent`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function queryAgent(agentId, query) {
  const res = await fetch(`${API_BASE_URL}/agent/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ agent_id: agentId, user_message: query }),
  });

  if (!res.ok) throw new Error("Query failed");
  return res.json();
}
