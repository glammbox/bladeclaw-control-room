import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, Mic, X, Clock } from 'lucide-react'

const RECENT_KEY = 'bladeclaw_recent_searches'
const MAX_RECENT = 5

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  readonly isFinal: boolean
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function saveRecent(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)))
  } catch {
    // localStorage unavailable
  }
}

export default function GoogleSearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent)
  const [listening, setListening] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const hasSpeechAPI = typeof window !== 'undefined' &&
    (window.SpeechRecognition != null || window.webkitSpeechRecognition != null)

  // Fetch typeahead suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    try {
      // Google suggest JSONP — use a CORS-friendly approach
      const encoded = encodeURIComponent(q)
      const res = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encoded}`,
        { mode: 'cors' }
      )
      if (!res.ok) throw new Error('suggest fail')
      const data = await res.json() as [string, string[]]
      setSuggestions(data[1]?.slice(0, 5) ?? [])
    } catch {
      // Suggest API blocked (CORS) — use filtered recent searches as fallback
      const filtered = recentSearches.filter(r => r.toLowerCase().includes(q.toLowerCase()))
      setSuggestions(filtered)
    }
  }, [recentSearches])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setShowSuggestions(true)
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    suggestTimerRef.current = setTimeout(() => fetchSuggestions(val), 250)
  }

  const handleSubmit = (searchQuery: string) => {
    const q = searchQuery.trim()
    if (!q) return
    // Save to recent
    const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, MAX_RECENT)
    setRecentSearches(updated)
    saveRecent(updated)
    setShowSuggestions(false)
    setQuery('')
    // Open Google in new tab
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer')
  }

  const handleVoice = () => {
    if (!hasSpeechAPI) return
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      setQuery(transcript)
      setListening(false)
      if (transcript) handleSubmit(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const clearRecent = (term: string) => {
    const updated = recentSearches.filter(r => r !== term)
    setRecentSearches(updated)
    saveRecent(updated)
  }

  // Show recent searches when focused with empty query
  const showDropdown = showSuggestions && focused && (suggestions.length > 0 || (query.length === 0 && recentSearches.length > 0))

  useEffect(() => {
    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    }
  }, [])

  const dropdownItems: Array<{ text: string; isRecent: boolean }> =
    query.length === 0
      ? recentSearches.map(r => ({ text: r, isRecent: true }))
      : suggestions.map(s => ({ text: s, isRecent: false }))

  return (
    <div className="relative flex-1" style={{ minWidth: '180px', maxWidth: '320px' }}>
      {/* Search form */}
      <form
        onSubmit={e => { e.preventDefault(); handleSubmit(query) }}
        className="flex items-center gap-2"
      >
        <div
          className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-sm border transition-all duration-200
                      ${focused
                        ? 'border-neon/50 bg-void'
                        : 'border-neon/20 bg-void/60 hover:border-neon/30'
                      }`}
          style={{ boxShadow: focused ? '0 0 10px rgba(0, 212, 255, 0.12)' : 'none' }}
        >
          <Search size={11} className={focused ? 'text-neon' : 'text-chrome-dark/60'} />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { setFocused(true); setShowSuggestions(true) }}
            onBlur={() => { setTimeout(() => { setFocused(false); setShowSuggestions(false) }, 200) }}
            onKeyDown={e => {
              if (e.key === 'Escape') { setShowSuggestions(false); setQuery('') }
            }}
            placeholder="Search the web..."
            className="flex-1 bg-transparent font-orbitron text-[10px] text-chrome placeholder-chrome-dark/40
                       outline-none tracking-wide min-w-0"
            style={{ caretColor: '#00d4ff' }}
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]) }}
              className="text-chrome-dark/40 hover:text-chrome transition-colors"
            >
              <X size={9} />
            </button>
          )}

          {hasSpeechAPI && (
            <button
              type="button"
              onClick={handleVoice}
              className={`transition-colors ${listening ? 'text-red-400 animate-pulse' : 'text-chrome-dark/40 hover:text-neon'}`}
              title={listening ? 'Stop listening' : 'Voice search'}
            >
              <Mic size={11} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && dropdownItems.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-sm border border-neon/20 bg-panel/95
                     backdrop-blur-md overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(0,212,255,0.08)' }}
        >
          {dropdownItems.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSubmit(item.text)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neon/8
                         transition-colors duration-100 border-b border-white/5 last:border-0"
            >
              {item.isRecent ? (
                <Clock size={9} className="text-chrome-dark/50 shrink-0" />
              ) : (
                <Search size={9} className="text-chrome-dark/50 shrink-0" />
              )}
              <span className="font-orbitron text-[10px] text-chrome truncate flex-1">{item.text}</span>
              {item.isRecent && (
                <button
                  type="button"
                  onMouseDown={e => { e.stopPropagation(); clearRecent(item.text) }}
                  className="text-chrome-dark/30 hover:text-red-400/60 transition-colors shrink-0"
                >
                  <X size={8} />
                </button>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
