import { useState } from 'react'
import { ChevronDown, ChevronRight, Activity } from 'lucide-react'
import { getMergedAgents, type OpenClawAgent } from '../lib/openclawData'

type HealthColor = 'gray' | 'blue' | 'green' | 'red'

function getHealthColor(agent: OpenClawAgent): HealthColor {
  if (agent.status === 'error') return 'red'
  if (agent.status === 'active' || agent.status === 'learning') return 'blue'
  if (agent.evolutionScore > 200) return 'green'
  return 'gray'
}

const HEALTH_STYLES: Record<HealthColor, { color: string; bg: string }> = {
  gray:  { color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  blue:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
  green: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
  red:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
}

// ─────────────────────────────────────────────
// Brain Growth Meter
// ─────────────────────────────────────────────

function BrainMeter({ score }: { score: number }) {
  const level = Math.min(5, Math.floor(score / 100))
  const pct = score % 100
  const BRAIN_ICONS = ['🧠', '🧠', '🧠🧠', '🧠🧠', '🧠🧠🧠', '🧠🧠🧠']

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm leading-none" title={`Intelligence level ${level}`}>
        {BRAIN_ICONS[level] ?? '🧠'}
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(192,192,192,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: pct + '%',
            background: 'linear-gradient(90deg, rgba(0,212,255,0.6), #00d4ff)',
          }}
        />
      </div>
      <span className="text-[8px] font-mono" style={{ color: 'rgba(0,212,255,0.5)' }}>Lv{level}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sparkline
// ─────────────────────────────────────────────

interface SparklineProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

function Sparkline({ data, color, width = 60, height = 16 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1].split(',')
        return (
          <circle
            cx={Number(last[0])}
            cy={Number(last[1])}
            r="2"
            fill={color}
            opacity={0.9}
          />
        )
      })()}
    </svg>
  )
}

// ─────────────────────────────────────────────
// Agent Row
// ─────────────────────────────────────────────

interface AgentRowProps {
  agent: OpenClawAgent
}

function AgentRow({ agent }: AgentRowProps) {
  const [expanded, setExpanded] = useState(false)
  const health = getHealthColor(agent)
  const style = HEALTH_STYLES[health]

  // Use lessonCount as lessonsLearned, runCount as buildsCompleted
  const lessonsLearned = agent.lessonCount ?? 0
  const buildsCompleted = agent.runCount ?? 0

  return (
    <div
      className="rounded-sm border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: style.color + '30',
        backgroundColor: expanded ? style.bg : 'transparent',
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-white/3 transition-colors"
      >
        {/* Expand icon */}
        <span className="text-chrome-dark/50 shrink-0">
          {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
        </span>

        {/* Agent emoji + name */}
        <span className="text-sm leading-none shrink-0">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {(() => {
              const pulseClass =
                agent.status === 'active' || agent.status === 'learning' ? 'agent-active' :
                agent.name?.toLowerCase().includes('pulse') ? 'agent-waiting' :
                'agent-idle'
              return (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${pulseClass}`}
                  style={{ color: style.color, backgroundColor: style.color }}
                />
              )
            })()}
            <span className="font-orbitron text-[10px]" style={{ color: style.color }}>
              {agent.name}
            </span>
          </div>
          <div className="font-mono text-[9px] text-chrome-dark/50 truncate">{agent.lastAction}</div>
          {/* Brain meter + stats */}
          <div className="mt-1.5 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex-1 min-w-0">
              <BrainMeter score={agent.evolutionScore} />
            </div>
            <div style={{ fontSize: '9px', fontFamily: 'Inter, system-ui, sans-serif', color: 'rgba(192,192,192,0.4)', whiteSpace: 'nowrap' }}>
              {lessonsLearned} lessons · {buildsCompleted} builds
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <Sparkline data={agent.sparklineData} color={style.color} />

        {/* Evolution score */}
        <div className="text-right shrink-0 ml-1">
          <div className="font-orbitron text-[11px]" style={{ color: style.color }}>
            {agent.evolutionScore}
          </div>
          <div className="font-mono text-[8px] text-chrome-dark/40">EVO</div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-white/5">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {[
              { label: 'MEMORY', value: `${agent.memoryLines}L` },
              { label: 'LESSONS', value: String(agent.lessonCount) },
              { label: 'RULES', value: String(agent.ruleCount) },
              { label: 'RUNS', value: String(agent.runCount) },
              { label: 'TOKENS', value: `${(agent.tokenCount / 1000).toFixed(1)}K` },
              { label: 'SIZE', value: `${(agent.memorySize / 1024).toFixed(1)}KB` },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-sm border border-white/5 px-2 py-1 text-center"
              >
                <div className="font-orbitron text-[10px]" style={{ color: style.color }}>{stat.value}</div>
                <div className="font-mono text-[8px] text-chrome-dark/40">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Last run date */}
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <Activity size={8} className="text-chrome-dark/50" />
            <span className="text-chrome-dark/50">Last run:</span>
            <span style={{ color: style.color + 'cc' }}>{agent.lastRunDate}</span>
          </div>

          {/* Lessons */}
          {agent.lessons.length > 0 && (
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '120px' }}>
              <div className="font-orbitron text-[8px] text-chrome-dark/50 tracking-wider">RECENT LESSONS</div>
              {agent.lessons.slice(0, 3).map((lesson, i) => (
                <div
                  key={i}
                  className="text-[9px] font-mono text-chrome-dark/70 leading-snug px-2 py-1
                             border-l-2 bg-white/3 rounded-r-sm"
                  style={{ borderLeftColor: style.color + '60' }}
                >
                  {lesson.replace(/^\[LESSON\]\s*\d{4}-\d{2}-\d{2}:\s*/, '')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function AgentHealthPanel() {
  const agents = getMergedAgents()
  const totalEvo = agents.reduce((sum, a) => sum + a.evolutionScore, 0)
  const evolvedCount = agents.filter(a => getHealthColor(a) === 'green').length
  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'learning').length

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="hud-label">Agent Health</div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-chrome-dark/60">
          <span><span className="text-neon">{activeCount}</span> active</span>
          <span>·</span>
          <span><span className="text-green-400">{evolvedCount}</span> evolved</span>
          <span>·</span>
          <span>EVO <span style={{ color: '#00d4ff' }}>{totalEvo}</span></span>
        </div>
      </div>

      {/* Agent list — full natural height, only internal scroll if needed */}
      <div className="space-y-1 overflow-y-auto scrollbar-thin" style={{ maxHeight: '600px' }}>
        {agents.map(agent => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/5 shrink-0">
        {(Object.entries(HEALTH_STYLES) as Array<[HealthColor, typeof HEALTH_STYLES[HealthColor]]>).map(([, s]) => (
          <div key={s.color} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          </div>
        ))}
        <span className="font-mono text-[8px] text-chrome-dark/40">🧠 = intelligence level</span>
      </div>
    </div>
  )
}
