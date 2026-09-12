import type { TagType } from '../../game/tags'

/**
 * Small monochrome line-glyph for each marker type. Drawn with `currentColor` so it inherits the
 * sticker's accent (or any text color), and uses only strokes/fills that print cleanly — this
 * replaces the emoji emblem on the printable QR stickers with a game-like sigil.
 */
export function TagGlyph({ type, size = 22 }: { type: TagType; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (type) {
    case 'ENERGY': // faceted gem
      return (
        <svg {...common}>
          <path d="M6 4h12l3 5-9 11L3 9z" />
          <path d="M3 9h18M9 4l3 16M15 4l-3 16" />
        </svg>
      )
    case 'BATTLE': // crossed swords
      return (
        <svg {...common}>
          <path d="M5 3l10 10M3 17l4-4M7 21l-4-4" />
          <path d="M19 3L9 13M21 17l-4-4M17 21l4-4" />
        </svg>
      )
    case 'ALLIANCE': // interlocked rings
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </svg>
      )
    case 'ARTIFACT': // amulet / eye
      return (
        <svg {...common}>
          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'MYSTERY': // puzzle sigil / interlocking triangles
      return (
        <svg {...common}>
          <path d="M12 3l8 14H4z" />
          <path d="M12 21l-8-14h16z" opacity="0.55" />
        </svg>
      )
    case 'LEGENDARY': // crown
      return (
        <svg {...common}>
          <path d="M3 8l4 8h10l4-8-5 4-4-6-4 6z" />
          <path d="M6 19h12" />
        </svg>
      )
    case 'CHAOS': // die face
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'PORTAL': // inward spiral
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 1-6.4 15.3A7 7 0 1 0 12 6a5 5 0 1 1 3.5 8.5A3 3 0 1 0 12 10" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}
