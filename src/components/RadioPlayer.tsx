import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Radio, SkipBack, SkipForward } from 'lucide-react'

interface Station {
  id: string
  name: string
  tagline: string
  url: string
  color: string
  genre: string
}

const STATIONS: Station[] = [
  {
    id: 'bbc1',
    name: 'BBC Radio 1',
    tagline: 'UK CHART HITS',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    color: '#3b82f6',
    genre: 'POP / CHART',
  },
  {
    id: 'lofi',
    name: 'Lofi Radio',
    tagline: 'STUDY & FOCUS',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    color: '#a78bfa',
    genre: 'LOFI / CHILL',
  },
  {
    id: 'nrj',
    name: 'NRJ France',
    tagline: 'HITS ONLY',
    url: 'https://live-icy.gatekeeper.your-server.de/C1530.mp3',
    color: '#f97316',
    genre: 'DANCE / HITS',
  },
]

const BAR_COUNT = 20

export default function RadioPlayer() {
  const [stationIndex, setStationIndex] = useState(0)
  const [activeStation, setActiveStation] = useState<Station>(STATIONS[0])
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(2))

  const currentStation = STATIONS[stationIndex]

  const prevStation = useCallback(() => {
    const newIdx = (stationIndex - 1 + STATIONS.length) % STATIONS.length
    setStationIndex(newIdx)
    playStation(STATIONS[newIdx])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIndex])

  const nextStation = useCallback(() => {
    const newIdx = (stationIndex + 1) % STATIONS.length
    setStationIndex(newIdx)
    playStation(STATIONS[newIdx])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationIndex])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const idleAnimRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Idle bar animation (when not playing real audio)
  const startIdleAnim = useCallback(() => {
    if (idleAnimRef.current) clearInterval(idleAnimRef.current)
    idleAnimRef.current = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 8 + 2))
    }, 150)
  }, [])

  const stopIdleAnim = useCallback(() => {
    if (idleAnimRef.current) clearInterval(idleAnimRef.current)
    setBars(new Array(BAR_COUNT).fill(2))
  }, [])

  // Web Audio analyser-driven bar animation
  const startAnalyser = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)

    const frame = () => {
      analyser.getByteFrequencyData(data)
      const step = Math.floor(data.length / BAR_COUNT)
      const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const val = data[i * step] ?? 0
        return Math.max(2, (val / 255) * 40)
      })
      setBars(newBars)
      animFrameRef.current = requestAnimationFrame(frame)
    }
    animFrameRef.current = requestAnimationFrame(frame)
  }, [])

  const stopAnalyser = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [])

  // Setup audio element
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'none'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (idleAnimRef.current) clearInterval(idleAnimRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  // Wire volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source
    } catch {
      // AudioContext not available in some environments
    }
  }, [])

  const playStation = useCallback(async (station: Station) => {
    const audio = audioRef.current
    if (!audio) return

    setError(null)
    setActiveStation(station)

    audio.pause()
    audio.src = station.url
    audio.volume = muted ? 0 : volume
    audio.load()

    // Init audio context on first play (requires user gesture)
    initAudioContext()
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    try {
      await audio.play()
      setPlaying(true)
      stopIdleAnim()
      if (analyserRef.current) {
        startAnalyser()
      } else {
        startIdleAnim()
      }
    } catch {
      setError('Stream unavailable')
      setPlaying(false)
      startIdleAnim()
    }
  }, [volume, muted, initAudioContext, startAnalyser, startIdleAnim, stopIdleAnim])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      stopAnalyser()
      startIdleAnim()
    } else {
      await playStation(activeStation)
    }
  }, [playing, activeStation, playStation, stopAnalyser, startIdleAnim])

  return (
    <div style={{display:'flex',alignItems:'center',gap:'10px',height:'48px',padding:'0 12px',background:'rgba(15,22,41,0.85)',backdropFilter:'blur(8px)',border:'1px solid rgba(0,212,255,0.1)',borderRadius:'6px'}}>
      <Radio size={12} className="text-neon/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:500,color:'#c0cfe0',fontSize:'12px'}}>{currentStation.name}</div>
        <div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:600,letterSpacing:'0.08em',color:'rgba(0,212,255,0.5)',fontSize:'9px',border:'1px solid rgba(0,212,255,0.2)',padding:'1px 5px',borderRadius:'2px',display:'inline-block'}}>{currentStation.genre}</div>
      </div>
      <button onClick={prevStation} className="text-chrome-dark hover:text-chrome transition-colors"><SkipBack size={11} /></button>
      <button onClick={togglePlay}
        style={{width:'28px',height:'28px',borderRadius:'4px',border:'1px solid rgba(0,212,255,0.25)',background:'rgba(0,212,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'#00d4ff',cursor:'pointer'}}>
        {playing ? <Pause size={11} /> : <Play size={11} />}
      </button>
      <button onClick={nextStation} className="text-chrome-dark hover:text-chrome transition-colors"><SkipForward size={11} /></button>
      <input type="range" min={0} max={1} step={0.05} value={volume}
        onChange={e => setVolume(parseFloat(e.target.value))}
        className="w-16 accent-neon h-1" />
    </div>
  )
}
