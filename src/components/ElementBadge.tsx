import type { Element } from '../game/elements'
import { ELEMENT_INFO } from '../game/elements'

export function ElementBadge({ element, showLabel = true }: { element: Element; showLabel?: boolean }) {
  const info = ELEMENT_INFO[element]
  return (
    <span className="pill" style={{ borderColor: info.color, color: info.color }}>
      <span>{info.emoji}</span>
      {showLabel && <span className="tracked" style={{ fontSize: 12 }}>{info.label}</span>}
    </span>
  )
}
