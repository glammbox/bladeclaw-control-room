import { useState, useRef, useEffect } from 'react'
import { Send, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ChatBar() {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    (window as any).__chatBarFocus = () => inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!message.trim()) return
    try {
      await fetch('http://localhost:18789/api/sessions/agent:main:main/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      })
    } catch {}
    setSent(true)
    setMessage('')
    setTimeout(() => setSent(false), 2000)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neon/20 bg-panel/95 backdrop-blur-md px-4 py-2.5 flex items-center gap-3">
      <Terminal size={14} className="text-neon/50 shrink-0" />
      <input
        ref={inputRef}
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') inputRef.current?.blur() }}
        placeholder="Message Director... (press / to focus)"
        className="flex-1 bg-transparent text-chrome text-sm placeholder:text-chrome-dark/40 outline-none"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      />
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.span key="sent" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-status-ok text-xs font-mono">SENT ✓</motion.span>
        ) : (
          <motion.button key="btn" onClick={handleSend} disabled={!message.trim()}
            className="text-chrome-dark hover:text-neon transition-colors disabled:opacity-30"
            whileHover={{scale:1.1}} whileTap={{scale:0.95}}>
            <Send size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
