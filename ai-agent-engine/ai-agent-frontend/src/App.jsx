import React, {useState, useEffect, useRef} from 'react'
import CreateAgent from './components/CreateAgent'
import AgentList from './components/AgentList'
import UploadDocs from './components/UploadDocs'
import ChatPanel from './components/ChatPanel'

const BACKEND = 'http://localhost:8000' // change if different

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('x-api-key') || '')
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [refreshFlag, setRefreshFlag] = useState(0)

  useEffect(()=>{ if(token) localStorage.setItem('x-api-key', token) }, [token])

  useEffect(()=>{ fetchAgents() }, [refreshFlag])

  async function fetchAgents(){
    if(!token) return
    try{
      const res = await fetch(BACKEND + '/agents', { headers: {'x-api-key': token} })
      if(res.status===200){
        const data = await res.json()
        setAgents(data)
      } else {
        console.error('list agents failed', res.status)
      }
    } catch(e){ console.error(e) }
  }

  return (
    <div className="container">
      <header>
        <h2>AI Agent Dashboard</h2>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <input placeholder="x-api-key (paste here)" value={token} onChange={e=>setToken(e.target.value)} style={{minWidth:340}} />
          <button onClick={()=>{ setRefreshFlag(f=>f+1); fetchAgents(); }}>Refresh</button>
        </div>
      </header>

      <div className="row">
        <div className="col" style={{minWidth:320}}>
          <div className="card">
            <h3 style={{marginTop:0}}>Create Agent</h3>
            <CreateAgent backend={BACKEND} token={token} onCreated={()=>setRefreshFlag(f=>f+1)} />
          </div>

          <div className="card">
            <h3 style={{marginTop:0}}>Agents</h3>
            <AgentList agents={agents} selected={selectedAgent} onSelect={a=>setSelectedAgent(a)} />
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3 style={{marginTop:0}}>Upload Documents</h3>
            <UploadDocs backend={BACKEND} token={token} agent={selectedAgent} />
          </div>

          <div className="card">
            <h3 style={{marginTop:0}}>Chat</h3>
            <ChatPanel backend={BACKEND} token={token} agent={selectedAgent} />
          </div>
        </div>
      </div>
      <footer style={{marginTop:12}} className="small">Notes: paste the API key from <span className="tok">/generate_test_key</span> or your real key. Backend must be running at <strong>{BACKEND}</strong>.</footer>
    </div>
  )
}
