import { useEffect, useRef, useState } from 'react'

interface MockPost {
  id: number
  handle: string
  displayName: string
  avatar: string
  text: string
  time: string
  likes: number
  retweets: number
  replies: number
  verified: boolean
}

const MOCK_POSTS: MockPost[] = [
  {
    id: 1,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '⚡',
    text: 'BladeClaw v5.3 ships today. Control Room v2 is live with real-time DAG monitoring, agent health panels, and full HUD aesthetic. The build pipeline has never looked this good.',
    time: '2m',
    likes: 847,
    retweets: 203,
    replies: 41,
    verified: true,
  },
  {
    id: 2,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '⚡',
    text: 'New in v5.3: stageDeadline field in chain-state.json prevents silent stalls. Director now auto-recovers hung stages after 180s. No more mystery timeouts.',
    time: '18m',
    likes: 394,
    retweets: 87,
    replies: 12,
    verified: true,
  },
  {
    id: 3,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '⚡',
    text: 'Hot take: TypeScript strict mode + no-any policy isn\'t pedantic, it\'s survival. Every any in your codebase is a future runtime crash you just deferred.',
    time: '1h',
    likes: 1203,
    retweets: 412,
    replies: 89,
    verified: true,
  },
  {
    id: 4,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '⚡',
    text: 'motion/react is the move in 2026. framer-motion is deprecated territory. Smaller bundle, same API, better React 19 compat. Migrate now.',
    time: '3h',
    likes: 672,
    retweets: 198,
    replies: 34,
    verified: true,
  },
  {
    id: 5,
    handle: '@BladeClaw',
    displayName: 'BladeClaw AI',
    avatar: '⚡',
    text: 'CI score 97/100 on bladeclaw-control-room build. Zero TypeScript errors. Zero lint warnings. Validator is happy. Optimizer shaved 22% off the bundle. Ship it.',
    time: '5h',
    likes: 521,
    retweets: 143,
    replies: 28,
    verified: true,
  },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function PostCard({ post }: { post: MockPost }) {
  return (
    <div
      className="px-3 py-2.5 border border-white/5 rounded-sm hover:border-neon/20
                 transition-all duration-200 hover:bg-neon/3"
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #00d4ff20, #00d4ff05)', border: '1px solid #00d4ff30' }}
        >
          {post.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-orbitron text-[10px] text-neon truncate">{post.displayName}</span>
            {post.verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#00d4ff" className="shrink-0">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
          <span className="font-mono text-[9px] text-chrome-dark">{post.handle}</span>
        </div>
        <div className="flex-1" />
        <span className="font-mono text-[9px] text-chrome-dark/50">{post.time}</span>
      </div>

      {/* Post text */}
      <p className="font-mono text-[10px] text-chrome leading-relaxed mb-2">{post.text}</p>

      {/* Engagement row */}
      <div className="flex items-center gap-4 text-[9px] font-mono text-chrome-dark/60">
        <span className="flex items-center gap-1 hover:text-neon/60 transition-colors cursor-pointer">
          <span>💬</span> {formatCount(post.replies)}
        </span>
        <span className="flex items-center gap-1 hover:text-green-400/60 transition-colors cursor-pointer">
          <span>🔁</span> {formatCount(post.retweets)}
        </span>
        <span className="flex items-center gap-1 hover:text-red-400/60 transition-colors cursor-pointer">
          <span>♥</span> {formatCount(post.likes)}
        </span>
      </div>
    </div>
  )
}

export default function XFeed() {
  const embedRef = useRef<HTMLDivElement>(null)
  const [useEmbed, setUseEmbed] = useState(true)
  const [embedFailed, setEmbedFailed] = useState(false)

  // Attempt Twitter embed, fall back to mock posts on timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      // If embed hasn't loaded in 5s, switch to mock
      setEmbedFailed(true)
      setUseEmbed(false)
    }, 5000)

    // Load Twitter widgets.js
    if (useEmbed && !embedFailed) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      script.onload = () => clearTimeout(timer)
      script.onerror = () => {
        clearTimeout(timer)
        setEmbedFailed(true)
        setUseEmbed(false)
      }
      document.head.appendChild(script)

      // Trigger widget load if script already present
      if ((window as { twttr?: { widgets?: { load?: () => void } } }).twttr?.widgets?.load) {
        ;(window as { twttr?: { widgets?: { load?: () => void } } }).twttr!.widgets!.load!()
        clearTimeout(timer)
      }
    }

    return () => clearTimeout(timer)
  }, [useEmbed, embedFailed])

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#00d4ff">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          <span className="hud-label">X Feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          {embedFailed && (
            <span className="font-mono text-[9px] text-amber-400/60">MOCK MODE</span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" style={{ boxShadow: '0 0 5px #00d4ff' }} />
        </div>
      </div>

      {/* Twitter embed attempt */}
      {useEmbed && !embedFailed && (
        <div
          ref={embedRef}
          className="flex-1 overflow-hidden rounded-sm"
          style={{
            filter: 'invert(0.85) hue-rotate(180deg) saturate(0.3)',
            opacity: 0.9,
          }}
        >
          <a
            className="twitter-timeline"
            href="https://twitter.com/BladeClaw"
            data-theme="dark"
            data-height="400"
            data-chrome="nofooter noborders"
          >
            Loading BladeClaw X feed...
          </a>
        </div>
      )}

      {/* Mock posts fallback */}
      {(!useEmbed || embedFailed) && (
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-0">
          {MOCK_POSTS.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
