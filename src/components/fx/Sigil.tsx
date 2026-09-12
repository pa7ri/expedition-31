import { ELEMENT_INFO, type Element } from '../../game/elements'
import { elementColor } from '../../fx/theme'

/**
 * An animated SVG rune/sigil per element. Draws a rotating outer ring, an inner glyph ring, and the
 * element emoji at center. Pure CSS animation (rune-spin) so it's cheap; sizes via `size` px.
 */
export function Sigil({
  element,
  size = 72,
  spin = true,
  color,
}: {
  element: Element
  size?: number
  spin?: boolean
  color?: string
}) {
  const c = color ?? elementColor(element)
  const info = ELEMENT_INFO[element]
  return (
    <span
      className="sigil"
      style={{ width: size, height: size, ['--sig' as string]: c }}
      aria-label={info.label}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className={spin ? 'sigil-ring' : ''}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" />
        <circle cx="50" cy="50" r="46" fill="none" stroke={c} strokeWidth="2.5" opacity="0.9"
          strokeDasharray="6 10" />
        <g opacity="0.7">
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            const x1 = 50 + Math.cos(a) * 38
            const y1 = 50 + Math.sin(a) * 38
            const x2 = 50 + Math.cos(a) * 44
            const y2 = 50 + Math.sin(a) * 44
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" />
          })}
        </g>
      </svg>
      <span className="sigil-glyph" style={{ fontSize: size * 0.4 }}>{info.emoji}</span>
    </span>
  )
}
