import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// ─────────────────────────────────────────────
// Model Pricing Table
// ─────────────────────────────────────────────

const MODEL_PRICING: Record<string, { input: number; output: number; label: string }> = {
  'claude-sonnet-4-6':       { input: 3.00,  output: 15.00, label: 'Claude Sonnet 4.6' },
  'gpt-5.4':                 { input: 2.50,  output: 10.00, label: 'GPT-5.4' },
  'gpt-4o':                  { input: 2.50,  output: 10.00, label: 'GPT-4o' },
  'grok-4-1-fast-reasoning': { input: 0.60,  output: 2.40,  label: 'Grok Fast' },
  'gemini-3.1-pro-preview':  { input: 1.25,  output: 5.00,  label: 'Gemini Pro' },
  'gemini-3-flash-preview':  { input: 0.15,  output: 0.60,  label: 'Gemini Flash' },
}
// Prices are per 1M tokens ($/1M)

const MODEL_USAGE_KEYS = Object.keys(MODEL_PRICING)

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AgentSpend {
  id: string
  name: string
  emoji: string
  tokens: number
  cost: number  // USD
  color: string
}

interface TokenState {
  totalTokens: number
  totalCost: number
  budgetCap: number
  burnRatePerMin: number
  agents: AgentSpend[]
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COST_PER_1K = 0.003  // ~$0.003 per 1K tokens (simulated)
const BUDGET_CAP = 5.00    // $5 default budget

const AGENT_COLORS = [
  '#00d4ff', '#0088ff', '#00ff88', '#ffbb00',
  '#ff6600', '#cc44ff', '#ff3355', '#00ffcc',
  '#88ff00', '#ff44aa',
]

const AGENT_NAMES = [
  { id: 'director', name: 'Director', emoji: '🎯' },
  { id: 'pulse', name: 'Pulse', emoji: '⚡' },
  { id: 'planner', name: 'Planner', emoji: '🏗️' },
  { id: 'research', name: 'Research', emoji: '🔍' },
  { id: 'market', name: 'Market', emoji: '📊' },
  { id: 'content', name: 'Content', emoji: '✍️' },
  { id: 'media', name: 'Media', emoji: '🎨' },
  { id: 'builder', name: 'Builder', emoji: '🔧' },
  { id: 'validator', name: 'Validator', emoji: '✅' },
  { id: 'optimizer', name: 'Optimizer', emoji: '⚙️' },
]

function generateInitialState(): TokenState {
  const agents: AgentSpend[] = AGENT_NAMES.map((a, i) => {
    const tokens = 1000 + Math.floor(Math.random() * 6000)
    return {
      ...a,
      tokens,
      cost: (tokens / 1000) * COST_PER_1K,
      color: AGENT_COLORS[i],
    }
  })

  const totalTokens = agents.reduce((s, a) => s + a.tokens, 0)
  const totalCost = agents.reduce((s, a) => s + a.cost, 0)

  return {
    totalTokens,
    totalCost,
    budgetCap: BUDGET_CAP,
    burnRatePerMin: 180 + Math.floor(Math.random() * 120),
    agents,
  }
}

function evolveState(prev: TokenState): TokenState {
  const agents = prev.agents.map((a) => {
    const delta = Math.floor(Math.random() * 200)
    const tokens = a.tokens + delta
    return { ...a, tokens, cost: (tokens / 1000) * COST_PER_1K }
  })

  const totalTokens = agents.reduce((s, a) => s + a.tokens, 0)
  const totalCost = agents.reduce((s, a) => s + a.cost, 0)

  return {
    ...prev,
    totalTokens,
    totalCost,
    burnRatePerMin: Math.max(50, prev.burnRatePerMin + Math.floor(Math.random() * 30) - 15),
    agents,
  }
}

// ─────────────────────────────────────────────
// Circular burn gauge (SVG)
// ─────────────────────────────────────────────

function getGaugeColor(pct: number): string {
  if (pct < 0.6) return '#00d4ff'     // cyan
  if (pct < 0.85) return '#ffbb00'    // amber
  return '#ff3355'                     // red
}

interface BurnGaugeProps {
  current: number
  cap: number
}

function BurnGauge({ current, cap }: BurnGaugeProps) {
  const pct = Math.min(1, current / cap)
  const color = getGaugeColor(pct)

  // SVG circle math
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
        {/* Track */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
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
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
        {/* Threshold ring at 85% */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - strokeWidth / 2 - 2}
          fill="none"
          stroke="rgba(255,187,0,0.2)"
          strokeWidth={1}
          strokeDasharray={`${circumference * 0.85 * ((radius - strokeWidth / 2 - 2) / radius)} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-orbitron text-base font-bold leading-none"
          style={{ color }}
          animate={{ color }}
          transition={{ duration: 0.5 }}
        >
          {(pct * 100).toFixed(0)}%
        </motion.span>
        <span className="font-mono text-[9px] text-chrome-dark/60 mt-0.5">BUDGET</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Per-agent spend bar
// ─────────────────────────────────────────────

interface SpendBarProps {
  agent: AgentSpend
  maxCost: number
}

function SpendBar({ agent, maxCost }: SpendBarProps) {
  const pct = maxCost > 0 ? Math.min(1, agent.cost / maxCost) : 0

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-4 text-center leading-none">{agent.emoji}</span>
      <span className="font-mono text-[9px] text-chrome-dark w-14 truncate">{agent.name}</span>

      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: agent.color, boxShadow: `0 0 4px ${agent.color}60` }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <span className="font-mono text-[9px] text-chrome-dark/70 w-12 text-right tabular-nums">
        ${agent.cost.toFixed(3)}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Neon burn rate meter
// ─────────────────────────────────────────────

function BurnRateMeter({ ratePerMin }: { ratePerMin: number }) {
  const maxRate = 500
  const pct = Math.min(1, ratePerMin / maxRate)
  const color = getGaugeColor(pct)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-chrome-dark/60 tracking-widest">BURN RATE</span>
        <motion.span
          className="font-orbitron text-[11px] font-bold tabular-nums"
          style={{ color }}
        >
          {ratePerMin.toLocaleString()} <span className="text-[9px] font-normal text-chrome-dark">tok/min</span>
        </motion.span>
      </div>

      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5 }}
        >
          {/* Shimmer */}
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

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

interface TokenCostTrackerProps {
  className?: string
}

export default function TokenCostTracker({ className = '' }: TokenCostTrackerProps) {
  const [state, setState] = useState<TokenState>(() => generateInitialState())
  const [thresholdWarning, setThresholdWarning] = useState(false)

  // Simulate live updates
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = evolveState(prev)
        // Trigger threshold warning
        if (next.totalCost / next.budgetCap > 0.85 && !thresholdWarning) {
          setThresholdWarning(true)
          setTimeout(() => setThresholdWarning(false), 3000)
        }
        return next
      })
    }, 2000)
    return () => clearInterval(id)
  }, [thresholdWarning])

  const maxAgentCost = Math.max(...state.agents.map((a) => a.cost))
  const budgetPct = state.totalCost / state.budgetCap
  const gaugeColor = getGaugeColor(budgetPct)

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="font-orbitron text-sm font-bold text-neon tracking-[0.2em] uppercase">
          Token Tracker
        </h2>
        <p className="font-mono text-[10px] text-chrome-dark mt-0.5">
          Burn rate and allocation by agent
        </p>
      </div>

      {/* Threshold warning */}
      <AnimatePresence>
        {thresholdWarning && (
          <motion.div
            className="px-3 py-2 rounded-sm border border-amber-500/40 bg-amber-500/10"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="font-orbitron text-[10px] text-amber-400 tracking-wider">
              ⚠ TOKEN THRESHOLD REACHED — Monitor burn rate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gauge + totals row */}
      <div className="flex items-center gap-4">
        <BurnGauge current={state.totalCost} cap={state.budgetCap} />

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-chrome-dark/60 tracking-widest">TOTAL SPENT</span>
            <motion.span
              className="font-orbitron text-lg font-bold tabular-nums"
              style={{ color: gaugeColor }}
              animate={{ color: gaugeColor }}
              transition={{ duration: 0.5 }}
            >
              ${state.totalCost.toFixed(4)}
            </motion.span>
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-chrome-dark/60 tracking-widest">TOKENS CONSUMED</span>
            <span className="font-orbitron text-sm font-bold text-chrome tabular-nums">
              {state.totalTokens.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-chrome-dark/60 tracking-widest">BUDGET CAP</span>
            <span className="font-mono text-[11px] text-chrome-dark">
              ${state.budgetCap.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Burn rate meter */}
      <BurnRateMeter ratePerMin={state.burnRatePerMin} />

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Per-agent bars */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] text-chrome-dark/50 tracking-widest uppercase mb-1">
          Per-Agent Spend
        </span>
        {state.agents.map((agent) => (
          <SpendBar key={agent.id} agent={agent} maxCost={maxAgentCost} />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Model Pricing Breakdown */}
      <ModelPricingTable activeModel="claude-sonnet-4-6" />
    </div>
  )
}

// ─────────────────────────────────────────────
// Model Pricing Table
// ─────────────────────────────────────────────

const SESSION_MODEL_USAGE: Record<string, { inputTokens: number; outputTokens: number }> = {
  'claude-sonnet-4-6':       { inputTokens: 18400, outputTokens: 6200 },
  'gpt-5.4':                 { inputTokens: 12800, outputTokens: 4100 },
  'gpt-4o':                  { inputTokens: 5200,  outputTokens: 1400 },
  'grok-4-1-fast-reasoning': { inputTokens: 22100, outputTokens: 8900 },
  'gemini-3.1-pro-preview':  { inputTokens: 9400,  outputTokens: 3200 },
  'gemini-3-flash-preview':  { inputTokens: 7800,  outputTokens: 2600 },
}

function ModelPricingTable({ activeModel }: { activeModel: string }) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (key: string, label: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[9px] text-chrome-dark/50 tracking-widest uppercase">
        Model Pricing ($/1M tokens)
      </span>
      {/* Horizontal scroll on mobile */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-[9px] font-mono border-collapse min-w-[420px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left pb-1 font-orbitron text-[8px] text-chrome-dark/50 tracking-wider pr-2">MODEL</th>
              <th className="text-right pb-1 font-orbitron text-[8px] text-chrome-dark/50 tracking-wider pr-2">$/1M IN</th>
              <th className="text-right pb-1 font-orbitron text-[8px] text-chrome-dark/50 tracking-wider pr-2">$/1M OUT</th>
              <th className="text-right pb-1 font-orbitron text-[8px] text-chrome-dark/50 tracking-wider pr-2">TOKENS</th>
              <th className="text-right pb-1 font-orbitron text-[8px] text-chrome-dark/50 tracking-wider">COST</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_USAGE_KEYS.map(key => {
              const pricing = MODEL_PRICING[key]
              const usage = SESSION_MODEL_USAGE[key] ?? { inputTokens: 0, outputTokens: 0 }
              const cost = (usage.inputTokens / 1_000_000) * pricing.input + (usage.outputTokens / 1_000_000) * pricing.output
              const totalTokens = usage.inputTokens + usage.outputTokens
              const isActive = key === activeModel

              return (
                <tr
                  key={key}
                  className="border-b border-white/3 transition-all duration-200"
                  style={isActive ? { backgroundColor: 'rgba(0,212,255,0.05)' } : undefined}
                >
                  <td className="py-1 pr-2">
                    <button
                      onClick={() => handleCopy(key, pricing.label)}
                      className="text-left transition-colors hover:text-neon"
                      style={{
                        color: isActive ? '#00d4ff' : '#9ca3af',
                        fontWeight: isActive ? '600' : '400',
                        border: isActive ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        display: 'inline-block',
                      }}
                      title="Click to copy model ID"
                    >
                      {copied === key ? '✓ Copied!' : pricing.label}
                    </button>
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums text-chrome-dark">
                    ${pricing.input.toFixed(2)}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums text-chrome-dark">
                    ${pricing.output.toFixed(2)}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums text-chrome-dark">
                    {(totalTokens / 1000).toFixed(1)}K
                  </td>
                  <td className="py-1 text-right tabular-nums" style={{ color: isActive ? '#00d4ff' : '#9ca3af' }}>
                    ${cost.toFixed(4)}
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
