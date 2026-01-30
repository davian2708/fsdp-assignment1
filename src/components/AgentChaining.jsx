import React, { useState, useEffect } from "react";
import { FiLink2, FiSend, FiChevronDown } from "react-icons/fi";
import { listAgents, queryAgentChain, linkAgents  } from "../api";
import "../styles/agentchaining.css";

export default function AgentChaining({ primaryAgentId, onChainSelected }) {
  const [agents, setAgents] = useState([]);
  // const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // const [chainInput, setChainInput] = useState("");
  // const [chainMessages, setChainMessages] = useState([]);
  // const [loading, setLoading] = useState(false);
  // const [showChainChat, setShowChainChat] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);


  useEffect(() => {
    loadAvailableAgents();
  }, [primaryAgentId]);

  const loadAvailableAgents = async () => {
    try {
      const data = await listAgents();
      const filtered = data.filter((a) => a.id !== primaryAgentId);
      setAgents(filtered);
      console.log("Available agents loaded:", filtered.length);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  };

// const selectAgent = async (agent) => {
//   try {
//     console.log("Linking agents:", primaryAgentId, agent.id);


//     await linkAgents(primaryAgentId, agent.id);

//     console.log("Agents linked successfully");

//     setSelectedAgent(agent);
//     setShowDropdown(false);
//     setShowChainChat(true);
//     setChainMessages([]);
//     setChainInput("");
//   } catch (err) {
//     console.error("Failed to link agents:", err);
//     alert("Failed to link agents. Check backend logs.");
//   }
// };

const selectAgent = async (agent) => {
  try {
    console.log("Linking agents:", primaryAgentId, agent.id);

    await linkAgents(primaryAgentId, agent.id);

    console.log("Agents linked successfully");

    setSelectedAgent(agent);
    setShowDropdown(false);

    onChainSelected({
      enabled: true,
      secondaryAgent: agent,
    });

  } catch (err) {
    console.error("Failed to link agents:", err);
    alert("Failed to link agents. Check backend logs.");
  }
};

  const handleChainQuery = async () => {
    if (!chainInput.trim() || !selectedAgent) return;

    const userMessage = chainInput;
    setChainInput("");

    setChainMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);

    setLoading(true);
    try {
      console.log("Querying chain:", {
        primary: primaryAgentId,
        secondary: selectedAgent.id,
        message: userMessage,
      });
      
      const res = await queryAgentChain(
        primaryAgentId,
        selectedAgent.id,
        userMessage,
        true
      );

      console.log("Chain response:", res);

      setChainMessages((prev) => [
        ...prev,
        {
          sender: "chain",
          text: res.combined_response,
          agentResponses: [
            {
              agent_name: res.primary_agent.name,
              response: res.primary_agent.response,
            },
            {
              agent_name: res.secondary_agent.name,
              response: res.secondary_agent.response,
            },
          ],
        },
      ]);
    } catch (err) {
      console.error("Chain query error:", err);
      setChainMessages((prev) => [
        ...prev,
        { sender: "chain", text: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // if (showChainChat && selectedAgent) {
  //   return (
  //     <div className="chain-interface">
  //       <div className="chain-header-simple">
  //         <button
  //           className="chain-back-btn"
  //           onClick={() => {
  //             setShowChainChat(false);
  //             setSelectedAgent(null);
  //             setChainMessages([]);
  //           }}
  //         >
  //           ← Back
  //         </button>
  //         <div className="chain-title">
  //           <h4>Chaining with {selectedAgent.name}</h4>
  //           <p>Messages sent through both agents</p>
  //         </div>
  //       </div>

  //       <div className="chain-messages-list">
  //         {chainMessages.map((msg, idx) => (
  //           <div key={idx} className={`chain-msg ${msg.sender}`}>
  //             <div className="msg-bubble">
  //               <p>{msg.text}</p>
  //               {msg.agentResponses && (
  //                 <div className="agent-responses-mini">
  //                   {msg.agentResponses.map((resp, i) => (
  //                     <div key={resp.agent_name} className="agent-resp-mini">
  //                       <strong>{resp.agent_name}:</strong>
  //                       <p>{resp.response}</p>
  //                     </div>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //         ))}
  //       </div>

  //       <div className="chain-input-simple">
  //         <input
  //           type="text"
  //           placeholder="Type message for chain..."
  //           value={chainInput}
  //           onChange={(e) => setChainInput(e.target.value)}
  //           onKeyDown={(e) => e.key === "Enter" && handleChainQuery()}
  //           disabled={loading}
  //         />
  //         <button
  //           onClick={handleChainQuery}
  //           disabled={loading || !chainInput.trim()}
  //         >
  //           <FiSend size={16} />
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="chain-dropdown-wrapper">
      <button
        className="chain-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Chain with another agent"
      >
        <FiLink2 size={18} /> Chain
        <FiChevronDown size={14} />
      </button>

      {showDropdown && (
        <div className="chain-dropdown">
          <div className="dropdown-header">
            <h4>Select agent to chain with:</h4>
          </div>
          
          {agents.length === 0 ? (
            <p className="no-agents">No other agents available</p>
          ) : (
            <div className="dropdown-list">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  className="dropdown-item"
                  onClick={() => selectAgent(agent)}
                >
                  <span className="agent-icon">{agent.icon || "🤖"}</span>
                  <div className="agent-details">
                    <strong>{agent.name}</strong>
                    <small>{agent.role}</small>
                  </div>
                  <span className="arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
