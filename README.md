# 🧭 Expedition 31 — Elemental Birthday Quest

A location-based social party game for ~14 players across two bars. Every player picks an
element (🔥 Fire / 💧 Water / 🌿 Earth / 🌪️ Air) that decides who they beat, what powers they
get, and how each physical NFC/QR marker reacts to them. Collect **Energy**; the highest score
wins. Built as a static React app on GitHub Pages with a Supabase backend — no server, no domain,
no paid infrastructure.

## The element circle

```
🔥 FIRE  >  🌪️ AIR  >  🌿 EARTH  >  💧 WATER  >  🔥 FIRE
```

Each element beats the next clockwise and loses to the previous. That's the only rule players
need to remember.

## Tech

- **React + TypeScript + Vite**, deployed to **GitHub Pages** (HashRouter so `?tag=` deep links work statically).
- **Supabase** (free) for the database and data access.
- **NTAG215** NFC tags + printable **QR** fallback for every marker.

---

## 1. Setup

### a. Install

```bash
npm install
```

### b. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a free project.
2. In the dashboard: **SQL Editor → New query**, paste and run `supabase/schema.sql`, then
   run `supabase/seed.sql` (seeds the 20 markers + the portal tag).
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key.

### c. Configure env

```bash
cp .env.example .env
# edit .env and paste your URL + anon key
```

### d. Run

```bash
npm run dev
```

Open the printed URL. If you see "Backend not configured", your `.env` is missing or the dev
server needs a restart.

---

## 2. Deploy to GitHub Pages

The app is configured for the repo path `/expedition-31/` (see `vite.config.ts` `base` and
`package.json` `homepage`). If your repo name differs, update both.

```bash
npm run deploy
```

This builds and pushes `dist/` to the `gh-pages` branch. Then in the repo:
**Settings → Pages → Build and deployment → Source = Deploy from a branch → `gh-pages` / root.**

Your app will be live at `https://<user>.github.io/expedition-31/`.

> **Env at build time:** GitHub Pages serves static files, so the Supabase URL/anon key are baked
> into the build. Set them in your local `.env` before `npm run deploy` (the anon key is public by
> design — that's expected for this "light anti-cheat" party game).

---

## 3. Program the markers

Every marker (NFC tag or QR) points at:

```
https://<user>.github.io/expedition-31/#/tag?tag=CODE
```

- **QR codes:** open `/#/admin` → **qr** tab → **Print QR sheet**. Cut out, place each at its marker.
- **NFC tags (NTAG215):** use a phone app like *NFC Tools* to write the same URL to each tag. Match
  the `CODE` to the tag's purpose (codes are listed in the admin **tags** tab and in `src/game/tags.ts`).

### Marker inventory (20 codes, 10 interactive)

| Type | Codes | Notes |
|------|-------|-------|
| 💰 Energy | `A11F` `A22E` `A33S` `A44Z` | Per-element payout, balanced to 400 total per element |
| ⚔️ Battle | `B01D` `B02D` `B03D` | Pick a rival; the circle decides |
| 🤝 Alliance | `C01R` `C02R` `C03R` | Two players scan within 120 s |
| 🧿 Artifact | `D01A` `D02A` `D03A` | One-time powers |
| 🧩 Mystery | `E01T` (Temple, group) `E02M` `E03M` | Temple needs all 4 elements |
| 👑 Legendary | `F01C` (Convergence) `F02X` (Collapse) | Bar 2 only |
| 🎲 Chaos | `G01H` | Element-independent gamble |
| 🌑 Portal | `P0RT` | Bar 1 → Bar 2 transition |

> **Interactive markers** (require a follow-up action after scanning): the 3 Battle, 3 Alliance,
> Temple, Convergence, Collapse, and Chaos tags = **10**. The rest resolve instantly on scan.
> All 20 codes fit the original 20-tag NTAG215 budget (the portal is included).

---

## 4. Running the party

Everything is driven from **`/#/admin`** (bookmark it — there's no link from the player UI).

1. **SETUP** — players open the app, register (name + element). No markers active yet.
2. **BAR_1** — advance the phase. Energy / battle / alliance / artifact / mystery / chaos go live.
   Midway, tell everyone "the elements have awakened."
3. **TRANSITION** — advance. Only the Portal tag scans; each element walks together to Bar 2.
4. **BAR_2** — advance. Everything reopens **plus** the two Legendary markers.
5. **FINAL** — advance, then send everyone to **`/#/final`** for the private gamble.
6. **ENDED** — reveal **`/#/winner`** on a big screen.

Admin controls: manual ±50/±100, freeze a player, confirm a secret mission (+150), enable/disable
individual tags, watch the live event log, print QR codes, reset or end the game.

### Reward reference

- Energy: +75…+125 by element (each element nets 400 across the 4 energy tags).
- Battle: winner +150, loser −75.
- Alliance: different elements +100 each, same +25 each.
- Temple / full group: +200 each.
- Convergence: SHARE +300 each, or BETRAY = betrayer +600 / others +150.
- Collapse: chosen element's players −150.
- Chaos: 40% +100, 30% −100, 5% +500 jackpot, 25% halve.
- Final gamble: **Stability** keep · **Power** 50%→+75% else −25% · **Chaos** 33%→×3 else −50%.

---

## 5. Test the whole game without NFC tags

**You don't need the physical tags to test.** An NFC tag does exactly one thing: it opens a URL.
Scanning a tag is identical to opening its URL in a browser:

```
http://localhost:5173/expedition-31/#/tag?tag=A11F      ← same as scanning marker A11F
```

So you can play the entire game by clicking URLs (or by scanning the QR codes on the printable
sheet in **Admin → qr**, using your phone camera — those encode the same URLs).

### Simulating several players on one machine

Each player's identity is a token in that browser's `localStorage`, so **one player = one browser
profile**. To be 4 players at once, use 1 normal window + 3 incognito windows (or 4 different
browsers). Register a different element in each.

### A full solo run

Bookmark the admin panel: `http://localhost:5173/expedition-31/#/admin` (there's no link to it
from the player UI).

| # | Do this | Expected |
|---|---------|----------|
| 1 | Admin → **phases** tab → **Bar 1** | Markers go live |
| 2 | Register 🔥/💧/🌿/🌪️ in 4 windows | Each starts at ⚡100 |
| 3 | Open `#/tag?tag=A11F` | 🔥+100 · 💧+75 · 🌿+125 · 🌪️+100 |
| 4 | Open `#/tag?tag=B01D`, pick a rival | Circle decides: winner +150, loser −75; re-scan blocked |
| 5 | Open `#/tag?tag=D01A` | Artifact lands in inventory |
| 6 | Open `#/tag?tag=C01R` in **two** windows within 120 s | Different elements +100 each |
| 7 | Open `#/tag?tag=E01T` in **all four** windows within 120 s | Temple unites → +200 each |
| 8 | Try `#/tag?tag=F01C` now | Blocked — Legendary is Bar 2 only |
| 9 | Admin → advance to **Bar 2** | Legendary unlocks |
| 10 | `#/tag?tag=F01C` (all four) → **Share** or **Betray** | Share +300 each / Betray +600 vs +150 |
| 11 | `#/tag?tag=F02X` → destroy an element | Those players −150 |
| 12 | `#/tag?tag=G01H` → Roll | Weighted dice outcome |
| 13 | Admin → advance to **Final**; each player opens `#/final` | Private gamble; scores lock |
| 14 | Open `#/winner` | 🏆 Champion reveal |
| 15 | Admin → danger zone → **Reset game** | Clean slate for the real party |

Also confirm: admin ±50/±100, freeze, and confirm-mission (+150) work; the leaderboard shows only
name + element + score + rank (missions and artifacts stay secret).

> All tag codes are listed in the marker table above and in `src/game/tags.ts`. When your NTAG215
> tags arrive, write each tag its URL (`…/#/tag?tag=CODE`) with an app like *NFC Tools* — the game
> behaves exactly as it did in this test.

---

## Project structure

```
src/
  components/  ElementBadge, PlayerCard, Leaderboard, QRSheet
  pages/       Home, Register, Game, LeaderboardPage, Tag, Final, Winner, Admin
  game/        elements.ts, tags.ts, scoring.ts, phases.ts, challenges.ts   (pure logic)
  lib/         supabase.ts, session.ts, api.ts, usePlayer.ts               (data + state)
supabase/      schema.sql, seed.sql
```

Game rules live in `src/game/` as pure functions; all database access is centralized in
`src/lib/api.ts`.
