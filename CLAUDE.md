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

Deployment is automated: pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) which builds with `BASE_PATH=/<repo-name>/` and publishes to GitHub Pages. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read from repo secrets at build time.

## Architecture

### One-file React app

Almost the entire application — game logic, screens, components, icons, CSS, sound engine, auth — lives in [src/App.jsx](src/App.jsx) (~8000 lines). The other source files are deliberately minimal:

- [src/main.jsx](src/main.jsx) — entry; dynamically imports `@supabase/supabase-js` and attaches a client to `window.supabase` when env vars are present. App reads from `window.supabase`, not from a module import.
- [src/supabase.js](src/supabase.js) — a separate, currently-unused tournament-sharing helper (sessions/submissions tables). The active auth path lives inside the `auth` object in App.jsx and references `window.supabase` directly.

When adding logic, prefer extending `App.jsx` rather than splitting into new files unless the work is genuinely separable — the colocation is intentional and matches how the rest of the codebase is organized.

### Top-level state lives in `App()` (bottom of App.jsx, ~line 7675)

The root `App` component owns:
- Screen routing via a `scr` string state (no router library — every screen is a conditional `{scr==='x' && <Screen/>}` block).
- All persisted state: profile, match scoreboards (`bo3`, `am` via `useReducer`), tournament, theme, ringId, inputMode, voice settings.
- Every persisted state has a paired `useEffect` that writes to `localStorage` via the `lsGet`/`lsSet` helpers (search for `ritmo_*` keys to see the persisted shape).

Screens are pure components driven by props/callbacks from `App()`. Navigation = `setScr(name)`. There is a `nav()` callback that special-cases `'rules'`/`'journey'` to skip landing pages when the user has already read them.

### Game logic — two reducers

Score state is computed by pure reducers near the top of App.jsx:

- **Best-of-3** ([App.jsx:183](src/App.jsx#L183) `bo3R`): full padel scoring — points (0/15/30/40), advantage/deuce, optional "Golden Point" mode (activated after N deuces via `cfg.goldenPointAfter`), 6-game sets with tiebreak at 6-6, best-of-3 sets. Each action pushes a snapshot to `s.hist` for UNDO.
- **Americano** ([App.jsx:220](src/App.jsx#L220) `amR`): point-based scoring to a configurable limit (`s.limit`, default 21) with a `TIME_UP` action used by the round timer.

When changing scoring rules, edit the reducer — the `Match` screen is a thin shell over `dBo3`/`dAm`.

### Tournament logic

[`genAmericanoRound`](src/App.jsx#L247), [`genMexicanoRound`](src/App.jsx#L286), and [`calcLeaderboard`](src/App.jsx#L315) implement pairing and standings:

- **Americano**: random pairings; avoids partner-repeats for up to 60 attempts, then falls back to allowing repeats. Fair sit-out (players with fewest prior sit-outs sit out next).
- **Mexicano**: pairings driven by current leaderboard standings (1+4 vs 2+3 per court group of 4).
- **Sit-out compensation**: in `points` mode, sit-outs get the per-round median score as `bonusPts`; in `wins` mode, lower-half players get `+1 win per sit-out`. Bonuses are kept on separate fields (`bonusPts`/`bonusWins`) and only folded into `totalPts`/`totalWins` at the end.

### Theming

Five themes (`dark`, `light`, `padel`, `wimbledon`, `funky`) are defined as CSS variable sets in the `CSS` template literal at the top of App.jsx. The `T` object (line 6) is the JS mirror — components use `T.bg`, `T.card`, etc., which all resolve to `var(--bg)` etc. The active theme is set via `document.documentElement.setAttribute('data-theme', theme)` plus a sync of the `--bg` value to `<body>` background and the `theme-color` meta tag (so iOS/Android system chrome matches).

When adding a styled element: use the `T.*` tokens. Never hardcode hex colors in components — the theme switch will break.

### Auth — Supabase real / mock fallback

The `auth` object ([App.jsx:425](src/App.jsx#L425)) reads `window.supabase` (set up in main.jsx). If absent (no env vars), every method falls back to a localStorage mock so the app is fully usable for preview/dev without any Supabase setup. `auth.isReal` is the runtime check. When editing auth flows, ensure both branches stay in sync.

The Supabase-backed tournament sharing helpers in [src/supabase.js](src/supabase.js) target tables defined in [supabase/schema.sql](supabase/schema.sql) (`ritmo_sessions`, `ritmo_submissions`) — currently wired to a "Coming soon" placeholder screen (`scr==='remote'`).

### Input modes & ring/voice

`inputMode` (`smartphone` | `ring` | `presenter`) changes the `Match` screen's input. For `ring`/`presenter`, a single app-level `KeyCapture` component lives in `App()` and forwards keys via a ref (`matchKeyRef`) — this is deliberate: the capture must not unmount when `Match` re-renders (e.g. on `bigScreen` toggle), otherwise focus is lost mid-game.

`playRing(id)` ([App.jsx:384](src/App.jsx#L384)) generates short sound effects via Web Audio API (no audio files). `voiceOn`/`voiceBaseUrl` enables HTTP-loaded `.mp3` announcements keyed by event (e.g. `match-a.mp3`, `satz-b.mp3`, `game-a.mp3`) — see the `announce` callback in `Match` for the event taxonomy.

## Conventions specific to this codebase

- **Code is dense / golf-like on purpose** — short identifiers (`s`, `a`, `h`, `gA`, `pA`), inline ternaries, single-letter reducer types. Match the surrounding style rather than expanding for readability.
- **No TypeScript, no PropTypes** — props are documented by destructuring defaults.
- **Inline styles only.** There is no CSS file beyond the `<style>{CSS}</style>` block injected by `App()`. Component styling is JS objects passed to `style={...}`.
- **All copy is German.** UI labels, error messages, comments are written in German (the audience is the Padel community in DACH). Preserve language when editing strings.
- **Single-source-of-truth deploy URL**: in dev `BASE_PATH` is `/`; in GH Pages CI it is `/<repo>/`. `main.jsx` injects `window.__BASE__` so OAuth redirect URIs work in both.
- **No sensitive committing**: `.env.local` is gitignored — Supabase keys go there locally and in GitHub Actions secrets for CI.
