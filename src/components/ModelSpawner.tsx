import { useState, useRef, useEffect } from 'react'
import { Send, Zap } from 'lucide-react'

interface ModelConfig {
  id: string
  name: string
  provider: string
  description: string
  color: string
  glow: string
  bgColor: string
  borderColor: string
  tag: string
}

const MODELS: ModelConfig[] = [
  {
    id: 'grok',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    description: 'Real-time internet access. Unfiltered reasoning. Fast iteration.',
    color: '#ffffff',
    glow: '0 0 12px rgba(255,255,255,0.3)',
    bgColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.15)',
    tag: 'REASONING',
  },
  {
    id: 'gpt',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    description: 'State-of-the-art instruction following. Production workhorse.',
    color: '#10b981',
    glow: '0 0 12px rgba(16,185,129,0.4)',
    bgColor: 'rgba(16,185,129,0.03)',
    borderColor: 'rgba(16,185,129,0.2)',
    tag: 'FLAGSHIP',
  },
  {
    id: 'claude',
    name: 'Claude 4',
    provider: 'Anthropic',
    description: 'Deep analysis, long context, nuanced writing. Builder\'s brain.',
    color: '#f97316',
    glow: '0 0 12px rgba(249,115,22,0.4)',
    bgColor: 'rgba(249,115,22,0.03)',
    borderColor: 'rgba(249,115,22,0.2)',
    tag: 'PRIMARY',
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5',
    provider: 'Google',
    description: 'Multimodal powerhouse. Images, code, and data at scale.',
    color: '#3b82f6',
    glow: '0 0 12px rgba(59,130,246,0.4)',
    bgColor: 'rgba(59,130,246,0.03)',
    borderColor: 'rgba(59,130,246,0.2)',
    tag: 'MULTIMODAL',
  },
]

type ChatMessage = { role: 'user' | 'assistant'; text: string; model?: string }

const MOCK_RESPONSES: Record<string, string[]> = {
  grok: [
    'Searching the live web... Found 847 relevant results. Here\'s my synthesis:',
    'Running real-time analysis. Signal confirmed — proceeding with response.',
    'Cross-referencing current data feeds. Output generated.',
  ],
  gpt: [
    'Understood. Processing your request with full context window optimization.',
    'Task decomposed into 3 sub-problems. Executing solution path...',
    'Instruction received. Generating production-ready output now.',
  ],
  claude: [
    'I\'ve carefully considered the nuances here. Let me walk through this step by step.',
    'That\'s an interesting framing. Here\'s a thorough analysis from multiple angles...',
    'Reading the full context... Deep reasoning engaged. Here\'s my structured response.',
  ],
  gemini: [
    'Multimodal analysis complete. Processing text and visual signals simultaneously.',
    'Scaling across 128K context. Generating comprehensive response...',
    'Gemini 2.5 activated — multimodal reasoning pipeline initialized.',
  ],
}

function getRandomResponse(modelId: string): string {
  const pool = MOCK_RESPONSES[modelId] ?? ['Processing your request...']
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function ModelSpawner() {
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null)
  const [spawning, setSpawning] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [responding, setResponding] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const handleLaunch = (model: ModelConfig) => {
    setSpawning(model.id)
    setTimeout(() => {
      setSpawning(null)
      setActiveModel(model)
      setChat([{
        role: 'assistant',
        text: `${model.name} online. ${model.provider} backend connected. Ready for input.`,
        model: model.name,
      }])
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 1200)
  }

  const handleSend = () => {
    if (!input.trim() || !activeModel || responding) return

    const userMsg = input.trim()
    setInput('')
    setChat(prev => [...prev, { role: 'user', text: userMsg }])
    setResponding(true)

    setTimeout(() => {
      const response = getRandomResponse(activeModel.id)
      setChat(prev => [...prev, {
        role: 'assistant',
        text: response + '\n\n' + generateMockDetail(userMsg),
        model: activeModel.name,
      }])
      setResponding(false)
    }, 800 + Math.random() * 1200)
  }

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="hud-label">Model Spawner</div>

      {!activeModel ? (
        /* Model grid */
        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto content-start">
          {MODELS.map(model => (
            <div
              key={model.id}
              className="relative rounded-sm border p-2 flex flex-col gap-1.5 transition-all duration-300
                         hover:scale-[1.01] cursor-default group"
              style={{
                backgroundColor: model.bgColor,
                borderColor: model.borderColor,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = model.glow
                ;(e.currentTarget as HTMLDivElement).style.borderColor = model.color
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = model.borderColor
              }}
            >
              {/* Provider + tag */}
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-[9px] tracking-widest" style={{ color: model.color, opacity: 0.7 }}>
                  {model.provider}
                </span>
                <span
                  className="text-[8px] font-orbitron tracking-wider px-1.5 py-0.5 rounded-sm border"
                  style={{ color: model.color, borderColor: model.color + '40', backgroundColor: model.color + '0d' }}
                >
                  {model.tag}
                </span>
              </div>

              {/* Model name */}
              <div className="font-orbitron text-xs" style={{ color: model.color, textShadow: model.glow }}>
                {model.name}
              </div>

              {/* Description */}
              <p className="text-[9px] font-mono text-chrome-dark leading-relaxed flex-1">
                {model.description}
              </p>

              {/* Launch button */}
              <button
                onClick={() => handleLaunch(model)}
                disabled={spawning === model.id}
                className="w-full py-1.5 rounded-sm border text-[10px] font-orbitron tracking-wider
                           transition-all duration-200 flex items-center justify-center gap-1.5"
                style={{
                  borderColor: model.borderColor,
                  color: model.color,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = model.color + '15'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = model.glow
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = model.color
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = model.borderColor
                }}
              >
                {spawning === model.id ? (
                  <>
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    SPAWNING...
                  </>
                ) : (
                  <>
                    <Zap size={9} />
                    LAUNCH
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Chat interface */
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Active model indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: activeModel.color, boxShadow: activeModel.glow }}
              />
              <span className="font-orbitron text-[10px] tracking-wider" style={{ color: activeModel.color }}>
                {activeModel.name}
              </span>
              <span className="text-[10px] font-mono text-chrome-dark">
                {activeModel.provider} — CONNECTED
              </span>
            </div>
            <button
              onClick={() => { setActiveModel(null); setChat([]) }}
              className="text-[10px] font-orbitron text-chrome-dark hover:text-red-400 transition-colors"
            >
              ✕ CLOSE
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-0">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-sm text-[11px] font-mono leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neon/10 border border-neon/20 text-chrome'
                      : 'bg-white/3 border text-chrome-dark'
                  }`}
                  style={msg.role === 'assistant' ? {
                    borderColor: activeModel.borderColor,
                    color: '#9ca3af',
                  } : undefined}
                >
                  {msg.role === 'assistant' && (
                    <div className="text-[9px] font-orbitron tracking-wider mb-1" style={{ color: activeModel.color }}>
                      {msg.model}
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              </div>
            ))}

            {responding && (
              <div className="flex gap-2 justify-start">
                <div className="px-3 py-2 rounded-sm border bg-white/3 text-[11px] font-mono"
                     style={{ borderColor: activeModel.borderColor }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms', color: activeModel.color }} />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms', color: activeModel.color }} />
                    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms', color: activeModel.color }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeModel.name}...`}
              disabled={responding}
              className="flex-1 bg-void border border-neon/15 rounded-sm px-3 py-1.5 text-xs text-chrome font-mono
                         focus:outline-none focus:border-neon/40 transition-all placeholder:text-chrome-dark/40
                         disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || responding}
              className="px-3 py-1.5 rounded-sm border border-neon/30 text-neon hover:bg-neon/10
                         hover:border-neon disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200"
              style={{ boxShadow: input.trim() ? '0 0 8px rgba(0,212,255,0.15)' : undefined }}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function generateMockDetail(prompt: string): string {
  const words = prompt.split(' ').length
  const lines = [
    `→ Context tokens: ${words * 4 + Math.floor(Math.random() * 200)}`,
    `→ Response time: ${(Math.random() * 0.8 + 0.3).toFixed(2)}s`,
    `→ Model confidence: ${85 + Math.floor(Math.random() * 14)}%`,
  ]
  return lines.join('\n')
}
