import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AgentStatus = 'idle' | 'active' | 'complete' | 'error'

export interface AgentData {
  id: string
  name: string
  emoji: string
  description: string
  status: AgentStatus
  queueDepth: number
  latencyMs: number
  lastAction: string
  tokensBurned: number
  progressPct: number
}

// ─────────────────────────────────────────────
// Pulse ring keyframes injected once via <style>
// ─────────────────────────────────────────────

const PULSE_STYLE = `
@keyframes pulse-active {
  0%   { transform: scale(1.0);  box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.6); }
  50%  { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(0, 212, 255, 0); }
  100% { transform: scale(1.0);  box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
}

@keyframes pulse-error {
  0%   { transform: scale(1.0);  box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7); }
  50%  { transform: scale(1.12); box-shadow: 0 0 0 5px rgba(255, 51, 51, 0); }
  100% { transform: scale(1.0);  box-shadow: 0 0 0 0 rgba(255, 51, 51, 0); }
}

@keyframes pulse-complete-fade {
  0%   { opacity: 1; box-shadow: 0 0 8px rgba(0, 255, 136, 0.8); border-color: #00ff88; }
  100% { opacity: 0; box-shadow: none; border-color: transparent; }
}
`

let styleInjected = false
function injectPulseStyle() {
  if (styleInjected || typeof document === 'undefined') return
  styleInjected = true
  const el = document.createElement('style')
  el.textContent = PULSE_STYLE
  document.head.appendChild(el)
}

// ─────────────────────────────────────────────
// Status colors / labels
// ─────────────────────────────────────────────

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle:     '#4a5568',
  active:   '#00d4ff',
  complete: '#00ff88',
  error:    '#ff3333',
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle:     'IDLE',
  active:   'ACTIVE',
  complete: 'DONE',
  error:    'ERR',
}

// ─────────────────────────────────────────────
// Pulse ring around the emoji avatar
// ─────────────────────────────────────────────

function PulseRing({ status }: { status: AgentStatus }) {
  useEffect(() => { injectPulseStyle() }, [])

  // complete state: show briefly then fade
  const [showComplete, setShowComplete] = useState(false)
  const prevStatus = useRef<AgentStatus>(status)

  useEffect(() => {
    if (prevStatus.current !== 'complete' && status === 'complete') {
      setShowComplete(true)
      const t = setTimeout(() => setShowComplete(false), 1400)
      return () => clearTimeout(t)
    }
    prevStatus.current = status
  }, [status])

  const ringStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      inset: '-4px',
      borderRadius: '4px',
      border: '2px solid transparent',
      pointerEvents: 'none',
    }

    if (status === 'active') {
      return {
        ...base,
        borderColor: '#00d4ff',
        animation: 'pulse-active 2s ease-in-out infinite',
        boxShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
      }
    }
    if (status === 'error') {
      return {
        ...base,
        borderColor: '#ff3333',
        animation: 'pulse-error 0.5s ease-in-out infinite',
        boxShadow: '0 0 6px rgba(255, 51, 51, 0.6)',
      }
    }
    if (status === 'complete' && showComplete) {
      return {
        ...base,
        borderColor: '#00ff88',
        animation: 'pulse-complete-fade 1.2s ease-out forwards',
        boxShadow: '0 0 8px rgba(0, 255, 136, 0.7)',
      }
    }
    // idle — dim gray, no pulse
    return {
      ...base,
      borderColor: '#2d3748',
      opacity: 0.4,
    }
  }

  return <div style={ringStyle()} aria-hidden="true" />
}

// ─────────────────────────────────────────────
// Status dot
// ─────────────────────────────────────────────

function StatusDot({ status }: { status: AgentStatus }) {
  const color = STATUS_COLORS[status]

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={
        status === 'active'
          ? { scale: [1, 1.3, 1] }
          : status === 'error'
          ? { scale: [1, 1.2, 1] }
          : {}
      }
      transition={
        status === 'active'
          ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
          : status === 'error'
          ? { duration: 0.6, repeat: Infinity }
          : {}
      }
    >
      {/* Outer pulse ring for active */}
      {status === 'active' && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 16, height: 16, border: `1px solid ${color}` }}
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: status !== 'idle' ? `0 0 6px ${color}` : 'none',
        }}
      />
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Energy pulse bar (active state)
// ─────────────────────────────────────────────

function EnergyPulseBar({ active, progress }: { active: boolean; progress: number }) {
  return (
    <div className="relative h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
      {/* Static fill */}
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          background: active
            ? 'linear-gradient(90deg, #0088ff, #00d4ff)'
            : 'rgba(255,255,255,0.15)',
        }}
      />
      {/* Animated shimmer on active */}
      {active && (
        <motion.div
          className="absolute top-0 h-full w-8 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #00d4ff80, transparent)',
          }}
          animate={{ left: ['-2rem', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Metric chip
// ─────────────────────────────────────────────

function MetricChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] text-chrome-dark/60 tracking-widest uppercase">{label}</span>
      <span className="font-mono text-[11px] text-chrome leading-none">{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────

interface SoulAgentPanelProps {
  agent: AgentData
  compact?: boolean
}

export default function SoulAgentPanel({ agent, compact = false }: SoulAgentPanelProps) {
  const isActive = agent.status === 'active'
  const isError = agent.status === 'error'
  const isComplete = agent.status === 'complete'

  const borderColor = isActive
    ? 'border-neon/40'
    : isError
    ? 'border-red-500/40'
    : isComplete
    ? 'border-green-500/30'
    : 'border-white/5'

  const glowStyle = isActive
    ? { boxShadow: '0 0 12px #00d4ff15, inset 0 0 12px #00d4ff05' }
    : isError
    ? { boxShadow: '0 0 8px #ff333310' }
    : {}

  return (
    <motion.div
      className={`relative rounded-sm border ${borderColor} bg-void/60 backdrop-blur-sm p-3 overflow-hidden transition-colors duration-500`}
      style={glowStyle}
      whileHover={{ scale: 1.01 }}
      layout
    >
      {/* Active scan line */}
      {isActive && (
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #00d4ff50, transparent)' }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        {/* Emoji avatar with pulse ring */}
        <div className="relative shrink-0 mt-0.5" style={{ width: '20px', height: '20px' }}>
          <PulseRing status={agent.status} />
          <span className="text-base leading-none block">{agent.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-orbitron text-[11px] font-bold text-chrome tracking-wider leading-none truncate">
              {agent.name.toUpperCase()}
            </span>
            <StatusDot status={agent.status} />
          </div>
          <span
            className="font-orbitron text-[8px] tracking-widest leading-none"
            style={{ color: STATUS_COLORS[agent.status] }}
          >
            {STATUS_LABELS[agent.status]}
          </span>
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="font-mono text-[9px] text-chrome-dark leading-relaxed mb-2 line-clamp-2">
          {agent.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <EnergyPulseBar active={isActive} progress={agent.progressPct} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <MetricChip label="Queue" value={agent.queueDepth} />
        <MetricChip label="Latency" value={`${agent.latencyMs}ms`} />
      </div>

      {/* Last action ticker */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agent.lastAction}
          className="mt-2 pt-2 border-t border-white/5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-mono text-[9px] text-chrome-dark/70 truncate">
            <span className="text-neon/50 mr-1">›</span>
            {agent.lastAction}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
