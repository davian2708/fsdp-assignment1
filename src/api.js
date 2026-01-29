const API_BASE_URL = "http://localhost:8000";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0ZXIiLCJleHAiOjE3OTQ1NzU5ODN9.baZmdIL7LBNHU34uAokJ5j-D563yJbWu_VwY8iMjDGM";

// ===== AGENT ENDPOINTS =====
export async function createAgent(agentData) {
  const res = await fetch(`${API_BASE_URL}/agents`, {
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

export async function routeHelpRequest(prompt) {
  const res = await fetch(`${API_BASE_URL}/help/route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Help routing failed");
  }

  return res.json(); // { agentId, created, tags }
}


export async function listAgents() {
  const res = await fetch(`${API_BASE_URL}/agents`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function queryAgent(agentId, message) {
  return fetch("http://localhost:8000/chat/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      agent_id: agentId,
      user_message: message
    })
  }).then(res => {
    if (!res.ok) throw new Error("Query failed");
    return res.json();
  });
}

// ===== FEEDBACK ENDPOINTS =====
export async function submitFeedback(chatId, messageId, agentId, feedbackType, userComment = "") {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      agent_id: agentId,
      feedback_type: feedbackType,
      user_comment: userComment,
    }),
  });

  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function getAgentFeedback(agentId) {
  const res = await fetch(`${API_BASE_URL}/feedback/agent/${agentId}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch feedback");
  return res.json();
}

export async function getFeedbackStats(agentId) {
  const res = await fetch(`${API_BASE_URL}/feedback/stats/${agentId}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch feedback stats");
  return res.json();
}

// ===== KNOWLEDGE BASE ENDPOINTS =====
export async function uploadKBDocument(agentId, content, sourceType, metadata = {}) {
  const res = await fetch(`${API_BASE_URL}/kb/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      content: content,
      metadata: { source_type: sourceType, ...metadata },
    }),
  });

  if (!res.ok) throw new Error("Failed to upload KB document");
  return res.json();
}

export async function uploadPDF(agentId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("agent_id", agentId);

  const res = await fetch(`${API_BASE_URL}/kb/upload-pdf`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload PDF");
  return res.json();
}

export async function uploadText(agentId, content, fileName = "") {
  const res = await fetch(`${API_BASE_URL}/kb/upload-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      content: content,
      metadata: {
        source_type: "text",
        file_name: fileName,
      },
    }),
  });

  if (!res.ok) throw new Error("Failed to upload text");
  return res.json();
}

export async function uploadFromURL(agentId, url) {
  const res = await fetch(`${API_BASE_URL}/kb/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      content: "",
      metadata: {
        source_type: "url",
        source_url: url,
      },
    }),
  });

  if (!res.ok) throw new Error("Failed to ingest URL");
  return res.json();
}

export async function uploadFAQ(agentId, faqEntries) {
  const res = await fetch(`${API_BASE_URL}/kb/faq`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      faq_entries: faqEntries,
    }),
  });

  if (!res.ok) throw new Error("Failed to upload FAQ");
  return res.json();
}

export async function getAgentKB(agentId) {
  const res = await fetch(`${API_BASE_URL}/kb/agent/${agentId}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch KB documents");
  return res.json();
}

// ===== RESPONSE SAVING ENDPOINTS =====
export async function saveResponse(agentId, userMessage, botResponse, tags = []) {
  const res = await fetch(`${API_BASE_URL}/responses/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      user_message: userMessage,
      bot_response: botResponse,
      tags: tags,
    }),
  });

  if (!res.ok) throw new Error("Failed to save response");
  return res.json();
}

export async function getSavedResponses(agentId, tags = null) {
  let url = `${API_BASE_URL}/responses/agent/${agentId}`;
  if (tags && tags.length > 0) {
    url += `?tags=${tags.join(",")}`;
  }

  const res = await fetch(url, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch saved responses");
  return res.json();
}

// ===== MULTI-BOT LINKING ENDPOINTS =====
export async function linkAgents(primaryAgentId, secondaryAgentId) {
  return fetch(`${API_BASE_URL}/chains/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      primary_agent_id: primaryAgentId,
      secondary_agent_id: secondaryAgentId,
    }),
  });
}

export async function queryAgentChain(
  primaryAgentId,
  secondaryAgentId,
  userMessage,
  passContext = true
) {
  const res = await fetch(`${API_BASE_URL}/chains/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      primary_agent_id: primaryAgentId,
      secondary_agent_id: secondaryAgentId,
      user_message: userMessage,
      pass_context: passContext,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to query agent chain");
  }

  return res.json();
}

export async function getAgentChains(agentId) {
  const res = await fetch(`${API_BASE_URL}/chains/chains/${agentId}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch agent chains");
  return res.json();
}