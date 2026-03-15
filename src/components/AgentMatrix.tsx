import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import SoulAgentPanel, { type AgentData, type AgentStatus } from './SoulAgentPanel'

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const AGENT_MODELS: Record<string, string> = {
  'pulse': 'Grok Fast',
  'planner': 'GPT-5.4',
  'research': 'GPT-5.4',
  'market': 'Grok Fast',
  'content': 'Claude Sonnet',
  'media': 'Gemini Flash',
  'builder': 'Claude Sonnet',
  'validator': 'GPT-5.4',
  'optimizer': 'Gemini Pro',
  'director': 'Claude Sonnet',
}

const AGENT_TEMPLATES: Omit<AgentData, 'status' | 'queueDepth' | 'latencyMs' | 'lastAction' | 'tokensBurned' | 'progressPct'>[] = [
  { id: 'director', name: 'Director', emoji: '🎯', description: 'Orchestrates DAG. Assigns missions.' },
  { id: 'pulse', name: 'Pulse', emoji: '⚡', description: 'Viability gate. Scores every prompt.' },
  { id: 'planner', name: 'Planner', emoji: '🏗️', description: 'Blueprint drafting. Site architecture.' },
  { id: 'research', name: 'Research', emoji: '🔍', description: 'Trend analysis. Stack intelligence.' },
  { id: 'market', name: 'Market', emoji: '📊', description: 'Intel analysis. ICP targeting.' },
  { id: 'content', name: 'Content', emoji: '✍️', description: 'Copy generation. Voice calibration.' },
  { id: 'media', name: 'Media', emoji: '🎨', description: 'Visual generation. Asset pipeline.' },
  { id: 'builder', name: 'Builder', emoji: '🔧', description: 'UI assembly. Component rendering.' },
  { id: 'validator', name: 'Validator', emoji: '✅', description: 'QA enforcement. Output integrity.' },
  { id: 'optimizer', name: 'Optimizer', emoji: '⚙️', description: 'Performance tuning. DX polish.' },
]

const LAST_ACTIONS: Record<string, string[]> = {
  director: ['Dispatching batch to Builder', 'Evaluating DAG state', 'Waiting for Validator', 'Chain complete — notifying'],
  pulse: ['Scoring prompt viability', 'Threshold check passed', 'Flagging low-signal input', 'All gates nominal'],
  planner: ['Generating component blueprint', 'Drafting file manifest', 'Writing batch plan', 'Blueprint ready → Director'],
  research: ['Fetching stack benchmarks', 'Indexing 2026 patterns', 'Comparing animation libs', 'Report filed to Planner'],
  market: ['Parsing ICP data', 'Segmentation complete', 'Writing positioning doc', 'ICP signals → Content'],
  content: ['Generating hero copy', 'Calibrating brand voice', 'Writing CTAs', 'Copy delivered → Builder'],
  media: ['Prompting DALL-E', 'Optimizing asset pipeline', 'Resizing for retina', 'Manifest → Builder'],
  builder: ['Writing ArcReactorCore.tsx', 'Installing R3F deps', 'Running tsc --noEmit', 'Batch 2 complete ✓'],
  validator: ['Running ESLint pass', 'Checking TS strictness', 'Audit score: 98/100', 'No critical issues found'],
  optimizer: ['Measuring LCP metric', 'Tree-shaking analysis', 'Compressing assets', 'Score improved: +12pts'],
}

function randomAction(agentId: string): string {
  const actions = LAST_ACTIONS[agentId] ?? ['Standing by']
  return actions[Math.floor(Math.random() * actions.length)]
}

function randomStatus(): AgentStatus {
  const r = Math.random()
  if (r < 0.25) return 'active'
  if (r < 0.55) return 'idle'
  if (r < 0.80) return 'complete'
  return 'error'
}

function generateAgentData(): AgentData[] {
  return AGENT_TEMPLATES.map((template) => ({
    ...template,
    status: randomStatus(),
    queueDepth: Math.floor(Math.random() * 8),
    latencyMs: 80 + Math.floor(Math.random() * 300),
    lastAction: randomAction(template.id),
    tokensBurned: Math.floor(Math.random() * 8000),
    progressPct: Math.floor(Math.random() * 100),
  }))
}

function evolveAgent(agent: AgentData): AgentData {
  const r = Math.random()
  const statusChange = r < 0.12  // 12% chance of status flip

  let newStatus = agent.status
  if (statusChange) {
    const transitions: Record<AgentStatus, AgentStatus[]> = {
      idle: ['active', 'idle'],
      active: ['complete', 'active', 'active'],
      complete: ['idle', 'active'],
      error: ['idle', 'active'],
    }
    const pool = transitions[agent.status]
    newStatus = pool[Math.floor(Math.random() * pool.length)]
  }

  const actionChange = r < 0.25

  return {
    ...agent,
    status: newStatus,
    queueDepth: Math.max(0, agent.queueDepth + Math.floor(Math.random() * 3) - 1),
    latencyMs: Math.max(20, Math.min(800, agent.latencyMs + Math.floor(Math.random() * 40) - 20)),
    lastAction: actionChange ? randomAction(agent.id) : agent.lastAction,
    tokensBurned: agent.tokensBurned + Math.floor(Math.random() * 50),
    progressPct: newStatus === 'complete'
      ? 100
      : newStatus === 'idle'
      ? 0
      : Math.min(99, agent.progressPct + Math.floor(Math.random() * 5)),
  }
}

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────

function MatrixHeader({ agents }: { agents: AgentData[] }) {
  const activeCount = agents.filter((a) => a.status === 'active').length
  const errorCount = agents.filter((a) => a.status === 'error').length

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-orbitron text-sm font-bold text-neon tracking-[0.2em] uppercase">
          Agent Matrix
        </h2>
        <p className="font-mono text-[10px] text-chrome-dark mt-0.5">
          Active units and operational status
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neon" style={{ boxShadow: '0 0 4px #00d4ff' }} />
          <span className="font-mono text-[10px] text-chrome-dark">{activeCount} ACTIVE</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 4px #ff3355' }} />
            <span className="font-mono text-[10px] text-red-400">{errorCount} ERR</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-chrome-dark/50">{agents.length} TOTAL</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

interface AgentMatrixProps {
  className?: string
}

export default function AgentMatrix({ className = '' }: AgentMatrixProps) {
  const [agents, setAgents] = useState<AgentData[]>(() => generateAgentData())

  // Simulate live updates every 2.5s
  useEffect(() => {
    const id = setInterval(() => {
      setAgents((prev) => prev.map((a) => (Math.random() < 0.4 ? evolveAgent(a) : a)))
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={className}>
      <MatrixHeader agents={agents} />

      {/* Responsive grid: 2-col mobile → 3-col md → 5-col desktop */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.05 }}
      >
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            className="min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <SoulAgentPanel
              agent={agent}
              modelLabel={AGENT_MODELS[agent.id?.toLowerCase()] || 'Claude Sonnet'}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
