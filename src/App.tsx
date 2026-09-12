import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { isConfigured } from './lib/supabase'
import { Home } from './pages/Home'
import { Register } from './pages/Register'
import { Game } from './pages/Game'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { Tag } from './pages/Tag'
import { Admin } from './pages/Admin'
import { Winner } from './pages/Winner'
import { Final } from './pages/Final'
import { CameraScanner } from './components/CameraScanner'
import { PhaseAnnouncer } from './components/PhaseAnnouncer'
import { ArcaneBackground } from './components/fx/ArcaneBackground'
import { pageVariants } from './fx/variants'

function NavIcon({ name }: { name: 'quest' | 'ranks' | 'scan' }) {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'quest') return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2.5 5.5L7 17l2.5-5.5z" fill="currentColor" stroke="none" /></svg>
  if (name === 'ranks') return <svg {...p}><path d="M6 4h12v5a6 6 0 0 1-12 0z" /><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" /></svg>
  return <svg {...p}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></svg>
}

function Nav() {
  const { pathname } = useLocation()
  const is = (p: string) => (pathname === p ? 'active' : '')
  return (
    <nav className="nav no-print">
      <Link className={is('/game')} to="/game"><span className="ico"><NavIcon name="quest" /></span>Quest</Link>
      <Link className={is('/leaderboard')} to="/leaderboard"><span className="ico"><NavIcon name="ranks" /></span>Ranks</Link>
      <Link className={is('/scan')} to="/scan"><span className="ico"><NavIcon name="scan" /></span>Scan</Link>
    </nav>
  )
}

function ConfigNotice() {
  return (
    <div className="app">
      <div className="notice">
        <strong>Backend not configured.</strong>
        <p className="muted">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in a{' '}
          <code>.env</code> file (see <code>.env.example</code>), then restart the dev server.
        </p>
      </div>
    </div>
  )
}

/** Animated route wrapper — fades/slides each page as the location changes. */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="enter" exit="exit">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game" element={<Game />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/scan" element={<CameraScanner />} />
          <Route path="/tag" element={<Tag />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/final" element={<Final />} />
          <Route path="/winner" element={<Winner />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  if (!isConfigured) return <ConfigNotice />
  return (
    <HashRouter>
      <ArcaneBackground />
      <AnimatedRoutes />
      <Nav />
      <PhaseAnnouncer />
    </HashRouter>
  )
}
