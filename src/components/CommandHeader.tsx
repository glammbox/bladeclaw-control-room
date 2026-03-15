import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Zap, Activity } from 'lucide-react'
import GoogleSearchBar from './GoogleSearchBar'

type ConnectionState = 'connected' | 'connecting' | 'disconnected'
type AlertLevel = 'NOMINAL' | 'CAUTION' | 'CRITICAL'

function useLiveClock() {
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().replace('T', ' ').substring(0, 19))

  useEffect(() => {
    const tick = () => {
      setUtcTime(new Date().toISOString().replace('T', ' ').substring(0, 19))
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return utcTime
}

function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const configs: Record<ConnectionState, { icon: typeof Wifi; color: string; label: string }> = {
    connected: { icon: Wifi, color: 'text-status-ok', label: 'CONNECTED' },
    connecting: { icon: Wifi, color: 'text-status-warn', label: 'SYNCING' },
    disconnected: { icon: WifiOff, color: 'text-status-error', label: 'OFFLINE' },
  }

  const { icon: Icon, color, label } = configs[state]

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Icon size={12} />
      <span style={{ fontFamily: "'Orbitron', monospace" }} className="text-[10px] tracking-widest">{label}</span>
    </div>
  )
}

function AlertBadge({ level }: { level: AlertLevel }) {
  const configs: Record<AlertLevel, { icon: typeof CheckCircle2; color: string; bgColor: string; dotColor: string }> = {
    NOMINAL: {
      icon: CheckCircle2,
      color: 'text-status-ok',
      bgColor: 'bg-status-ok/10 border-status-ok/30',
      dotColor: '#22c55e',
    },
    CAUTION: {
      icon: AlertTriangle,
      color: 'text-status-warn',
      bgColor: 'bg-status-warn/10 border-status-warn/30',
      dotColor: '#f59e0b',
    },
    CRITICAL: {
      icon: AlertTriangle,
      color: 'text-status-error',
      bgColor: 'bg-status-error/10 border-status-error/30',
      dotColor: '#ef4444',
    },
  }

  const { icon: Icon, color, bgColor, dotColor } = configs[level]

  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1 rounded-sm border ${bgColor}`}
      animate={level === 'CRITICAL' ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 0.8, repeat: Infinity }}
    >
      {/* Neon status dot with pulse */}
      <span
        className="w-2 h-2 rounded-full inline-block animate-pulse"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
      />
      <Icon size={10} className={color} />
      <span style={{ fontFamily: "'Orbitron', monospace" }} className={`text-[10px] tracking-widest ${color}`}>{level}</span>
    </motion.div>
  )
}

function UptimeTicker() {
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setUptime((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(uptime / 3600)
  const m = Math.floor((uptime % 3600) / 60)
  const s = uptime % 60

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-1.5" style={{ color: 'var(--chrome)' }}>
      <Activity size={10} style={{ color: 'rgba(0,212,255,0.6)' }} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
        UPTIME {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  )
}

export default function CommandHeader() {
  const utcTime = useLiveClock()
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('NOMINAL')
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected')
  const [pulseKey, setPulseKey] = useState(0)

  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const timeStr = time.toTimeString().slice(0, 8)

  // Simulate occasional state changes for realism
  const simulateActivity = useCallback(() => {
    const r = Math.random()
    if (r < 0.05) {
      setAlertLevel('CAUTION')
      setTimeout(() => setAlertLevel('NOMINAL'), 4000)
    } else if (r < 0.02) {
      setConnectionState('connecting')
      setTimeout(() => setConnectionState('connected'), 2000)
    }
    setPulseKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const id = setInterval(simulateActivity, 8000)
    return () => clearInterval(id)
  }, [simulateActivity])

  return (
    <header
      className="relative z-50"
      style={{
        background: 'rgba(5,9,20,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
      }}
    >
      {/* Circuit board background overlay — hero-circuit at 4% opacity */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://res.cloudinary.com/di3ctzmzu/image/upload/q_auto,f_auto,w_1920/v1773611042/bladeclaw/j7azhsqas3610wmcqdjg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)', zIndex: 1 }}
      />

      <div className="relative flex items-center gap-4 px-6 py-3" style={{ zIndex: 1 }}>
        {/* Logo + Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative">
            <motion.div
              key={pulseKey}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.12), transparent)',
                border: '1px solid rgba(0,212,255,0.4)',
              }}
              animate={{ boxShadow: ['0 0 4px rgba(0,212,255,0.25)', '0 0 14px rgba(0,212,255,0.5)', '0 0 4px rgba(0,212,255,0.25)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={14} style={{ color: '#00d4ff' }} />
            </motion.div>
          </div>

          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
              }}
            >
              BladeClaw Control Room
            </h1>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'var(--chrome)',
                letterSpacing: '0.1em',
                marginTop: '2px',
                marginBottom: 0,
              }}
            >
              Autonomous Build Operations — Live
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />

        {/* Status */}
        <AnimatePresence mode="wait">
          <AlertBadge key={alertLevel} level={alertLevel} />
        </AnimatePresence>

        {/* Search bar */}
        <div className="h-8 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />
        <GoogleSearchBar />

        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center gap-6">
          <UptimeTicker />

          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />

          {/* Live UTC clock — JetBrains Mono, neon */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'var(--chrome)',
                letterSpacing: '0.05em',
              }}
            >
              UTC
            </span>
            <motion.span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                color: '#00d4ff',
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 8px rgba(0,212,255,0.5)',
              }}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {utcTime.split(' ')[1]}
            </motion.span>
          </div>

          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />

          <ConnectionIndicator state={connectionState} />

          <div className="h-4 w-px" style={{ background: 'rgba(0,212,255,0.2)' }} />

          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: 'rgba(0,212,255,0.7)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.1em',
            }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* Bottom scan accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)', zIndex: 1 }}
      />
    </header>
  )
}
