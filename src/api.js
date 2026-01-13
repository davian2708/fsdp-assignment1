export async function queryAgent(agentId, userMessage, imageBase64 = null) {
  console.log("queryAgent called:", agentId, userMessage);
  console.log("Sending image:", !!imageBase64);

  const res = await fetch("http://127.0.0.1:8000/agent/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      user_message: userMessage,
      image_base64: imageBase64,
    }),
  });

  console.log("Response status:", res.status);

  const text = await res.text();
  console.log("Raw response:", text);

  if (!res.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
}


