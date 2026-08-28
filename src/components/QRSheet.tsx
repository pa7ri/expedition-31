import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { TAGS } from '../game/tags'

/** Builds the full scan URL for a tag code using the current origin + hash route. */
export function tagUrl(code: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, '/')
  return `${base}#/tag?tag=${code}`
}

function QRCell({ code, title }: { code: string; title: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, tagUrl(code), { width: 180, margin: 1 })
  }, [code])
  return (
    <div className="qr-cell">
      <canvas ref={ref} />
      <div className="ttl">{title}</div>
      <div className="code">{code}</div>
    </div>
  )
}

/** Printable sheet of all tag QR codes (spec §19 admin, §34 step 19). */
export function QRSheet() {
  return (
    <div>
      <div className="grid-tags">
        {TAGS.map((t) => (
          <QRCell key={t.code} code={t.code} title={t.title} />
        ))}
      </div>
    </div>
  )
}
