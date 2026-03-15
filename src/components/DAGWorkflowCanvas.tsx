import { useEffect, useRef, useState } from 'react'

const NODE_W = 80   // smaller width per node
const NODE_H = 48   // compact height
const GAP = 20      // gap between nodes
const STAGES = ['pulse','planner','research','market','content','media','builder','validator','optimizer','package']
const TOTAL_W = STAGES.length * (NODE_W + GAP) - GAP + 20  // total canvas width
const CANVAS_H = NODE_H + 60  // single row + padding

const STAGE_DESCRIPTIONS: Record<string, string> = {
  pulse: 'Viability',
  planner: 'Blueprint',
  research: 'Intel',
  market: 'Competitors',
  content: 'Copy',
  media: 'Assets',
  builder: 'Code',
  validator: 'QA',
  optimizer: 'Polish',
  package: 'ZIP',
}

const STAGE_TASKS: Record<string, string[]> = {
  pulse: ['Scanning...', 'Scoring...', 'Refining...'],
  planner: ['Templates...', 'Blueprint...', 'batchPlan...'],
  research: ['Perplexity...', 'npm registry...', 'Caching...'],
  market: ['ICP signals...', 'Competitors...', 'Positioning...'],
  content: ['Brand voice...', 'Hero copy...', 'CTAs...'],
  media: ['Pexels...', 'Generating...', 'Manifest...'],
  builder: ['Components...', 'tsc check...', 'Assets...'],
  validator: ['ESLint...', 'TypeScript...', 'CI score...'],
  optimizer: ['LCP...', 'Bundle...', 'Patches...'],
  package: ['Vercel...', 'ZIP...', 'Manifest...'],
}

type NodeStatus = 'completed' | 'active' | 'pending'

interface DAGNode {
  id: string
  status: NodeStatus
}

const PROGRESSION_SEQUENCE = STAGES

function nodeColor(status: NodeStatus): string {
  if (status === 'completed') return '#22c55e'
  if (status === 'active') return '#00d4ff'
  return '#374151'
}

function nodeBg(status: NodeStatus): string {
  if (status === 'completed') return '#052210'
  if (status === 'active') return '#001a24'
  return '#0c0c0c'
}

const initialNodes: DAGNode[] = STAGES.map((id, i) => ({
  id,
  status: i === 0 ? 'active' : 'pending',
}))

export default function DAGWorkflowCanvas() {
  const [nodes, setNodes] = useState<DAGNode[]>(initialNodes)
  const [tick, setTick] = useState(0)
  const [activeTaskIndices, setActiveTaskIndices] = useState<Record<string, number>>({})

  // Advance one node every 2.5s for demo
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick(t => t + 1)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Cycle active task text every 2s
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTaskIndices(prev => {
        const next = { ...prev }
        nodes.forEach(n => {
          if (n.status === 'active') {
            const tasks = STAGE_TASKS[n.id] ?? []
            next[n.id] = ((prev[n.id] ?? 0) + 1) % tasks.length
          }
        })
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [nodes])

  useEffect(() => {
    setNodes(prev => {
      const updated = prev.map(n => ({ ...n }))
      let activeIdx = -1
      for (let i = 0; i < PROGRESSION_SEQUENCE.length; i++) {
        const id = PROGRESSION_SEQUENCE[i]
        const n = updated.find(x => x.id === id)
        if (n?.status === 'active') { activeIdx = i; break }
      }
      if (activeIdx === -1) {
        const firstPending = PROGRESSION_SEQUENCE.findIndex(id =>
          updated.find(x => x.id === id)?.status === 'pending'
        )
        if (firstPending !== -1) {
          const node = updated.find(x => x.id === PROGRESSION_SEQUENCE[firstPending])
          if (node) node.status = 'active'
        }
      } else {
        const activeNode = updated.find(x => x.id === PROGRESSION_SEQUENCE[activeIdx])
        if (activeNode) activeNode.status = 'completed'
        const nextId = PROGRESSION_SEQUENCE[activeIdx + 1]
        if (nextId) {
          const nextNode = updated.find(x => x.id === nextId)
          if (nextNode && nextNode.status === 'pending') nextNode.status = 'active'
        }
      }
      return updated
    })
  }, [tick])

  return (
    <div className="w-full flex flex-col">
      <div className="hud-label mb-2">DAG Workflow</div>
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <svg
          width={TOTAL_W}
          height={CANVAS_H}
          viewBox={`0 0 ${TOTAL_W} ${CANVAS_H}`}
          style={{ display: 'block' }}
        >
          <defs>
            <marker id="dag-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 6 2.5, 0 5" fill="#374151" />
            </marker>
            <marker id="dag-arrow-active" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 6 2.5, 0 5" fill="#00d4ff88" />
            </marker>
            <marker id="dag-arrow-done" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 6 2.5, 0 5" fill="#22c55e" />
            </marker>
            <filter id="dag-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="dag-glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Arrows between nodes (horizontal) */}
          {nodes.map((node, i) => {
            if (i >= nodes.length - 1) return null
            const nextNode = nodes[i + 1]
            const x = 10 + i * (NODE_W + GAP)
            const y = 20
            const arrowColor =
              node.status === 'completed' && nextNode.status === 'completed' ? '#22c55e'
              : node.status === 'active' || nextNode.status === 'active' ? '#00d4ff88'
              : '#1f2937'
            const markerId =
              node.status === 'completed' && nextNode.status === 'completed' ? 'dag-arrow-done'
              : node.status === 'active' ? 'dag-arrow-active'
              : 'dag-arrow'
            return (
              <line
                key={node.id + '-arrow'}
                x1={x + NODE_W}
                y1={y + NODE_H / 2}
                x2={x + NODE_W + GAP - 4}
                y2={y + NODE_H / 2}
                stroke={arrowColor}
                strokeWidth="1"
                markerEnd={`url(#${markerId})`}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const isActive = node.status === 'active'
            const color = nodeColor(node.status)
            const bg = nodeBg(node.status)
            const x = 10 + i * (NODE_W + GAP)
            const y = 20
            const filterId = isActive ? 'dag-glow-blue' : node.status === 'completed' ? 'dag-glow-green' : undefined
            const tasks = STAGE_TASKS[node.id] ?? []
            const taskText = isActive ? tasks[activeTaskIndices[node.id] ?? 0] ?? '' : ''
            const label = node.id.charAt(0).toUpperCase() + node.id.slice(1)
            const desc = STAGE_DESCRIPTIONS[node.id] ?? ''

            return (
              <g key={node.id} filter={filterId ? `url(#${filterId})` : undefined}>
                {/* Pulse ring for active */}
                {isActive && (
                  <rect
                    x={x - 3} y={y - 3}
                    width={NODE_W + 6} height={NODE_H + 6}
                    rx={5} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.25"
                  >
                    <animate attributeName="opacity" values="0.25;0.05;0.25" dur="1.5s" repeatCount="indefinite" />
                  </rect>
                )}

                {/* Node box */}
                <rect
                  x={x} y={y}
                  width={NODE_W} height={NODE_H}
                  rx={3}
                  fill={bg}
                  stroke={color}
                  strokeWidth={isActive ? 1.5 : 1}
                />

                {/* Stage name */}
                <text
                  x={x + NODE_W / 2} y={y + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="'Orbitron', monospace"
                  fill={color}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  {label.toUpperCase()}
                </text>

                {/* Description or task text */}
                <text
                  x={x + NODE_W / 2} y={y + 28}
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={isActive ? 'rgba(0,212,255,0.7)' : 'rgba(192,192,192,0.45)'}
                >
                  {isActive && taskText ? taskText : desc}
                </text>

                {/* Status dot */}
                <circle
                  cx={x + NODE_W - 8}
                  cy={y + 8}
                  r={3.5}
                  fill={color}
                >
                  {isActive && (
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Completed checkmark */}
                {node.status === 'completed' && (
                  <text
                    x={x + NODE_W - 8} y={y + 12}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#22c55e"
                  >
                    ✓
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="text-chrome-dark">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neon inline-block" style={{ boxShadow: '0 0 6px #00d4ff' }} />
          <span className="text-chrome-dark">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
          <span className="text-chrome-dark">Pending</span>
        </div>
      </div>
    </div>
  )
}
