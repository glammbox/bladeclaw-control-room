import { useState, useRef, TouchEvent } from 'react'
import AgentMatrix from './AgentMatrix'
import DeliveriesBrowser from './DeliveriesBrowser'
import IntelFeed from './IntelFeed'
import TokenCostTracker from './TokenCostTracker'
import DAGWorkflowCanvas from './DAGWorkflowCanvas'
import ModelSpawner from './ModelSpawner'
import AgentHealthPanel from './AgentHealthPanel'

const PANELS = [
  { id: 'dag', label: '⚡ DAG', component: DAGWorkflowCanvas },
  { id: 'agents', label: '🤖 Agents', component: AgentMatrix },
  { id: 'health', label: '🧠 Health', component: AgentHealthPanel },
  { id: 'projects', label: '📦 Projects', component: DeliveriesBrowser },
  { id: 'tokens', label: '💰 Tokens', component: TokenCostTracker },
  { id: 'spawner', label: '⚙️ Spawn', component: ModelSpawner },
  { id: 'intel', label: '📡 Intel', component: IntelFeed },
]

export default function MobileSwipeLayout() {
  const [current, setCurrent] = useState(0)
  const startX = useRef<number | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) < 40) return
    if (dx < 0 && current < PANELS.length - 1) setCurrent(c => c + 1)
    if (dx > 0 && current > 0) setCurrent(c => c - 1)
    startX.current = null
  }

  const Panel = PANELS[current].component

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#050507', touchAction: 'pan-x' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Tab strip */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(0,212,255,0.1)', flexShrink: 0, padding: '0 4px', gap: '2px', scrollbarWidth: 'none' }}>
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setCurrent(i)}
            style={{
              flexShrink: 0,
              padding: '6px 10px',
              background: 'none',
              border: 'none',
              borderBottom: i === current ? '2px solid #00d4ff' : '2px solid transparent',
              color: i === current ? '#00d4ff' : '#8892a4',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Swipe dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '4px 0', flexShrink: 0 }}>
        {PANELS.map((_, i) => (
          <div key={i} style={{ width: i === current ? '12px' : '4px', height: '4px', borderRadius: '2px', background: i === current ? '#00d4ff' : 'rgba(0,212,255,0.2)', transition: 'all 0.2s ease' }} />
        ))}
      </div>

      {/* Active panel — fills remaining height, no scroll */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px' }} className="hud-panel">
        <Panel />
      </div>

      {/* Swipe hint */}
      <div style={{ textAlign: 'center', padding: '4px', fontSize: '9px', color: 'rgba(0,212,255,0.3)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        ← swipe →
      </div>
    </div>
  )
}
