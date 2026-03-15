import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface ToggleProps {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neon/5">
      <div>
        <div className="text-xs text-chrome font-mono">{label}</div>
        {description && <div className="text-[10px] text-chrome-dark mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-9 h-4 rounded-full transition-all duration-300 border shrink-0
          ${value ? 'bg-neon/20 border-neon/60' : 'bg-void border-chrome-dark/30'}
        `}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`
            absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300
            ${value ? 'left-[22px] bg-neon' : 'left-0.5 bg-chrome-dark'}
          `}
          style={value ? { boxShadow: '0 0 5px #00d4ff' } : {}}
        />
      </button>
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="py-2 border-b border-neon/5">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-chrome font-mono">{label}</span>
        <span className="font-orbitron text-[10px] text-neon">{value}</span>
      </div>
      <div className="relative h-1 bg-panel-border rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-neon rounded-full transition-all"
          style={{ width: `${pct}%`, boxShadow: '0 0 4px #00d4ff' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [animQuality, setAnimQuality] = useState(2)
  const [themeIntensity, setThemeIntensity] = useState(7)
  const [smoothScroll, setSmoothScroll] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [soundFx, setSoundFx] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [showIntelFeed, setShowIntelFeed] = useState(true)
  const [showMediaDock, setShowMediaDock] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-panel border-l border-neon/20 flex flex-col overflow-hidden"
            style={{ boxShadow: '-4px 0 24px rgba(0,212,255,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neon/10">
              <Settings size={14} className="text-neon" />
              <span className="font-orbitron text-xs text-neon tracking-widest uppercase">Settings</span>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="text-chrome-dark hover:text-chrome transition-colors p-1 rounded"
                aria-label="Close settings"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {/* Display */}
              <div>
                <div className="hud-label mb-2">Display</div>
                <Slider label="Theme Intensity" value={themeIntensity} min={1} max={10} onChange={setThemeIntensity} />
                <Slider label="Animation Quality" value={animQuality} min={1} max={3} onChange={setAnimQuality} />
                <Toggle label="Smooth Scroll" description="Lenis on panels" value={smoothScroll} onChange={setSmoothScroll} />
                <Toggle label="Compact Mode" description="Dense panel view" value={compactMode} onChange={setCompactMode} />
              </div>

              {/* Data */}
              <div>
                <div className="hud-label mb-2">Data</div>
                <Toggle label="Auto-Refresh" description="Poll for agent updates" value={autoRefresh} onChange={setAutoRefresh} />
                <Slider label="Refresh Interval (s)" value={refreshInterval} min={2} max={30} onChange={setRefreshInterval} />
                <Toggle label="Notifications" description="Alert banners" value={notifications} onChange={setNotifications} />
                <Toggle label="Sound FX" value={soundFx} onChange={setSoundFx} />
              </div>

              {/* Panels */}
              <div>
                <div className="hud-label mb-2">Panels</div>
                <Toggle label="Intel Feed" description="Right-rail event stream" value={showIntelFeed} onChange={setShowIntelFeed} />
                <Toggle label="Media Dock" description="Music / YouTube dock" value={showMediaDock} onChange={setShowMediaDock} />
              </div>

              {/* System Info */}
              <div>
                <div className="hud-label mb-2">System Info</div>
                <div className="space-y-1.5 font-mono text-[10px] text-chrome-dark">
                  {([
                    ['Version', 'v1.0.0'],
                    ['Build', 'Production'],
                    ['Runtime', 'BladeClaw DAG'],
                    ['Agents', '10'],
                    ['Stack', 'React · Vite · Tailwind'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-neon/5 pb-1">
                      <span>{k}</span>
                      <span className="text-chrome">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
