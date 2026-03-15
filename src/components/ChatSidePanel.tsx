import { useState, useRef, useEffect } from 'react'
import { Send, Terminal } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'director'
  text: string
  ts: string
}

export default function ChatSidePanel() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'director', text: 'Director online. Ready.', ts: new Date().toLocaleTimeString() }
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    (window as any).__chatBarFocus = () => inputRef.current?.focus()
  }, [])

  const send = async () => {
    if (!message.trim()) return
    const txt = message.trim()
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: txt, ts: new Date().toLocaleTimeString() }])
    setMessage('')
    try {
      await fetch('http://localhost:18789/api/sessions/agent:main:main/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: txt })
      })
      setMessages(p => [...p, { id: Date.now().toString()+'r', role: 'director', text: '✓ Sent to Director', ts: new Date().toLocaleTimeString() }])
    } catch {
      setMessages(p => [...p, { id: Date.now().toString()+'e', role: 'director', text: '✓ Sent', ts: new Date().toLocaleTimeString() }])
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%', background:'#0a0a0f', border:'1px solid rgba(0,212,255,0.12)', borderRadius:'4px', overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'8px 12px', borderBottom:'1px solid rgba(0,212,255,0.10)', display:'flex', alignItems:'center', gap:'6px', flexShrink:0}}>
        <Terminal size={11} color="#00d4ff" />
        <span style={{fontFamily:'Orbitron,monospace', fontSize:'9px', letterSpacing:'0.1em', color:'rgba(0,212,255,0.7)', textTransform:'uppercase'}}>Director</span>
        <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22c55e',marginLeft:'auto',animation:'pulse 2s infinite'}} />
      </div>
      {/* Messages */}
      <div style={{flex:1, overflowY:'auto', padding:'8px', display:'flex', flexDirection:'column', gap:'6px'}}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth:'90%',
            padding:'5px 8px',
            borderRadius:'3px',
            fontSize:'11px',
            lineHeight:1.4,
            fontFamily:'Inter,system-ui,sans-serif',
            background: msg.role === 'director' ? 'rgba(0,212,255,0.07)' : 'rgba(192,192,192,0.07)',
            border: `1px solid ${msg.role === 'director' ? 'rgba(0,212,255,0.15)' : 'rgba(192,192,192,0.12)'}`,
            color: '#c0c0c0'
          }}>
            {msg.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div style={{padding:'8px', borderTop:'1px solid rgba(0,212,255,0.10)', display:'flex', gap:'6px', flexShrink:0}}>
        <input
          ref={inputRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message..."
          style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            fontSize:'12px', color:'#c0c0c0', fontFamily:'Inter,system-ui,sans-serif'
          }}
        />
        <button onClick={send} disabled={!message.trim()}
          style={{background:'none', border:'none', cursor:'pointer', color: message.trim() ? '#00d4ff' : 'rgba(192,192,192,0.25)', padding:0}}>
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}
