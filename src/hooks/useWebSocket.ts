import { useCallback, useEffect, useRef, useState } from 'react'

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error'
export type WSMode = 'ws' | 'polling'

export interface WSEvent {
  type: string
  payload: unknown
  ts: number
}

interface UseWebSocketReturn {
  status: WSStatus
  lastEvent: WSEvent | null
  send: (data: unknown) => void
  mode: WSMode
}

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined

const INITIAL_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 30_000
const HEARTBEAT_INTERVAL_MS = 15_000
const HEARTBEAT_TIMEOUT_MS = 5_000

// Mock events for polling fallback
const MOCK_EVENT_POOL: WSEvent[] = [
  { type: 'agent.status', payload: { id: 'director', status: 'active' }, ts: 0 },
  { type: 'agent.status', payload: { id: 'builder', status: 'working' }, ts: 0 },
  { type: 'dag.progress', payload: { stage: 'build', progress: 0.6 }, ts: 0 },
  { type: 'token.update', payload: { agent: 'builder', tokens: 4200 }, ts: 0 },
  { type: 'intel.log', payload: { message: 'Batch 3 complete — running tsc', level: 'INFO' }, ts: 0 },
  { type: 'agent.status', payload: { id: 'validator', status: 'idle' }, ts: 0 },
  { type: 'token.update', payload: { agent: 'director', tokens: 1800 }, ts: 0 },
  { type: 'dag.progress', payload: { stage: 'validate', progress: 0.3 }, ts: 0 },
]

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<WSStatus>('connecting')
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null)
  const [mode, setMode] = useState<WSMode>('polling')

  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(INITIAL_BACKOFF_MS)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const heartbeatAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mockIdxRef = useRef(0)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current)
    if (heartbeatAckTimerRef.current) clearTimeout(heartbeatAckTimerRef.current)
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
  }, [])

  const startPollingFallback = useCallback(() => {
    if (!mountedRef.current) return
    setMode('polling')
    setStatus('open')

    pollingTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return
      const evt = {
        ...MOCK_EVENT_POOL[mockIdxRef.current % MOCK_EVENT_POOL.length],
        ts: Date.now(),
      }
      mockIdxRef.current++
      setLastEvent(evt)
    }, 2000)
  }, [])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
    // In polling mode, no-op (no real server)
  }, [])

  const connect = useCallback(() => {
    if (!WS_URL) {
      // No WS URL configured — go straight to polling
      startPollingFallback()
      return
    }

    if (!mountedRef.current) return

    setStatus('connecting')

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        backoffRef.current = INITIAL_BACKOFF_MS
        setStatus('open')
        setMode('ws')

        // Start heartbeat loop
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return
          ws.send(JSON.stringify({ type: 'ping' }))
          heartbeatAckTimerRef.current = setTimeout(() => {
            // No pong received — treat as dead connection
            ws.close()
          }, HEARTBEAT_TIMEOUT_MS)
        }, HEARTBEAT_INTERVAL_MS)
      }

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(evt.data as string) as Record<string, unknown>
          // Clear heartbeat ack timer on any message (pong or data)
          if (heartbeatAckTimerRef.current) {
            clearTimeout(heartbeatAckTimerRef.current)
          }
          if (data.type === 'pong') return
          setLastEvent({ type: data.type as string, payload: data.payload, ts: Date.now() })
        } catch {
          // Non-JSON frame — ignore
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setStatus('error')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setStatus('closed')
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current)
        if (heartbeatAckTimerRef.current) clearTimeout(heartbeatAckTimerRef.current)

        // Exponential backoff with jitter
        const jitter = Math.random() * 300
        const delay = Math.min(backoffRef.current + jitter, MAX_BACKOFF_MS)
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)

        reconnectTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return
          // After MAX_BACKOFF attempts, fall back to polling
          if (backoffRef.current >= MAX_BACKOFF_MS) {
            startPollingFallback()
          } else {
            connect()
          }
        }, delay)
      }
    } catch {
      // WebSocket constructor threw (invalid URL, etc.) — fall to polling
      startPollingFallback()
    }
  }, [startPollingFallback])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimers()
      wsRef.current?.close()
    }
  }, [connect, clearTimers])

  return { status, lastEvent, send, mode }
}
