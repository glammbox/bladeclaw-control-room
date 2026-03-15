import { useEffect, useRef, useState } from 'react'

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

type NodeStatus = 'completed' | 'active' | 'pending'

interface DAGNode {
  id: string
  label: string
  x: number
  y: number
  status: NodeStatus
}

interface DAGEdge {
  from: string
  to: string
}

// Layout: linear then parallel branches then converge
const INITIAL_NODES: DAGNode[] = [
  { id: 'pulse',     label: 'Pulse',     x: 60,  y: 100, status: 'completed' },
  { id: 'planner',   label: 'Planner',   x: 160, y: 100, status: 'completed' },
  { id: 'research',  label: 'Research',  x: 280, y: 60,  status: 'active'    },
  { id: 'market',    label: 'Market',    x: 280, y: 140, status: 'pending'   },
  { id: 'content',   label: 'Content',   x: 400, y: 60,  status: 'pending'   },
  { id: 'media',     label: 'Media',     x: 400, y: 140, status: 'pending'   },
  { id: 'builder',   label: 'Builder',   x: 510, y: 100, status: 'pending'   },
  { id: 'validator', label: 'Validator', x: 610, y: 100, status: 'pending'   },
  { id: 'optimizer', label: 'Optimizer', x: 710, y: 100, status: 'pending'   },
  { id: 'package',   label: 'Package',   x: 820, y: 100, status: 'pending'   },
]

const EDGES: DAGEdge[] = [
  { from: 'pulse',    to: 'planner'   },
  { from: 'planner',  to: 'research'  },
  { from: 'planner',  to: 'market'    },
  { from: 'research', to: 'content'   },
  { from: 'market',   to: 'content'   },
  { from: 'market',   to: 'media'     },
  { from: 'research', to: 'media'     },
  { from: 'content',  to: 'builder'   },
  { from: 'media',    to: 'builder'   },
  { from: 'builder',  to: 'validator' },
  { from: 'validator',to: 'optimizer' },
  { from: 'optimizer',to: 'package'   },
]

// Progression sequence: which node becomes active next
const PROGRESSION_SEQUENCE = [
  'pulse', 'planner', 'research', 'market', 'content', 'media',
  'builder', 'validator', 'optimizer', 'package',
]

function nodeColor(status: NodeStatus): string {
  if (status === 'completed') return '#22c55e'
  if (status === 'active')    return '#00d4ff'
  return '#374151'
}

function nodeBg(status: NodeStatus): string {
  if (status === 'completed') return '#052210'
  if (status === 'active')    return '#001a24'
  return '#0c0c0c'
}

function edgeColor(fromStatus: NodeStatus, toStatus: NodeStatus): string {
  if (fromStatus === 'completed' && toStatus === 'completed') return '#22c55e'
  if (fromStatus === 'completed' && toStatus === 'active')    return '#00d4ff'
  if (fromStatus === 'active')                                return '#00d4ff88'
  return '#1f2937'
}

export default function DAGWorkflowCanvas() {
  const [nodes, setNodes] = useState<DAGNode[]>(INITIAL_NODES)
  const [tick, setTick] = useState(0)
  const animRef = useRef(0)

  // Advance one node every 2.5s for demo
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick(t => t + 1)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setNodes(prev => {
      const updated = prev.map(n => ({ ...n }))

      // Find the last active node index in sequence
      let activeIdx = -1
      for (let i = 0; i < PROGRESSION_SEQUENCE.length; i++) {
        const id = PROGRESSION_SEQUENCE[i]
        const n = updated.find(x => x.id === id)
        if (n?.status === 'active') { activeIdx = i; break }
      }

      if (activeIdx === -1) {
        // No active node — find first pending
        const firstPending = PROGRESSION_SEQUENCE.findIndex(id =>
          updated.find(x => x.id === id)?.status === 'pending'
        )
        if (firstPending !== -1) {
          const node = updated.find(x => x.id === PROGRESSION_SEQUENCE[firstPending])
          if (node) node.status = 'active'
        }
      } else {
        // Complete current active, activate next pending
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

  // Store animation frame ref
  useEffect(() => {
    animRef.current = Date.now()
  })

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div className="w-full h-full flex flex-col">
      <div className="hud-label mb-2">DAG Workflow</div>
      <div className="flex-1 relative overflow-hidden rounded-sm">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 900 200"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          <defs>
            {/* Arrow markers for each edge color */}
            <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
            </marker>
            <marker id="arrow-done" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
            </marker>
            <marker id="arrow-pending" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#1f2937" />
            </marker>

            {/* Glow filter for active nodes */}
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const from = nodeMap.get(edge.from)
            const to   = nodeMap.get(edge.to)
            if (!from || !to) return null

            const color = edgeColor(from.status, to.status)
            const markerId =
              from.status === 'completed' && to.status === 'completed' ? 'arrow-done'
              : (from.status === 'active' || to.status === 'active')    ? 'arrow-active'
              : 'arrow-pending'

            // Bezier curve
            const dx = to.x - from.x
            const cx1 = from.x + dx * 0.4
            const cy1 = from.y
            const cx2 = to.x - dx * 0.4
            const cy2 = to.y

            return (
              <path
                key={i}
                d={`M ${from.x + 30} ${from.y} C ${cx1 + 30} ${cy1} ${cx2 - 30} ${cy2} ${to.x - 30} ${to.y}`}
                stroke={color}
                strokeWidth="1.5"
                fill="none"
                markerEnd={`url(#${markerId})`}
                opacity={0.8}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isActive = node.status === 'active'
            const color = nodeColor(node.status)
            const bg = nodeBg(node.status)
            const filterId = isActive ? 'glow-blue' : node.status === 'completed' ? 'glow-green' : undefined

            return (
              <g key={node.id} filter={filterId ? `url(#${filterId})` : undefined}>
                {/* Pulse ring for active */}
                {isActive && (
                  <circle cx={node.x} cy={node.y} r={28} fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values="28;36;28" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node box */}
                <rect
                  x={node.x - 30}
                  y={node.y - 16}
                  width={60}
                  height={32}
                  rx={4}
                  fill={bg}
                  stroke={color}
                  strokeWidth={isActive ? 1.5 : 1}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="'Orbitron', monospace"
                  fill={color}
                  fontWeight={isActive ? 'bold' : 'normal'}
                >
                  {node.label}
                </text>
                {/* Description */}
                <text
                  x={node.x}
                  y={node.y + 11}
                  textAnchor="middle"
                  fontSize="6"
                  fontFamily="Inter, system-ui, sans-serif"
                  fill="rgba(192,192,192,0.45)"
                >
                  {STAGE_DESCRIPTIONS[node.id?.toLowerCase()] || ''}
                </text>

                {/* Status dot */}
                <circle
                  cx={node.x + 22}
                  cy={node.y - 10}
                  r={3}
                  fill={color}
                />
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
