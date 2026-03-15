import { useEffect, useRef, useState } from 'react'

const NODE_W = 160
const NODE_H = 60
const GAP = 35
const CANVAS_W = 200
const STAGES = ['pulse','planner','research','market','content','media','builder','validator','optimizer','package']
const CANVAS_H = STAGES.length * (NODE_H + GAP)

const STAGE_DESCRIPTIONS: Record<string, string> = {
  pulse: 'Checking viability',
  planner: 'Generating blueprint',
  research: 'Gathering intel',
  market: 'Analyzing competitors',
  content: 'Writing copy',
  media: 'Creating assets',
  builder: 'Writing code',
  validator: 'Running quality checks',
  optimizer: 'Polishing performance',
  package: 'Zipping deliverable',
}

const STAGE_TASKS: Record<string, string[]> = {
  pulse: ['Scanning viability...', 'Scoring 4 axes...', 'Refining prompt...'],
  planner: ['Checking templates...', 'Generating blueprint...', 'Writing batchPlan...'],
  research: ['Querying Perplexity...', 'Checking npm registry...', 'Caching results...'],
  market: ['Parsing ICP signals...', 'Competitor analysis...', 'Writing positioning doc...'],
  content: ['Reading brand voice...', 'Writing hero copy...', 'Generating CTAs...'],
  media: ['Searching Pexels...', 'Generating assets...', 'Building manifest...'],
  builder: ['Writing components...', 'Running tsc --noEmit...', 'Verifying assets...'],
  validator: ['Running ESLint...', 'Checking TypeScript...', 'Computing CI score...'],
  optimizer: ['Measuring LCP...', 'Tree-shaking bundle...', 'Applying patches...'],
  package: ['Deploying to Vercel...', 'Creating ZIP...', 'Writing manifest...'],
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

  const cx = CANVAS_W / 2

  return (
    <div className="w-full flex flex-col">
      <div className="hud-label mb-2">DAG Workflow</div>
      <div className="relative">
        <svg
          width="100%"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="xMidYMin meet"
          style={{ display: 'block' }}
        >
          <defs>
            <marker id="arrow-dag-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
            </marker>
            <marker id="arrow-dag-done" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
            </marker>
            <marker id="arrow-dag-pending" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#1f2937" />
            </marker>
            <filter id="dag-glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="dag-glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Arrows between nodes */}
          {nodes.map((node, i) => {
            if (i >= nodes.length - 1) return null
            const nextNode = nodes[i + 1]
            const y = i * (NODE_H + GAP)
            const arrowFrom = y + NODE_H
            const arrowTo = y + NODE_H + GAP - 6
            const color =
              node.status === 'completed' && nextNode.status === 'completed' ? '#22c55e'
              : node.status === 'active' || nextNode.status === 'active' ? '#00d4ff88'
              : '#1f2937'
            const markerId =
              node.status === 'completed' && nextNode.status === 'completed' ? 'arrow-dag-done'
              : node.status === 'active' ? 'arrow-dag-active'
              : 'arrow-dag-pending'
            return (
              <line
                key={node.id + '-arrow'}
                x1={cx} y1={arrowFrom}
                x2={cx} y2={arrowTo}
                stroke={color}
                strokeWidth="1.5"
                markerEnd={`url(#${markerId})`}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const isActive = node.status === 'active'
            const color = nodeColor(node.status)
            const bg = nodeBg(node.status)
            const y = i * (NODE_H + GAP)
            const nodeX = cx - NODE_W / 2
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
                    x={nodeX - 4} y={y - 4}
                    width={NODE_W + 8} height={NODE_H + 8}
                    rx={6} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.25"
                  >
                    <animate attributeName="opacity" values="0.25;0.05;0.25" dur="1.5s" repeatCount="indefinite" />
                  </rect>
                )}

                {/* Node box */}
                <rect
                  x={nodeX} y={y}
                  width={NODE_W} height={NODE_H}
                  rx={4}
                  fill={bg}
                  stroke={color}
                  strokeWidth={isActive ? 1.5 : 1}
                />

                {/* Stage name */}
                <text
                  x={cx} y={y + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="'Orbitron', monospace"
                  fill={color}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  {label.toUpperCase()}
                </text>

                {/* Description or task text */}
                <text
                  x={cx} y={y + 33}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={isActive ? 'rgba(0,212,255,0.7)' : 'rgba(192,192,192,0.45)'}
                >
                  {isActive && taskText ? taskText : desc}
                </text>

                {/* Status dot */}
                <circle
                  cx={nodeX + NODE_W - 10}
                  cy={y + 10}
                  r={4}
                  fill={color}
                >
                  {isActive && (
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Completed checkmark */}
                {node.status === 'completed' && (
                  <text
                    x={nodeX + NODE_W - 10} y={y + 14}
                    textAnchor="middle"
                    fontSize="8"
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
