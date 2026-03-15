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

const HEALTH_STYLES: Record<HealthColor, { color: string; label: string; bg: string }> = {
  gray:  { color: '#6b7280', label: 'IDLE',    bg: 'rgba(107,114,128,0.08)' },
  blue:  { color: '#3b82f6', label: 'ACTIVE',  bg: 'rgba(59,130,246,0.08)'  },
  green: { color: '#22c55e', label: 'EVOLVED', bg: 'rgba(34,197,94,0.08)'   },
  red:   { color: '#ef4444', label: 'CRITICAL', bg: 'rgba(239,68,68,0.08)'  },
}

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
      {/* Last point dot */}
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

interface AgentRowProps {
  agent: OpenClawAgent
}

function AgentRow({ agent }: AgentRowProps) {
  const [expanded, setExpanded] = useState(false)
  const health = getHealthColor(agent)
  const style = HEALTH_STYLES[health]

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
            <span
              className="font-orbitron text-[8px] px-1 py-0.5 rounded-sm border"
              style={{ color: style.color, borderColor: style.color + '40', backgroundColor: style.color + '15' }}
            >
              {style.label}
            </span>
          </div>
          <div className="font-mono text-[9px] text-chrome-dark/50 truncate">{agent.lastAction}</div>
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
            <div className="space-y-1">
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

export default function AgentHealthPanel() {
  const agents = getMergedAgents()
  const totalEvo = agents.reduce((sum, a) => sum + a.evolutionScore, 0)
  const evolvedCount = agents.filter(a => getHealthColor(a) === 'green').length
  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'learning').length

  return (
    <div className="w-full h-full flex flex-col gap-2">
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

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin min-h-0">
        {agents.map(agent => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/5 shrink-0">
        {(Object.entries(HEALTH_STYLES) as Array<[HealthColor, typeof HEALTH_STYLES[HealthColor]]>).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-mono text-[8px] text-chrome-dark/50">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
