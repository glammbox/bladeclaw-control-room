import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'

// ─────────────────────────────────────────────
// Real-time hooks
// ─────────────────────────────────────────────
import { useWebSocket } from '../hooks/useWebSocket'
import { useAgentStatus } from '../hooks/useAgentStatus'
import { useDAGProgress } from '../hooks/useDAGProgress'
import { useTokenTracker } from '../hooks/useTokenTracker'

// ─────────────────────────────────────────────
// Panel components
// ─────────────────────────────────────────────
import CommandHeader from '../components/CommandHeader'
import AgentMatrix from '../components/AgentMatrix'
import TokenCostTracker from '../components/TokenCostTracker'
import DAGWorkflowCanvas from '../components/DAGWorkflowCanvas'
import DeliveriesBrowser from '../components/DeliveriesBrowser'
import MediaHub from '../components/MediaHub'
import ModelSpawner from '../components/ModelSpawner'
import SettingsPanel from '../components/SettingsPanel'
import AgentHealthPanel from '../components/AgentHealthPanel'
import ChatBar from '../components/ChatBar'

// ─────────────────────────────────────────────
// WS mode badge
// ─────────────────────────────────────────────

function WSModeBadge({ mode, status }: { mode: 'ws' | 'polling'; status: string }) {
  const isLive = mode === 'ws' && status === 'open'
  return (
    <div
      className={`
        fixed bottom-14 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1
        rounded-sm border font-mono text-[10px] tracking-wider uppercase
        ${isLive
          ? 'border-status-ok/40 bg-status-ok/10 text-status-ok'
          : 'border-neon/20 bg-neon/5 text-chrome-dark'
        }
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-status-ok animate-pulse' : 'bg-chrome-dark'}`}
      />
      {isLive ? 'WebSocket Live' : 'Polling Mode'}
    </div>
  )
}

// ─────────────────────────────────────────────
// Settings button
// ─────────────────────────────────────────────

function SettingsToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5
        rounded-sm border border-neon/20 bg-panel/80 backdrop-blur-sm
        text-chrome-dark hover:text-neon hover:border-neon/40 transition-all duration-200"
      aria-label="Open settings"
    >
      <Settings size={12} />
    </button>
  )
}

// ─────────────────────────────────────────────
// HUD Status Bar
// ─────────────────────────────────────────────

function HUDStatusBar({
  agentCount,
  activeCount,
  totalTokens,
  ciScore,
  burnRate,
}: {
  agentCount: number
  activeCount: number
  totalTokens: number
  ciScore: number
  burnRate: number
}) {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4
      px-4 py-1 font-mono text-[10px] text-chrome-dark pointer-events-none">
      <span>AGENTS: <span className="text-neon">{activeCount}</span>/{agentCount}</span>
      <span className="text-neon/20">|</span>
      <span>TOKENS: <span className="text-neon">{(totalTokens / 1000).toFixed(1)}K</span></span>
      <span className="text-neon/20">|</span>
      <span>BURN: <span className="text-status-warn">{burnRate.toLocaleString()}/min</span></span>
      <span className="text-neon/20">|</span>
      <span>CI: <span className={ciScore >= 90 ? 'text-status-ok' : 'text-status-warn'}>{ciScore}</span></span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

export default function Dashboard() {
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Real-time data hooks ──────────────────
  const ws = useWebSocket()
  const agents = useAgentStatus({ lastEvent: ws.lastEvent })
  const dag = useDAGProgress({ lastEvent: ws.lastEvent })
  const tokens = useTokenTracker({ lastEvent: ws.lastEvent })

  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'working').length

  // Keyboard shortcut: / to focus chat
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        ;(window as any).__chatBarFocus?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      {/* Neon progress bar at top */}
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-neon/60 transition-all duration-500"
        style={{ width: (dag as any).buildProgress ? (dag as any).buildProgress + '%' : '0%' }}
      />

      {/* HUD overlays */}
      <HUDStatusBar
        agentCount={agents.length}
        activeCount={activeCount}
        totalTokens={tokens.totalTokens}
        ciScore={dag.ciScore}
        burnRate={tokens.burnRate}
      />
      <WSModeBadge mode={ws.mode} status={ws.status} />
      <SettingsToggle onClick={() => setSettingsOpen(true)} />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Fixed chat bar at bottom */}
      <ChatBar />

      {/* Main dashboard page */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full flex flex-col gap-2 p-2"
      >
        {/* ── Command Header (full width) ── */}
        <div className="shrink-0">
          <CommandHeader />
        </div>

        {/* ── Main grid ──
          Uses dashboard-grid CSS class for desktop (12-col, row placement).
          CSS media queries handle tablet/mobile fallbacks.
        */}
        <div className="grid gap-2 dashboard-grid">

          {/* AgentMatrix */}
          <div className="agent-matrix-cell">
            <AgentMatrix className="h-full" />
          </div>

          {/* MediaHub — spans 2 rows on desktop */}
          <div className="media-hub-cell">
            <MediaHub />
          </div>

          {/* TokenCostTracker */}
          <div className="token-tracker-cell">
            <TokenCostTracker className="h-full" />
          </div>

          {/* DAGWorkflowCanvas — horizontal scroll on small screens */}
          <div className="dag-canvas-cell" style={{ overflowX: 'auto' }}>
            <DAGWorkflowCanvas />
          </div>

          {/* DeliveriesBrowser */}
          <div className="deliveries-cell">
            <DeliveriesBrowser />
          </div>

          {/* ModelSpawner */}
          <div className="model-spawner-cell">
            <ModelSpawner />
          </div>

          {/* AgentHealthPanel */}
          <div className="agent-health-cell">
            <AgentHealthPanel />
          </div>
        </div>
      </motion.div>
    </>
  )
}
