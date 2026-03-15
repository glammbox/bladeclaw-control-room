import { useState } from 'react'
import IntelFeed from './IntelFeed'
import NewsFeed from './NewsFeed'
import RadioPlayer from './RadioPlayer'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type MediaTab = 'intel' | 'news' | 'x' | 'radio' | 'youtube'

const MEDIA_TABS: Array<{ id: MediaTab; label: string; color: string }> = [
  { id: 'intel',   label: 'INTEL',  color: '#00d4ff' },
  { id: 'news',    label: 'NEWS',   color: '#22c55e' },
  { id: 'x',       label: 'X',      color: '#e2e8f0' },
  { id: 'radio',   label: 'RADIO',  color: '#a78bfa' },
  { id: 'youtube', label: 'YT',     color: '#ef4444' },
]

// ─────────────────────────────────────────────
// X Feed — styled mock posts
// ─────────────────────────────────────────────

interface MockPost {
  id: number
  handle: string
  displayName: string
  avatar: string
  text: string
  time: string
  likes: number
  retweets: number
  verified: boolean
}

const MOCK_X_POSTS: MockPost[] = [
  {
    id: 1,
    handle: '@sama',
    displayName: 'Sam Altman',
    avatar: '🌟',
    text: 'The pace of AI progress is still accelerating. What we ship this year will look incremental compared to what comes after.',
    time: '4m',
    likes: 3842,
    retweets: 712,
    verified: true,
  },
  {
    id: 2,
    handle: '@karpathy',
    displayName: 'Andrej Karpathy',
    avatar: '🤖',
    text: 'Coding agents are getting genuinely good. Not just autocomplete — full edit loops, file creation, test runs. The developer experience is fundamentally changing.',
    time: '22m',
    likes: 6210,
    retweets: 1843,
    verified: true,
  },
  {
    id: 3,
    handle: '@elonmusk',
    displayName: 'Elon Musk',
    avatar: '🚀',
    text: 'Grok 4 is the most powerful AI I\'ve ever used. Real-time web search + deep reasoning = completely different category.',
    time: '1h',
    likes: 42100,
    retweets: 8930,
    verified: true,
  },
  {
    id: 4,
    handle: '@natfriedman',
    displayName: 'Nat Friedman',
    avatar: '⚡',
    text: 'The real unlock of AI coding agents isn\'t writing code faster — it\'s having infinite junior engineers who never get tired and never complain.',
    time: '3h',
    likes: 4821,
    retweets: 1204,
    verified: true,
  },
  {
    id: 5,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '🗡️',
    text: 'Control Room v6 just dropped. Vertical DAG, expandable chat, MediaHub, brain meters, real model pricing. Built in 2 hours by Director.',
    time: '5h',
    likes: 847,
    retweets: 203,
    verified: true,
  },
  {
    id: 6,
    handle: '@karpathy',
    displayName: 'Andrej Karpathy',
    avatar: '🤖',
    text: 'motion/react > framer-motion. The migration is trivial. The bundle savings are real. Just do it.',
    time: '8h',
    likes: 3120,
    retweets: 890,
    verified: true,
  },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function XFeedTab() {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-thin" style={{ maxHeight: '100%' }}>
      {MOCK_X_POSTS.map(post => (
        <div
          key={post.id}
          className="px-3 py-2.5 border border-white/5 rounded-sm hover:border-neon/20 transition-all duration-200 hover:bg-neon/3"
        >
          {/* Author row */}
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #00d4ff20, #00d4ff05)', border: '1px solid #00d4ff30' }}
            >
              {post.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-orbitron text-[10px] text-neon truncate">{post.displayName}</span>
                {post.verified && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#00d4ff" className="shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
              <span className="font-mono text-[9px] text-chrome-dark">{post.handle}</span>
            </div>
            <span className="font-mono text-[9px] text-chrome-dark/50 shrink-0">{post.time}</span>
          </div>

          {/* Post text */}
          <p className="font-mono text-[10px] text-chrome leading-relaxed mb-2">{post.text}</p>

          {/* Engagement */}
          <div className="flex items-center gap-4 text-[9px] font-mono text-chrome-dark/60">
            <span className="hover:text-green-400/60 transition-colors cursor-pointer">🔁 {formatCount(post.retweets)}</span>
            <span className="hover:text-red-400/60 transition-colors cursor-pointer">♥ {formatCount(post.likes)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// YouTube tab
// ─────────────────────────────────────────────

function YouTubeTab() {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex-1 rounded-sm overflow-hidden border border-red-500/15">
        <iframe
          src="https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alW3xmYiWRaoz0anC6xKaLi&autoplay=0"
          title="Lofi Beats"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            aspectRatio: '16/9',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
      <div className="text-[9px] font-mono text-chrome-dark/50 text-center">
        Lofi Beats — background focus playlist
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Radio tab
// ─────────────────────────────────────────────

function RadioTab() {
  return (
    <div className="flex flex-col gap-2 h-full">
      <RadioPlayer />
      <div className="text-[9px] font-mono text-chrome-dark/40 text-center px-2">
        Click a station to play · Volume slider controls audio level
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function MediaHub() {
  const [activeTab, setActiveTab] = useState<MediaTab>('intel')
  const tab = MEDIA_TABS.find(t => t.id === activeTab)!

  return (
    <div className="w-full h-full flex flex-col gap-1.5">
      {/* Tab bar — scrollable on mobile */}
      <div
        className="flex items-center gap-0.5 p-0.5 rounded-sm border border-neon/10 bg-void shrink-0"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {MEDIA_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="shrink-0 flex-1 px-1 py-1 rounded-sm text-[9px] font-orbitron tracking-wider transition-all duration-200 border"
            style={activeTab === t.id ? {
              minWidth: '40px',
              borderColor: t.color + '50',
              backgroundColor: t.color + '15',
              color: t.color,
              fontFamily: 'Rajdhani,sans-serif',
              fontWeight: 600,
              letterSpacing: '0.08em',
            } : {
              minWidth: '40px',
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              color: 'rgba(192,192,192,0.4)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 min-h-0 rounded-sm border p-2 overflow-hidden"
        style={{ borderColor: tab.color + '20', backgroundColor: tab.color + '04' }}
      >
        {activeTab === 'intel'   && <IntelFeed />}
        {activeTab === 'news'    && <NewsFeed />}
        {activeTab === 'x'       && <XFeedTab />}
        {activeTab === 'radio'   && <RadioTab />}
        {activeTab === 'youtube' && <YouTubeTab />}
      </div>
    </div>
  )
}
