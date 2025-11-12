import React, {useState} from 'react'

export default function CreateAgent({backend, token, onCreated}){
  const [name, setName] = useState('test_agent')
  const [role, setRole] = useState('RSAF procedural guidance')
  const [persona, setPersona] = useState('formal, concise, military tone')
  const [allowed, setAllowed] = useState('example_source')

  async function create(){
    if(!token) return alert('Provide x-api-key first')
    const body = { name, role, persona, allowed_sources: allowed.split(',').map(s=>s.trim()) }
    const res = await fetch(backend + '/agents', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key': token }, body: JSON.stringify(body)
    })
    if(res.ok){
      alert('Agent created')
      setName('test_agent_' + Math.floor(Math.random()*999))
      onCreated && onCreated()
    } else {
      const t = await res.text()
      alert('Create failed: ' + res.status + ' ' + t)
    }
  }

  return (
    <div>
      <div className="small">Name</div>
      <input value={name} onChange={e=>setName(e.target.value)} />
      <div className="small">Role</div>
      <input value={role} onChange={e=>setRole(e.target.value)} />
      <div className="small">Persona</div>
      <input value={persona} onChange={e=>setPersona(e.target.value)} />
      <div className="small">Allowed sources (comma)</div>
      <input value={allowed} onChange={e=>setAllowed(e.target.value)} />
      <div style={{marginTop:8}}>
        <button onClick={create}>Create Agent</button>
      </div>
    </div>
  )
}
