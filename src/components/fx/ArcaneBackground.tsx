import { useReducedMotion } from '../../fx/useReducedMotion'
import type { Element } from '../../game/elements'
import { elementColor, glow } from '../../fx/theme'

/**
 * Fixed, full-viewport arcane backdrop mounted once at the app root. Layered radial rune-glows over
 * an obsidian base, plus a slow-drifting starfield and a rotating rune ring. All motion is
 * transform/opacity (compositor-only) and disabled under reduced motion. pointer-events: none so it
 * never intercepts taps. Optional `tint` shifts the ambient glow toward the player's element.
 */
export function ArcaneBackground({ tint }: { tint?: Element }) {
  const reduced = useReducedMotion()
  const c = tint ? elementColor(tint) : '#6b5cff'
  return (
    <div className="arcane-bg" aria-hidden style={{ ['--tint' as string]: c, ['--tint-glow' as string]: glow(c, 0.22) }}>
      <div className="arcane-bg-glow" />
      <div className={`arcane-bg-stars ${reduced ? 'still' : ''}`} />
      <div className={`arcane-bg-runes ${reduced ? 'still' : ''}`}>
        <svg viewBox="0 0 200 200" width="200" height="200">
          <circle cx="100" cy="100" r="92" fill="none" stroke={c} strokeWidth="0.6" opacity="0.4" strokeDasharray="2 14" />
          <circle cx="100" cy="100" r="70" fill="none" stroke={c} strokeWidth="0.5" opacity="0.3" strokeDasharray="10 8" />
        </svg>
      </div>
      <div className="arcane-bg-vignette" />
    </div>
  )
}
