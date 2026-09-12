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
import { PhaseAnnouncer } from './components/PhaseAnnouncer'
import { ArcaneBackground } from './components/fx/ArcaneBackground'
import { pageVariants } from './fx/variants'

function Nav() {
  const { pathname } = useLocation()
  const is = (p: string) => (pathname === p ? 'active' : '')
  return (
    <nav className="nav no-print">
      <Link className={is('/game')} to="/game"><span className="ico">🧭</span>Quest</Link>
      <Link className={is('/leaderboard')} to="/leaderboard"><span className="ico">🏆</span>Ranks</Link>
      <Link className={is('/scan')} to="/scan"><span className="ico">📲</span>Scan</Link>
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
          <Route path="/scan" element={<ScanHelp />} />
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

function ScanHelp() {
  return (
    <div className="app">
      <div className="card center">
        <h2>📲 Scan a marker</h2>
        <p className="muted">
          Hold your phone to an NFC marker, or scan its QR code with your camera. The marker will
          open the expedition and reveal what happens for your element.
        </p>
      </div>
    </div>
  )
}
