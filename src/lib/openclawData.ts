// openclawData.ts — Mirrors real OpenClaw agent structure (BladeClaw v5.3)
// Populated with realistic data matching actual agent DAG lifecycle

export type AgentLifecycleStatus = 'idle' | 'queued' | 'active' | 'complete' | 'error' | 'learning'

export interface OpenClawAgent {
  id: string
  name: string
  emoji: string
  description: string
  status: AgentLifecycleStatus
  tokenCount: number
  memoryLines: number
  lessonCount: number
  ruleCount: number
  runCount: number
  lastRunDate: string
  lastAction: string
  memorySize: number // bytes
  evolutionScore: number
  lessons: string[]
  sparklineData: number[] // historical evolution scores (last 7 days)
}

export interface ChainState {
  sessionId: string
  buildPath: string
  activeStage: string | null
  completedStages: string[]
  pendingStages: string[]
  ciScore: number
  startedAt: string
  stageDeadline: string | null
  errorCount: number
  totalTokens: number
  buildPasses: boolean | null
}

function computeEvolution(lessons: number, rules: number, runs: number): number {
  return lessons * 10 + rules * 5 + runs * 2
}

// Real agent names matching BladeClaw v5.3 roster
export const BLADECLAW_AGENTS: OpenClawAgent[] = [
  {
    id: 'director',
    name: 'Director',
    emoji: '🎯',
    description: 'Orchestrates DAG. Assigns missions. Owns chain-state.',
    status: 'active',
    tokenCount: 42380,
    memoryLines: 187,
    lessonCount: 12,
    ruleCount: 8,
    runCount: 94,
    lastRunDate: '2026-03-14',
    lastAction: 'Dispatching batch to Builder — session bc-20260314',
    memorySize: 9872,
    evolutionScore: computeEvolution(12, 8, 94),
    lessons: [
      '[LESSON] 2026-03-13: Stall detection requires stageDeadline in chain-state.json',
      '[LESSON] 2026-03-10: Agent handoff must ACK before marking stage complete',
      '[LESSON] 2026-03-08: GPT-5.4 fallback activates when Sonnet hits rate limit',
    ],
    sparklineData: [180, 220, 240, 260, 290, 310, 348],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    emoji: '⚡',
    description: 'Viability gate. Scores every prompt. Blocks bad runs.',
    status: 'complete',
    tokenCount: 18920,
    memoryLines: 94,
    lessonCount: 7,
    ruleCount: 5,
    runCount: 112,
    lastRunDate: '2026-03-14',
    lastAction: 'Gate check passed — viability score 94/100',
    memorySize: 4320,
    evolutionScore: computeEvolution(7, 5, 112),
    lessons: [
      '[LESSON] 2026-03-12: Score < 60 must hard-block pipeline, not warn',
      '[LESSON] 2026-03-09: Vague prompts score low but can recover with clarification',
      '[LESSON] 2026-03-05: Threshold calibration — nominal range 70–100',
    ],
    sparklineData: [120, 150, 165, 179, 190, 204, 319],
  },
  {
    id: 'planner',
    name: 'Planner',
    emoji: '🏗️',
    description: 'Blueprint drafting. Site architecture. File manifest generation.',
    status: 'complete',
    tokenCount: 31450,
    memoryLines: 142,
    lessonCount: 9,
    ruleCount: 6,
    runCount: 87,
    lastRunDate: '2026-03-14',
    lastAction: 'Blueprint ready — 12 sections, 3 pages, 48 components',
    memorySize: 7230,
    evolutionScore: computeEvolution(9, 6, 87),
    lessons: [
      '[LESSON] 2026-03-11: Blueprint must include SoulAgentPanel spec or Builder skips it',
      '[LESSON] 2026-03-07: 3-batch pattern reduces Builder timeout failures by 80%',
      '[LESSON] 2026-03-04: Component dependency graph must be acyclic',
    ],
    sparklineData: [200, 225, 239, 258, 270, 280, 294],
  },
  {
    id: 'research',
    name: 'Research',
    emoji: '🔍',
    description: 'Trend analysis. Stack intelligence. Competitor benchmarking.',
    status: 'active',
    tokenCount: 28740,
    memoryLines: 118,
    lessonCount: 8,
    ruleCount: 4,
    runCount: 71,
    lastRunDate: '2026-03-14',
    lastAction: 'Indexing 2026 React patterns — 847 sources scanned',
    memorySize: 6140,
    evolutionScore: computeEvolution(8, 4, 71),
    lessons: [
      '[LESSON] 2026-03-10: motion/react outperforms framer-motion — all builds migrate',
      '[LESSON] 2026-03-06: R3F needs --legacy-peer-deps with React 19',
      '[LESSON] 2026-03-01: GSAP ScrollTrigger > CSS for complex sequences',
    ],
    sparklineData: [140, 162, 178, 196, 210, 228, 242],
  },
  {
    id: 'market',
    name: 'Market',
    emoji: '📊',
    description: 'Intel analysis. ICP targeting. Market positioning docs.',
    status: 'queued',
    tokenCount: 14280,
    memoryLines: 76,
    lessonCount: 5,
    ruleCount: 3,
    runCount: 58,
    lastRunDate: '2026-03-13',
    lastAction: 'Waiting for Research output — queue position 1',
    memorySize: 3840,
    evolutionScore: computeEvolution(5, 3, 58),
    lessons: [
      '[LESSON] 2026-03-09: ICP signals must include both demographics and psychographics',
      '[LESSON] 2026-03-05: Positioning doc locked before Content starts — avoid rewrites',
      '[LESSON] 2026-02-28: Automotive niche needs competitor pricing data',
    ],
    sparklineData: [80, 96, 110, 124, 136, 148, 181],
  },
  {
    id: 'content',
    name: 'Content',
    emoji: '✍️',
    description: 'Copy generation. Voice calibration. CTA writing.',
    status: 'idle',
    tokenCount: 22190,
    memoryLines: 103,
    lessonCount: 7,
    ruleCount: 5,
    runCount: 79,
    lastRunDate: '2026-03-13',
    lastAction: 'Standing by — awaiting Market + Research outputs',
    memorySize: 5210,
    evolutionScore: computeEvolution(7, 5, 79),
    lessons: [
      '[LESSON] 2026-03-11: Hero headline < 8 words converts 23% better',
      '[LESSON] 2026-03-08: Tone calibration requires reading client SOUL.md first',
      '[LESSON] 2026-03-03: CTAs must include urgency + specificity to perform',
    ],
    sparklineData: [160, 176, 193, 208, 223, 234, 248],
  },
  {
    id: 'media',
    name: 'Media',
    emoji: '🎨',
    description: 'Visual generation. DALL-E prompting. Asset pipeline.',
    status: 'idle',
    tokenCount: 19870,
    memoryLines: 89,
    lessonCount: 6,
    ruleCount: 4,
    runCount: 64,
    lastRunDate: '2026-03-13',
    lastAction: 'Manifest generator on standby — 0 assets queued',
    memorySize: 4590,
    evolutionScore: computeEvolution(6, 4, 64),
    lessons: [
      '[LESSON] 2026-03-10: Always verify public/ before Builder starts — blocks silently',
      '[LESSON] 2026-03-06: Retina 2x assets require exact @2x naming convention',
      '[LESSON] 2026-03-02: WebP first, JPEG fallback — 35% smaller average',
    ],
    sparklineData: [100, 118, 134, 148, 162, 174, 188],
  },
  {
    id: 'builder',
    name: 'Builder',
    emoji: '🔧',
    description: 'UI assembly. Component rendering. TypeScript strict mode.',
    status: 'active',
    tokenCount: 58940,
    memoryLines: 187,
    lessonCount: 14,
    ruleCount: 9,
    runCount: 94,
    lastRunDate: '2026-03-14',
    lastAction: 'Writing batch 2 — 6 components, tsc --noEmit running',
    memorySize: 9920,
    evolutionScore: computeEvolution(14, 9, 94),
    lessons: [
      '[LESSON] 2026-03-14: Max 7 files per batch or timeout at 87s',
      '[LESSON] 2026-03-13: Sonnet is NEVER fallback — GPT-5.4 is universal fallback',
      '[LESSON] 2026-03-10: framer-motion → motion/react for all new builds',
    ],
    sparklineData: [280, 310, 336, 358, 380, 402, 428],
  },
  {
    id: 'validator',
    name: 'Validator',
    emoji: '✅',
    description: 'QA enforcement. TypeScript CI. Output integrity scoring.',
    status: 'idle',
    tokenCount: 12840,
    memoryLines: 68,
    lessonCount: 5,
    ruleCount: 7,
    runCount: 86,
    lastRunDate: '2026-03-13',
    lastAction: 'Awaiting Builder handoff — CI pipeline queued',
    memorySize: 3480,
    evolutionScore: computeEvolution(5, 7, 86),
    lessons: [
      '[LESSON] 2026-03-12: TypeScript strict mode failures block at CI — catch early',
      '[LESSON] 2026-03-08: CI score < 80 triggers Builder retry automatically',
      '[LESSON] 2026-03-04: Lint errors counted separately from type errors',
    ],
    sparklineData: [120, 140, 155, 167, 180, 192, 307],
  },
  {
    id: 'optimizer',
    name: 'Optimizer',
    emoji: '⚙️',
    description: 'Performance tuning. Bundle analysis. DX polish.',
    status: 'idle',
    tokenCount: 10230,
    memoryLines: 58,
    lessonCount: 4,
    ruleCount: 5,
    runCount: 72,
    lastRunDate: '2026-03-12',
    lastAction: 'Lazy-load patches standing by for next bundle',
    memorySize: 2940,
    evolutionScore: computeEvolution(4, 5, 72),
    lessons: [
      '[LESSON] 2026-03-11: Tree-shaking on motion/react saves avg 22KB',
      '[LESSON] 2026-03-07: Dynamic import + Suspense pattern required for 3D components',
      '[LESSON] 2026-03-01: Lighthouse Perf > 90 = green light from Validator',
    ],
    sparklineData: [80, 96, 108, 122, 136, 148, 219],
  },
]

// Simulated chain-state.json structure matching real BladeClaw v5.3
export const SIMULATED_CHAIN_STATE: ChainState = {
  sessionId: 'bc-20260314-controlroom-v2',
  buildPath: '/home/austi/.openclaw/workspace/agents/builder/build/bladeclaw-control-room',
  activeStage: 'builder',
  completedStages: ['pulse', 'planner', 'research'],
  pendingStages: ['market', 'content', 'media', 'validator', 'optimizer', 'package'],
  ciScore: 0,
  startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  stageDeadline: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  errorCount: 0,
  totalTokens: 259850,
  buildPasses: null,
}

// Window-injected real data interface (populated by OpenClaw host if available)
declare global {
  interface Window {
    BLADECLAW_DATA?: {
      agents?: Partial<OpenClawAgent>[]
      chainState?: Partial<ChainState>
    }
  }
}

/** Merge window.BLADECLAW_DATA into static mock data if available */
export function getMergedAgents(): OpenClawAgent[] {
  const injected = window.BLADECLAW_DATA?.agents
  if (!injected || injected.length === 0) return BLADECLAW_AGENTS

  return BLADECLAW_AGENTS.map(agent => {
    const override = injected.find(a => a.id === agent.id)
    return override ? { ...agent, ...override } : agent
  })
}

export function getMergedChainState(): ChainState {
  const override = window.BLADECLAW_DATA?.chainState
  return override ? { ...SIMULATED_CHAIN_STATE, ...override } : SIMULATED_CHAIN_STATE
}
