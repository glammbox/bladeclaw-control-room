import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function useHeartbeat(intervalMs = 1200) {
  const [beat, setBeat] = useState(0)
  const [intensity, setIntensity] = useState(1)

  useEffect(() => {
    const id = setInterval(() => {
      setBeat((b) => b + 1)
      // Simulate variable heartbeat intensity
      setIntensity(0.7 + Math.random() * 0.6)
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { beat, intensity }
}

// ─────────────────────────────────────────────
// R3F Sub-components
// ─────────────────────────────────────────────

interface GlowRingProps {
  radius: number
  thickness: number
  color: string
  rotationSpeed: number
  beatIntensity: number
  phase?: number
}

function GlowRing({ radius, thickness, color, rotationSpeed, beatIntensity, phase = 0 }: GlowRingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  const geometry = useMemo(() => new THREE.TorusGeometry(radius, thickness, 16, 100), [radius, thickness])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed + phase
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + phase) * 0.15
    }
    if (matRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2 + phase)
      matRef.current.opacity = (0.6 + pulse * 0.4) * beatIntensity
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.8} />
    </mesh>
  )
}

interface ParticleFieldProps {
  count: number
  beatIntensity: number
}

function ParticleField({ count, beatIntensity }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 0.5 + Math.random() * 1.8
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.sin(angle) * r
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      velocities[i * 3] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001
    }
    return { positions, velocities }
  }, [count])

  useFrame((state) => {
    if (!pointsRef.current) return
    const geo = pointsRef.current.geometry
    const pos = geo.attributes.position.array as Float32Array
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const angle = Math.atan2(pos[i3 + 1], pos[i3]) + velocities[i3] * (1 + beatIntensity * 0.5)
      const r = Math.sqrt(pos[i3] ** 2 + pos[i3 + 1] ** 2) + Math.sin(t * 2 + i) * 0.0005

      // Clamp radius
      const clampedR = Math.max(0.3, Math.min(2.2, r))
      pos[i3] = Math.cos(angle) * clampedR
      pos[i3 + 1] = Math.sin(angle) * clampedR
      pos[i3 + 2] += velocities[i3 + 2]
      if (Math.abs(pos[i3 + 2]) > 0.3) velocities[i3 + 2] *= -1
    }

    geo.attributes.position.needsUpdate = true
    pointsRef.current.rotation.z = t * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00d4ff"
        transparent
        opacity={0.7 * beatIntensity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

interface CoreOrbProps {
  beatIntensity: number
  beat: number
}

function CoreOrb({ beatIntensity, beat }: CoreOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const prevBeat = useRef(beat)

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime
      const baseScale = 0.18 + Math.sin(t * 1.5) * 0.02

      // Beat pulse: scale up on new beat
      const beatPulse = beat !== prevBeat.current ? beatIntensity * 0.08 : 0
      if (beat !== prevBeat.current) prevBeat.current = beat

      const scale = baseScale + beatPulse
      meshRef.current.scale.setScalar(scale)
    }
    if (matRef.current) {
      const t = state.clock.elapsedTime
      matRef.current.opacity = 0.7 + Math.sin(t * 3) * 0.2
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color="#00d4ff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function EnergySpokes({ beatIntensity }: { beatIntensity: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const spokeCount = 6

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  const spokes = useMemo(() => {
    return Array.from({ length: spokeCount }, (_, i) => {
      const angle = (i / spokeCount) * Math.PI * 2
      const length = 0.8 + Math.random() * 0.4
      const x = Math.cos(angle) * length * 0.5
      const y = Math.sin(angle) * length * 0.5

      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0)]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return { geometry, angle, length }
    })
  }, [])

  return (
    <group ref={groupRef}>
      {spokes.map(({ geometry }, i) => (
        <line key={i}>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.3 * beatIntensity}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────
// Invalidation-aware scene wrapper
// ─────────────────────────────────────────────

function ReactorScene({ beat, intensity }: { beat: number; intensity: number }) {
  const { invalidate } = useThree()

  useEffect(() => {
    invalidate()
  }, [beat, intensity, invalidate])

  return (
    <>
      <ambientLight intensity={0.1} />
      <CoreOrb beatIntensity={intensity} beat={beat} />
      <GlowRing radius={0.55} thickness={0.018} color="#00d4ff" rotationSpeed={0.4} beatIntensity={intensity} phase={0} />
      <GlowRing radius={0.85} thickness={0.012} color="#0088ff" rotationSpeed={-0.25} beatIntensity={intensity * 0.8} phase={1} />
      <GlowRing radius={1.1} thickness={0.008} color="#00d4ff" rotationSpeed={0.15} beatIntensity={intensity * 0.6} phase={2} />
      <EnergySpokes beatIntensity={intensity} />
      <ParticleField count={120} beatIntensity={intensity} />
    </>
  )
}

// ─────────────────────────────────────────────
// Mobile CSS fallback
// ─────────────────────────────────────────────

function MobileFallback({ beat }: { beat: number }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'radial-gradient(circle, #00d4ff08, transparent 70%)' }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer rings */}
        {[80, 100, 120].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-neon/30"
            style={{
              width: size,
              height: size,
              animation: `spin ${3 + i * 1.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
              boxShadow: '0 0 8px #00d4ff30',
            }}
          />
        ))}

        {/* Core orb */}
        <div
          className="w-10 h-10 rounded-full bg-neon/20 border border-neon/60"
          style={{
            boxShadow: `0 0 ${10 + (beat % 3) * 5}px #00d4ff60`,
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

interface ArcReactorCoreProps {
  className?: string
}

export default function ArcReactorCore({ className = '' }: ArcReactorCoreProps) {
  const isMobile = useIsMobile()
  const { beat, intensity } = useHeartbeat(1200)

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }, [])

  return (
    <div
      className={`relative ${className} cursor-pointer`}
      title="DAG Pulse HUD - Live Beat Visualization"
      style={{
        background: 'radial-gradient(circle at center, #00d4ff06 0%, transparent 70%)',
      }}
    >
      {isMobile ? (
        <MobileFallback beat={beat} />
      ) : (
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 0, 3], fov: 50 }}
          style={{ background: 'transparent' }}
          onCreated={handleCreated}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ReactorScene beat={beat} intensity={intensity} />
        </Canvas>
      )}

      {/* Beat indicator pulse ring overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: `inset 0 0 ${20 + intensity * 20}px #00d4ff10`,
          animation: 'pulse 1.2s ease-in-out infinite',
        }}
      />
    </div>
  )
}
