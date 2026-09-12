import { useCallback, useEffect, useRef } from 'react'
import type { ParticleKind } from '../../fx/theme'

/**
 * Zero-dependency canvas particle system for elemental reveal bursts. One <ParticleCanvas> renders
 * a full-bleed overlay canvas; call the returned `burst(kind, origin?)` to spawn a themed burst.
 *
 * Performance guards:
 *  - single requestAnimationFrame loop, stops itself when no particles remain
 *  - devicePixelRatio clamped to 2
 *  - hard cap on live particles
 *  - no-ops entirely under prefers-reduced-motion (caller passes `enabled`)
 */

const MAX_PARTICLES = 90
const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0..1 remaining
  decay: number
  size: number
  color: string
  gravity: number
  spin: number
  rot: number
  shape: 'circle' | 'spark' | 'leaf' | 'ring'
  swirl: number // angular drift for air/portal
}

type Origin = { x: number; y: number }

interface Preset {
  count: number
  colors: string[]
  make: (o: Origin, color: string) => Particle
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const base = (o: Origin, color: string): Particle => ({
  x: o.x,
  y: o.y,
  vx: 0,
  vy: 0,
  life: 1,
  decay: rand(0.008, 0.016),
  size: rand(3, 7),
  color,
  gravity: 0,
  spin: 0,
  rot: 0,
  shape: 'circle',
  swirl: 0,
})

const PRESETS: Record<ParticleKind, Preset> = {
  FIRE: {
    count: 34,
    colors: ['#ff5b35', '#ff8a3d', '#ffd15c', '#ff3b2f'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-1.4, 1.4), vy: rand(-4.2, -1.6), gravity: -0.03, size: rand(3, 6), shape: 'spark', decay: rand(0.012, 0.024) }),
  },
  WATER: {
    count: 30,
    colors: ['#3aa0ff', '#6fc3ff', '#bfe9ff', '#2f7fd6'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-1.8, 1.8), vy: rand(-3.6, -0.8), gravity: 0.06, size: rand(3, 8), shape: 'ring', decay: rand(0.01, 0.018) }),
  },
  EARTH: {
    count: 28,
    colors: ['#4caf6d', '#7ed99a', '#b98a4b', '#d8c48a'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-2.2, 2.2), vy: rand(-3.4, -1), gravity: 0.09, size: rand(4, 9), shape: 'leaf', spin: rand(-0.2, 0.2), decay: rand(0.008, 0.015) }),
  },
  AIR: {
    count: 30,
    colors: ['#b98cff', '#d9c2ff', '#eae3ff', '#9d7be0'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-2.6, 2.6), vy: rand(-2.4, 0.4), gravity: -0.01, size: rand(2, 5), shape: 'circle', swirl: rand(0.04, 0.12) * (Math.random() < 0.5 ? -1 : 1), decay: rand(0.01, 0.02) }),
  },
  GOLD: {
    count: 36,
    colors: ['#f5c451', '#ffe08a', '#ffd15c', '#d9a52f'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-2, 2), vy: rand(-4, -1), gravity: 0.08, size: rand(2, 5), shape: 'spark', decay: rand(0.01, 0.02) }),
  },
  ARTIFACT: {
    count: 40,
    colors: ['#f5c451', '#ffe08a', '#b98cff', '#fff'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-2.4, 2.4), vy: rand(-4.4, -1.2), gravity: 0.07, size: rand(2, 6), shape: 'spark', decay: rand(0.009, 0.018) }),
  },
  MYSTERY: {
    count: 26,
    colors: ['#16a085', '#5bd6bd', '#b98cff', '#c9f5e9'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-1.4, 1.4), vy: rand(-1.8, 0.6), gravity: -0.02, size: rand(6, 14), shape: 'circle', decay: rand(0.006, 0.012) }),
  },
  CHAOS: {
    count: 44,
    colors: ['#ff5b35', '#3aa0ff', '#4caf6d', '#b98cff', '#f5c451', '#ff4d6d'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-4.5, 4.5), vy: rand(-4.5, 4.5), gravity: 0.04, size: rand(3, 7), shape: pick(['circle', 'spark', 'ring']), spin: rand(-0.3, 0.3), decay: rand(0.01, 0.02) }),
  },
  PORTAL: {
    count: 46,
    colors: ['#5b3fb0', '#b98cff', '#3aa0ff', '#eae3ff'],
    // Spawned on a ring, drifting inward with swirl.
    make: (o, c) => {
      const ang = rand(0, Math.PI * 2)
      const r = rand(80, 150)
      return { ...base(o, c), x: o.x + Math.cos(ang) * r, y: o.y + Math.sin(ang) * r, vx: -Math.cos(ang) * rand(1.5, 3), vy: -Math.sin(ang) * rand(1.5, 3), swirl: rand(0.08, 0.16), size: rand(2, 5), shape: 'circle', decay: rand(0.008, 0.014) }
    },
  },
  LEGENDARY: {
    count: 52,
    colors: ['#f5c451', '#ffe08a', '#fff', '#b7791f'],
    make: (o, c) => {
      const ang = rand(0, Math.PI * 2)
      const speed = rand(2.5, 6)
      return { ...base(o, c), vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, gravity: 0.02, size: rand(2, 6), shape: 'spark', decay: rand(0.008, 0.016) }
    },
  },
  BATTLE: {
    count: 34,
    colors: ['#c0392b', '#ff5b35', '#f5c451', '#fff'],
    make: (o, c) => {
      const ang = rand(0, Math.PI * 2)
      const speed = rand(3, 7)
      return { ...base(o, c), vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, gravity: 0.05, size: rand(2, 5), shape: 'spark', decay: rand(0.012, 0.024) }
    },
  },
  ALLIANCE: {
    count: 30,
    colors: ['#2e86c1', '#3aa0ff', '#4caf6d', '#f5c451'],
    make: (o, c) => ({ ...base(o, c), vx: rand(-2.4, 2.4), vy: rand(-3.6, -0.8), gravity: 0.06, size: rand(3, 7), shape: 'ring', decay: rand(0.01, 0.018) }),
  },
}

export function useParticles(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particles = useRef<Particle[]>([])
  const raf = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  const resize = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    // .reveal-canvas is a fixed, full-viewport overlay, so its own rect is the drawing area.
    const rect = c.getBoundingClientRect()
    const w = rect.width || window.innerWidth
    const h = rect.height || window.innerHeight
    sizeRef.current = { w, h }
    c.width = Math.floor(w * DPR)
    c.height = Math.floor(h * DPR)
  }, [])

  const draw = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.save()
    ctx.scale(DPR, DPR)

    const live: Particle[] = []
    for (const p of particles.current) {
      p.vx += 0
      p.vy += p.gravity
      if (p.swirl) {
        // rotate velocity vector slightly for swirling motion
        const cos = Math.cos(p.swirl)
        const sin = Math.sin(p.swirl)
        const nvx = p.vx * cos - p.vy * sin
        const nvy = p.vx * sin + p.vy * cos
        p.vx = nvx
        p.vy = nvy
      }
      p.x += p.vx
      p.y += p.vy
      p.rot += p.spin
      p.life -= p.decay
      if (p.life <= 0) continue

      ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
      ctx.fillStyle = p.color
      const s = p.size * (0.5 + p.life * 0.5)

      if (p.shape === 'spark') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(Math.atan2(p.vy, p.vx))
        ctx.fillRect(-s, -s * 0.28, s * 2.2, s * 0.56)
        ctx.restore()
      } else if (p.shape === 'ring') {
        ctx.beginPath()
        ctx.lineWidth = Math.max(1, s * 0.28)
        ctx.strokeStyle = p.color
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.shape === 'leaf') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.beginPath()
        ctx.ellipse(0, 0, s, s * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2)
        ctx.fill()
      }
      live.push(p)
    }
    ctx.restore()
    particles.current = live

    if (live.length > 0) {
      raf.current = requestAnimationFrame(draw)
    } else {
      raf.current = null
      ctx.clearRect(0, 0, c.width, c.height)
    }
  }, [])

  const burst = useCallback(
    (kind: ParticleKind, origin?: Origin) => {
      if (!enabled) return
      const c = canvasRef.current
      if (!c) return
      resize()
      const { w, h } = sizeRef.current
      const o = origin ?? { x: w / 2, y: h * 0.42 }
      const preset = PRESETS[kind] ?? PRESETS.GOLD
      const room = MAX_PARTICLES - particles.current.length
      const n = Math.max(0, Math.min(preset.count, room))
      for (let i = 0; i < n; i++) {
        particles.current.push(preset.make(o, pick(preset.colors)))
      }
      if (raf.current == null) raf.current = requestAnimationFrame(draw)
    },
    [enabled, draw, resize],
  )

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (raf.current != null) cancelAnimationFrame(raf.current)
      raf.current = null
      particles.current = []
    }
  }, [resize])

  return { canvasRef, burst }
}
