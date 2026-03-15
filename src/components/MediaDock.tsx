import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, Music, Youtube, Volume2, VolumeX, Radio, ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import RadioPlayer from './RadioPlayer'

type MediaMode = 'music' | 'youtube' | 'radio'

interface Track {
  id: number
  title: string
  artist: string
  duration: number // seconds
  color: string
}

const PLAYLIST: Track[] = [
  { id: 1, title: 'Neon Overdrive',    artist: 'BLADECLAW OST',  duration: 243, color: '#00d4ff' },
  { id: 2, title: 'Ghost Protocol',    artist: 'Synthwave Corp', duration: 198, color: '#f97316' },
  { id: 3, title: 'Iron Frequency',    artist: 'Arc Division',   duration: 317, color: '#22c55e' },
]

const YOUTUBE_URL = 'https://www.youtube.com/embed/bpOSxM0rNPM?autoplay=0&mute=1&controls=1&rel=0&modestbranding=1'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MediaDock() {
  const [mode, setMode] = useState<MediaMode>('music')
  const [playing, setPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [progress, setProgress] = useState(0) // 0–100
  const [elapsed, setElapsed] = useState(0)
  // Music mode: collapsed by default
  const [musicExpanded, setMusicExpanded] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const track = PLAYLIST[currentTrack]

  // Progress ticker when playing
  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= track.duration) {
            handleNext()
            return 0
          }
          setProgress(Math.round((next / track.duration) * 100))
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, currentTrack])

  const handleNext = () => {
    const next = (currentTrack + 1) % PLAYLIST.length
    setCurrentTrack(next)
    setElapsed(0)
    setProgress(0)
  }

  const handleTrackSelect = (idx: number) => {
    setCurrentTrack(idx)
    setElapsed(0)
    setProgress(0)
    setPlaying(true)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newElapsed = Math.round(ratio * track.duration)
    setElapsed(newElapsed)
    setProgress(Math.round(ratio * 100))
  }

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-between shrink-0">
        <div className="hud-label">Media Dock</div>
        <div className="flex items-center gap-1 p-0.5 rounded-sm border border-neon/15 bg-void">
          <button
            onClick={() => setMode('music')}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-orbitron tracking-wider
                        transition-all duration-200
                        ${mode === 'music'
                          ? 'bg-neon/10 text-neon border border-neon/30'
                          : 'text-chrome-dark hover:text-chrome border border-transparent'
                        }`}
          >
            <Music size={9} />
            MUSIC
          </button>
          <button
            onClick={() => setMode('youtube')}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-orbitron tracking-wider
                        transition-all duration-200
                        ${mode === 'youtube'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'text-chrome-dark hover:text-chrome border border-transparent'
                        }`}
          >
            <Youtube size={9} />
            VIDEO
          </button>
          <button
            onClick={() => setMode('radio')}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-orbitron tracking-wider
                        transition-all duration-200
                        ${mode === 'radio'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'text-chrome-dark hover:text-chrome border border-transparent'
                        }`}
          >
            <Radio size={9} />
            RADIO
          </button>
        </div>
      </div>

      {mode === 'music' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
          {/* ─── Collapsed mini strip ─── */}
          {!musicExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-2 rounded-sm border"
              style={{
                height: '48px',
                borderColor: track.color + '40',
                backgroundColor: track.color + '08',
                boxShadow: playing ? `0 0 10px ${track.color}20` : 'none',
              }}
            >
              {/* Play/Pause */}
              <button
                onClick={() => setPlaying(p => !p)}
                className="w-7 h-7 rounded-sm border flex items-center justify-center shrink-0 transition-all hover:scale-110"
                style={{
                  borderColor: track.color + '50',
                  color: track.color,
                  backgroundColor: playing ? track.color + '15' : 'transparent',
                  boxShadow: playing ? `0 0 6px ${track.color}40` : 'none',
                }}
              >
                {playing ? <Pause size={11} /> : <Play size={11} />}
              </button>

              {/* Track name + progress bar */}
              <div className="flex-1 min-w-0">
                <div className="font-orbitron text-[10px] truncate mb-1" style={{ color: track.color }}>
                  {track.title}
                  <span className="text-chrome-dark/50 ml-1 font-mono text-[9px]">— {track.artist}</span>
                </div>
                {/* Thin progress bar */}
                <div
                  className="h-0.5 bg-void/80 rounded-full cursor-pointer relative overflow-hidden"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: track.color,
                      boxShadow: `0 0 3px ${track.color}`,
                    }}
                  />
                </div>
              </div>

              {/* Expand button */}
              <button
                onClick={() => setMusicExpanded(true)}
                className="w-6 h-6 shrink-0 flex items-center justify-center rounded-sm border border-white/10
                           text-chrome-dark hover:text-chrome hover:border-white/20 transition-all"
                title="Expand player"
              >
                <ChevronUp size={11} />
              </button>
            </motion.div>
          ) : (
            /* ─── Expanded full player ─── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-2 min-h-0"
            >
              {/* Collapse button row */}
              <div className="flex justify-end shrink-0">
                <button
                  onClick={() => setMusicExpanded(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded-sm border border-white/10
                             text-chrome-dark hover:text-chrome text-[10px] font-mono transition-all"
                  title="Collapse player"
                >
                  <ChevronDown size={10} />
                  <span>COLLAPSE</span>
                </button>
              </div>

              {/* Now playing */}
              <div
                className="rounded-sm border p-3 flex items-center gap-3 transition-all duration-300 shrink-0"
                style={{
                  borderColor: track.color + '40',
                  backgroundColor: track.color + '08',
                  boxShadow: playing ? `0 0 12px ${track.color}20` : 'none',
                }}
              >
                {/* Album art placeholder */}
                <div
                  className="w-12 h-12 rounded-sm shrink-0 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: track.color + '15', border: `1px solid ${track.color}30` }}
                >
                  {playing && (
                    <div className="absolute inset-0 flex items-end justify-center gap-0.5 pb-1.5 px-1.5">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            backgroundColor: track.color,
                            animation: `equalize 0.${5 + i * 2}s ease-in-out infinite alternate`,
                            height: `${30 + Math.random() * 40}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {!playing && <Music size={18} style={{ color: track.color, opacity: 0.5 }} />}
                </div>

                {/* Track info + controls */}
                <div className="flex-1 min-w-0">
                  <div className="font-orbitron text-xs truncate" style={{ color: track.color }}>
                    {track.title}
                  </div>
                  <div className="text-[10px] font-mono text-chrome-dark truncate">
                    {track.artist}
                  </div>

                  {/* Progress bar */}
                  <div
                    className="mt-2 h-1 bg-void rounded-full cursor-pointer relative overflow-hidden"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: track.color,
                        boxShadow: `0 0 4px ${track.color}`,
                      }}
                    />
                  </div>

                  {/* Time */}
                  <div className="flex justify-between mt-1 text-[9px] font-mono text-chrome-dark/60">
                    <span>{formatTime(elapsed)}</span>
                    <span>{formatTime(track.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPlaying(p => !p)}
                    className="w-8 h-8 rounded-sm border flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{
                      borderColor: track.color + '50',
                      color: track.color,
                      backgroundColor: playing ? track.color + '15' : 'transparent',
                      boxShadow: playing ? `0 0 8px ${track.color}40` : 'none',
                    }}
                  >
                    {playing ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-7 h-7 rounded-sm border flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ borderColor: track.color + '30', color: track.color }}
                  >
                    <SkipForward size={11} />
                  </button>
                </div>
              </div>

              {/* Playlist */}
              <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
                {PLAYLIST.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => handleTrackSelect(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm border text-left
                                transition-all duration-200 hover:scale-[1.005]
                                ${idx === currentTrack
                                  ? 'border-opacity-40 bg-opacity-5'
                                  : 'border-white/5 hover:border-white/10 hover:bg-white/3'
                                }`}
                    style={idx === currentTrack ? {
                      borderColor: t.color + '50',
                      backgroundColor: t.color + '08',
                    } : undefined}
                  >
                    <span className="text-[10px] font-mono w-4 text-center" style={{ color: idx === currentTrack ? t.color : '#4b5563' }}>
                      {idx === currentTrack && playing ? '♪' : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate" style={{ color: idx === currentTrack ? t.color : '#9ca3af' }}>
                        {t.title}
                      </div>
                      <div className="text-[10px] font-mono text-chrome-dark/50">{t.artist}</div>
                    </div>
                    <span className="text-[10px] font-mono text-chrome-dark/40">{formatTime(t.duration)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      ) : mode === 'youtube' ? (
        /* YouTube mode — full size always */
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex-1 rounded-sm overflow-hidden border border-red-500/20 relative min-h-0"
               style={{ minHeight: '120px' }}>
            <iframe
              src={YOUTUBE_URL}
              title="BladeClaw Media Player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none', minHeight: '120px' }}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-chrome-dark">
            <VolumeX size={10} className="text-red-400/60" />
            <span>Muted by default — unmute in player</span>
            <div className="flex-1" />
            <Volume2 size={10} className="text-chrome-dark/40" />
          </div>
        </div>
      ) : (
        /* Radio mode — full size always */
        <div className="flex-1 min-h-0 overflow-hidden">
          <RadioPlayer />
        </div>
      )}


    </div>
  )
}
