import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import SoulAgentPanel, { type AgentData, type AgentStatus } from './SoulAgentPanel'
import { invokeGatewayTool, readFile } from '../lib/gatewayApi'

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

interface GatewaySession {
  key?: string
  model?: string
  totalTokens?: number
  updatedAt?: string
}

function MatrixHeader({ agents }: { agents: AgentData[] }) {
  const activeCount = agents.filter((a) => a.status === 'active').length
  const errorCount = agents.filter((a) => a.status === 'error').length

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-label text-sm tracking-[0.24em] uppercase" style={{ color: 'var(--neon)' }}>
          Agent Matrix
        </h2>
        <p className="font-body text-[10px] mt-0.5" style={{ color: 'var(--chrome-dim)' }}>
          Active units and operational status
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full agent-active" style={{ backgroundColor: 'var(--neon)' }} />
          <span className="font-data text-[10px]" style={{ color: 'var(--chrome-dim)' }}>{activeCount} ACTIVE</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--status-error)', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
            <span className="font-data text-[10px]" style={{ color: 'var(--status-error)' }}>{errorCount} ERR</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="font-data text-[10px]" style={{ color: 'rgba(192,192,192,0.45)' }}>{agents.length} TOTAL</span>
        </div>
      </div>
    </div>
  )
}

interface AgentMatrixProps {
  className?: string
}

export default function AgentMatrix({ className = '' }: AgentMatrixProps) {
  const [liveAgents, setLiveAgents] = useState<AgentData[]>([])
  const [agentModels, setAgentModels] = useState<Record<string, string>>({})

  useEffect(() => {
    const poll = async () => {
      const sessionsResult = await invokeGatewayTool('sessions_list', { limit: 20 }) as { sessions?: GatewaySession[] } | null
      const sessions = sessionsResult?.sessions ?? []

      const chainRaw = await readFile('/home/austi/.openclaw/workspace/tmp/chain-state.json')
      let chain: { currentStage?: string; completedStages?: string[] } | null = null
      try {
        chain = chainRaw ? JSON.parse(chainRaw) : null
      } catch {
        chain = null
      }

      const mapped = AGENT_TEMPLATES.map((template) => {
        const session = sessions.find((s) => s.key?.includes(`:${template.id}:`))
        const isCurrentStage = chain?.currentStage === template.id
        const isCompleted = chain?.completedStages?.includes(template.id) ?? false
        const status: AgentStatus = isCurrentStage ? 'active' : isCompleted ? 'complete' : session ? 'idle' : 'idle'
        const lastSeen = session?.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : '—'

        return {
          ...template,
          status,
          queueDepth: 0,
          latencyMs: 0,
          lastAction: `Last seen: ${lastSeen}`,
          tokensBurned: session?.totalTokens ?? 0,
          progressPct: isCurrentStage ? 65 : isCompleted ? 100 : 0,
        }
      })

      const modelMap = AGENT_TEMPLATES.reduce<Record<string, string>>((acc, template) => {
        const session = sessions.find((s) => s.key?.includes(`:${template.id}:`))
        acc[template.id] = session?.model ?? (template.id === 'director' ? 'claude-sonnet-4-6' : '—')
        return acc
      }, {})

      setAgentModels(modelMap)
      setLiveAgents(mapped)
    }

    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={className}>
      <MatrixHeader agents={liveAgents} />

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.05 }}
      >
        {liveAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            className="min-w-0 corner-bracket hud-panel rounded-sm"
            style={{
              border: agent.status === 'active' ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(0,212,255,0.12)',
              boxShadow: agent.status === 'active' ? '0 0 16px rgba(0,212,255,0.25), 0 0 32px rgba(0,212,255,0.1)' : undefined,
              opacity: agent.status === 'idle' ? 0.6 : 1,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: agent.status === 'idle' ? 0.6 : 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ y: -1 }}
          >
            <SoulAgentPanel
              agent={agent}
              modelLabel={agentModels[agent.id?.toLowerCase()] || '—'}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
