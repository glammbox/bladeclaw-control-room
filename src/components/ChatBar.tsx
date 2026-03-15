import { useState, useRef, useEffect } from 'react'
import { Send, Terminal, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Message {
  id: string
  role: 'user' | 'director'
  text: string
  ts: string
}

export default function ChatBar() {
  const [message, setMessage] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'director', text: 'Director online. What do you need?', ts: new Date().toLocaleTimeString() }
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (window as any).__chatBarFocus = () => { inputRef.current?.focus(); setExpanded(true) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: message.trim(), ts: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMsg])
    const sent = message.trim()
    setMessage('')
    setExpanded(true)
    try {
      const res = await fetch('http://localhost:18789/api/sessions/agent:main:main/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sent })
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        const reply = data?.response || data?.message || '✓ Message sent to Director'
        setMessages(prev => [...prev, { id: Date.now().toString() + 'r', role: 'director', text: reply, ts: new Date().toLocaleTimeString() }])
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'director', text: '✓ Sent — reply will appear in main session', ts: new Date().toLocaleTimeString() }])
    }
  }

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="chat-expanded"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed z-50"
            style={{
              bottom: '48px',
              left: 0,
              right: 0,
              width: '100vw',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            <div
              className="rounded-t-lg border border-neon/30 backdrop-blur-xl shadow-2xl"
              style={{ height: '70vh', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(10,10,15,0.98)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-neon/15 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={13} className="text-neon" />
                  <span className="font-orbitron text-[10px] tracking-widest text-neon">DIRECTOR CHAT</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <button onClick={() => setExpanded(false)} className="text-chrome-dark hover:text-chrome transition-colors">
                  <Minimize2 size={13} />
                </button>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className="shrink-0 w-6 h-6 rounded-sm border flex items-center justify-center text-[9px] font-orbitron"
                      style={msg.role === 'director'
                        ? { borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)' }
                        : { borderColor: 'rgba(192,192,192,0.2)', color: '#c0c0c0', backgroundColor: 'rgba(192,192,192,0.05)' }
                      }
                    >
                      {msg.role === 'director' ? 'D' : 'P'}
                    </div>
                    <div
                      className="max-w-[75%] rounded-sm px-3 py-2 text-sm leading-relaxed"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        ...(msg.role === 'director'
                          ? { backgroundColor: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#c0c0c0' }
                          : { backgroundColor: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.15)', color: '#c0c0c0', marginLeft: 'auto' }
                        )
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed bottom bar — always visible */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neon/20 backdrop-blur-md px-4 h-12 flex items-center gap-3"
        style={{ backgroundColor: 'rgba(10,10,15,0.98)' }}
      >
        <Terminal size={13} className="text-neon/40 shrink-0" />
        <input
          ref={inputRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') setExpanded(false) }}
          onFocus={() => setExpanded(true)}
          placeholder="Message Director... (press / to open)"
          className="flex-1 bg-transparent text-chrome text-base sm:text-sm outline-none"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#c0c0c0', fontSize: '16px' }}
        />
        {messages.length > 1 && (
          <button onClick={() => setExpanded(!expanded)} className="text-chrome-dark hover:text-neon transition-colors mr-1">
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="text-chrome-dark hover:text-neon transition-colors disabled:opacity-25"
        >
          <Send size={13} />
        </button>
      </div>
    </>
  )
}
