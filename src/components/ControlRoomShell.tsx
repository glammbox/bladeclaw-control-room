import { type ReactNode, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LayoutDashboard, Settings, Zap, Activity } from 'lucide-react'

interface ControlRoomShellProps {
  children: ReactNode
}

function ScanLine() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-30"
      aria-hidden="true"
    >
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent"
        initial={{ top: '-1px' }}
        animate={{ top: '100vh' }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
      />
    </div>
  )
}

function HUDCorners() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-neon/60" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-neon/60" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-neon/60" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-neon/60" />

      {/* Edge tick marks */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-0.5 bg-gradient-to-b from-transparent via-neon/40 to-transparent" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-24 w-0.5 bg-gradient-to-b from-transparent via-neon/40 to-transparent" />
    </div>
  )
}

function StatusBar() {
  const now = new Date()
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-b border-neon/10 bg-void/80 backdrop-blur-sm">
      {/* System ident */}
      <div className="flex items-center gap-2">
        <img
          src="/images/bladeclaw-icon.png"
          alt="BladeClaw"
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
        <span className="font-orbitron text-xs text-neon tracking-[0.3em] uppercase">
          BladeClaw
        </span>
        <span className="text-chrome-dark text-xs">Control Room</span>
      </div>

      <div className="flex-1" />

      {/* Live indicators */}
      <div className="flex items-center gap-4 text-xs text-chrome-dark font-mono">
        <div className="flex items-center gap-1.5">
          <span className="status-dot status-dot-ok animate-pulse" />
          <span className="text-status-ok font-orbitron tracking-widest">NOMINAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={10} className="text-neon" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={10} className="text-neon" />
          <span className="text-neon">LIVE</span>
        </div>
      </div>
    </div>
  )
}

function SideNav() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="w-14 flex flex-col items-center py-4 gap-2 border-r border-neon/10 bg-void/50 backdrop-blur-sm shrink-0">
      {navItems.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path
        return (
          <Link
            key={path}
            to={path}
            title={label}
            className={`
              w-10 h-10 flex items-center justify-center rounded-sm transition-all duration-200
              ${active
                ? 'bg-neon/10 text-neon border border-neon/40 shadow-neon-sm'
                : 'text-chrome-dark hover:text-chrome hover:bg-white/5 border border-transparent'
              }
            `}
          >
            <Icon size={16} />
          </Link>
        )
      })}

      <div className="flex-1" />

      {/* Energy indicator */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <div className="w-0.5 h-8 bg-gradient-to-b from-neon/60 to-transparent rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" style={{ boxShadow: '0 0 6px #00d4ff' }} />
      </div>
    </nav>
  )
}

export default function ControlRoomShell({ children }: ControlRoomShellProps) {
  const shellRef = useRef<HTMLDivElement>(null)

  // Allow natural page scroll — no overflow lock
  useEffect(() => {
    document.body.style.overflowX = 'hidden'
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflowX = ''
      document.body.style.overflowY = ''
    }
  }, [])

  return (
    <div
      ref={shellRef}
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#050505',
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        overflowX: 'hidden',
      }}
    >
      {/* HUD overlay image */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-5"
        style={{
          backgroundImage: 'url(/images/hud-overlay.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-10 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, #00d4ff18 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <ScanLine />
      <HUDCorners />

      {/* Status bar — sticky at top */}
      <div className="sticky top-0 z-40">
        <StatusBar />
      </div>

      {/* Main layout — natural height, scrolls with page */}
      <div className="flex flex-1 relative z-20" style={{ minHeight: 0 }}>
        {/* Side nav — sticky so it stays visible while scrolling */}
        <div className="sticky top-[var(--statusbar-h,40px)] self-start h-[calc(100vh-var(--statusbar-h,40px))]">
          <SideNav />
        </div>

        {/* Page content — grows naturally */}
        <main className="flex-1 relative" style={{ minWidth: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      {/* Bottom status rail */}
      <div className="h-6 flex items-center px-4 gap-4 border-t border-neon/10 bg-void/80 backdrop-blur-sm shrink-0">
        <span className="font-orbitron text-[10px] text-neon/40 tracking-[0.4em]">
          BLADECLAW CONTROL ROOM v1.0
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-chrome-dark">
          AUTONOMOUS BUILD OPERATIONS — LIVE
        </span>
      </div>
    </div>
  )
}
