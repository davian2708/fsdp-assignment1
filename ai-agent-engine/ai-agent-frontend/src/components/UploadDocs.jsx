import React, {useState} from 'react'

export default function UploadDocs({backend, token, agent}){
  const [files, setFiles] = useState(null)

  async function upload(){
    if(!token) return alert('Provide x-api-key')
    if(!agent) return alert('Select an agent')
    if(!files) return alert('Select files')
    const form = new FormData()
    for(let i=0;i<files.length;i++) form.append('files', files[i])
    const res = await fetch(`${backend}/kb/${agent.name}/upload`, {
      method:'POST', headers:{ 'x-api-key': token }, body: form
    })
    if(res.ok){
      alert('Uploaded')
    } else {
      const t = await res.text()
      alert('Upload failed: ' + res.status + ' ' + t)
    }
  }

  return (
    <div>
      <div className="small">Selected agent: {agent?agent.name:'(none)'}</div>
      <input type="file" multiple onChange={e=>setFiles(e.target.files)} />
      <div style={{marginTop:8}}><button onClick={upload}>Upload Docs to Agent KB</button></div>
      <div className="small" style={{marginTop:8}}>Tip: upload small .txt for demo. PDF ingestion requires backend support.</div>
    </div>
  )
}
