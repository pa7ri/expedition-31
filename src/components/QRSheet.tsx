import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { TAGS, TAG_THEME, type TagDef } from '../game/tags'

/** Builds the full scan URL for a tag code using the current origin + hash route. */
export function tagUrl(code: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, '/')
  return `${base}#/tag?tag=${code}`
}

/**
 * A single printable sticker — a fantasy "trading card" for one physical marker. Ornate
 * border, serif title, big code, themed accent per tag type, and the QR in a framed well.
 */
function Sticker({ tag }: { tag: TagDef }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const theme = TAG_THEME[tag.type]

  useEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, tagUrl(tag.code), {
        width: 220,
        margin: 1,
        color: { dark: '#2a2016', light: '#f4e8cf' },
      })
    }
  }, [tag.code])

  return (
    <div className="sticker" style={{ ['--accent' as string]: theme.accent }}>
      <div className="sticker-frame">
        <div className="sticker-head">
          <span className="sticker-emblem">{theme.emblem}</span>
          <span className="sticker-kind">{theme.kind}</span>
        </div>
        <div className="sticker-title">{tag.title}</div>
        <div className="sticker-qr">
          <canvas ref={ref} />
        </div>
        <div className="sticker-code">{tag.code}</div>
        <div className="sticker-hint">{theme.hint}</div>
        <div className="sticker-foot">✦ EXPEDITION 31 ✦</div>
      </div>
    </div>
  )
}

/** Printable sheet of all tag stickers (spec §19 admin, §34 step 19). */
export function QRSheet() {
  return (
    <div className="sticker-sheet">
      {TAGS.map((t) => (
        <Sticker key={t.code} tag={t} />
      ))}
    </div>
  )
}
