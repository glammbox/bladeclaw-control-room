import { useCallback, useEffect, useRef, useState } from 'react'
import type { WSEvent } from './useWebSocket'
import { getMergedAgents, type AgentLifecycleStatus } from '../lib/openclawData'

export type AgentStatus = 'idle' | 'active' | 'working' | 'error' | 'complete' | 'offline' | 'queued' | 'learning'

export interface AgentState {
  id: string
  name: string
  emoji: string
  description: string
  status: AgentStatus
  progressPct: number
  tokensBurned: number
  latencyMs: number
  queueDepth: number
  lastAction: string
}

// Map OpenClaw lifecycle → display status
function mapStatus(s: AgentLifecycleStatus): AgentStatus {
  switch (s) {
    case 'queued':   return 'queued'
    case 'learning': return 'working'
    case 'active':   return 'active'
    case 'complete': return 'complete'
    case 'error':    return 'error'
    default:         return 'idle'
  }
}

const LAST_ACTIONS: Record<string, string[]> = {
  director:  ['Dispatching batch to Builder', 'Evaluating DAG state', 'Chain complete', 'Monitoring agents', 'Updating chain-state.json'],
  pulse:     ['Scoring prompt viability', 'Gate check passed', 'Threshold nominal', 'All gates clear', 'Blocking low-score prompt'],
  planner:   ['Generating blueprint', 'Writing file manifest', 'Blueprint ready', 'Drafting batch plan', 'Dependency graph validated'],
  research:  ['Fetching stack benchmarks', 'Indexing 2026 patterns', 'Report filed', 'Comparing libs', 'Scraping competitor data'],
  market:    ['Parsing ICP data', 'Segmentation complete', 'Positioning doc ready', 'ICP signals sent', 'Audience profile locked'],
  content:   ['Generating hero copy', 'Calibrating voice', 'Writing CTAs', 'Copy delivered', 'Tone profile applied'],
  media:     ['Prompting DALL-E', 'Optimizing pipeline', 'Resizing for retina', 'Manifest sent', 'WebP conversion complete'],
  builder:   ['Writing components', 'Installing deps', 'Running tsc --noEmit', 'Batch complete ✓', 'npm run build passing'],
  validator: ['Running CI checks', 'TypeScript passing', 'Lint clean', 'Score: 98', 'Handoff ACK sent'],
  optimizer: ['Analyzing bundle', 'Tree-shaking', 'Compressing assets', 'Perf score: 96', 'Lazy-load patch applied'],
}

function randomAction(id: string): string {
  const pool = LAST_ACTIONS[id] ?? ['Standing by']
  return pool[Math.floor(Math.random() * pool.length)]
}

// DAG lifecycle simulation: idle → queued → active → complete
// Matches real BladeClaw pipeline ordering
const PIPELINE_ORDER = ['pulse', 'planner', 'research', 'market', 'content', 'media', 'builder', 'validator', 'optimizer']

function buildInitialState(): AgentState[] {
  const ocAgents = getMergedAgents()

  return ocAgents.map(agent => {
    const status = mapStatus(agent.status)
    let progressPct = 0
    if (status === 'complete') progressPct = 100
    else if (status === 'active') progressPct = 45 + Math.random() * 30
    else if (status === 'queued') progressPct = 0

    return {
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      description: agent.description,
      status,
      progressPct,
      tokensBurned: agent.tokenCount,
      latencyMs: Math.floor(Math.random() * 300) + 80,
      queueDepth: status === 'queued' ? 1 : status === 'active' ? Math.floor(Math.random() * 4) : 0,
      lastAction: agent.lastAction,
    }
  })
}

interface UseAgentStatusOptions {
  lastEvent?: WSEvent | null
  pollIntervalMs?: number
}

export function useAgentStatus({ lastEvent, pollIntervalMs = 2000 }: UseAgentStatusOptions = {}) {
  const [agents, setAgents] = useState<AgentState[]>(buildInitialState)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track which pipeline stage we've advanced to
  const pipelineStepRef = useRef<number>(
    // Start after the already-complete stages
    PIPELINE_ORDER.findIndex(id => {
      const a = getMergedAgents().find(ag => ag.id === id)
      return a?.status === 'active' || a?.status === 'queued' || a?.status === 'idle'
    })
  )

  // Apply real WS events when available
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'agent.status') {
      const p = lastEvent.payload as { id?: string; status?: AgentStatus; progress?: number }
      if (!p.id) return
      setAgents(prev =>
        prev.map(a =>
          a.id === p.id
            ? {
                ...a,
                status: p.status ?? a.status,
                progressPct: p.progress != null ? p.progress * 100 : a.progressPct,
                lastAction: randomAction(a.id),
              }
            : a
        )
      )
    }
  }, [lastEvent])

  // Realistic DAG lifecycle simulation:
  // idle → queued → active → complete in pipeline order
  const tick = useCallback(() => {
    // Check if window.BLADECLAW_DATA is available — use real data if so
    if (window.BLADECLAW_DATA?.agents) {
      const merged = getMergedAgents()
      setAgents(prev =>
        prev.map(a => {
          const real = merged.find(r => r.id === a.id)
          if (!real) return a
          const status = mapStatus(real.status)
          return {
            ...a,
            status,
            tokensBurned: real.tokenCount,
            lastAction: real.lastAction,
            progressPct: status === 'complete' ? 100 : status === 'active' ? a.progressPct : 0,
          }
        })
      )
      return
    }

    // Enhanced mock: simulate realistic DAG lifecycle
    setAgents(prev =>
      prev.map(a => {
        if (a.status === 'complete') return a

        if (a.status === 'idle') {
          // Small chance to become queued if it's the next in pipeline
          const myPipelineIdx = PIPELINE_ORDER.indexOf(a.id)
          const isNext = myPipelineIdx === pipelineStepRef.current
          if (isNext && Math.random() < 0.08) {
            return { ...a, status: 'queued', queueDepth: 1 }
          }
          return a
        }

        if (a.status === 'queued') {
          // Become active quickly
          if (Math.random() < 0.15) {
            return { ...a, status: 'active', progressPct: 5, queueDepth: 0 }
          }
          return a
        }

        if (a.status === 'active' || a.status === 'working') {
          const increment = Math.random() * 3 + 0.5
          const next = Math.min(a.progressPct + increment, 100)
          if (next >= 100) {
            // Complete this stage, advance pipeline
            const myPipelineIdx = PIPELINE_ORDER.indexOf(a.id)
            if (myPipelineIdx >= 0) {
              pipelineStepRef.current = myPipelineIdx + 1
            }
            return {
              ...a,
              progressPct: 100,
              status: 'complete',
              tokensBurned: a.tokensBurned + Math.floor(Math.random() * 200),
              lastAction: randomAction(a.id),
            }
          }
          return {
            ...a,
            progressPct: next,
            tokensBurned: a.tokensBurned + Math.floor(Math.random() * 80),
            latencyMs: Math.floor(Math.random() * 300) + 80,
            lastAction: Math.random() < 0.2 ? randomAction(a.id) : a.lastAction,
          }
        }

        return a
      })
    )
  }, [])

  useEffect(() => {
    pollingRef.current = setInterval(tick, pollIntervalMs)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [tick, pollIntervalMs])

  return agents
}
