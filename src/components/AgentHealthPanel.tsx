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
  gray: { color: 'var(--chrome)', bg: 'rgba(136,146,164,0.04)' },
  blue: { color: 'var(--neon)', bg: 'rgba(0,212,255,0.08)' },
  green: { color: 'var(--status-ok)', bg: 'rgba(34,197,94,0.08)' },
  red: { color: 'var(--status-error)', bg: 'rgba(239,68,68,0.08)' },
}

function BrainMeter({ score }: { score: number }) {
  const level = Math.min(5, Math.floor(score / 100))
  const pct = score % 100
  const BRAIN_ICONS = ['🧠', '🧠', '🧠🧠', '🧠🧠', '🧠🧠🧠', '🧠🧠🧠']

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm leading-none" title={`Intelligence level ${level}`}>
        {BRAIN_ICONS[level] ?? '🧠'}
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(0,212,255,0.4), #00d4ff)',
            height: '100%',
            borderRadius: '2px',
            transition: 'width 1s ease',
          }}
        />
      </div>
      <span className="text-[8px] font-data" style={{ color: 'rgba(0,212,255,0.5)' }}>Lv{level}</span>
    </div>
  )
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
  const sparkColor = agent.status === 'active' || agent.status === 'learning' ? 'var(--neon)' : 'var(--chrome)'

  const lessonsLearned = agent.lessonCount ?? 0
  const buildsCompleted = agent.runCount ?? 0

  return (
    <div
      className="rounded-sm hud-panel overflow-hidden transition-all duration-200"
      style={{
        border: expanded ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(0,212,255,0.12)',
        backgroundColor: expanded ? style.bg : 'rgba(15,22,41,0.7)',
        opacity: agent.status === 'idle' ? 0.6 : 1,
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors"
        style={{ borderBottom: expanded ? '1px solid rgba(0,212,255,0.06)' : 'none' }}
      >
        <span className="shrink-0" style={{ color: 'var(--chrome-dim)' }}>
          {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
        </span>

        <span className="text-sm leading-none shrink-0">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {(() => {
              const pulseClass =
                agent.status === 'active' || agent.status === 'learning'
                  ? 'agent-active'
                  : agent.name?.toLowerCase().includes('pulse')
                    ? 'agent-waiting'
                    : 'agent-idle'
              return (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${pulseClass}`}
                  style={{ backgroundColor: style.color }}
                />
              )
            })()}
            <span className="font-label text-[10px]" style={{ color: style.color }}>
              {agent.name}
            </span>
          </div>
          <div className="font-body text-[9px] truncate" style={{ color: 'rgba(138,146,164,0.7)' }}>{agent.lastAction}</div>
          <div className="mt-1.5 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex-1 min-w-0">
              <BrainMeter score={agent.evolutionScore} />
            </div>
            <div className="font-data text-[9px] whitespace-nowrap" style={{ color: 'rgba(192,192,192,0.4)' }}>
              {lessonsLearned} lessons · {buildsCompleted} builds
            </div>
          </div>
        </div>

        <Sparkline data={agent.sparklineData} color={sparkColor} />

        <div className="text-right shrink-0 ml-1">
          <div className="font-data text-[11px]" style={{ color: style.color }}>
            {agent.evolutionScore}
          </div>
          <div className="font-data text-[8px]" style={{ color: 'rgba(138,146,164,0.45)' }}>EVO</div>
        </div>
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {[
              { label: 'MEMORY', value: `${agent.memoryLines}L` },
              { label: 'LESSONS', value: String(agent.lessonCount) },
              { label: 'RULES', value: String(agent.ruleCount) },
              { label: 'RUNS', value: String(agent.runCount) },
              { label: 'TOKENS', value: `${(agent.tokenCount / 1000).toFixed(1)}K` },
              { label: 'SIZE', value: `${(agent.memorySize / 1024).toFixed(1)}KB` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-sm px-2 py-1 text-center hud-panel"
                style={{ border: '1px solid rgba(0,212,255,0.12)' }}
              >
                <div className="font-data text-[10px]" style={{ color: style.color }}>{stat.value}</div>
                <div className="font-label text-[8px]" style={{ color: 'var(--chrome-dim)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-data">
            <Activity size={8} style={{ color: 'var(--chrome-dim)' }} />
            <span style={{ color: 'var(--chrome-dim)' }}>Last run:</span>
            <span style={{ color: style.color }}>{agent.lastRunDate}</span>
          </div>

          {agent.lessons.length > 0 && (
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '120px' }}>
              <div className="font-label text-[8px] tracking-wider" style={{ color: 'var(--chrome-dim)' }}>RECENT LESSONS</div>
              {agent.lessons.slice(0, 3).map((lesson, i) => (
                <div
                  key={i}
                  className="text-[9px] font-body leading-snug px-2 py-1 rounded-r-sm"
                  style={{
                    color: 'rgba(192,207,224,0.72)',
                    borderLeft: `2px solid ${style.color}99`,
                    background: 'rgba(255,255,255,0.03)',
                  }}
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
  const evolvedCount = agents.filter((a) => getHealthColor(a) === 'green').length
  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'learning').length

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="font-label text-sm tracking-[0.24em] uppercase" style={{ color: 'var(--chrome-bright)' }}>
          SOUL INTEGRITY
        </div>
        <div className="flex items-center gap-2 text-[9px] font-data" style={{ color: 'var(--chrome-dim)' }}>
          <span><span style={{ color: 'var(--neon)' }}>{activeCount}</span> active</span>
          <span>·</span>
          <span><span style={{ color: 'var(--status-ok)' }}>{evolvedCount}</span> evolved</span>
          <span>·</span>
          <span>EVO <span style={{ color: 'var(--neon)' }}>{totalEvo}</span></span>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto scrollbar-thin" style={{ maxHeight: '600px' }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
            <AgentRow agent={agent} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1 shrink-0" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
        {(Object.entries(HEALTH_STYLES) as Array<[HealthColor, typeof HEALTH_STYLES[HealthColor]]>).map(([, s]) => (
          <div key={s.color} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          </div>
        ))}
        <span className="font-data text-[8px]" style={{ color: 'rgba(138,146,164,0.45)' }}>🧠 = intelligence level</span>
      </div>
    </div>
  )
}
