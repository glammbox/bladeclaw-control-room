import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'

interface ToggleProps {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neon/5">
      <div>
        <div className="text-sm text-chrome font-mono">{label}</div>
        {description && <div className="text-xs text-chrome-dark mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative w-10 h-5 rounded-full transition-all duration-300 border
          ${value ? 'bg-neon/20 border-neon/60' : 'bg-void border-chrome-dark/30'}
        `}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300
            ${value ? 'left-5 bg-neon' : 'left-0.5 bg-chrome-dark'}
          `}
          style={value ? { boxShadow: '0 0 6px #00d4ff' } : {}}
        />
      </button>
    </div>
  )
}

interface SliderProps {
  label: string
  description?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function Slider({ label, description, value, min, max, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="py-3 border-b border-neon/5">
      <div className="flex justify-between mb-2">
        <div>
          <div className="text-sm text-chrome font-mono">{label}</div>
          {description && <div className="text-xs text-chrome-dark mt-0.5">{description}</div>}
        </div>
        <span className="font-orbitron text-xs text-neon">{value}</span>
      </div>
      <div className="relative h-1 bg-panel-border rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-neon rounded-full transition-all"
          style={{ width: `${pct}%`, boxShadow: '0 0 6px #00d4ff' }}
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

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hud-panel p-5 flex flex-col">
      <div className="panel-corner panel-corner-tl" />
      <div className="panel-corner panel-corner-tr" />
      <div className="panel-corner panel-corner-bl" />
      <div className="panel-corner panel-corner-br" />
      <div className="hud-label mb-4">{title}</div>
      {children}
    </div>
  )
}

export default function Settings() {
  const location = useLocation()

  const [animQuality, setAnimQuality] = useState(2) // 1=low, 2=med, 3=high
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
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full w-full p-3 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {/* Page header */}
        <div className="flex items-center gap-3 py-2">
          <div className="w-1 h-6 bg-neon rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
          <h2 className="font-orbitron text-lg text-neon tracking-widest uppercase">System Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Display & Appearance */}
          <SettingsSection title="Display &amp; Appearance">
            <Slider
              label="Theme Intensity"
              description="Neon glow and visual intensity"
              value={themeIntensity}
              min={1}
              max={10}
              onChange={setThemeIntensity}
            />
            <Slider
              label="Animation Quality"
              description="1 = Performance  |  3 = Ultra"
              value={animQuality}
              min={1}
              max={3}
              onChange={setAnimQuality}
            />
            <Toggle
              label="Smooth Scroll"
              description="Lenis smooth scrolling on panels"
              value={smoothScroll}
              onChange={setSmoothScroll}
            />
            <Toggle
              label="Compact Mode"
              description="Reduce panel padding for dense view"
              value={compactMode}
              onChange={setCompactMode}
            />
          </SettingsSection>

          {/* Data & Refresh */}
          <SettingsSection title="Data &amp; Refresh">
            <Toggle
              label="Auto-Refresh"
              description="Polling updates for agent status"
              value={autoRefresh}
              onChange={setAutoRefresh}
            />
            <Slider
              label="Refresh Interval (s)"
              description="How often to poll for updates"
              value={refreshInterval}
              min={2}
              max={30}
              onChange={setRefreshInterval}
            />
            <Toggle
              label="Notifications"
              description="Alert banners for agent events"
              value={notifications}
              onChange={setNotifications}
            />
            <Toggle
              label="Sound FX"
              description="Subtle UI audio feedback"
              value={soundFx}
              onChange={setSoundFx}
            />
          </SettingsSection>

          {/* Panel Visibility */}
          <SettingsSection title="Panel Visibility">
            <Toggle
              label="Intel Feed"
              description="Right-rail live event stream"
              value={showIntelFeed}
              onChange={setShowIntelFeed}
            />
            <Toggle
              label="Media Dock"
              description="Music / YouTube entertainment panel"
              value={showMediaDock}
              onChange={setShowMediaDock}
            />
          </SettingsSection>

          {/* System Info */}
          <SettingsSection title="System Info">
            <div className="space-y-2 font-mono text-xs text-chrome-dark">
              {[
                ['Version', 'v1.0.0'],
                ['Build Mode', 'Production'],
                ['Runtime', 'BladeClaw DAG'],
                ['Agent Count', '10'],
                ['Stack', 'React 18 · Vite 5 · TailwindCSS 3'],
                ['3D Engine', 'Three.js · R3F · Drei'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-neon/5 pb-1.5">
                  <span className="text-chrome-dark">{k}</span>
                  <span className="text-chrome">{v}</span>
                </div>
              ))}
            </div>
          </SettingsSection>
        </div>
      </div>
    </motion.div>
  )
}
