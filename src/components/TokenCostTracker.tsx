import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { invokeGatewayTool } from '../lib/gatewayApi'

const MODEL_PRICING: Record<string, { input: number; output: number; label: string }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, label: 'Claude Sonnet 4.6' },
  'gpt-5.4': { input: 2.5, output: 10.0, label: 'GPT-5.4' },
  'gpt-4o': { input: 2.5, output: 10.0, label: 'GPT-4o' },
  'grok-4-1-fast-reasoning': { input: 0.6, output: 2.4, label: 'Grok Fast' },
  'gemini-3.1-pro-preview': { input: 1.25, output: 5.0, label: 'Gemini Pro' },
  'gemini-3-flash-preview': { input: 0.15, output: 0.6, label: 'Gemini Flash' },
}

const MODEL_USAGE_KEYS = Object.keys(MODEL_PRICING)

interface AgentSpend {
  id: string
  name: string
  emoji: string
  tokens: number
  cost: number
  color: string
}

const BUDGET_CAP = 5.0

const AGENT_COLORS = [
  '#00d4ff', '#0088ff', '#00ff88', '#ffbb00',
  '#ff6600', '#cc44ff', '#ff3355', '#00ffcc',
  '#88ff00', '#ff44aa',
]

interface GatewaySession {
  key?: string
  displayName?: string
  model?: string
  totalTokens?: number
  updatedAt?: string
}

interface LiveTokenData {
  totalTokens: number
  totalCost: number
  sessions: GatewaySession[]
  burnRatePerMin: number
  agents: AgentSpend[]
}

function getGaugeColor(pct: number): string {
  if (pct < 0.6) return 'var(--neon)'
  if (pct < 0.85) return 'var(--status-warn)'
  return 'var(--status-error)'
}

interface BurnGaugeProps {
  current: number
  cap: number
}

function BurnGauge({ current, cap }: BurnGaugeProps) {
  const pct = Math.min(1, current / cap)
  const color = getGaugeColor(pct)
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)
  const centerX = size / 2
  const centerY = size / 2

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(0,212,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - strokeWidth / 2 - 2}
          fill="none"
          stroke="rgba(245,158,11,0.2)"
          strokeWidth={1}
          strokeDasharray={`${circumference * 0.85 * ((radius - strokeWidth / 2 - 2) / radius)} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-data text-base font-bold leading-none"
          style={{ color }}
          animate={{ color }}
          transition={{ duration: 0.5 }}
        >
          {(pct * 100).toFixed(0)}%
        </motion.span>
        <span className="font-label text-[9px] mt-0.5" style={{ color: 'var(--chrome-dim)' }}>BUDGET</span>
      </div>
    </div>
  )
}

interface SpendBarProps {
  agent: AgentSpend
  maxCost: number
}

function SpendBar({ agent, maxCost }: SpendBarProps) {
  const pct = maxCost > 0 ? Math.min(1, agent.cost / maxCost) : 0

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-4 text-center leading-none">{agent.emoji}</span>
      <span className="font-data text-[9px] w-14 truncate" style={{ color: 'var(--chrome)' }}>{agent.name}</span>

      <div className="flex-1 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(0,212,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: agent.color, boxShadow: `0 0 4px ${agent.color}60` }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <span className="font-data text-[9px] w-12 text-right tabular-nums" style={{ color: 'rgba(192,207,224,0.7)' }}>
        ${agent.cost.toFixed(3)}
      </span>
    </div>
  )
}

function BurnRateMeter({ ratePerMin }: { ratePerMin: number }) {
  const maxRate = 500
  const pct = Math.min(1, ratePerMin / maxRate)
  const color = getGaugeColor(pct)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-label text-[9px] tracking-widest" style={{ color: 'var(--chrome-dim)' }}>BURN RATE</span>
        <motion.span className="font-data text-[11px] font-bold tabular-nums" style={{ color }}>
          {ratePerMin.toLocaleString()} <span className="text-[9px] font-normal" style={{ color: 'var(--chrome)' }}>tok/min</span>
        </motion.span>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-y-0 w-6"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
            animate={{ left: ['-1.5rem', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  )
}

interface AnimatedValueProps {
  value: string
  changed: boolean
  className?: string
  style?: React.CSSProperties
}

function AnimatedValue({ value, changed, className = '', style }: AnimatedValueProps) {
  return (
    <motion.span
      className={`${className} ${changed ? 'data-update' : ''}`.trim()}
      initial={false}
      animate={changed ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      style={style}
    >
      {value}
    </motion.span>
  )
}

interface TokenCostTrackerProps {
  className?: string
}

export default function TokenCostTracker({ className = '' }: TokenCostTrackerProps) {
  const [liveData, setLiveData] = useState<LiveTokenData>({
    totalTokens: 0,
    totalCost: 0,
    sessions: [],
    burnRatePerMin: 0,
    agents: [],
  })
  const [thresholdWarning, setThresholdWarning] = useState(false)
  const previousTotals = useRef({ totalCost: 0, totalTokens: 0, burnRatePerMin: 0, at: Date.now() })
  const renderedTotals = useRef({ totalCost: 0, totalTokens: 0, burnRatePerMin: 0 })

  useEffect(() => {
    const poll = async () => {
      const result = await invokeGatewayTool('sessions_list', { limit: 20 }) as { sessions?: GatewaySession[] } | null
      const sessions = result?.sessions ?? []
      const totalTokens = sessions.reduce((sum: number, s) => sum + (s.totalTokens ?? 0), 0)
      const totalCost = totalTokens * 0.000009

      const now = Date.now()
      const prev = previousTotals.current
      const elapsedMin = Math.max((now - prev.at) / 60000, 1 / 60)
      const burnRatePerMin = Math.max(0, Math.round((totalTokens - prev.totalTokens) / elapsedMin))

      const agents = sessions.map((s, i) => {
        const id = s.key ?? `session-${i}`
        const parts = (s.key ?? '').split(':')
        const keyName = parts[2] || parts[1] || s.displayName || id
        const name = keyName.charAt(0).toUpperCase() + keyName.slice(1)
        const tokens = s.totalTokens ?? 0
        return {
          id,
          name,
          emoji: '•',
          tokens,
          cost: tokens * 0.000009,
          color: AGENT_COLORS[i % AGENT_COLORS.length],
        }
      })

      if (totalCost / BUDGET_CAP > 0.85 && !thresholdWarning) {
        setThresholdWarning(true)
        setTimeout(() => setThresholdWarning(false), 3000)
      }

      setLiveData({ totalTokens, totalCost, sessions, burnRatePerMin, agents })
      previousTotals.current = { totalCost, totalTokens, burnRatePerMin, at: now }
    }

    poll()
    const id = setInterval(poll, 8000)
    return () => clearInterval(id)
  }, [thresholdWarning])

  const previous = renderedTotals.current
  const hasCostChanged = previous.totalCost !== liveData.totalCost
  const hasTokensChanged = previous.totalTokens !== liveData.totalTokens
  const hasBurnChanged = previous.burnRatePerMin !== liveData.burnRatePerMin
  const maxAgentCost = liveData.agents.length ? Math.max(...liveData.agents.map((a) => a.cost)) : 0
  const budgetPct = liveData.totalCost / BUDGET_CAP
  const gaugeColor = getGaugeColor(budgetPct)

  useEffect(() => {
    renderedTotals.current = {
      totalCost: liveData.totalCost,
      totalTokens: liveData.totalTokens,
      burnRatePerMin: liveData.burnRatePerMin,
    }
  }, [liveData.totalCost, liveData.totalTokens, liveData.burnRatePerMin])

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div>
        <h2 className="font-label text-sm tracking-[0.24em] uppercase" style={{ color: 'var(--neon)' }}>
          Token Tracker
        </h2>
        <p className="font-body text-[10px] mt-0.5" style={{ color: 'var(--chrome-dim)' }}>
          Burn rate and allocation by agent
        </p>
      </div>

      <AnimatePresence>
        {thresholdWarning && (
          <motion.div
            className="px-3 py-2 rounded-sm"
            style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="font-label text-[10px] tracking-wider" style={{ color: 'var(--status-warn)' }}>
              ⚠ TOKEN THRESHOLD REACHED — Monitor burn rate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <BurnGauge current={liveData.totalCost} cap={BUDGET_CAP} />

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="font-label text-[9px] tracking-widest" style={{ color: 'var(--chrome-dim)' }}>TOTAL SPENT</span>
            <AnimatedValue
              value={`$${liveData.totalCost.toFixed(4)}`}
              changed={hasCostChanged}
              className="text-2xl font-bold tabular-nums"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: 'var(--neon)',
                textShadow: '0 0 12px rgba(0,212,255,0.45)',
              }}
            />
          </div>

          <div className="flex flex-col">
            <span className="font-label text-[9px] tracking-widest" style={{ color: 'var(--chrome-dim)' }}>TOKENS CONSUMED</span>
            <AnimatedValue
              value={liveData.totalTokens.toLocaleString()}
              changed={hasTokensChanged}
              className="font-data text-sm font-bold tabular-nums"
              style={{ color: 'var(--chrome-bright)' }}
            />
          </div>

          <div className="flex flex-col">
            <span className="font-label text-[9px] tracking-widest" style={{ color: 'var(--chrome-dim)' }}>BUDGET CAP</span>
            <span className="font-data text-[11px]" style={{ color: 'var(--chrome)' }}>
              ${BUDGET_CAP.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className={hasBurnChanged ? 'data-update' : ''}>
        <BurnRateMeter ratePerMin={liveData.burnRatePerMin} />
      </div>

      <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,212,255,0.08)', paddingTop: '6px' }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,212,255,0.6)', marginBottom: '4px' }}>PER AGENT</div>
        {liveData.sessions.map(s => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
            <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '10px', color: '#8892a4', fontWeight: 600 }}>{s.key?.split(':')?.[1] ?? s.displayName}</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '9px', color: '#c0cfe0' }}>{((s.totalTokens ?? 0) / 1000).toFixed(1)}K</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '9px', color: '#00d4ff' }}>{s.model ?? '—'}</span>
          </div>
        ))}
      </div>

      <div className="h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />

      <div className="flex flex-col gap-1.5">
        <span className="font-label text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--chrome-dim)' }}>
          Per-Agent Spend
        </span>
        {liveData.agents.map((agent) => (
          <SpendBar key={agent.id} agent={agent} maxCost={maxAgentCost} />
        ))}
      </div>

      <div className="h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />

      <ModelPricingTable
        activeModel={liveData.sessions[0]?.model ?? 'claude-sonnet-4-6'}
        sessions={liveData.sessions}
      />
    </div>
  )
}

function ModelPricingTable({ activeModel, sessions }: { activeModel: string; sessions: GatewaySession[] }) {
  const [copied, setCopied] = useState<string | null>(null)
  const usageByModel = sessions.reduce<Record<string, number>>((acc, session) => {
    const key = session.model ?? ''
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + (session.totalTokens ?? 0)
    return acc
  }, {})

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-label text-[9px] tracking-widest uppercase" style={{ color: 'var(--chrome-dim)' }}>
        Model Pricing ($/1M tokens)
      </span>
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-[9px] border-collapse min-w-[420px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
              <th className="text-left pb-1 pr-2 font-label text-[8px] tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,146,164,0.7)', fontSize: '10px' }}>MODEL</th>
              <th className="text-right pb-1 pr-2 font-label text-[8px] tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,146,164,0.7)', fontSize: '10px' }}>$/1M IN</th>
              <th className="text-right pb-1 pr-2 font-label text-[8px] tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,146,164,0.7)', fontSize: '10px' }}>$/1M OUT</th>
              <th className="text-right pb-1 pr-2 font-label text-[8px] tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,146,164,0.7)', fontSize: '10px' }}>TOKENS</th>
              <th className="text-right pb-1 font-label text-[8px] tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,146,164,0.7)', fontSize: '10px' }}>COST</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_USAGE_KEYS.map((key, index) => {
              const pricing = MODEL_PRICING[key]
              const usage = { inputTokens: usageByModel[key] ?? 0, outputTokens: 0 }
              const cost = (usage.inputTokens / 1_000_000) * pricing.input + (usage.outputTokens / 1_000_000) * pricing.output
              const totalTokens = usage.inputTokens + usage.outputTokens
              const isActive = key === activeModel

              return (
                <tr
                  key={key}
                  className="transition-all duration-200"
                  style={{
                    borderBottom: '1px solid rgba(0,212,255,0.03)',
                    background: isActive
                      ? 'rgba(0,212,255,0.08)'
                      : index % 2 === 0
                        ? 'rgba(255,255,255,0.015)'
                        : 'rgba(255,255,255,0.03)',
                    border: isActive ? '1px solid rgba(0,212,255,0.2)' : undefined,
                  }}
                >
                  <td className="py-1 pr-2">
                    <button
                      onClick={() => handleCopy(key)}
                      className="text-left transition-colors hover:text-neon font-body"
                      style={{
                        color: isActive ? 'var(--neon)' : 'var(--chrome-bright)',
                        fontWeight: isActive ? '600' : '400',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        display: 'inline-block',
                      }}
                      title="Click to copy model ID"
                    >
                      {copied === key ? '✓ Copied!' : pricing.label}
                    </button>
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums font-data" style={{ color: 'var(--chrome)' }}>
                    ${pricing.input.toFixed(2)}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums font-data" style={{ color: 'var(--chrome)' }}>
                    ${pricing.output.toFixed(2)}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums font-data" style={{ color: 'var(--chrome)' }}>
                    {(totalTokens / 1000).toFixed(1)}K
                  </td>
                  <td className="py-1 text-right tabular-nums font-data" style={{ color: isActive ? 'var(--neon)' : 'var(--chrome-bright)' }}>
                    <AnimatedValue value={`$${cost.toFixed(4)}`} changed={isActive} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
