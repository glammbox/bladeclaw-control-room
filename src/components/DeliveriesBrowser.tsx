import { useEffect, useState } from 'react'
import { Download, Search, CheckCircle, Clock, AlertCircle, XCircle, X, ExternalLink, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const PROJECT_URLS: Record<string, string> = {
  "Dave's Harley Shop": 'https://daves-harley-shop.vercel.app',
  'daves-harley-shop': 'https://daves-harley-shop.vercel.app',
  'bark-noir-v3': 'https://bark-noir-v3.vercel.app',
  'bark-noir-v2': 'https://bark-noir-v2.vercel.app',
  'bladeclaw-control-room': 'https://bladeclaw-control-room.vercel.app',
}

type DeliveryStatus = 'shipped' | 'building' | 'review' | 'failed'

interface Delivery {
  id: string
  project: string
  ciScore: number
  date: string
  status: DeliveryStatus
  size: string
  buildTime: string
  colorScheme: string[]
  url?: string | null
}

// Key files per project (hardcoded for mock builds)
const PROJECT_FILES: Record<string, string[]> = {
  'd1':  ['src/components/BikeCard.tsx', 'src/pages/Inventory.tsx', 'src/hooks/useInventory.ts', 'public/images/hd-fat-boy.jpg', 'src/i18n/en.ts'],
  'd2':  ['src/components/DogCard.tsx', 'src/pages/Gallery.tsx', 'src/hooks/useGallery.ts', 'public/images/noir-hero.jpg'],
  'd3':  ['src/components/StudioHero.tsx', 'src/pages/Dojo.tsx', 'src/components/ArcCanvas.tsx', 'public/images/sensei.jpg'],
  'd4':  ['src/components/ListingCard.tsx', 'src/pages/Properties.tsx', 'src/hooks/useListings.ts', 'public/images/valley-hero.jpg'],
  'd5':  ['src/components/PriceChart.tsx', 'src/pages/Dashboard.tsx', 'src/hooks/usePriceFeed.ts'],
  'd6':  ['src/components/VinylCard.tsx', 'src/pages/Shop.tsx', 'src/hooks/useCart.ts', 'public/images/vinyl-hero.jpg'],
  'd7':  ['src/pages/Dashboard.tsx', 'src/components/AgentMatrix.tsx', 'src/components/MediaDock.tsx'],
  'd8':  ['src/components/GarageCard.tsx', 'src/pages/Speed.tsx', 'public/images/phantom-v8.jpg'],
  'd9':  ['src/pages/Home.tsx', 'src/components/ConsultingHero.tsx'],
  'd10': ['src/components/ArtistCard.tsx', 'src/pages/Collective.tsx', 'public/images/tattoo-flash.jpg'],
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const configs: Record<DeliveryStatus, { label: string; icon: LucideIcon; badgeStyle: React.CSSProperties }> = {
    shipped:  { label: 'SHIPPED',  icon: CheckCircle,  badgeStyle: {background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',color:'#22c55e',fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.08em',fontSize:'9px',padding:'2px 6px',borderRadius:'3px'} },
    building: { label: 'BUILDING', icon: Clock,        badgeStyle: {background:'rgba(0,212,255,0.1)',border:'1px solid rgba(0,212,255,0.3)',color:'#00d4ff',fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.08em',fontSize:'9px',padding:'2px 6px',borderRadius:'3px'} },
    review:   { label: 'REVIEW',   icon: AlertCircle,  badgeStyle: {background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',color:'#f59e0b',fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.08em',fontSize:'9px',padding:'2px 6px',borderRadius:'3px'} },
    failed:   { label: 'FAILED',   icon: XCircle,      badgeStyle: {background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.08em',fontSize:'9px',padding:'2px 6px',borderRadius:'3px'} },
  }
  const { label, icon: Icon, badgeStyle } = configs[status]

  return (
    <span style={{...badgeStyle, display:'inline-flex', alignItems:'center', gap:'3px'}}>
      <Icon size={9} />
      {label}
    </span>
  )
}

function CIScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : score > 0 ? '#ef4444' : '#374151'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-void rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color, boxShadow: score > 0 ? `0 0 4px ${color}` : undefined }}
        />
      </div>
      <span className="font-mono text-xs" style={{ color: score > 0 ? color : '#374151' }}>
        {score > 0 ? score : '—'}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Drawer: Delivery detail slide-over
// ─────────────────────────────────────────────

interface DrawerProps {
  delivery: Delivery | null
  onClose: () => void
}

function DeliveryDrawer({ delivery, onClose }: DrawerProps) {
  const ciColor = delivery
    ? delivery.ciScore >= 90 ? '#22c55e' : delivery.ciScore >= 70 ? '#f59e0b' : delivery.ciScore > 0 ? '#ef4444' : '#374151'
    : '#374151'

  const handleDownload = () => {
    if (!delivery || delivery.status !== 'shipped') return
    const slug = delivery.project.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    window.open(`/deliveries/${slug}-v1.zip`, '_blank')
  }

  return (
    <AnimatePresence>
      {delivery && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(5,5,5,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col border-l border-neon/20 bg-panel overflow-hidden"
            style={{ width: '400px', backgroundColor: '#0a0a0f' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-start justify-between p-5 border-b border-neon/10">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="font-orbitron text-base font-bold text-chrome tracking-wide truncate">
                  {delivery.project}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <StatusBadge status={delivery.status} />
                  {delivery.ciScore > 0 && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-sm border text-[11px] font-orbitron font-bold tracking-wider"
                      style={{ borderColor: ciColor + '50', backgroundColor: ciColor + '10', color: ciColor }}
                    >
                      CI {delivery.ciScore}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 shrink-0 rounded-sm border border-white/10 flex items-center justify-center
                           text-chrome-dark hover:text-chrome hover:border-white/30 transition-all"
                aria-label="Close drawer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Color scheme preview */}
            <div className="shrink-0 mx-5 mt-4 rounded-sm overflow-hidden border border-white/5" style={{ height: '48px' }}>
              <div className="flex h-full">
                {delivery.colorScheme.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 flex items-center justify-center text-[9px] font-mono"
                    style={{ backgroundColor: c, color: '#ffffff88' }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Meta info */}
            <div className="shrink-0 grid grid-cols-2 gap-3 mx-5 mt-4">
              <div className="rounded-sm border border-neon/10 bg-void/60 p-3">
                <div className="font-mono text-[9px] text-chrome-dark/60 tracking-widest uppercase mb-1">Build Time</div>
                <div className="font-orbitron text-sm text-chrome">{delivery.buildTime}</div>
              </div>
              <div className="rounded-sm border border-neon/10 bg-void/60 p-3">
                <div className="font-mono text-[9px] text-chrome-dark/60 tracking-widest uppercase mb-1">Date</div>
                <div className="font-orbitron text-sm text-chrome">{delivery.date}</div>
              </div>
              <div className="rounded-sm border border-neon/10 bg-void/60 p-3">
                <div className="font-mono text-[9px] text-chrome-dark/60 tracking-widest uppercase mb-1">Bundle Size</div>
                <div className="font-orbitron text-sm text-chrome">{delivery.size}</div>
              </div>
              <div className="rounded-sm border border-neon/10 bg-void/60 p-3">
                <div className="font-mono text-[9px] text-chrome-dark/60 tracking-widest uppercase mb-1">CI Score</div>
                <div className="font-orbitron text-sm" style={{ color: ciColor }}>
                  {delivery.ciScore > 0 ? `${delivery.ciScore}/100` : '—'}
                </div>
              </div>
            </div>

            {/* File list */}
            <div className="shrink-0 mx-5 mt-4">
              <div className="font-mono text-[10px] text-chrome-dark/60 tracking-widest uppercase mb-2">Key Files</div>
              <div className="space-y-1">
                {(PROJECT_FILES[delivery.id] ?? ['src/index.tsx']).map(f => (
                  <div
                    key={f}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-white/5 bg-void/40"
                  >
                    <span className="text-neon/50 font-mono text-[10px]">›</span>
                    <span className="font-mono text-[10px] text-chrome-dark truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* ZIP download button */}
            <div className="shrink-0 p-5 border-t border-neon/10">
              <button
                onClick={handleDownload}
                disabled={delivery.status !== 'shipped'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm border font-orbitron
                            text-sm tracking-widest uppercase transition-all duration-200
                            ${delivery.status === 'shipped'
                              ? 'cursor-pointer hover:scale-[1.02]'
                              : 'cursor-not-allowed opacity-40'
                            }`}
                style={delivery.status === 'shipped' ? {
                  borderColor: '#ffd700',
                  backgroundColor: 'rgba(255, 215, 0, 0.08)',
                  color: '#ffd700',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.2)',
                } : {
                  borderColor: '#374151',
                  color: '#6b7280',
                }}
              >
                <Download size={15} />
                {delivery.status === 'shipped' ? `Download ZIP — ${delivery.size}` : 'Not Available'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function DeliveriesBrowser() {
  const [query, setQuery] = useState('')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:18789/tools/invoke', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer e4ccba5fa1bcc9afb2f43eff40ba9932b1e9ed91589f0d2d', 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'read', args: { path: '/home/austi/.openclaw/workspace/memory/builds-index.md' }, sessionKey: 'main' })
        })
        const data = await res.json()
        // The read tool returns content as text in result.content[0].text
        const text = data?.result?.content?.[0]?.text ?? data?.result?.details ?? ''
        const lines = (typeof text === 'string' ? text : '').split('\n')
          .filter((l: string) => l.startsWith('|') && !l.includes('---') && !l.includes('Date') && !l.includes('Project'))
        const parsed = lines.map((line: string, i: number) => {
          const cols = line.split('|').map((c: string) => c.trim()).filter(Boolean)
          return {
            id: String(i),
            date: cols[0] ?? '',
            project: cols[1] ?? 'Unknown',
            ciScore: (cols[5] ?? '').includes('✅') ? 100 : 0,
            size: '—',
            buildTime: '—',
            colorScheme: ['#050505', '#00d4ff', '#4a5568'],
            url: cols[3] ?? null,
            status: (cols[5] ?? '').includes('✅') ? 'shipped' : 'building',
          } as Delivery
        }).filter((d: Delivery) => d.project && d.project.length > 1)
        if (parsed.length > 0) setDeliveries(parsed)
      } catch (e) { console.error('deliveries load failed', e) }
    }
    load()
  }, [])

  const filtered = deliveries.filter(d =>
    d.project.toLowerCase().includes(query.toLowerCase()) ||
    d.status.includes(query.toLowerCase())
  )

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <div className="hud-label">Deliveries</div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-dark" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-void border border-neon/15 rounded-sm pl-8 pr-3 py-1.5 text-xs text-chrome font-mono
                       focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all
                       placeholder:text-chrome-dark/50"
          />
        </div>

        {/* Cards */}
        <div className="scrollbar-thin" style={{ flex: 1, minHeight: 0, overflowY: 'scroll', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,255,0.4) transparent' }}>
          <div className="flex flex-col gap-2">
            {filtered.map(delivery => (
              <div
                key={delivery.id}
                className="border border-neon/10 rounded-sm px-2 py-2 transition-all duration-200 cursor-pointer group hover:bg-neon/5 hover:border-neon/20"
                style={{ position: 'relative', boxShadow: 'none' }}
                onClick={() => {
                  const slug = delivery.project.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                  const url = delivery.url || PROJECT_URLS[delivery.project] || PROJECT_URLS[slug]
                  if (url) window.open(url, '_blank')
                  setSelectedDelivery(delivery)
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 0 20px rgba(0,212,255,0.04)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeliveries(d => d.filter(x => x.id !== delivery.id))
                  }}
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(239,68,68,0.6)', fontSize: '12px', lineHeight: 1,
                    padding: '2px 4px'
                  }}
                  title="Remove"
                >×</button>

                <div className="flex items-start justify-between gap-2 pr-6">
                  <span className="truncate max-w-[170px] text-chrome group-hover:text-neon transition-colors" style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 500 }}>
                    {delivery.url && delivery.url !== '—' && delivery.url !== 'null' ? (
                      <a href={delivery.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>{delivery.project}</a>
                    ) : (
                      <span>{delivery.project}</span>
                    )}
                  </span>
                  <StatusBadge status={delivery.status} />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <CIScoreBar score={delivery.ciScore} />
                  <span className="font-mono text-chrome-dark text-[10px]">{delivery.date}</span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {delivery.status === 'shipped' && (() => {
                    const slug = delivery.project.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    const url = delivery.url || PROJECT_URLS[delivery.project] || PROJECT_URLS[slug]
                    return url ? (
                      <button
                        onClick={e => { e.stopPropagation(); window.open(url, '_blank') }}
                        className="text-[9px] font-mono text-neon border border-neon/20 px-1.5 py-0.5 rounded-sm hover:bg-neon/10 transition-all shrink-0"
                      >
                        OPEN →
                      </button>
                    ) : null
                  })()}
                  <button
                    onClick={e => { e.stopPropagation(); if (delivery.status === 'shipped') setSelectedDelivery(delivery) }}
                    disabled={delivery.status !== 'shipped'}
                    title={delivery.status === 'shipped' ? `Download ${delivery.size}` : 'Not available'}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-orbitron
                                transition-all duration-200
                                ${delivery.status === 'shipped'
                                  ? 'border-neon/30 text-neon hover:bg-neon/10 hover:border-neon hover:shadow-neon-sm cursor-pointer'
                                  : 'border-white/5 text-chrome-dark/30 cursor-not-allowed'
                                }`}
                  >
                    <Download size={9} />
                    <span>{delivery.status === 'shipped' ? delivery.size : '—'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-chrome-dark font-mono text-xs opacity-50">
              No deliveries match &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="text-[10px] font-mono text-chrome-dark flex items-center justify-between">
          <span>{filtered.length} of {deliveries.length} deliveries</span>
          <span className="text-neon/40">
            {deliveries.filter(d => d.status === 'shipped').length} shipped
          </span>
        </div>
      </div>

      {/* Slide-over drawer */}
      <DeliveryDrawer delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} />
    </>
  )
}
