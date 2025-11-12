import React from 'react'

export default function AgentList({agents, selected, onSelect}){
  if(!agents) return <div>No agents</div>
  return (
    <div>
      {agents.map(a=> (
        <div key={a.id} className={'agent-item ' + ((selected && selected.id===a.id)?'agent-selected':'')} onClick={()=>onSelect(a)}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <strong>{a.name}</strong>
            <span className="small">{a.id.slice(0,8)}</span>
          </div>
          <div className="small">{a.role}</div>
          <div className="small">Sources: {(a.allowed_sources||[]).join(', ')}</div>
        </div>
      ))}
    </div>
  )
}
