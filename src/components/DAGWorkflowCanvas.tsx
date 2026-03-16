import { useEffect, useState } from 'react'
import ChatSidePanel from './ChatSidePanel'
import { getChainState } from '../lib/gatewayApi'

const NODE_W = 60
const NODE_H = 28
const GAP = 14
const STAGES = ['pulse', 'planner', 'research', 'market', 'content', 'media', 'builder', 'validator', 'optimizer', 'package']
const TOTAL_W = STAGES.length * (NODE_W + GAP) - GAP + 20
const CANVAS_H = NODE_H + 60

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

const initialNodes: DAGNode[] = STAGES.map((id, i) => ({
  id,
  status: i === 0 ? 'active' : 'pending',
}))

function getNodeStroke(status: NodeStatus): string {
  if (status === 'completed') return 'rgba(34,197,94,0.5)'
  if (status === 'active') return '#00d4ff'
  return 'rgba(0,212,255,0.15)'
}

function getArrowStroke(node: DAGNode, nextNode: DAGNode): string {
  if (nextNode.status === 'active') return '#00d4ff'
  return 'rgba(0,212,255,0.4)'
}

export default function DAGWorkflowCanvas() {
  const [nodes, setNodes] = useState<DAGNode[]>(initialNodes)
  const [activeTaskIndices, setActiveTaskIndices] = useState<Record<string, number>>({})

  useEffect(() => {
    const poll = async () => {
      const chain = await getChainState()
      if (!chain) return
      const completed: string[] = chain.completedStages ?? []
      const current: string = chain.currentStage ?? ''
      setNodes(STAGES.map(id => ({
        id,
        status: completed.includes(id) ? 'completed' : id === current ? 'active' : 'pending'
      })))
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTaskIndices((prev) => {
        const next = { ...prev }
        nodes.forEach((n) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '6px', padding: '8px' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="w-full flex flex-col">
          <div className="font-label mb-2 text-sm tracking-[0.2em] uppercase" style={{ color: 'var(--chrome-bright)' }}>
            DAG Workflow
          </div>
          <div style={{ width: '100%', maxHeight: '80px', overflow: 'hidden', position: 'relative' }}>
            <svg width={TOTAL_W} height={CANVAS_H} viewBox={`0 0 ${TOTAL_W} ${CANVAS_H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%' }}>
              <defs>
                <marker id="dag-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="rgba(0,212,255,0.4)" />
                </marker>
                <marker id="dag-arrow-active" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill="#00d4ff" />
                </marker>
                <filter id="node-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {nodes.map((node, i) => {
                if (i >= nodes.length - 1) return null
                const nextNode = nodes[i + 1]
                const x = 10 + i * (NODE_W + GAP)
                const y = 20
                const arrowColor = getArrowStroke(node, nextNode)
                const markerId = nextNode.status === 'active' ? 'dag-arrow-active' : 'dag-arrow'
                return (
                  <line
                    key={`${node.id}-arrow`}
                    x1={x + NODE_W}
                    y1={y + NODE_H / 2}
                    x2={x + NODE_W + GAP - 4}
                    y2={y + NODE_H / 2}
                    stroke={arrowColor}
                    strokeWidth={nextNode.status === 'active' ? 1.5 : 1}
                    markerEnd={`url(#${markerId})`}
                  />
                )
              })}

              {nodes.map((node, i) => {
                const isActive = node.status === 'active'
                const x = 10 + i * (NODE_W + GAP)
                const y = 20
                const tasks = STAGE_TASKS[node.id] ?? []
                const taskText = isActive ? tasks[activeTaskIndices[node.id] ?? 0] ?? '' : ''
                const label = node.id.charAt(0).toUpperCase() + node.id.slice(1)
                const desc = STAGE_DESCRIPTIONS[node.id] ?? ''

                return (
                  <g key={node.id}>
                    {isActive && (
                      <rect
                        x={x - 3}
                        y={y - 3}
                        width={NODE_W + 6}
                        height={NODE_H + 6}
                        rx={5}
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="1"
                        opacity="0.25"
                        filter="url(#node-glow)"
                      >
                        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="1.5s" repeatCount="indefinite" />
                      </rect>
                    )}

                    <rect
                      x={x}
                      y={y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={3}
                      fill="rgba(8,8,16,0.95)"
                      stroke={getNodeStroke(node.status)}
                      strokeWidth={isActive ? 1.5 : 1}
                      filter={isActive ? 'url(#node-glow)' : undefined}
                    />

                    <text
                      x={x + NODE_W / 2}
                      y={y + 14}
                      textAnchor="middle"
                      fontSize="6"
                      fontFamily="Rajdhani, sans-serif"
                      fill="#c0cfe0"
                      fontWeight="600"
                    >
                      {label.toUpperCase()}
                    </text>

                    <circle cx={x + NODE_W - 6} cy={y + 6} r={3} fill={getNodeStroke(node.status)}>
                      {isActive && (
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                      )}
                    </circle>

                    {node.status === 'completed' && (
                      <text x={x + NODE_W - 6} y={y + 9} textAnchor="middle" fontSize="6" fill="var(--status-ok)">
                        ✓
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-2 text-[10px] font-data">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--status-ok)' }} />
              <span style={{ color: 'var(--chrome)' }}>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--neon)', boxShadow: '0 0 6px rgba(0,212,255,0.6)' }} />
              <span style={{ color: 'var(--chrome)' }}>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'rgba(0,212,255,0.15)' }} />
              <span style={{ color: 'var(--chrome)' }}>Pending</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatSidePanel />
      </div>
    </div>
  )
}
