import { useEffect, useRef, useState } from 'react'
import { Newspaper, RefreshCw } from 'lucide-react'

type NewsTab = 'fox' | 'aljazeera' | 'tech'

interface NewsItem {
  title: string
  pubDate: string
  link: string
  source: string
}

interface RssApiResponse {
  items?: Array<{
    title?: string
    pubDate?: string
    link?: string
  }>
  status?: string
}

const RSS_FEEDS: Record<NewsTab, { label: string; url: string; color: string; source: string }> = {
  fox: {
    label: 'FOX NEWS',
    url: 'https://feeds.foxnews.com/foxnews/latest',
    color: '#3b82f6',
    source: 'Fox News',
  },
  aljazeera: {
    label: 'AL JAZEERA',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    color: '#f97316',
    source: 'Al Jazeera',
  },
  tech: {
    label: 'TECH',
    url: 'https://techcrunch.com/feed/',
    color: '#22c55e',
    source: 'TechCrunch',
  },
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '—'
  }
}

async function fetchFeed(tab: NewsTab): Promise<NewsItem[]> {
  const feed = RSS_FEEDS[tab]
  const encoded = encodeURIComponent(feed.url)
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=5`

  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data: RssApiResponse = await res.json()
  if (!data.items) return []

  return data.items.map(item => ({
    title: item.title ?? 'No title',
    pubDate: item.pubDate ?? '',
    link: item.link ?? '#',
    source: feed.source,
  }))
}

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState<NewsTab>('fox')
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async (tab: NewsTab) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFeed(tab)
      setItems(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Feed unavailable — CORS or network error')
      // Fallback mock items
      setItems([
        { title: 'BladeClaw v5.3 ships real-time control room dashboard', pubDate: new Date().toISOString(), link: '#', source: RSS_FEEDS[tab].source },
        { title: 'AI agent pipelines achieve 97% CI scores in production', pubDate: new Date().toISOString(), link: '#', source: RSS_FEEDS[tab].source },
        { title: 'OpenClaw DAG framework beats traditional CI by 40%', pubDate: new Date().toISOString(), link: '#', source: RSS_FEEDS[tab].source },
        { title: 'TypeScript strict mode adoption rises among AI codegen tools', pubDate: new Date().toISOString(), link: '#', source: RSS_FEEDS[tab].source },
        { title: 'React 19 + motion/react: the 2026 animation stack', pubDate: new Date().toISOString(), link: '#', source: RSS_FEEDS[tab].source },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(activeTab)
  }, [activeTab])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      load(activeTab)
    }, 5 * 60 * 1000)
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current) }
  }, [activeTab])

  const feedColor = RSS_FEEDS[activeTab].color

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Newspaper size={11} style={{ color: feedColor }} />
          <span className="hud-label">News Feed</span>
        </div>
        <button
          onClick={() => load(activeTab)}
          disabled={loading}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-white/10
                     text-chrome-dark hover:text-neon hover:border-neon/30 transition-all"
          title="Refresh feed"
        >
          <RefreshCw size={9} className={loading ? 'animate-spin' : ''} />
          {lastRefresh && (
            <span className="font-mono text-[9px]">
              {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-0.5 rounded-sm border border-neon/10 bg-void shrink-0">
        {(Object.keys(RSS_FEEDS) as NewsTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1 rounded-sm text-[9px] font-orbitron tracking-wider
                        transition-all duration-200
                        ${activeTab === tab
                          ? 'border text-white'
                          : 'text-chrome-dark hover:text-chrome border border-transparent'
                        }`}
            style={activeTab === tab ? {
              borderColor: RSS_FEEDS[tab].color + '50',
              backgroundColor: RSS_FEEDS[tab].color + '12',
              color: RSS_FEEDS[tab].color,
            } : undefined}
          >
            {RSS_FEEDS[tab].label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-24 text-chrome-dark font-mono text-xs">
            <span className="animate-pulse">FETCHING FEED...</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-[10px] font-mono text-amber-400/60 px-2 py-1 border border-amber-400/20 rounded-sm">
            ⚠ {error}
          </div>
        )}

        {!loading && items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2.5 py-2 rounded-sm border border-white/5 hover:border-opacity-40
                       transition-all duration-200 hover:scale-[1.005] group"
            style={{ borderColor: feedColor + '20', backgroundColor: feedColor + '05' }}
          >
            {/* Source badge + time */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-orbitron text-[8px] tracking-wider px-1.5 py-0.5 rounded-sm border"
                style={{ color: feedColor, borderColor: feedColor + '40', backgroundColor: feedColor + '15' }}
              >
                {item.source.toUpperCase()}
              </span>
              <span className="font-mono text-[9px] text-chrome-dark/50">
                {formatDate(item.pubDate)}
              </span>
            </div>

            {/* Headline */}
            <p
              className="font-mono text-[10px] leading-snug line-clamp-2 transition-colors duration-200"
              style={{ color: feedColor + 'cc' }}
            >
              {item.title}
            </p>

            {/* Bottom accent line */}
            <div
              className="mt-1.5 h-px opacity-0 group-hover:opacity-40 transition-opacity"
              style={{ backgroundColor: feedColor }}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
