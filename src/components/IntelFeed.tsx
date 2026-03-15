import { useEffect, useRef, useState } from 'react'

type EventType = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

interface IntelEvent {
  id: number
  type: EventType
  message: string
  ts: string
}

let eventCounter = 0

function makeId() { return ++eventCounter }

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(11, 23)
}

const SEED_EVENTS: Omit<IntelEvent, 'id' | 'ts'>[] = [
  { type: 'INFO',     message: 'Pulse agent initialized — scanning for new prompts' },
  { type: 'INFO',     message: 'Director spawning Planner for session bc-20260314' },
  { type: 'SUCCESS',  message: 'Planner blueprint generated — 12 sections, 3 pages' },
  { type: 'INFO',     message: 'Research agent started — querying competitor landscape' },
  { type: 'INFO',     message: 'Market agent started — pulling demographic signals' },
  { type: 'WARNING',  message: 'Token threshold reached 80% on Research agent' },
  { type: 'INFO',     message: 'Content agent received research output — 4,200 tokens' },
  { type: 'INFO',     message: 'Media agent generating image manifest — 14 assets' },
  { type: 'SUCCESS',  message: 'Build batch 1 complete — config + scaffold (0 errors)' },
  { type: 'SUCCESS',  message: 'Build batch 2 complete — components (0 TypeScript errors)' },
  { type: 'INFO',     message: 'Validator running CI pipeline — bladeclaw-control-room' },
  { type: 'SUCCESS',  message: 'Validator passed — CI score: 97/100' },
  { type: 'INFO',     message: 'Optimizer applying performance patches — 3 suggestions' },
  { type: 'SUCCESS',  message: 'Build packaged — ZIP ready (4.2 MB)' },
]

const LIVE_EVENT_POOL: Omit<IntelEvent, 'id' | 'ts'>[] = [
  { type: 'INFO',     message: 'Heartbeat received from Pulse agent' },
  { type: 'INFO',     message: 'Director polling chain-state — 3 agents active' },
  { type: 'SUCCESS',  message: 'Agent handoff complete: Builder → Validator' },
  { type: 'WARNING',  message: 'Rate limit approaching on xAI Grok endpoint' },
  { type: 'INFO',     message: 'Memory pruning triggered — daily log rotated' },
  { type: 'SUCCESS',  message: 'New delivery registered — phantom-speed-garage' },
  { type: 'CRITICAL', message: 'Validator rejected build — TypeScript error in Hero.tsx' },
  { type: 'INFO',     message: 'Retry triggered — Builder spawning fresh batch' },
  { type: 'SUCCESS',  message: 'Build retry succeeded — error patched (0 errors)' },
  { type: 'WARNING',  message: 'Memory usage elevated — 78% on Builder agent' },
  { type: 'INFO',     message: 'GPT-5.4 fallback activated — Sonnet rate limited' },
  { type: 'SUCCESS',  message: 'Delivery shipped — bark-noir-v2 (96 CI score)' },
  { type: 'INFO',     message: 'Planner queued 2 new sessions for tomorrow' },
  { type: 'WARNING',  message: 'Token burn rate $2.40/hr — above budget threshold' },
  { type: 'CRITICAL', message: 'Build stall detected — stage deadline exceeded 180s' },
  { type: 'INFO',     message: 'Stage timeout recovery initiated — requeuing task' },
  { type: 'SUCCESS',  message: 'Optimizer applied lazy-load patch — bundle -22%' },
  { type: 'INFO',     message: 'Codex subtask dispatched — 7 files in batch 3' },
]

const TYPE_STYLES: Record<EventType, { color: string; label: string; glow?: string }> = {
  INFO:     { color: 'text-sky-400',   label: 'INFO',    glow: undefined         },
  SUCCESS:  { color: 'text-green-400', label: 'OK',      glow: '0 0 6px #22c55e' },
  WARNING:  { color: 'text-amber-400', label: 'WARN',    glow: '0 0 6px #f59e0b' },
  CRITICAL: { color: 'text-red-400',   label: 'CRIT',    glow: '0 0 8px #ef4444' },
}

function initSeedEvents(): IntelEvent[] {
  const now = Date.now()
  return SEED_EVENTS.map((e, i) => ({
    ...e,
    id: makeId(),
    ts: new Date(now - (SEED_EVENTS.length - i) * 8000).toISOString().replace('T', ' ').substring(11, 23),
  }))
}

export default function IntelFeed() {
  const [events, setEvents] = useState<IntelEvent[]>(initSeedEvents)
  const bottomRef = useRef<HTMLDivElement>(null)
  const poolRef = useRef(0)

  // Add a new event every 3-5 seconds
  useEffect(() => {
    const addEvent = () => {
      const template = LIVE_EVENT_POOL[poolRef.current % LIVE_EVENT_POOL.length]
      poolRef.current++

      const newEvent: IntelEvent = {
        id: makeId(),
        type: template.type,
        message: template.message,
        ts: timestamp(),
      }

      setEvents(prev => {
        const updated = [...prev, newEvent]
        // Keep last 20
        return updated.length > 20 ? updated.slice(-20) : updated
      })
    }

    // Random interval 2.5–5s
    const schedule = () => {
      const delay = 2500 + Math.random() * 2500
      return window.setTimeout(() => {
        addEvent()
        timeoutRef.current = schedule()
      }, delay)
    }

    const timeoutRef = { current: schedule() }
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-0.5 scrollbar-thin pr-1">
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
