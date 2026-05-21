# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build → /dist (set BASE_PATH for sub-path deploys)
npm run preview    # preview built /dist
```

There are no lint, test, or typecheck scripts — this is a plain JS (no TypeScript) Vite + React 18 app with no test suite. When verifying changes, run `npm run build` to catch syntax errors and start `npm run dev` to exercise the UI manually.

Deployment is automated: pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) which builds and publishes to GitHub Pages. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read from repo secrets at build time.

- **Project page** (`https://<user>.github.io/<repo>/`): default. Workflow uses `BASE_PATH=/<repo>/`.
- **Custom domain** (e.g. `https://ritmopadel.app/`): set the repository *variable* `CUSTOM_DOMAIN` (Settings → Secrets and variables → Actions → Variables). The workflow then switches `BASE_PATH=/` and writes `dist/CNAME` on every deploy so the binding persists. DNS + Supabase URL changes are documented in `setup.txt`.

## Architecture

### Source layout

Pure / side-effect-free modules have been extracted from the original mega-file. Screens and the root component still live colocated in `src/App.jsx`, which keeps the UI graph easy to read while letting tests and consumers reuse the small pieces.

| File | What lives there | Notes |
|------|------------------|-------|
| [src/main.jsx](src/main.jsx) | Entry point. Dynamically imports `@supabase/supabase-js` and attaches a client to `window.supabase`. Injects `window.__BASE__`. | The `auth` module reads `window.supabase` at call time, not import time. |
| [src/App.jsx](src/App.jsx) | All screens, modal components, the `<App/>` root that wires routing/state. | ~8500 lines. Adding a new screen → add it here. |
| [src/theme.js](src/theme.js) | `T` token mirror, `CSS` template literal with all 5 theme variable sets, palette helpers (`hexToRgb`, `rgba`, `luminance`, `shiftColor`, `buildThemePalette`). | Source of truth for visual constants. |
| [src/utils.js](src/utils.js) | `lsGet` / `lsSet` (safe localStorage), `getAssetBase`, `getInitials`, `readImageAsDataUrl`, `resizeImage`. | Pure JS; no React. |
| [src/levels.js](src/levels.js) | `getLevelLabel` / `getLevelTier` / `getLevelColor` (L1..L7 mapping) and `estimateLevel(profile)` for the RITMO questionnaire. | Pure functions; safe to import anywhere. |
| [src/game.js](src/game.js) | `bo3R` / `amR` reducers + initial states `B0` / `A0` + helpers `ptD`, `wG`. | Pure; UI-agnostic. |
| [src/tournament.js](src/tournament.js) | `genAmericanoRound`, `genMexicanoRound`, `calcLeaderboard`, `PCOLS`, `shuffle`. | Pure round-generation + standings. |
| [src/audio.js](src/audio.js) | `RINGS` config + `playRing(id)` synthesised via Web Audio API. | No audio files. |
| [src/auth.js](src/auth.js) | `auth.*` methods + `sb()` wrapper around `window.supabase`. Email-only, password-validated. No localStorage mock fallback. | `ritmo` / `padelhaus` is a deliberate dev bypass. |
| [src/icons.jsx](src/icons.jsx) | Every small SVG glyph + brand logos. | Imports `T` from theme; uses `getAssetBase()` for PNG fallback paths. |
| [src/padelStyles.js](src/padelStyles.js) | `PADEL_STYLES` (6 archetypes), `PADEL_QUIZ`, `computeStyle`, `STYLE_IMAGES`. | Content/data; no React. |
| [src/db.js](src/db.js) | Profile load/save + match logging + online tournament helpers (publish/subscribe/score-submit/ready-check). | Talks to Supabase via `window.supabase`. |
| [src/skillDescriptions.js](src/skillDescriptions.js) | `SKILL_DESCRIPTIONS` — text for the RITMO DNA Skill tier card. | Translation-ready content. |
| [src/supabase.js](src/supabase.js) | Older standalone tournament-sharing helper (legacy). | Currently unused by the active flow. |

When adding logic:
1. **Pure helper, reusable, no React?** → put it in (or extend) one of the small modules above.
2. **Screen, modal, top-level state?** → add it to `App.jsx`. Colocation here is deliberate — the screens share many small inline subcomponents and styles.

### Top-level state lives in `App()` (bottom of App.jsx)

The root `App` component owns:
- Screen routing via a `scr` string state (no router library — every screen is a conditional `{scr==='x' && <Screen/>}` block).
- All persisted state: profile, match scoreboards (`bo3`, `am` via `useReducer`), tournament, theme, ringId, inputMode, voice settings.
- Every persisted state has a paired `useEffect` that writes to `localStorage` via the `lsGet`/`lsSet` helpers from `src/utils.js` (search for `ritmo_*` keys to see the persisted shape).

Screens are pure components driven by props/callbacks from `App()`. Navigation = `setScr(name)`. There is a `nav()` callback that special-cases `'rules'`/`'journey'` to skip landing pages when the user has already read them.

### Game logic — two reducers

Score state is computed by pure reducers in [`src/game.js`](src/game.js):

- **Best-of-3** (`bo3R`): full padel scoring — points (0/15/30/40), advantage/deuce, optional "Golden Point" mode (activated after N deuces via `cfg.goldenPointAfter`), 6-game sets with tiebreak at 6-6, best-of-3 sets. Each action pushes a snapshot to `s.hist` for UNDO.
- **Americano** (`amR`): point-based scoring to a configurable limit (`s.limit`, default 21; `lim<=0` = ∞ mode) with a `TIME_UP` action used by the round timer.

When changing scoring rules, edit the reducer — the `Match` screen is a thin shell over `dBo3`/`dAm`.

### Tournament logic

[`genAmericanoRound`](src/tournament.js), `genMexicanoRound`, and `calcLeaderboard` in [`src/tournament.js`](src/tournament.js) implement pairing and standings:

- **Americano**: random pairings; avoids partner-repeats for up to 60 attempts, then falls back to allowing repeats. Fair sit-out (players with fewest prior sit-outs sit out next).
- **Mexicano**: pairings driven by current leaderboard standings (1+4 vs 2+3 per court group of 4).
- **Sit-out compensation**: in `points` mode, sit-outs get the per-round median score as `bonusPts`; in `wins` mode, lower-half players get `+1 win per sit-out`. Bonuses are kept on separate fields (`bonusPts`/`bonusWins`) and only folded into `totalPts`/`totalWins` at the end.

### Theming

Five themes (`dark`, `light`, `padel`, `wimbledon`, `funky`) are defined as CSS variable sets in the `CSS` template literal in [`src/theme.js`](src/theme.js). The `T` object is the JS mirror — components use `T.bg`, `T.card`, etc., which all resolve to `var(--bg)`. The active theme is set via `document.documentElement.setAttribute('data-theme', theme)` plus a sync of the `--bg` value to `<body>` background and the `theme-color` meta tag (so iOS/Android system chrome matches).

When adding a styled element: use the `T.*` tokens. Never hardcode hex colors in components — the theme switch will break.

### Auth — Supabase only

The `auth` object in [`src/auth.js`](src/auth.js) reads `window.supabase` (set up in `main.jsx`). If the client is missing, every method throws `SUPA_MISSING` immediately — there is no localStorage mock fallback. The single non-Supabase code path is the dev bypass: signing in as `ritmo` / `padelhaus` returns a synthetic test user without calling Supabase.

The tournament-sharing helpers in [src/db.js](src/db.js) target tables defined in [supabase/schema.sql](supabase/schema.sql) (`ritmo_sessions`, `ritmo_submissions`, `ritmo_profiles`, `ritmo_matches`). Row Level Security is enabled on the user-owned tables (`ritmo_profiles`, `ritmo_matches`) with `auth.uid() = user_id` policies; `ritmo_sessions` and `ritmo_submissions` are public on purpose (PIN-protected, no PII).

### Input modes & ring/voice

`inputMode` (`smartphone` | `ring` | `presenter`) changes the `Match` screen's input. For `ring`/`presenter`, a single app-level `KeyCapture` component lives in `App()` and forwards keys via a ref (`matchKeyRef`) — this is deliberate: the capture must not unmount when `Match` re-renders (e.g. on `bigScreen` toggle), otherwise focus is lost mid-game.

`playRing(id)` (in [`src/audio.js`](src/audio.js)) generates short sound effects via Web Audio API (no audio files). `voiceOn`/`voiceBaseUrl` enables HTTP-loaded `.mp3` announcements keyed by event (e.g. `match-a.mp3`, `satz-b.mp3`, `game-a.mp3`) — see the `announce` callback in `Match` for the event taxonomy.

## Conventions specific to this codebase

- **Code is dense / golf-like on purpose** — short identifiers (`s`, `a`, `h`, `gA`, `pA`), inline ternaries, single-letter reducer types. Match the surrounding style rather than expanding for readability.
- **No TypeScript, no PropTypes** — props are documented by destructuring defaults.
- **Inline styles only.** There is no CSS file beyond the `<style>{CSS}</style>` block injected by `App()`. Component styling is JS objects passed to `style={...}`.
- **All copy is German.** UI labels, error messages, comments are written in German (the audience is the Padel community in DACH). Preserve language when editing strings.
- **Single-source-of-truth deploy URL**: in dev `BASE_PATH` is `/`; in GH Pages CI it is `/<repo>/`. `main.jsx` injects `window.__BASE__` so OAuth redirect URIs work in both.
- **No sensitive committing**: `.env.local` is gitignored — Supabase keys go there locally and in GitHub Actions secrets for CI.
- **Security defaults**:
  - User-supplied images are re-encoded as JPEG via canvas before persistence (strips EXIF/geo).
  - `lsGet` / `lsSet` swallow exceptions so quota errors / private mode don't crash the UI.
  - Auth input validation (email regex, password length ≥ 8) lives in `src/auth.js`, before the Supabase call.
  - RLS policies on user-owned tables enforce ownership server-side; never trust client-side filtering for privacy.
