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
      <span className="font-orbitron text-[10px] tracking-widest">{label}</span>
    </div>
  )
}

function AlertBadge({ level }: { level: AlertLevel }) {
  const configs: Record<AlertLevel, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
    NOMINAL: { icon: CheckCircle2, color: 'text-status-ok', bgColor: 'bg-status-ok/10 border-status-ok/30' },
    CAUTION: { icon: AlertTriangle, color: 'text-status-warn', bgColor: 'bg-status-warn/10 border-status-warn/30' },
    CRITICAL: { icon: AlertTriangle, color: 'text-status-error', bgColor: 'bg-status-error/10 border-status-error/30' },
  }

  const { icon: Icon, color, bgColor } = configs[level]

  return (
    <motion.div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-sm border ${bgColor}`}
      animate={level === 'CRITICAL' ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 0.8, repeat: Infinity }}
    >
      <Icon size={10} className={color} />
      <span className={`font-orbitron text-[10px] tracking-widest ${color}`}>{level}</span>
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
    <div className="flex items-center gap-1.5 text-chrome-dark">
      <Activity size={10} className="text-neon/60" />
      <span className="font-mono text-[11px]">
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
    <header className="relative border-b border-neon/20 bg-void/90 backdrop-blur-md z-50">
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00d4ff80, transparent)' }}
      />

      <div className="flex items-center gap-4 px-6 py-3">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              key={pulseKey}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #00d4ff20, transparent)',
                border: '1px solid #00d4ff40',
              }}
              animate={{ boxShadow: ['0 0 4px #00d4ff40', '0 0 12px #00d4ff80', '0 0 4px #00d4ff40'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={14} className="text-neon" />
            </motion.div>
          </div>

          <div>
            <h1 className="font-orbitron text-sm font-bold text-neon tracking-[0.2em] leading-none">
              BladeClaw Control Room
            </h1>
            <p className="font-mono text-[10px] text-chrome-dark tracking-widest mt-0.5">
              Autonomous Build Operations — Live
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-neon/20" />

        {/* Status */}
        <AnimatePresence mode="wait">
          <AlertBadge key={alertLevel} level={alertLevel} />
        </AnimatePresence>

        {/* Search bar */}
        <div className="h-8 w-px bg-neon/20" />
        <GoogleSearchBar />

        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center gap-6">
          <UptimeTicker />

          <div className="h-4 w-px bg-neon/20" />

          {/* Live UTC clock */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-chrome-dark tracking-wider">UTC</span>
            <motion.span
              className="font-mono text-[13px] text-neon font-semibold tabular-nums"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {utcTime.split(' ')[1]}
            </motion.span>
          </div>

          <div className="h-4 w-px bg-neon/20" />

          <ConnectionIndicator state={connectionState} />

          <div className="h-4 w-px bg-neon/20" />

          <span className="font-mono text-[10px] text-neon/70 tabular-nums tracking-widest">{timeStr}</span>
        </div>
      </div>

      {/* Bottom scan accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent, #00d4ff60, transparent)' }}
      />
    </header>
  )
}
