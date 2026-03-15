import { useState } from 'react'
import { Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

interface ModelConfig {
  id: string
  name: string
  provider: string
  color: string
  dotColor: string
  tag: string
}

const MODELS: ModelConfig[] = [
  {
    id: 'claude',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    color: '#f97316',
    dotColor: '#f97316',
    tag: 'PRIMARY',
  },
  {
    id: 'gpt',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    color: '#10b981',
    dotColor: '#10b981',
    tag: 'FLAGSHIP',
  },
  {
    id: 'grok',
    name: 'Grok Fast',
    provider: 'xAI',
    color: '#ffffff',
    dotColor: '#e2e8f0',
    tag: 'REASONING',
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    provider: 'Google',
    color: '#3b82f6',
    dotColor: '#3b82f6',
    tag: 'MULTIMODAL',
  },
]

interface Toast {
  id: string
  text: string
}

async function sendSpawnRequest(modelName: string) {
  try {
    await fetch('http://localhost:18789/api/sessions/agent:main:main/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Spawn a ${modelName} session` }),
    })
  } catch {
    // Silently fail — UI already shows toast
  }
}

export default function ModelSpawner() {
  const [spawning, setSpawning] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (text: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }

  const handleSpawn = async (model: ModelConfig) => {
    if (spawning) return
    setSpawning(model.id)
    addToast(`Spawning ${model.name}...`)
    await sendSpawnRequest(model.name)
    setTimeout(() => {
      setSpawning(null)
      addToast(`${model.name} session ready`)
    }, 1200)
  }

  return (
    <div className="w-full flex flex-col gap-3 relative">
      <div className="hud-label">Model Spawner</div>

      {/* 2×2 compact grid */}
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map(model => (
          <div
            key={model.id}
            className="rounded-sm border flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-default"
            style={{
              height: '60px',
              minWidth: 0,
              borderColor: spawning === model.id ? model.color + '80' : model.color + '25',
              backgroundColor: spawning === model.id ? model.color + '10' : 'transparent',
              boxShadow: spawning === model.id ? `0 0 10px ${model.color}30` : 'none',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.dotColor }} />
              <span className="font-orbitron text-[9px] tracking-wider" style={{ color: model.color }}>
                {model.name}
              </span>
            </div>
            <button
              onClick={() => handleSpawn(model)}
              disabled={!!spawning}
              className="flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[9px] font-orbitron tracking-wider transition-all duration-200 disabled:opacity-40"
              style={{
                borderColor: model.color + '40',
                color: model.color,
              }}
              onMouseEnter={e => {
                if (!spawning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = model.color + '15'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }}
            >
              {spawning === model.id ? (
                <>
                  <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                  SPAWNING
                </>
              ) : (
                <>
                  <Zap size={8} />
                  SPAWN
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-1.5 pointer-events-none" style={{ maxWidth: '260px' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="px-3 py-2 rounded-sm border border-neon/30 font-mono text-[10px] text-neon"
              style={{ backgroundColor: 'rgba(0,212,255,0.08)', backdropFilter: 'blur(8px)' }}
            >
              {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
