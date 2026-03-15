import { useEffect, useRef, useState } from 'react'
import type { WSEvent } from './useWebSocket'
import { getMergedChainState } from '../lib/openclawData'

export type NodeStatus = 'completed' | 'active' | 'pending' | 'error' | 'queued'

export interface DAGNode {
  id: string
  label: string
  x: number
  y: number
  status: NodeStatus
}

export interface DAGEdge {
  from: string
  to: string
}

export interface DAGProgressState {
  nodes: DAGNode[]
  edges: DAGEdge[]
  activeStage: string | null
  completedStages: string[]
  ciScore: number
  chainStateFormat: 'v1' | 'v2' | 'unknown'
}

const INITIAL_NODES: DAGNode[] = [
  { id: 'pulse',     label: 'Pulse',     x: 60,  y: 100, status: 'completed' },
  { id: 'planner',   label: 'Planner',   x: 160, y: 100, status: 'completed' },
  { id: 'research',  label: 'Research',  x: 280, y: 60,  status: 'completed' },
  { id: 'market',    label: 'Market',    x: 280, y: 140, status: 'pending'   },
  { id: 'content',   label: 'Content',   x: 400, y: 60,  status: 'pending'   },
  { id: 'media',     label: 'Media',     x: 400, y: 140, status: 'pending'   },
  { id: 'builder',   label: 'Builder',   x: 510, y: 100, status: 'active'    },
  { id: 'validator', label: 'Validator', x: 610, y: 100, status: 'pending'   },
  { id: 'optimizer', label: 'Optimizer', x: 710, y: 100, status: 'pending'   },
  { id: 'package',   label: 'Package',   x: 820, y: 100, status: 'pending'   },
]

const EDGES: DAGEdge[] = [
  { from: 'pulse',     to: 'planner'   },
  { from: 'planner',   to: 'research'  },
  { from: 'planner',   to: 'market'    },
  { from: 'research',  to: 'content'   },
  { from: 'market',    to: 'content'   },
  { from: 'market',    to: 'media'     },
  { from: 'content',   to: 'builder'   },
  { from: 'media',     to: 'builder'   },
  { from: 'builder',   to: 'validator' },
  { from: 'validator', to: 'optimizer' },
  { from: 'optimizer', to: 'package'   },
]

// Pipeline simulation order
const PIPELINE_STAGES = [
  'pulse', 'planner', 'research', 'market', 'content', 'media', 'builder', 'validator', 'optimizer', 'package',
]

function computeActiveStage(nodes: DAGNode[]): string | null {
  return nodes.find(n => n.status === 'active')?.id ?? null
}

function computeCompleted(nodes: DAGNode[]): string[] {
  return nodes.filter(n => n.status === 'completed').map(n => n.id)
}

/** Detect chain-state format version */
function detectChainStateFormat(chainState: ReturnType<typeof getMergedChainState>): 'v1' | 'v2' | 'unknown' {
  if ('stageDeadline' in chainState && chainState.stageDeadline !== undefined) return 'v2'
  if ('activeStage' in chainState) return 'v1'
  return 'unknown'
}

/** Merge chain-state data into DAG nodes */
function mergeChainState(nodes: DAGNode[]): DAGNode[] {
  const chain = getMergedChainState()
  return nodes.map(node => {
    if (chain.completedStages.includes(node.id)) return { ...node, status: 'completed' as NodeStatus }
    if (chain.activeStage === node.id) return { ...node, status: 'active' as NodeStatus }
    return { ...node, status: 'pending' as NodeStatus }
  })
}

interface UseDAGProgressOptions {
  lastEvent?: WSEvent | null
  pollIntervalMs?: number
}

export function useDAGProgress({ lastEvent, pollIntervalMs = 3000 }: UseDAGProgressOptions = {}): DAGProgressState {
  const [nodes, setNodes] = useState<DAGNode[]>(() => mergeChainState(INITIAL_NODES))
  const [ciScore, setCiScore] = useState(87)
  const [chainStateFormat, setChainStateFormat] = useState<'v1' | 'v2' | 'unknown'>(() =>
    detectChainStateFormat(getMergedChainState())
  )
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastChainHashRef = useRef<string>('')

  // Apply real WS dag events
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'dag.progress') {
      const p = lastEvent.payload as { stage?: string; status?: NodeStatus; ciScore?: number }
      if (p.stage) {
        setNodes(prev =>
          prev.map(n =>
            n.id === p.stage ? { ...n, status: p.status ?? 'active' } : n
          )
        )
      }
      if (p.ciScore != null) setCiScore(p.ciScore)
    }
  }, [lastEvent])

  // Poll chain-state every 3s, detect format changes
  useEffect(() => {
    const poll = () => {
      const chain = getMergedChainState()
      const hash = JSON.stringify({
        activeStage: chain.activeStage,
        completed: chain.completedStages,
        ciScore: chain.ciScore,
      })

      // Only update if chain-state actually changed
      if (hash !== lastChainHashRef.current) {
        lastChainHashRef.current = hash

        // Detect format change
        const fmt = detectChainStateFormat(chain)
        setChainStateFormat(fmt)

        // If real data available, merge it
        if (window.BLADECLAW_DATA?.chainState) {
          setNodes(prev => mergeChainState(prev))
          if (chain.ciScore > 0) setCiScore(chain.ciScore)
          return
        }
      }

      // Simulation ticker — advance pipeline slowly
      setNodes(prev => {
        const next = [...prev]
        const activeIdx = next.findIndex(n => n.status === 'active')
        if (activeIdx === -1) {
          const pendingIdx = next.findIndex(n => n.status === 'pending')
          if (pendingIdx !== -1) {
            next[pendingIdx] = { ...next[pendingIdx], status: 'active' }
          }
          return next
        }
        // Randomly complete the active stage
        if (Math.random() < 0.04) {
          next[activeIdx] = { ...next[activeIdx], status: 'completed' }
          setCiScore(s => Math.min(s + Math.floor(Math.random() * 2), 100))
          const nextStageId = PIPELINE_STAGES[PIPELINE_STAGES.indexOf(next[activeIdx].id) + 1]
          if (nextStageId) {
            const nextIdx = next.findIndex(n => n.id === nextStageId)
            if (nextIdx !== -1) next[nextIdx] = { ...next[nextIdx], status: 'active' }
          }
        }
        return next
      })
    }

    tickRef.current = setInterval(poll, pollIntervalMs)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [pollIntervalMs])

  return {
    nodes,
    edges: EDGES,
    activeStage: computeActiveStage(nodes),
    completedStages: computeCompleted(nodes),
    ciScore,
    chainStateFormat,
  }
}
