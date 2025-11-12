import React, {useState, useRef, useEffect} from 'react'

export default function ChatPanel({backend, token, agent}){
  const [messages, setMessages] = useState([])
  const [msg, setMsg] = useState('')
  const boxRef = useRef()

  useEffect(()=>{ setMessages([]); setMsg('') }, [agent])

  async function send(){
    if(!token) return alert('Provide x-api-key')
    if(!agent) return alert('Select an agent')
    if(!msg) return
    const userMsg = {role:'user', text: msg}
    setMessages(m=>[...m, {type:'user', text: msg}])
    setMsg('')
    try{
      const res = await fetch(backend + '/agents/query', {
        method:'POST',
        headers: {'Content-Type':'application/json', 'x-api-key': token},
        body: JSON.stringify({ agent_id: agent.id, query: msg })
      })
      if(res.ok){
        const data = await res.json()
        const a = data.answer || JSON.stringify(data)
        setMessages(m=>[...m, {type:'agent', text: a}])
        // scroll
        setTimeout(()=> boxRef.current && (boxRef.current.scrollTop = boxRef.current.scrollHeight), 80)
      } else {
        const t = await res.text()
        setMessages(m=>[...m, {type:'agent', text: 'Error: ' + res.status + ' ' + t}])
      }
    }catch(e){
      setMessages(m=>[...m, {type:'agent', text: 'Exception: ' + String(e)}])
    }
  }

  return (
    <div>
      <div className="small">Chatting with: {agent?agent.name:'(no agent selected)'}</div>
      <div ref={boxRef} className="chat-box" style={{marginTop:8}}>
        {messages.map((m,i)=> (
          <div key={i} className={'message ' + (m.type==='user'?'user':'agent')}>
            <div style={{display:'inline-block', padding:8, borderRadius:8, background: m.type==='user'? '#dcfce7':'#eef2ff' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:8, display:'flex', gap:8}}>
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type your question..." onKeyDown={e=>{ if(e.key==='Enter') send() }} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
