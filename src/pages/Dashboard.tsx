import { lazy, Suspense, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { Settings, ChevronLeft, ChevronRight, Music, X } from 'lucide-react'

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
const ArcReactorCore = lazy(() => import('../components/ArcReactorCore'))
import AgentMatrix from '../components/AgentMatrix'
import TokenCostTracker from '../components/TokenCostTracker'
import DAGWorkflowCanvas from '../components/DAGWorkflowCanvas'
import DeliveriesBrowser from '../components/DeliveriesBrowser'
import IntelFeed from '../components/IntelFeed'
import NewsFeed from '../components/NewsFeed'
import XFeed from '../components/XFeed'
import MediaDock from '../components/MediaDock'
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
        fixed bottom-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1
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
// HUD Status Overlay (top-right in header area)
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
// Tabbed Intel Panel (INTEL | NEWS | X FEED)
// ─────────────────────────────────────────────

type IntelTab = 'intel' | 'news' | 'xfeed'

const INTEL_TABS: Array<{ id: IntelTab; label: string; color: string }> = [
  { id: 'intel',  label: 'INTEL',  color: '#00d4ff' },
  { id: 'news',   label: 'NEWS',   color: '#22c55e' },
  { id: 'xfeed',  label: 'X FEED', color: '#6366f1' },
]

function TabbedIntelPanel() {
  const [activeTab, setActiveTab] = useState<IntelTab>('intel')
  const tab = INTEL_TABS.find(t => t.id === activeTab)!

  return (
    <div className="w-full h-full flex flex-col gap-1.5">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-sm border border-neon/10 bg-void shrink-0">
        {INTEL_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-1 py-1 rounded-sm text-[9px] font-orbitron tracking-wider
                        transition-all duration-200
                        ${activeTab === t.id
                          ? 'border'
                          : 'text-chrome-dark hover:text-chrome border border-transparent'
                        }`}
            style={activeTab === t.id ? {
              borderColor: t.color + '50',
              backgroundColor: t.color + '12',
              color: t.color,
            } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-sm border p-2"
        style={{ borderColor: tab.color + '20', backgroundColor: tab.color + '04' }}>
        {activeTab === 'intel' && <IntelFeed />}
        {activeTab === 'news'  && <NewsFeed />}
        {activeTab === 'xfeed' && <XFeed />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Collapsible Agent Health Side Panel
// ─────────────────────────────────────────────

function CollapsibleAgentHealth() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`flex flex-col transition-all duration-300 border border-neon/10 rounded-sm bg-panel/40
                  ${collapsed ? 'w-6 items-center justify-center' : 'w-full h-full p-2'}`}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 text-chrome-dark hover:text-neon transition-colors"
          title="Expand agent health"
        >
          <ChevronRight size={11} />
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span />
            <button
              onClick={() => setCollapsed(true)}
              className="text-chrome-dark/50 hover:text-chrome transition-colors"
              title="Collapse panel"
            >
              <ChevronLeft size={10} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AgentHealthPanel />
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Floating Media Dock button + drawer
// ─────────────────────────────────────────────

function FloatingMediaDock() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating music button — bottom right, above WS badge */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-3 right-3 z-30 w-10 h-10 rounded-sm border flex items-center justify-center
                    font-orbitron text-base transition-all duration-200
                    ${open
                      ? 'border-neon/50 bg-neon/15 text-neon shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                      : 'border-neon/20 bg-panel/80 backdrop-blur-sm text-chrome-dark hover:text-neon hover:border-neon/40'
                    }`}
        aria-label="Toggle media dock"
      >
        <Music size={15} />
      </button>

      {/* Media dock drawer — slides up from bottom right */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="media-backdrop"
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(5,5,5,0.4)', backdropFilter: 'blur(2px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="media-drawer"
              className="fixed bottom-16 right-3 z-50 rounded-sm border border-neon/20 bg-panel overflow-hidden"
              style={{ width: '380px', maxHeight: '480px', backgroundColor: '#0a0a0f' }}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-neon/10 shrink-0">
                <span className="font-orbitron text-[10px] tracking-widest text-neon/70 uppercase">Media Dock</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-sm border border-white/10 flex items-center justify-center
                             text-chrome-dark hover:text-chrome hover:border-white/20 transition-all"
                  aria-label="Close media dock"
                >
                  <X size={11} />
                </button>
              </div>

              {/* MediaDock content */}
              <div className="p-3 overflow-y-auto" style={{ maxHeight: '420px' }}>
                <MediaDock />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
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

  // Derived values for HUD status bar
  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'working').length

  // Keyboard shortcuts: / to focus chat, Escape to blur
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

      {/* Floating media dock */}
      <FloatingMediaDock />

      {/* Fixed chat bar at bottom */}
      <ChatBar />

      {/* Main dashboard page */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full w-full flex flex-col gap-2 p-2 pb-14"
      >
        {/* ── Row 1: Command Header (full width) ── */}
        <div className="shrink-0">
          <CommandHeader />
        </div>

        {/* ── Main grid body ── */}
        <div className="flex-1 min-h-0 grid gap-2 dashboard-grid">
          {/*
            Desktop: 12-column grid, 2 main rows + bottom row
            Row 1: ArcReactor(3) | AgentMatrix(6) | IntelFeed(3) [spans 2 rows]
            Row 2: TokenTracker(3) | DAGCanvas(5) | DeliveriesBrowser(4)
            Row 3: ModelSpawner(8) | AgentHealth(4)

            MediaDock is now a floating bottom-right drawer (🎵 button)
            AgentMatrix gets 6 cols (was 6), now with 5-col grid inside
          */}

          {/* ArcReactorCore — hero panel center-left */}
          <div className="arc-reactor-cell">
            <Suspense
              fallback={
                <div className="h-full w-full rounded-sm border border-neon/10 bg-panel/40 animate-pulse" aria-hidden="true" />
              }
            >
              <ArcReactorCore className="h-full" />
            </Suspense>
          </div>

          {/* AgentMatrix — right of arc reactor, wider space with 5-col grid */}
          <div className="agent-matrix-cell">
            <AgentMatrix className="h-full" />
          </div>

          {/* Tabbed Intel Panel (INTEL | NEWS | X FEED) — far right rail, spans 2 rows */}
          <div className="intel-feed-cell">
            <TabbedIntelPanel />
          </div>

          {/* TokenCostTracker — bottom-left */}
          <div className="token-tracker-cell">
            <TokenCostTracker className="h-full" />
          </div>

          {/* DAGWorkflowCanvas — center bottom */}
          <div className="dag-canvas-cell">
            <DAGWorkflowCanvas />
          </div>

          {/* DeliveriesBrowser — bottom-right (now visible, replaces media strip) */}
          <div className="deliveries-cell">
            <DeliveriesBrowser />
          </div>

          {/* ModelSpawner — bottom strip, takes more space with MediaDock freed */}
          <div className="model-spawner-cell">
            <ModelSpawner />
          </div>

          {/* AgentHealthPanel — inline */}
          <div className="agent-health-cell">
            <AgentHealthPanel />
          </div>
        </div>
      </motion.div>

    </>
  )
}
