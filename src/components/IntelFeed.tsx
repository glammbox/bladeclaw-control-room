import { useEffect, useRef, useState } from 'react'
import { getSubagents, getSessions } from '../lib/gatewayApi'

type EventType = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

interface IntelEvent {
  id: number
  type: EventType
  message: string
  ts: string
}

const TYPE_STYLES: Record<EventType, { color: string; label: string; glow?: string }> = {
  INFO:     { color: 'text-sky-400',   label: 'INFO',    glow: undefined         },
  SUCCESS:  { color: 'text-green-400', label: 'OK',      glow: '0 0 6px #22c55e' },
  WARNING:  { color: 'text-amber-400', label: 'WARN',    glow: '0 0 6px #f59e0b' },
  CRITICAL: { color: 'text-red-400',   label: 'CRIT',    glow: '0 0 8px #ef4444' },
}

export default function IntelFeed() {
  const [events, setEvents] = useState<IntelEvent[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const poll = async () => {
      const subs = await getSubagents()
      const sessions = await getSessions()
      const newEvents: any[] = []
      let id = Date.now()
      const active = subs?.active ?? []
      active.forEach((a: any) => {
        newEvents.push({ id: id++, type: 'INFO', message: `Agent running: ${a.label ?? a.id}`, ts: new Date().toISOString().substring(11,19) })
      })
      sessions.slice(0, 8).forEach((s: any) => {
        const name = s.key?.split(':')?.[2] ?? s.displayName ?? s.key
        const tokens = s.totalTokens ?? 0
        const model = s.model ?? '—'
        newEvents.push({ id: id++, type: 'SUCCESS', message: `${name} | ${model} | ${(tokens/1000).toFixed(1)}K tokens`, ts: new Date(s.updatedAt ?? Date.now()).toISOString().substring(11,19) })
      })
      if (newEvents.length === 0) {
        newEvents.push({ id: id++, type: 'INFO', message: 'System nominal', ts: new Date().toISOString().substring(11,19) })
      }
      setEvents(newEvents)
    }

    poll()
    const id2 = setInterval(poll, 5000)
    return () => clearInterval(id2)
  }, [])

  // Auto-scroll to bottom — scroll the container, not the page
  useEffect(() => {
    if (bottomRef.current) {
      const container = bottomRef.current.parentElement
      if (container) container.scrollTop = container.scrollHeight
    }
  }, [events])

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="hud-label">Intel Feed</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" style={{ boxShadow: '0 0 5px #00d4ff' }} />
          <span className="font-orbitron text-[10px] text-neon/60 tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Event list */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'scroll',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,212,255,0.4) transparent',
        }}
        className="font-mono text-[11px] space-y-0.5 pr-1"
      >
        {events.map((ev, i) => {
          const style = TYPE_STYLES[ev.type]
          const isNew = i === events.length - 1

          return (
            <div
              key={ev.id}
              className={`flex items-start gap-2 px-2 py-1 rounded-sm transition-all duration-500
                          ${isNew ? 'bg-white/5' : 'bg-transparent hover:bg-white/3'}`}
            >
              {/* Timestamp */}
              <span className="text-chrome-dark/50 shrink-0 tabular-nums">{ev.ts}</span>

              {/* Type badge */}
              <span
                className={`${style.color} font-orbitron text-[9px] tracking-widest shrink-0 w-9 text-right`}
                style={{ textShadow: style.glow }}
              >
                {style.label}
              </span>

              {/* Message */}
              <span className={`${style.color} opacity-80 leading-relaxed`}>
                {ev.message}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="text-[10px] font-mono text-chrome-dark/40 flex items-center justify-between">
        <span>Showing last {events.length} events</span>
        <span className="flex items-center gap-1">
          <span className="text-red-400/60">{events.filter(e => e.type === 'CRITICAL').length} CRIT</span>
          <span className="mx-1">·</span>
          <span className="text-amber-400/60">{events.filter(e => e.type === 'WARNING').length} WARN</span>
        </span>
      </div>
    </div>
  )
}
