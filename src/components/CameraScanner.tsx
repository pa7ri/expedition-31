import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { ArcaneButton } from './fx/ArcaneButton'

/** Pull a marker code out of a decoded QR payload — accepts a full `#/tag?tag=CODE` URL or a bare code. */
function codeFromPayload(raw: string): string | null {
  const text = raw.trim()
  // Full marker URL: find the hash query and read ?tag= (matches tagUrl() in QRSheet.tsx).
  const hash = text.includes('#') ? text.slice(text.indexOf('#') + 1) : text
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const tag = new URLSearchParams(q).get('tag')
  if (tag) return tag.toUpperCase()
  // Bare code fallback: a short alphanumeric token (e.g. "A11F").
  if (/^[A-Za-z0-9]{2,8}$/.test(text)) return text.toUpperCase()
  return null
}

/**
 * Live in-browser QR scanner for the Scan screen. Streams the rear camera into a hidden canvas,
 * decodes frames with jsQR (works on iOS Safari, unlike the native BarcodeDetector), and navigates
 * to the resolved `/tag?tag=CODE` route on the first hit. Degrades to a manual code entry when the
 * camera is unavailable or permission is denied.
 */
export function CameraScanner() {
  const nav = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false

    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (stopped || !video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        raf = requestAnimationFrame(tick)
        return
      }
      const w = video.videoWidth
      const h = video.videoHeight
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.drawImage(video, 0, 0, w, h)
      const img = ctx.getImageData(0, 0, w, h)
      const found = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })
      const code = found ? codeFromPayload(found.data) : null
      if (code) {
        stopped = true
        stream?.getTracks().forEach((t) => t.stop())
        nav(`/tag?tag=${code}`)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This device or browser has no camera access. Enter a marker code below instead.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setError('Camera permission denied. Allow the camera in your browser, or enter a marker code below.')
      }
    }
    start()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [nav])

  const goManual = () => {
    const code = codeFromPayload(manual)
    if (code) nav(`/tag?tag=${code}`)
  }

  return (
    <div className="app">
      <div className="card center">
        <h2>Scan a marker</h2>
        <p className="muted">Point your camera at a marker's QR code — it opens automatically.</p>

        {!error && (
          <div className="scanner">
            <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
            <div className="scanner-reticle" aria-hidden />
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {error && <p className="muted" style={{ color: 'var(--danger, #ff6b6b)' }}>{error}</p>}

        <div className="stack" style={{ marginTop: 14 }}>
          <div className="muted" style={{ fontSize: 12 }}>Or enter a marker code manually</div>
          <input
            className="input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goManual()}
            placeholder="e.g. A11F"
            autoCapitalize="characters"
          />
          <ArcaneButton variant="primary" disabled={!codeFromPayload(manual)} onClick={goManual}>
            Open marker
          </ArcaneButton>
        </div>
      </div>
    </div>
  )
}
