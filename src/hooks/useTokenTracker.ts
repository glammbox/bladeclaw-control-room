import { useEffect, useRef, useState } from 'react'
import type { WSEvent } from './useWebSocket'

export interface AgentTokenBreakdown {
  id: string
  name: string
  emoji: string
  tokens: number
  cost: number   // USD
  share: number  // 0–1 fraction of total
  color: string
}

export interface TokenTrackerState {
  totalTokens: number
  totalCost: number
  burnRate: number        // tokens per minute
  costEstimate: number    // projected total cost at current burn rate
  budgetCap: number
  budgetUsedPct: number
  agentBreakdown: AgentTokenBreakdown[]
}

const COST_PER_1K = 0.003   // ~$0.003/1K tokens
const BUDGET_CAP = 5.00

const AGENT_META: { id: string; name: string; emoji: string; color: string }[] = [
  { id: 'director',  name: 'Director',  emoji: '🎯', color: '#00d4ff' },
  { id: 'pulse',     name: 'Pulse',     emoji: '⚡', color: '#f97316' },
  { id: 'planner',   name: 'Planner',   emoji: '🏗️', color: '#22c55e' },
  { id: 'research',  name: 'Research',  emoji: '🔍', color: '#a855f7' },
  { id: 'market',    name: 'Market',    emoji: '📊', color: '#eab308' },
  { id: 'content',   name: 'Content',   emoji: '✍️', color: '#ec4899' },
  { id: 'media',     name: 'Media',     emoji: '🎨', color: '#14b8a6' },
  { id: 'builder',   name: 'Builder',   emoji: '🔧', color: '#f97316' },
  { id: 'validator', name: 'Validator', emoji: '✅', color: '#22c55e' },
  { id: 'optimizer', name: 'Optimizer', emoji: '⚙️', color: '#6366f1' },
]

// Initial seeded token counts (agents that have already run)
const INITIAL_TOKENS: Record<string, number> = {
  director:  3200,
  pulse:     1100,
  planner:   5800,
  research:  2400,
  market:    0,
  content:   0,
  media:     0,
  builder:   8400,
  validator: 0,
  optimizer: 0,
}

function buildBreakdown(tokenMap: Record<string, number>): AgentTokenBreakdown[] {
  const total = Object.values(tokenMap).reduce((s, t) => s + t, 0) || 1
  return AGENT_META.map(a => {
    const tokens = tokenMap[a.id] ?? 0
    const cost = (tokens / 1000) * COST_PER_1K
    return { ...a, tokens, cost, share: tokens / total }
  })
}

interface UseTokenTrackerOptions {
  lastEvent?: WSEvent | null
}

export function useTokenTracker({ lastEvent }: UseTokenTrackerOptions = {}): TokenTrackerState {
  const [tokenMap, setTokenMap] = useState<Record<string, number>>(INITIAL_TOKENS)
  const burnSamplesRef = useRef<number[]>([])
  const lastTotalRef = useRef(Object.values(INITIAL_TOKENS).reduce((s, t) => s + t, 0))
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Apply real WS token events
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'token.update') {
      const p = lastEvent.payload as { agent?: string; tokens?: number; delta?: number }
      if (!p.agent) return
      setTokenMap(prev => ({
        ...prev,
        [p.agent!]: p.tokens != null
          ? p.tokens
          : (prev[p.agent!] ?? 0) + (p.delta ?? 0),
      }))
    }
  }, [lastEvent])

  // Simulation: drip tokens onto active agents
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTokenMap(prev => {
        const next = { ...prev }
        // Active agents burn tokens
        const activeAgents = ['director', 'builder', 'research']
        for (const id of activeAgents) {
          next[id] = (next[id] ?? 0) + Math.floor(Math.random() * 120 + 20)
        }
        return next
      })
    }, 2000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  // Compute burn rate (tokens/min) from samples
  useEffect(() => {
    const total = Object.values(tokenMap).reduce((s, t) => s + t, 0)
    const delta = total - lastTotalRef.current
    lastTotalRef.current = total
    // delta is per 2s tick → convert to per minute
    burnSamplesRef.current = [...burnSamplesRef.current.slice(-5), delta * 30]
  }, [tokenMap])

  const breakdown = buildBreakdown(tokenMap)
  const totalTokens = breakdown.reduce((s, a) => s + a.tokens, 0)
  const totalCost = (totalTokens / 1000) * COST_PER_1K
  const burnRate = burnSamplesRef.current.length
    ? burnSamplesRef.current.reduce((s, v) => s + v, 0) / burnSamplesRef.current.length
    : 0
  // Project remaining cost: assume ~20k tokens to go
  const remainingEstimate = (20_000 / 1000) * COST_PER_1K
  const costEstimate = totalCost + remainingEstimate

  return {
    totalTokens,
    totalCost,
    burnRate: Math.round(burnRate),
    costEstimate,
    budgetCap: BUDGET_CAP,
    budgetUsedPct: Math.min(totalCost / BUDGET_CAP, 1),
    agentBreakdown: breakdown,
  }
}
