# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server on http://localhost:5180
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
| [src/theme.js](src/theme.js) | `T` token mirror, `CSS` template literal with the theme variable sets + font tokens, palette helpers (`hexToRgb`, `rgba`, `luminance`, `shiftColor`, `buildThemePalette`). | Source of truth for visual constants. |
| [src/utils.js](src/utils.js) | `lsGet` / `lsSet` (safe localStorage), `getAssetBase`, `getInitials`, `readImageAsDataUrl`, `resizeImage` + der Papierkorb (`purgeTrash`, `trashDaysLeft`, `TRASH_DAYS`). | Pure JS; no React. |
| [src/levels.js](src/levels.js) | `getLevelLabel` / `getLevelTier` / `getLevelColor` (L1..L7 mapping) and `estimateLevel(profile)` for the RITMO questionnaire. | Pure functions; safe to import anywhere. |
| [src/game.js](src/game.js) | `bo3R` / `amR` reducers + initial states `B0` / `A0` + helpers `ptD`, `wG`. | Pure; UI-agnostic. |
| [src/tournament.js](src/tournament.js) | `genAmericanoRound`, `genMexicanoRound`, `calcLeaderboard`, `PCOLS`, `shuffle`. | Pure round-generation + standings. |
| [src/audio.js](src/audio.js) | `RINGS` (timer tones) + `CUES` (the three court calls behind the speaker button in a running tournament) plus `playRing(id)` / `playCue(id)`, synthesised via Web Audio API. | Two ring tones are mp3; everything else is synthesised, no asset. |
| [src/auth.js](src/auth.js) | `auth.*` methods + `sb()` wrapper around `window.supabase`. Email-only, password-validated. No localStorage mock fallback. | `ritmo` / `padelhaus` is a deliberate dev bypass. |
| [src/icons.jsx](src/icons.jsx) | Every small SVG glyph + brand logos. | Imports `T` from theme; uses `getAssetBase()` for PNG fallback paths. |
| [src/padelStyles.js](src/padelStyles.js) | `PADEL_STYLES` (6 archetypes), `PADEL_QUIZ`, `computeStyle`, `STYLE_IMAGES`. | Content/data; no React. |
| [src/db.js](src/db.js) | Profile load/save + match logging + online tournament helpers (publish/subscribe/score-submit/ready-check). | Talks to Supabase via `window.supabase`. |
| [src/ocr.js](src/ocr.js) | On-device OCR (tesseract.js, lazy-loaded) plus the name-extraction heuristic (`lineToName`, `namesFromText`) behind "Aus Screenshot übernehmen" in the tournament setup. | Worker, WASM core and language data are all same-origin — the CDN defaults would fail the CSP. Der Dateidialog geht im **Aufrufer** auf (Assistent bzw. Formular), nicht im `PlayerScanSheet`: ein programmatischer Klick auf ein `file`-Input braucht die Nutzergeste, und die ist nach Mount + Effekt nicht mehr sicher da. Das Sheet bekommt die Auswahl als `initialFiles` und startet direkt in `work`. |
| [src/legal.js](src/legal.js) | Impressum, Datenschutzerklärung, Nutzungsbedingungen, Haftung und Lizenzhinweise als Datenblöcke; `OPERATOR` / `PROCESSORS` halten die vor dem Launch auszufüllenden Betreiberangaben. | Rendered by `SettingsRechtliches`. Keep in sync when data processing changes. |
| [src/tourneyPdf.js](src/tourneyPdf.js) | Turnier-Export als A4-PDF (Endstand, Sieger, Rundenverlauf) und `exportTourneyPdf` (Share-Sheet bzw. Download). | jsPDF wird per `import()` nachgeladen; eigene Schriften unter [src/fonts/pdf/](src/fonts/pdf/). |
| [src/courtLayout.js](src/courtLayout.js) | Raeumliche Anordnung der Courts: `defaultLayout`, `normLayout`, `layoutBounds`, `moveTo`, `rotateCourt`, `compactLayout`. | Reines Raster (4 x 5), keine React-Abhaengigkeit. Gezeichnet wird in `CourtMap` (App.jsx). |
| [src/events.js](src/events.js) | `EVENTS` (die Termine der Startseite, von Hand gepflegt) + `upcomingEvents`, `eventLabel`, `eventIcs` (Kalenderdatei), `eventMapsUrl`. | Nur kommende Events werden gezeigt; neue Termine einfach anhaengen. |
| [src/whatsNew.js](src/whatsNew.js) | `RELEASES` (die Ausgaben des Update-Newsletters) + `unseenRelease(seen)`. | Inhalt/Daten; die Regeln fuer neue Ausgaben stehen im Dateikopf. |
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

- **Best-of-3** (`bo3R`): full padel scoring — points (0/15/30/40), advantage/deuce, optional "Golden Point". **Rules are configurable via an optional `s.cfg`** = `{setsToWin, gamesPerSet, tbAt, tbPoints, noDecider}` (seed with `makeBo3(cfg)`). When `cfg` is absent the `DEFCFG` values apply (6-game sets, TB at 6-6, best-of-3) — so the classic `Match` screen, which never sets cfg, is byte-identical. `noDecider` plays exactly 2 sets then decides on total games, then a 7-pt match-TB. Each action pushes a snapshot to `s.hist` for UNDO.
- **Americano** (`amR`): point-based scoring to a configurable limit (`s.limit`, default 21; `lim<=0` = ∞ mode) with a `TIME_UP` action used by the round timer. Seed with `makeAm(limit)`.

When changing scoring rules, edit the reducer — the `Match` screen is a thin shell over `dBo3`/`dAm`.

### Tournament logic

[`genAmericanoRound`](src/tournament.js), `genMexicanoRound`, and `calcLeaderboard` in [`src/tournament.js`](src/tournament.js) implement pairing and standings:

- **One optimizer, all free formats** (`anneal`): multi-start hill climbing on a seating order — several random starts, then swap two seats while it gets cheaper. Used by Americano, Team-Americano, Mixicano and King of the Court's first round. It replaced the old "shuffle, check, retry up to 60 times, then give up and take pure random" — which gave up exactly in the late rounds, where structure matters most.
  - `cells` are the seats that form one court; a swap touches at most two of them, and only those are re-scored. With a full re-score per trial swap a 24-player round took ~90 ms — a visible stutter on a phone at every round change. `meetCost(history,prior,ids)` additionally precomputes the pair costs into a flat table, because building a key string per lookup was the rest of the time.
  - **Never seed the optimizer with the unchanged list.** In round 1 nothing has been played, every arrangement costs 0, and the first candidate examined wins — which was the sign-up order, tournament after tournament: 1+2 vs 3+4 on court 1. The first candidate is always a shuffled one.
- **Costs** (`meetCost`) are a *ranking*, not a trade-off: `W_PARTNER` (60) ≫ `W_OPP` (8) ≫ `W_MEET` (1). `W_MEET` counts every meeting regardless of side and is what makes "jeder gegen jeden" actually happen — without it two people who were partners three times are free as opponents. The gaps have to stay large: a court has two partner pairs but four opponent pairs, so with narrower weights four small savings buy a partner repeat (seen at 8 players / 7 rounds, where every pair can partner exactly once and a repeat is obvious).
- **Americano**: fair sit-out (players with fewest prior sit-outs sit out next, random tie-break), then the optimizer.
- **Mexicano / Team-Mexicano**: pairings driven by current leaderboard standings (1+4 vs 2+3 per court group of 4; team rank = sum of both members' positions). The standings order is *not* negotiable — the only freedom is the order among players on equal scores, and that is what the optimizer is allowed to permute (`blocks`). Round 1 is one big tie, which is why it used to be the sign-up list playing itself. Ranking uses the leaderboard's own order, not `pts`: pause bonuses and host corrections are already folded into it.
- **Team-Americano**: fixed pairs, so the promise is "every team against every other". Optimized on matchup repeats (`W_MATCH`) plus the player-level opponent costs inside them. Measured over 20 simulated tournaments at 12 players / 3 courts / 9 rounds: matchup coverage 96 % → 100 %, most-repeated matchup 3.4× → 2.05× (2.0 is the arithmetic floor).
- **Cross-tournament memory**: `meetLogFor()` in App.jsx reads the *stored tournaments themselves* — there is no second store to drift out of sync, and nothing to clean up when a tournament is deleted. The last `MEET_LOG_MAX` (6) tournaments count, matched **by name** (a player's `id` is only their list position and means nothing across tournaments). In the generator it is a tiebreaker and not a law: `W_PRIOR` × `PRIOR_CAP` stays below every one of the three cost levels, so it can decide a tie but never buy a repeat in the running tournament.
- **Sit-out compensation**: controlled by the tournament's `pauseMode` (wizard step "Runden & Regeln", or the Sieger-Modus card in the classic form). `'mean'` (default, and the fallback for tournaments saved before the setting existed) credits sit-outs the rounded per-round mean as `bonusPts` in `points` mode, or `+1 win per sit-out` for lower-half players in `wins` mode. `'fixed'` credits a flat `pausePts` per sit-out as `bonusPts` (also in `wins` mode, where points act as the tiebreak) — unlike `'mean'` it needs no confirmed results in the round. `'none'` credits nothing — sit-outs are still counted for the P column, just not compensated. Bonuses are kept on separate fields (`bonusPts`/`bonusWins`) and only folded into `totalPts`/`totalWins` at the end.
- **Next-round preview**: while a round runs, `TournamentPlay` already draws the *following* round and keeps it on `tourney.nextPreview = {forRound, round}`; `nextRound()` then plays exactly that draw instead of generating a fresh one. This is what feeds the "Danach" page in the live participant view *and* the Danach-Fach der Timer-Karte beim Host. It only happens for formats in `PREVIEWABLE_FORMATS` (`americano`, `teamamericano`, `mixicano`) whose pairings depend on the *history* of who played with/against whom. Mexicano and Team-Mexicano draw from the leaderboard, King of the Court and Knockout from the current round's winners — previewing those would fix the pairings before the results exist and stop them being the format the host picked, so they show an honest "steht noch nicht fest" instead.

### Turnier-PDF (`src/tourneyPdf.js`)

"Teilen" an einem beendeten Turnier erzeugt ein PDF: schwarzes
Kopfband mit Wortmarke, ein Gratulationsblock fuer den Sieger, Podest
2/3, die vollstaendige Tabelle und danach jede Runde mit Paarungen,
Ergebnissen und Pausen. Einstiege sind der Endstand-Screen und die
Live-Liste (Swipe-Aktion und "... mehr"-Sheet).

Es gibt genau EINEN Weg nach draussen. Der fruehere Textversand stand
eine Weile als zweiter Knopf daneben ("Als Text") - das war eine
Auswahl, die niemand treffen will, und der Knopf heisst deshalb nur
"Teilen" mit dem Share-Glyph. Dass ein PDF entsteht, ist Ergebnis und
nicht Option. `shareTourney` (Text) bleibt fuer die Faelle ohne
Endstand: laufende Turniere, Entwuerfe, Einzelmatches und beigetretene
Online-Sessions.

Warum eine echte Datei statt `window.print()`: das Ergebnis soll ohne
Umweg ueber den Druckdialog in die Gruppe. `exportTourneyPdf` gibt den
Blob an `navigator.share({files})` weiter, wo der Browser das kann
(iOS/Android), sonst faellt es auf einen Download zurueck.

Drei Dinge, an denen ein erster Entwurf scheiterte:

- **jsPDF gehoert nicht ins Startbundle** (~390 kB). Es wird per
  `await import('jspdf')` erst beim Klick geholt - gleiches Muster wie
  tesseract.js. `html2canvas`/`dompurify` zieht jsPDF selbst dynamisch
  und nur fuer `doc.html()`, das hier niemand aufruft.
- **Die 14 PDF-Standardschriften koennen nur WinAnsi.** Aus
  "Wisniewska" (mit s-acute) wurde ein "Wi[niewska". Deshalb ist Inter
  eingebettet, auf Latin-1 + Latin Extended-A beschnitten, erzeugt von
  [tools/make-pdf-fonts.py](tools/make-pdf-fonts.py) (25 kB je Schnitt,
  beide Schnitte noetig - sonst faellt fetter Text still auf Helvetica
  zurueck). Centauri kommt als TTF aus derselben Quelle wie der Webfont
  und gilt mit denselben Regeln: nie Zahlen, nie Namen.
- **`charSpace` rechnet in der Dokumenteinheit**, hier also in
  Millimetern, und `align:'right'` beruecksichtigt es nicht. Gesperrter
  rechtsbuendiger Text lief dadurch ueber seinen Anker hinaus; dafuer
  gibt es `putRS()`.

Schlaegt das Nachladen von Schrift oder Wortmarke fehl, entsteht das
PDF trotzdem - in Helvetica und ohne Logo. Das Dokument darf nicht an
einer Kuer haengen.

### Live mode (players joining a shared tournament)

"Live teilen" in the running-tournament screen mirrors a local tournament into a PIN session (`mode:'mirror'`, `allowLateJoin:true`). Players join via `JoinTournament`, which resolves the PIN first (`lookup`) and only then asks who they are:

- If the session already carries a roster (`tournamentState.players` — always the case for a mirror session), `RosterNamePicker` lists those names; names already claimed by another participant are disabled. Picking a name joins with it *verbatim*, which matters because `TournamentParticipantView` matches a participant to a player by `sessionParticipantId` or, failing that, by lowercased name — a typed "Chris" for a rostered "Christian" used to leave the player without a match.
- Without a roster (lobby session, not yet started) the flow falls back to the free-text `name` step, also reachable via "Mein Name steht nicht dabei".

The participant's match view is a two-page swipe (`MatchPager`, scroll-snap — same mechanism as the Schnellstart strip in the Turnier hub): **Jetzt** shows the running match as a 2×2 grid (`MatchSlotGrid`), **Danach** shows the next match on a blue padel court (`PadelCourtBlue`, real 20 m × 10 m proportions) plus a Mit/Gegen readout. The pager sits outside the score-submission card on purpose so players who are sitting out still see what is coming.

### `MatchSlotGrid` — the standard way a match is drawn

One match, one component: Team A left, Team B right, the net between, two rows of players (one when `court.single`). Used by the host's `TournamentCourtCard` in the running tournament *and* by the participant's live view, so both sides see the same picture.

The grid is five columns — `players | innerA | net | innerB | players` — and the two inner columns collapse to zero when unused.

- The `Team A` / `Team B` labels sit over the **player** column, not over the whole half — with the score column beside them, centering over the half pulls them inward and off the circles.
- `meName` highlights that player's seat (orange ring, glow, "Du").
- `innerA` / `innerB` put content at the net side of a team's own half, spanning both rows. The host's court card puts the score there: 21 left of the net, 9 right of it, read like a scoreboard. Do **not** stack the two scores on the net instead — vertically stacked they need `A`/`B` markers and are still read as belonging to the upper/lower *row*.
- `net` puts content **on** the net (the host's VS circle); pass an array and the component draws net segments between the items so the line never runs through it. Masking the line with a background does not work — `--card2` is semi-transparent in the glass theme and the strike-through stays visible.
- Both score cells carry the same fixed width, otherwise a one-digit score sits closer to the net than a two-digit one.
- Open courts show a `ScoreWheel` (its row height is the `h` prop — 28 in the grid, the default 34 elsewhere), confirmed courts a large number with the winner in the accent color.

### Die Court-Karte — der Zustand sitzt auf dem Netz

Der Kopf trägt links den Court-Namen als Kartentitel in der Antiqua
(dahinter ggf. die `1V1`-Pille), rechts die `✓ FERTIG`-Plakette und
den Stift für die **Aufstellung**. Sonst nichts. Der Name stand bis
Runde 5 als orange Plakette da — Orange ist Status, und ein Name ist
keiner.

Der Zustand des Matches — und der Knopf, der ihn weiterschaltet —
sitzt **auf dem Netz**, auf der Kreuzung mit dem Reihentrenner,
zwischen den beiden Zahlen, um die es geht:

| Netz | Bedeutung | Tippen |
|---|---|---|
| `VS` rot, inert | mindestens ein Rad steht auf `–` | — |
| `✓` orange | beide Stände stehen | bestätigt |
| `↺` gedämpft | bestätigt | öffnet wieder |

- **Der Knopf lag vorher oben rechts in der Kartenzeile** (und davor
  als breiter Knopf unter der Karte). Oben rechts war er weit weg von
  dem, was man gerade tut: man stellt zwei Räder in der Mitte und
  soll dann in die Ecke greifen.
- **`ready` verlangt beide Räder.** Solange eines auf `–` steht, ist
  gar kein Ergebnis eingetragen — ein Knopf, der dann 0:0
  festschreibt, wäre eine Falle.
- Der **Schlüssel** (`key={\`net-${netState}\`}`) erzwingt beim
  Zustandswechsel einen Neuaufbau; nur so läuft `netPop` erneut. Im
  `vs`-Zustand trägt der Kreis stattdessen `court-vs` (Dauerpuls) als
  Hinweis, dass dort noch etwas fehlt.
- `MatchSlotGrid` bekommt dafür **`netW`** (Vorgabe 32, hier 44): den
  Knopf trifft man, die Plakette las man nur. Die Spielerspalten
  werden dadurch schmaler — deshalb trägt die `Team A`/`Team B`-Zeile
  jetzt `whiteSpace:'nowrap'`, sonst bricht sie in Centauri zu
  `TEAM` / `A`.

Im **`ScoreWheel`** steht ganz oben ein **Strich**, erst darunter die
0: der Strich ist `value === null`, „noch nichts eingetragen". Vorher
stand dort die 0 — und eine 0 sieht aus wie ein Ergebnis.

Weiteres am Kopf:

- **Kein „• LIVE" mehr.** Der Status stand doppelt da: die grüne
  „Fertig"-Plakette sagt fertig, ihr Fehlen sagt läuft. Ein rotes
  Blinklicht daneben sagt nur nochmal dasselbe.
- **Kein Court-Emoji.** Der Picker (`CourtEmojiPicker`) ist raus; alte
  Turniere tragen `courtEmojis` noch im Datensatz, es liest sie nur
  niemand mehr.
- Ohne Knopf unter der Karte trägt das `MatchSlotGrid` den Abstand zum
  Kartenrand nicht mehr — nur noch den zum Tier-Chip, falls einer da
  ist (`marginBottom: tier ? 14 : 0`).

Auf den Kacheln der Platzkarte steht **kein Spielstand**, nur der
Zustand („frei" / „läuft" / „fertig"). Auf 80 px liest man „16:8"
eher raten als lesen, und es steht ohnehin groß auf der Court-Karte
darunter: die Karte beantwortet „wo wird gespielt und ist der Platz
durch", nicht „wie steht es".

Die Platzkarte darüber trägt denselben Stift in denselben Maßen
(30 px, `borderRadius: 9`): es ist dieselbe Geste — antippen, ändern,
wieder antippen. Dass man drin ist, sagen der gefüllte Knopf und das
Ressort („ANORDNUNG ANPASSEN"), nicht ein zweites Wort auf dem Knopf.

### Die Startseite (`Home`)

Foto (`assets/home-bg.jpg`, fest, mit dunklem Verlauf darueber), drei
Antiqua-Ueberschriften und Glas darauf — nach einem Entwurf des
Teams. Kopf: der reine Schriftzug (`ritmo-lettering.png`), Glocke und
Menue als runde Glasknoepfe (`GlassCircle`).

- **Spielen**: zwei runde Glasknoepfe, Match → `single-setup`,
  Turnier → `tournament-hub`. Die Schnellstarts liegen seitdem im
  Turnier-Bereich (siehe dort).
- **Events**: eine Glaskarte je kommendem Event aus
  [src/events.js](src/events.js), hoechstens drei; ohne Termin ein
  kursiver Satz. Die Knoepfe: Kalenderdatei (`.ics`) und Route
  (Google Maps).
- **Deine Spiele**: laufendes Match plus die letzten Turniere
  (laufende vor beendeten, keine Entwuerfe), bis zu drei; „Alle in
  Live ›“, wenn es mehr gibt.
- Hinter jeder Ueberschrift ein Zeichen in 30 % Weiss (`HomeDeco`).
- **Zwei Hausregeln sind hier bewusst gebrochen**, weil der Entwurf
  es so will: eine vierte Schrift (`T.fontSerif`, nur hier) und
  Ziffern in Centauri auf der Event-Karte (Monat und Uhrzeit, ab
  15 px gesetzt). Wer die Karte aendert, prueft die Zeile
  „AUGUST 2026“ bei 390 px — bei 20 px lief sie aus der Karte.
- Die Mock-Karten „Matches für dich“ und die Datumsleiste sind
  entfallen, mit ihnen `MATCH_SLOTS` und `HOME_EVENTS`.

### Die Sprache der Startseite — Screen fuer Screen

Die uebrigen Screens werden in Runden auf die Startseite umgestellt.
Die Bausteine stehen in App.jsx direkt vor `ScreenHeader`:

| Baustein | Was er tut |
|---|---|
| `PhotoBackdrop({dim})` | Das Foto der Startseite samt Verlauf, `zIndex:-1` hinter dem Inhalt. `dim` dunkelt fuer Arbeits-Screens nach. |
| `PHOTO_ROOT` | In den Screen-Rahmen spreizen: `isolation:'isolate'` gibt ihm einen eigenen Stapelkontext — sonst rutscht das Foto hinter den Grund des Rahmens. |
| `GLASS` | Klares Glas wie die Home-Karten in der installierten App: kein Blur, kein grauer Fill — 6 % Weiss, Haarlinie 22 %, innen ein heller Lichtsaum (zwei inset-Schatten), aussen weicher Schlagschatten. Gedrueckt `T.glassHi`, Trenner in Listen `T.glassSep`. |
| `HEAD_SERIF` | Die kursive Antiqua der Startseiten-Ueberschriften (40 px; `ScreenHeader` 38, `SectionRule` 25). |
| `GlassCircle` | Runder Glasknopf (bei Home definiert). |

- **`GLASS` sieht aus wie die Home-Karten auf dem iPhone**, und das
  ist klares Glas, nicht Milchglas. Grund: im Standalone-Modus fehlt
  „Safari" im User-Agent, `GlassSurface` waehlt deshalb seinen SVG-Weg
  (`.glass-surface--svg`) — und WebKit wendet den
  `backdrop-filter: url(#…)` nicht an. Uebrig bleiben 6 % Weiss und der
  innere Lichtsaum. Eine Zeit lang trug `GLASS` stattdessen Blur 24 und
  eine Toenung; auf dem Telefon stand das als grauer Fill neben den
  klaren Home-Karten. Ohne `backdrop-filter` kostet eine Glasflaeche
  beim Scrollen ausserdem nichts mehr.
- **Der Rueckweg von `GlassSurface` (`.glass-surface--fallback`) ist
  dasselbe klare Glas** — ausser in der Tab-Leiste (`.nav-glass`), die
  ueber wechselndem Inhalt lesbar bleiben muss und ihr Milchglas
  behaelt. Vorher Blur + Aufhellung + Toenung: WebKit rechnet die
  Unschaerfe erst nach dem Einblenden der Seite, die Home-Karten kamen
  klar herein und wurden eine halbe Sekunde spaeter grau.
- Wer `boxShadow` auf einer `GLASS`-Flaeche setzt (Auswahl-Schein),
  haengt `GLASS.boxShadow` an, statt ihn zu ersetzen — sonst fehlen
  Lichtkante und Schatten genau an der gewaehlten Karte.
- **Kein `BottomFade` auf Foto-Screens**: er verlaeuft in `--bg` und
  stuende als dunkler Balken ueber der Tab-Bar.
- **Die Hoehe der installierten iPhone-App misst `main.jsx` selbst**
  (`fitStandaloneHeight`). iOS meldet dort ein Fenster, das um etwa
  die Statusleiste zu kurz ist (gemessene Luecke ~55 pt): html, `100%`,
  `100dvh` und `position:fixed` endeten alle darueber, und unten stand
  der schwarze html-Grund. `screen.*` kennt die echte Hoehe; gesetzt
  wird sie inline auf html/body/#root, nur im Standalone-Modus und nur
  bei einer plausiblen Luecke (unter 140 px). Gleichzeitig ist der
  Cache auf `ritmo-v4` gestiegen, damit offene Apps den Stand neu laden.
- **Screens sind `height:'100%'`, nie `100dvh`.** In der installierten
  iPhone-App (black-translucent) ist `100dvh` um den unteren Rand zu
  kurz: der Screen endete ueber der Unterkante, Tab-Leiste und
  Knopfleiste schwebten, und darunter stand ein schwarzer Balken (der
  Grund von `html`). `100%` ist die echte Hoehe — `index.html` sagt
  dasselbe fuer html/body/#root. Die Screens haengen direkt an
  `#root`, `100%` greift also.
- **`BarBlur`** liegt unter Tab-Leiste und Knopfleiste (`.bar-blur`):
  Unschaerfe mit Maskenverlauf plus ein Hauch Schwarz, bis unter den
  Home-Indikator. Der Inhalt verschwimmt dort, statt hart an der
  Leiste abzureissen.
- **Glyphen weiss, nicht orange** (`T.t1`). Orange bleibt Status und
  Marke: Ressort, laufend, Akzent. `BookIcon`/`JourneyIcon`/`TrophyIcon`
  nehmen dafuer `color`.
- `SwipeableCard` hat keinen eigenen Grund mehr: die Aktionen dahinter
  sind ungewischt unsichtbar (Deckkraft 0), Glas darf also durchscheinen.
- Umgestellt wird mit zwei Werkbank-Skripten (nicht im Repo): eines
  macht aus `background:T.card,border:\`1px solid ${T.border}\`` ein
  `...GLASS`, setzt Rahmen mit `T.bgGrad` auf Foto und streicht
  `BottomFade`; das andere macht aus den grauen Versal-Zwischenzeilen
  (`color:T.t3,fontSize:11,…,textTransform:'uppercase'`) die Antiqua
  und aus `${T.sep}` ein `${T.glassSep}`. Beides immer nur fuer den
  Zeilenbereich der Runde, danach Screenshot jedes Screens.
- Stand: **Runde 1** (Profil, Live, Suche, Bibel, Turnier-Bereich),
  **Runde 2** (Einstellungen samt Unterseiten: `SettingsCard`,
  `SettingsSubLayout`, `SettingsSection`) und **Runde 3** (RITMO Post,
  Bald-Seiten, Profil bearbeiten, Match-Praeferenzen, RITMO-DNA-Seite,
  die Bibel — siehe unten), **Runde 4** (Single Match, siehe dort) und
  **Runde 5** (der ganze Turnierbereich, siehe „Turniere in der
  Sprache der Startseite“) und **Runde 6** (Splash, Beta-Landing,
  Beta-Pause, Hinweis beim ersten Start, Login, Registrierung,
  Bestaetigungs- und Passwort-Screens) umgestellt. Die Auth-Screens
  tragen statt des runden Splash-Logos den Schriftzug (`AuthMark`),
  Titel in der Antiqua, Felder aus Glas, Knoepfe als Pillen. Offen:
  das Onboarding (`Welcome`).

### Turniere in der Sprache der Startseite (Runde 5)

Assistent, Konfigurator, Beitreten, Lobby, Teilnehmeransicht, laufendes
Turnier, Endstand und alle Sheets darunter. **Nur Darstellung**: kein
Handler, kein State, keine Regel und nichts in `src/tournament.js`
wurde angefasst — Paarungen, Wertung und Pausen-Ausgleich laufen
unverändert.

- **Foto unter allem**, gedimmt nach Arbeit: Assistent `.45`,
  laufendes Turnier `.32`, Beitreten/Teilnehmer `.25`, Endstand `.2`.
  Der Assistent ist ein `position:fixed`-Overlay und bekommt
  `PHOTO_ROOT` + `PhotoBackdrop` genauso wie ein Screen.
- **Assistent**: Kopf aus Ressort (Centauri), „Schritt n von 7“ (Inter
  — Ziffern nie in Centauri) und sieben Segmenten statt eines Balkens
  (der alte rechnete mit `/6` und lief im letzten Schritt über).
  Schritt-Titel in der Antiqua, Standfirst kursiv. Fusszeile ohne
  eigenen Grund: `‹ Zurück` gelb, `Weiter ›` / `Turnier starten ›`
  orange — auch der Start war vorher grün.
- **Auswahl** überall wie in Single Match: Pillen weiss mit schwarzer
  Schrift (Modus, Format, Sieger-Modus, Pausen, Rundenpriorität);
  gewählte Karten Glas mit oranger Kontur und Schein plus Radio-Punkt
  statt Haken.
- **Kartentitel** in der Antiqua (21 px), Sheet-Titel 24 px. Ausnahme:
  Titel, die eine Zahl *sind* („3 Turniere“ im Papierkorb), bleiben
  Inter.
- **Zahlen** in Inter mit `tabular-nums`. Das `ui-monospace` der Timer,
  PINs und Spielstände ist raus.
- **Kopf des laufenden Turniers**: Timer-Karte, Ansicht- und
  Historie-Knopf sind Glas mit weissem Glyph statt schwarz mit oranger
  2-px-Kontur. Die Zeit ist weiss, **orange nur solange sie läuft**,
  rot wenn abgelaufen. Der aktive Ansicht-Knopf (Tabelle) ist weiss mit
  schwarzem Glyph — dieselbe Sprache wie die Auswahl-Pillen.
- **Werkzeug-Fach**: Glyphen weiss; der Live-Glyph wird orange, solange
  gespiegelt wird (Status).
- **Endstand**: siehe „Endstand: die Titelseite".
- **Beitreten**: der Einleitungs-Block (`SetupHero`, inzwischen gelöscht, mit demselben Glyph
  wie der Kopf) ist zum Standfirst geworden. QR-Scan ist eine weisse
  Pille, der PIN-Knopf in der Leiste orange.
- Getestet mit einem durchgespielten Americano (8 Spieler, 2 Courts,
  Ergebnisse über die Räder, Rundenwechsel, Beenden über beide Schritte,
  Endstand). Lobby und Teilnehmeransicht brauchen eine Supabase-Session
  und sind nur im Code umgestellt — wer dort etwas ändert, prüft sie an
  einer echten Session.

### Single Match: Aufstellung und Scoreboard

**Setup (`SingleSetup`)** ist eine Aufstellung, kein Formular: die vier
Namen stehen auf einem Court von oben, Team 2 oben, Team 1 (du) unten,
das Netz dazwischen. Darunter zwei Modus-Karten mit Klartext und NUR
die Optionen des gewaehlten Modus (Golden Point bzw. Spielziel), am
Ende ein grosser „Match starten“-Knopf mit einer Zusammenfassung.

- Die Namensfelder sind eine **Render-Funktion** (`seat(idx)`), keine
  innen definierte Komponente — die wuerde bei jedem Tastendruck neu
  gemountet, und das Feld verloere den Fokus.
- Team A ist immer das Team des Nutzers (`user_team:'A'` beim
  Loggen). Deshalb gibt es keinen „Seiten tauschen“-Knopf.

**Anzeige (`Match`, Hochformat)** ist ein Scoreboard: zwei grosse
Glasflaechen, die GANZE Flaeche ist der Punkt-Knopf. Team B oben,
Team A unten — wie im Setup.

- **Rueckgaengig in Daumenhoehe** zwischen den Flaechen. Vorher gab es
  auf dem Telefon gar keins (nur per Ring/Presenter); ein Vertipper
  kostete den ganzen Spielstand.
- **„Aufschlag rechts/links“** auf der Flaeche des aufschlagenden
  Teams (`servingTeam`/`isDeuce`, dieselbe Rechnung wie die
  `ServiceIndicator`-Skizze im Vollbild).
- Einstand/Vorteil/Golden Point stehen als **Wort in der Antiqua**.
  Beim Vorteil der Gegenseite bleibt die Stelle leer — ein Strich in
  104 px stand als grauer Balken da.
- **Americano „Split 21“ endet, wenn BEIDE zusammen 21 Punkte haben**
  (`amR`: `pA+pB>=lim`), nicht bei 21 fuer ein Team. Der Status zaehlt
  deshalb die offenen Punkte herunter („Noch 16 von 21 Punkten“); das
  Setup sagt „21 gesamt“ und nennt ein Beispiel (18:3).
- **Sieg als Karte** (Ergebnis, „Neues Match“, „Letzter Punkt zurück“,
  „Startseite“) statt eines Banners am Seitenende.
- Vollbild (`bigScreen`) behaelt sein Layout; es bekommt nur das Foto
  mit `dim .62` — dort zaehlen auf dem Fernseher nur die Zahlen.

### Die Bibel: Regelwerk, Journey, App-FAQ

Neu gebaut als Magazin, nicht nur umgefaerbt.

- **`WissenList`** — das Inhaltsverzeichnis von Regelwerk und Journey:
  eine Glaskarte, je Kapitel eine Zeile mit grosser kursiver Nummer
  (`01`, orange), Titel in der Antiqua, Vorspann. Die Kapitel-Icons
  stehen nur noch gross auf der Kapitelseite.
- **`RulesDetailLayout`** — die Kapitelseite fuer ALLE Kapitel beider
  Teile: „Kapitel n von N“, Titel, Vorspann, Icon im Glaskreis, ein
  Fortschrittsbalken aus Segmenten (statt 6-px-Punkten). Foto mit
  `dim .38` — hier wird gelesen. Am Ende „‹ Zurück“ / „Weiter ›“:
  das Wischen zum Blaettern bleibt, aber es kennt keiner.
- **Textbausteine** `RulesH` (Antiqua mit kurzer oranger Haarlinie),
  `RulesP`/`RulesUl` (15 px statt 13, Punkte statt Striche),
  `RulesDef` (Begriff in der Antiqua, Erklaerung darunter, Haarlinie
  links). Wer ein Kapitel schreibt, nimmt diese vier — dann sieht es
  von selbst aus wie die anderen.
- **`WissenLanding`** — der Einstieg vor dem ersten Lesen: Kopf wie
  ueberall, Bild als gerahmte Karte, Schlagzeile, grosser Weiter-Knopf.
- **App-FAQ** ist nach Themen gruppiert (`APP_FAQ` = Gruppen mit
  `items`), durchsuchbar (Fragen UND Antworten, Treffer markiert per
  `Hl`), Akkordeon mit Plus, das zum Kreuz kippt. Die Antworten nennen
  Wege in der App so, wie sie dort beschriftet sind — wer einen Screen
  umbenennt, sucht hier mit.

### Papierkorb (`ritmo_trash`)

Ein gelöschtes Turnier ist nicht weg: es liegt **`TRASH_DAYS` (7) Tage**
im Papierkorb und räumt sich danach selbst ab. Ein Turnier ist ein
Abend Arbeit — Namen, Runden, Ergebnisse —, und ein Wisch nach links
ist schnell gemacht.

- Der **Undo-Toast bleibt trotzdem**: er deckt die nächsten Sekunden
  ab („falsch gewischt"), der Papierkorb den nächsten Morgen. Beide
  Wege führen über `restoreTrash`, es gibt also nur eine Rückholung.
- **Aufgeräumt wird bei jeder Benutzung, nicht per Timer**
  (`purgeTrash` beim Laden und bei jedem Schreiben). Ein Timer läuft
  nur, solange die App offen ist — und genau dann ist auch niemand
  sieben Tage weg. `purgeTrash` überlebt dabei auch Einträge ohne
  `deletedAt`.
- `TRASH_MAX` (30) deckelt gegen die localStorage-Quote: ein Turnier
  trägt alle Runden mit sich.
- **„Alle löschen" löscht auch nicht mehr endgültig** — es schiebt in
  den Papierkorb. Der einzige endgültige Weg ist der rote Knopf im
  Papierkorb selbst (bzw. „Papierkorb leeren").
- Der Einstieg ist eine **Zeile am Ende der Live-Liste**, kein Knopf im
  Kopf: der Papierkorb ist kein Werkzeug, das man sucht, sondern ein
  Ort, an dem etwas liegt. Er erscheint nur, wenn etwas drin ist.
- Im Sheet stehen die beiden Knöpfe nebeneinander und tragen
  Gegenteil-Farben: **gelb zurück** (wie überall, siehe Theming), **rot
  endgültig**. Kein Wischen dort — im Papierkorb ist ein Fehlwisch
  nicht mehr rückgängig zu machen.

### Die Timer-Karte — und was danach kommt

Die Karte links in der Kopfzeile des laufenden Turniers zeigt die
Rundenzeit **und** ist der Aufklapper fuer die naechste Auslosung.
Tippen tauscht die Uhr gegen `DANACH / Runde N`; darunter faehrt ein
Fach aus mit einer Zeile je Court (Court-Name, beide Paare, `VS`) und
einer Pausen-Zeile. Der Host sah die Vorschau bisher nirgends — sie
stand nur in der Teilnehmeransicht, obwohl er derjenige ist, der die
Leute ruft.

- Gezeigt wird **genau** `tourney.nextPreview` — dieselbe Auslosung,
  die `nextRound()` spaeter einloest. Nichts wird fuer die Anzeige
  neu gewuerfelt, sonst waere das Fach eine andere Runde als die,
  die dann gespielt wird.
- Formate ohne Vorschau (Mexicano, Team-Mexicano, K.-o., King of the
  Court) bekommen denselben ehrlichen Satz wie die Teilnehmeransicht,
  statt einer erfundenen Paarung.
- **Aufgeklappt tritt die Uhr ganz beiseite**, mitsamt ihrem
  Start/Pause-Knopf und dem Fortschrittsbalken: eine Uhr steuern, die
  man nicht sieht, ist Blindflug, und ein halb gefuellter Balken
  hinter „Runde 2" misst nichts, was dort steht. Der runde Knopf
  traegt dann die Stoppuhr und fuehrt zurueck.
- Die **Hoehe wird gemessen** (`offsetHeight` des Inhalts), nicht
  geschaetzt — eine Runde hat mal einen Court und mal sechs. Gleiche
  Regel wie beim Werkzeug-Fach: mit einem zu grossen Wert laeuft der
  erste Teil des Uebergangs ins Leere. Ab 320 px scrollt das Fach in
  sich, damit das Turnier darunter nicht verschwindet.
- **Laufend ist die Karte eine Mini-Kapsel** wie der Timer im Single
  Match (`TimerCapsule`): Knopf links, Zeit rechts in allen
  Zustaenden; ab dem ersten Start wird sie schwarz und ganz rund, der
  Knopf getoent mit orangem Glyph, „Timer“ bzw. „Zeit um“ vor der
  Zahl, die Ziffern duenn und orange (pausiert gedimmt). Der
  Fortschrittsbalken ist entfallen. Aufgeklappt bleibt sie Glas.
- Das Fach **schiebt**, statt sich darueberzulegen: was darin steht,
  liest man im Vergleich mit dem, was gerade laeuft.
- Der Rundenwechsel schliesst es (derselbe Effekt, der den
  Court-Filter zuruecksetzt) — danach ist „danach" etwas anderes.

### Beta-Pause (`APP_PAUSED`)

**Derzeit offen** (`APP_PAUSED=false`). Der Schalter bleibt fuer den
naechsten Bedarf: auf `true`, und nach dem Splash steht nur noch
`BetaPause` — ein Dank an die Beta-Tester und der Hinweis, dass RITMO
weiterentwickelt wird. `App()` rendert in diesem Zustand per frueher
Rueckgabe nur Splash und diese Seite — kein Login, kein Home, kein
`?join=`, keine Verified-Landing.

- **Zu- und aufmachen:** `APP_PAUSED` in App.jsx umstellen, deployen.
  Dazu den Cache-Namen in `public/sw.js` hochzaehlen (beim Aufmachen
  `ritmo-v3`): erst der neue Worker laedt offene Fenster und aus dem
  Hintergrund geholte PWAs neu, sonst stuende dort die alte Seite, bis
  jemand die App selbst neu startet.
- Nach dem Splash schaltet ein **eigener Merker** (`pauseShown`), nicht
  `scr`: Effekte wie der Auth-Listener stellen `scr` um und duerfen
  weder den Splash abwuergen noch die Sperre umgehen.
- **Die Geraetedaten bleiben**: Profil, Turniere und Papierkorb liegen
  weiter in localStorage und sind beim Wiederaufmachen da.
- **Der Cache darf die alte App nicht weiterreichen.** Mit `ritmo-v1`
  lief sie offline aus dem Service-Worker-Cache einfach weiter. Seit
  `ritmo-v2` loescht `activate` jeden fremden Cache, laedt offene
  Fenster einmal neu, und Navigationen gehen mit `cache:'no-cache'`
  raus (GitHub Pages erlaubt `index.html` sonst 10 Minuten im
  HTTP-Cache). `main.jsx` registriert mit `updateViaCache:'none'` und
  fragt beim Zurueckholen der PWA aus dem Hintergrund selbst nach
  einem neuen Worker.
- **Das Neuladen in `activate` wird angestossen, nicht abgewartet.**
  Die Navigation laeuft durch den neuen Worker und wartet auf
  `activated` — verkettet in `waitUntil` hing er fuer immer in
  `activating`.
- Gemessen mit echtem Service Worker (alte Version gecacht, dann
  Deploy): ab `ritmo-v2` steht der neue Stand schon beim ersten Start
  mit Netz, danach auch offline (Aufmachen v2 → v3 so nachgemessen).
  Von `ritmo-v1` aus konnte es einen Start laenger dauern — v1 holte
  `index.html` noch durch den HTTP-Cache. Beim Testen nach
  `setOffline(false)` kurz warten: sofort danach scheitert der
  Netzabruf noch, und der Cache liefert die alte Seite — das sieht aus
  wie ein Fehler im Worker und ist keiner. **Wer nie wieder online geht, behaelt die alte
  App** — der Code liegt auf seinem Geraet, dagegen hilft kein
  Server.

### Der Splash: Intro-Video, Schriftzug, Ladebalken

Das Intro-Video (`assets/splash-intro.mp4`, Handschlag am Netz von
oben, 8,4 s) laeuft vollflaechig unter einem leichten Verlauf, darauf
mittig der Schriftzug und darunter der Ladebalken — **5 px hoch und
bis 300 px breit**, wie die Leiste einer Sportuebertragung. Er fuellt
sich ueber die Laenge des Videos (`SPL_MS` = 8400, `splFill`, vorn ein
oranger Kopf, ein Glanz `splGlint` laeuft darueber). Der Splash endet
mit dem Video (`ended`), Tippen startet sofort.

- **Das Video ist heruntergerechnet**: 720p, H.264, ohne Ton,
  `+faststart` — 0,7 MB statt 15,7 MB im Original. Wer ein neues
  liefert, rechnet es genauso um (`ffmpeg -an -vf scale=720:-2
  -c:v libx264 -crf 24 -movflags +faststart`) und legt ein Standbild
  daneben (`splash-intro-poster.jpg`).
- **Der Service Worker laesst Range-Anfragen durch** (`sw.js`, ab
  `ritmo-v6`). Safari fragt Videos mit `bytes=0-1` an und will 206;
  ein 200 mit der ganzen Datei aus dem Cache, und das Video spielt auf
  dem iPhone gar nicht.
- **Laeuft das Video nach 1,5 s nicht** (Stromsparmodus auf iOS,
  fehlender Codec, kein Netz), endet der Splash 0,9 s spaeter — statt
  acht Sekunden ein Standbild zu zeigen. Die harte Obergrenze ist
  `SPL_MS` + 1,6 s.
- **„Skip Intro" bleibt** und merkt sich die Wahl (`ritmo_skip_intro`,
  beim Logout geloescht). Dann steht statt des Videos das Foto der
  Startseite da, das Video wird gar nicht erst geladen, und der Balken
  laeuft in `SPL_MS_SKIP` (0,7 s) durch.
- Playwrights Chromium kann kein H.264 (`MediaError` 4). Wer den
  Splash dort testet, leitet die Datei per `route` auf eine WebM-Kopie
  um — sonst sieht man nur den Rueckweg.
- html/body/`theme-color` stehen waehrend des Splash auf Schwarz, damit
  iOS die Safe-Areas nicht in der Theme-Farbe toent; der Theme-Sync
  der App pausiert solange (`scr==='splash'`).

### Der Turnier-Start-Vorhang und sein Orb (`TennisOrb`)

Zwischen „Start" und der ersten Runde liegt ein kurzer Vorhang
(`TournamentStartSplash`): ein Ball dreht sich, holt aus und schiesst
auf den Betrachter zu. Der Screenwechsel passiert dabei **sofort** —
der Vorhang deckt ihn nur zu, statt die App künstlich langsamer zu
machen.

Der Ball ist seit dem Orb kein Aufkleber mehr, der sich im Kreis
dreht, sondern eine echte Kugel aus Punkten:

- Die Punkte sitzen per **Fibonacci-Gitter** auf der Kugel, werden je
  Bild gedreht, perspektivisch projiziert und von hinten nach vorn
  gezeichnet. Rund wird der Ball dadurch von selbst: vorn gross und
  hell, hinten klein und matt. Ein CSS-Spin um die Z-Achse kann das
  nicht, weil er nichts über die dritte Achse weiss.
- Die Naht ist die **echte Tennisball-Kurve**
  (`x = a·cos t + b·cos 3t`, `y = a·sin t − b·sin 3t`, `z = c·sin 2t`).
  Sie liegt genau dann auf der Einheitskugel, wenn **a + b = 1** und
  **c = 2·√(ab)** — deshalb stehen dort 0,7 / 0,3 / 0,9165 und keine
  „schön gerundeten" Zahlen.
- Die Naht ist eine **eigene, dichte Punktreihe**, und das Feld lässt
  ihr Platz (Punkte näher als 0,085 fallen raus). Ohne beides franst
  die Linie aus, und aus der S-Kurve wird ein oranger Fleck.
- **Canvas, nicht SVG**: 1200 Punkte je Bild als DOM-Knoten zu bewegen
  kostet mehr, als der ganze Vorhang dauert.
- **Canvas kennt keine CSS-Variablen.** `T.o` ist `var(--o)` und
  landet als solcher String im `fillStyle` — also unsichtbar. Die
  Farben werden im Effekt einmal per `getComputedStyle` aufgelöst.
- Bei `prefers-reduced-motion` wird **ein** Bild gezeichnet und keine
  Schleife gestartet.

### `MatchBar` im laufenden Turnier — das Werkzeug-Fach

Die Leiste zeigt im Ruhezustand nur **Home**, den **Werkzeug-Schalter**
(`ToolsIcon`, vier Kacheln) und — wenn die Runde fertig ist —
**Nächste Runde**. Beenden, Live teilen, Ansagen und Bearbeiten liegen
im Fach: vier Knöpfe, die man pro Runde vielleicht einmal anfasst,
standen dauerhaft über dem Turnier, das man ständig ansieht.

- Ein `rightButtons`-Eintrag mit **`items`** ist ein Fach — und das Fach
  ist **keine zweite Leiste neben dem Schalter, sondern derselbe Knopf,
  der sich streckt**: eine Kapsel, die geschlossen exakt der 48er-Kreis
  des Schalters ist und offen bis über die vier Werkzeuge reicht. Der
  Schalter liegt mit drin, ganz rechts. Vorher lag die Kapsel *neben*
  dem Schalter und wuchs per `max-width` aus dem Nichts — das sah aus
  wie eine zweite Leiste, die eingeblendet wird, nicht wie eine Fläche,
  die sich verformt.
- Die Kapsel liegt **absolut** und ist rechts verankert, ein
  48-px-Platzhalter hält der Reihe den Platz frei. Grund ist Arithmetik:
  sechs runde Knöpfe passen bei 390 px nicht nebeneinander (vier
  Werkzeuge 230 px + Schalter + Weiter + Home = 376 von 342). Im Fluss
  müsste etwas schrumpfen; *über* der Leiste darf es einfach liegen.
- **Die Breite IST die Animation** (48 → `48 + gap + n*48 + (n-1)*gap + pad`,
  bei vier Werkzeugen 278). Aufgehen mit einem Hauch Überschwingen
  (`cubic-bezier(.22,1.08,.36,1)`, 440 ms), Zugehen kurz und ohne
  (280 ms): beim Schließen will niemand noch einmal nachfedern.
- **Kein Glas auf Glas.** Im Fach tragen die Knöpfe `btn.plain` — die
  Kapsel ist das Material, die Werkzeuge sind nur noch Glyphen darauf.
  `plain` muss dabei ausdrücklich `background:'transparent'` setzen,
  sonst malt der Browser seinen eigenen (weißen) Knopfgrund.
- Der Schalter-Glyph **dreht sich 45°**, solange offen ist: aus vier
  Kacheln wird eine Raute. Das ist der einzige Zustand, den der Knopf
  selbst noch trägt.
- Die Knöpfe im Fach blenden **gestaffelt** (35 ms je Position) und in
  beide Richtungen von innen nach außen: beim Ausfahren erscheint der
  am Schalter zuerst, beim Einfahren verschwindet der äußerste zuerst.
  Die Reihe bewegt sich dadurch wie eine Kette und nicht wie ein Block.
  Der Staffel-Style liegt auf `btn.fx`, das in `MatchBar` **ganz
  zuletzt** gemergt wird — es muss auch die `opacity` überschreiben
  dürfen, die `fab` für den Disabled-Zustand setzt. Die Knöpfe kommen
  dabei **unter dem Schalter hervor** (`translateX(14px) scale(.6)`)
  und verschwinden wieder darunter; die Kapsel schneidet sie ab
  (`overflow:hidden`).
- Solange das Fach offen ist, blendet **Home** aus (`homeHidden`): das
  Fach wächst über ihn hinweg, und ein halb verdeckter Knopf sieht
  kaputt aus.
- Das Fach fährt nach **4,5 s** von allein ein, und jeder Griff hinein
  schließt es — die Entscheidung ist getroffen. Timer und Zustand
  liegen in `TournamentPlay`, `MatchBar` bleibt ein reiner Renderer.
- Der **Live-Punkt wandert auf den Schalter**, solange das Fach zu ist.
  Dass gerade gespiegelt wird, darf nicht hinter einem Knopf
  verschwinden.
- **Live teilen stand davor oben** neben Timer, Ansicht und Historie.
  Diese Reihe steuert die *laufende Runde*; Teilen ist eine Aktion am
  Turnier. Der Timer bekommt dadurch die Breite zurück, die der
  vierte 58-px-Knopf gekostet hat.
- **Der breite „Nächste Runde"-Knopf steht am Ende der Liste** — wer
  oben steht, sieht ihn nicht und weiß nicht, dass die Runde fertig
  ist. Er wandert deshalb als Pfeil in die Leiste, solange er selbst
  nicht im Bild ist, und verschwindet dort wieder, sobald man unten
  ankommt. Es ist derselbe Knopf, nicht ein zweiter Weg.
- Gemessen wird per `IntersectionObserver` **am Knopf selbst**, mit
  dem Scroll-Container als `root` und `threshold: 0.9`. Nicht über
  eine Scroll-Position: die Frage ist „sieht man ihn?", und nur die
  beantwortet das ohne geratenen Schwellenwert. Die 0.9 verhindert das
  Flackern, wenn vom breiten Knopf nur ein Streifen am unteren Rand
  hängt.
- `btn.hidden` in `MatchBar` blendet einen Knopf weg, statt ihn aus
  dem Array zu nehmen: Breite 0 plus `marginLeft:-10` gegen das
  `gap` der Reihe. Ein Knopf, der einfach verschwindet, lässt die
  Reihe springen und vom rechten Rand abrücken. Gilt nur für Knöpfe,
  die nicht die ersten der Gruppe sind — davor gibt es keine Lücke zu
  schlucken.
- Fünf Knöpfe plus Home sind bei 390 px die Obergrenze: 48 px je
  Knopf, 10 px Lücke, 24 px Rand — 328 von 342 px. Ein sechster passt
  nicht.

### Der Padel-Schläger (`PadelRacketIcon`)

Ein Schläger für die ganze App: Live-Tab, die Eyebrow über den
Matches, das Schläger-Kapitel der Bibel. Vorher waren es drei — ein
Kreis mit drei Punkten und einem Strich im Tab, eine **Ellipse mit
Saitenkreuz** (`RacketMini`, also ein Tennisschläger) in den Listen,
dazu zwei PNGs.

- **Die Kontur ist gerechnet, nicht gemalt.** Der Kopf ist ein Kreis
  (r 8 um 9/9); die beiden Streben sind die Parallelkurven *einer*
  Bézier-Mittellinie im Abstand 1,7, und aus denselben Kurven entsteht
  das Herz — der Durchbruch zwischen Kopf und Griff. Deshalb ist die
  Strebe oben so dick wie unten und das Herz sitzt zwangsläufig mittig.
  Die 40-Punkt-Polylinien der Werkbank sind anschliessend je Kante auf
  **eine** Kubische gefittet (max. Abweichung 0,025 von 28, also
  unsichtbar); im Repo stehen nur die zwei fertigen Pfade.
- **Das Herz ist unten spitz, nicht oben.** Ein Dreieck mit der Spitze
  nach oben liest sich als Bleistift, und eine nach unten
  durchhängende Oberkante als Mund mit Zunge. Beides ist passiert.
- **Hochkant, 18:28.** `size` ist immer die HÖHE. Mit quadratischer
  Box wird der Griff zum Stummel und der ganze Glyph zur Glühbirne —
  das war der erste Entwurf, zweimal.
- **Drei Lochbilder statt eines**: 3/4/3 ab 30 px, 2/3/2 ab 20 px,
  darunter fünf im Würfelbild. Sieben Löcher bei 15 px sind ein
  Grauschleier.
- Gefüllt (`active`) werden die Löcher per `evenodd` **ausgestanzt**,
  nicht in `--bg` übermalt: `--bg` ist im Glass-Theme ein Verlauf,
  übermalte Löcher wären Flecken. Gleiche Falle wie beim Netz in
  `MatchSlotGrid`.
- `RacketMini` ist nur noch der alte Name auf dieselbe Zeichnung, damit
  die sechs Aufrufer bleiben können.

Wer die Form ändert, rechnet sie neu und prüft sie **im Satz**: bei
22 px in der Tab-Bar und bei 150 px nebeneinander.

### Die Linien-Palette (`LineIcon`, „Haarlinie")

Die Glyphen der App sind **ein Satz** in [src/icons.jsx](src/icons.jsx)
(`LN` + `LineIcon({name,size,color,sw})`): 24er-Raster, 1,25er
Strich, runde Enden, nichts gefuellt — so fein wie die Antiqua
daneben. Masse kommt vom Glaskreis, nicht vom Glyph.

- Die alten Komponenten (`HomeIcon`, `TrophyIcon`, `EditIcon`,
  `TrashIcon`, `ToolsIcon`, `SpeakerIcon`, `BellIcon`, `MenuIcon`,
  `PersonGlyph`, `BookIcon`, `SearchIcon`, `StopwatchIcon`,
  `PeopleIcon`, in App.jsx die Tab-Glyphen, `ShareIcon`,
  `HistoryIcon`, `ScanGlyph`, die Home-Glyphen fuer Match, Kalender,
  Route und der Live-teilen-Sender) **behalten ihre Namen** und
  zeichnen nur noch mit `LineIcon` — die Aufrufer bleiben, wie sie
  sind. Ein neuer Glyph kommt als Eintrag in `LN`, nicht als eigenes SVG.
- **Unter ~19 px waechst der Strich mit** (`24/size`), sonst faellt
  1,25 unter einen Geraetepixel und wird grau.
- **Aktiv** heisst in der Tab-Leiste: derselbe Glyph mit 1,75er Strich
  auf der hellen Pille — nicht gefuellt. Gefuellte Glyphen stehen nur
  noch in Knoepfen, deren Flaeche selbst die Farbe ist (Play/Pause im
  orangen Kreis).
- Der Schlaeger (`PadelRacketIcon`) und die Modus-Glyphen bleiben
  eigene Zeichnungen; sie sind Bildsprache, keine Werkzeugsymbole.
- Turnier auf Home ist nur noch der Pokal — Schlaeger plus Pokal
  schief uebereinander war das einzige zusammengesetzte Zeichen.

### `TournamentModeIcon` — die sieben Modus-Glyphen

Steht in [src/icons.jsx](src/icons.jsx) und rechts auf den Format-Karten
im Schritt 1 des Assistenten — dort, wo vorher ein Haken stand. Der
Haken sagte nur, was die orange Kontur schon sagt; die Auswahl trägt
jetzt `aria-pressed`, und der Platz trägt die Information, um die es
geht.

Die Bildsprache ist eine Grammatik, kein Sammelsurium:

`SCHLÄGER (oder PAAR)  +  genau EIN Zeichen darüber  =  MODUS`

- Der Schläger steht **einmal** im Satz (`TM_HEAD` + `TM_GRIP`) und
  wird nur verschoben, skaliert und gedreht. `TmRacket` rechnet die
  Strichstärke gegen die Skalierung (`TM_SW/k`) — sonst würden die
  Paare dünner als die Solisten.
- Der Kopf ist ein **Tropfen, kein Kreis**: ein hohler Kreis mit Stiel
  liest sich bei 28 px als Ball oder Lupe.
- **Nichts umschließt etwas anderes.** Ein Ring um zwei Köpfe wurde
  zuverlässig als Eule gelesen, ein Strahlenkranz direkt am Kopf machte
  aus der Sonne eine Glühbirne. Der Abstand zwischen Grundwort und
  Zeichen ist das, was beide lesbar hält.
- Team-Americano und Team-Mexicano tragen dasselbe Paar und
  unterscheiden sich **nur** im Zeichen darüber (Kreispfeil bzw. ↑↓).
- Farbe: `active` → `T.o`, sonst `T.t3`. Keine weiteren Farben, keine
  Verläufe, keine Rasterbilder.

Wer einen Glyph ändert, prüft ihn im Satz — nicht einzeln. Die
Fallstricke stehen oben, weil jeder davon einmal passiert ist.

### `CourtMap` — die Anlage als Skizze

Ein Court war lange nur eine Zeile in einer Liste; auf der Anlage ist
er ein Ort. Jedes Turnier traegt deshalb eine Anordnung — pro Court ein
Rasterfeld und eine Ausrichtung (`tourney.courtLayout`, Logik in
[src/courtLayout.js](src/courtLayout.js)).

Dieselbe Karte steht an drei Stellen und tut dort zwei Dinge:

- **Setup** (Assistent, Schritt "Courts", und die Court-Karte im freien
  Formular): `editable` — erst den Platz antippen, dann das Feld.
  **Kein Drag**: auf 390 px trifft ein Finger das Raster nicht
  zuverlaessig, und ein Zug, der danebengeht, sieht aus wie ein
  kaputter Knopf. Ein belegtes Zielfeld *tauscht* die beiden Plaetze,
  statt den Zug zu verweigern.
- **Laufendes Turnier** (ueber den Court-Karten, ab 2 Courts): zeigt je
  Platz nur den Stand ("läuft", "21:14", "frei") und **filtert** die
  Karten darunter auf einen Court. Keine Namen auf der Kachel — die
  braucht man in Lesegroesse, und die passt auf 80 px nicht; wer sie
  sehen will, tippt den Platz an. Der Filter faellt beim Rundenwechsel weg —
  sonst steht der Host vor einer leeren Liste und sucht den Schalter.
  Der Stift oben rechts schaltet dieselbe Karte in den Editiermodus,
  damit sich die Anordnung vor Ort noch gerade ruecken laesst.

- `normLayout` laeuft **bei jeder Benutzung**, nie nur beim Speichern:
  so ueberleben Turniere von vor dieser Funktion, geaenderte
  Court-Zahlen und halb kaputte Datensaetze ohne Sonderfall.
- Die Glyph-Box traegt das Seitenverhaeltnis des Platzes (20 x 10 m) per
  `aspectRatio`, **nicht** `preserveAspectRatio="none"` — sonst skalieren
  waagerechte und senkrechte Linien unterschiedlich und das Netz sieht
  nach Fehler aus statt nach Grundriss.

### `PlayerScanSheet` — das Fenster zum Screenshot-Scan

Drei Zustaende, ein Kopf: Ressort ("AUS SCREENSHOT"), Zeile, orange
Haarlinie — dieselbe Anmutung wie die Screen-Koepfe. Der Titel sagt,
wo man steht ("Wird gelesen", "12 Namen gefunden"), statt zu
wiederholen, was der Knopf davor schon gesagt hat.

- **Lesen**: Schritt, Bildzaehler, Balken. Der Datenschutz-Satz steht
  genau hier — das ist der Moment, in dem jemand wartet und liest.
- **Liste**: Zaehler plus Sammelschalter (bei zwoelf Namen will niemand
  zwoelf Haken einzeln wegklicken), dann eine Zeile je Name im Bild der
  spaeteren Spielerliste: Haken-Kreis, Name auf einer Linie. Man sieht,
  was man bekommt.
- **Fehler**: der einzige Weg, auf dem die Auswahlkarte noch erscheint.

Zwei Dinge, die beim Umbau aufgeflogen sind:

- Das Sheet haengt per `createPortal` am **Body**. Der Wizard-Schritt
  bildet einen eigenen Stapelkontext; darin bekam das
  `position:fixed`-Overlay weder die volle Hoehe noch lag es ueber Kopf-
  und Fusszeile des Assistenten — das Sheet stand oben abgeschnitten und
  unten unter dem Weiter-Knopf.
- Der Grund ist **zweilagig** (`linear-gradient(--card,--card), --bg`).
  `--card` allein ist halbtransparent: sobald das Sheet ueber dem
  Assistenten lag, schien dessen oranger Weiter-Knopf hindurch. Gleiche
  Falle wie beim Netz in `MatchSlotGrid` und beim Rand des
  `MinuteRuler`. Die klebende Fusszeile traegt denselben Grund.

### Tastatur: das Feld rollt mit

Wer unten in einem langen Formular in ein Feld tippt, bekommt vom
Browser einen Sprung: die Tastatur fährt hoch, das Feld liegt
dahinter, und die Seite springt hart nach oben. Ein App-weiter Effekt
in `App()` rollt es stattdessen weich in den sichtbaren Bereich, in
derselben Zeit, in der die Tastatur aufgeht.

- Gerechnet wird gegen das **`visualViewport`**, nicht gegen
  `window.innerHeight`. Auf iOS schrumpft das Layout-Viewport beim
  Öffnen der Tastatur gar nicht — nur `visualViewport` weiß, wo der
  sichtbare Bereich aufhört. Aus demselben Grund reicht
  `scrollIntoView({block:'center'})` nicht: es zentriert im
  *Layout*-Viewport und lässt das Feld trotzdem hinter der Tastatur.
- Gerollt wird der **nächste scrollende Vorfahre**, nicht das Fenster:
  die Screens sind `100%` hoch, gescrollt wird immer eine Box darin
  (auch in den Sheets).
- Bewegt wird **nur, was nötig ist** (Band von 26 px an beiden
  Rändern). Ein Feld, das schon bequem im Bild steht, bleibt stehen —
  sonst wandert bei jedem Feldwechsel das halbe Formular.
- Ausgelöst von `focusin` **und** `visualViewport.resize`: beim Fokus
  weiß noch niemand, wie hoch die Tastatur wird. Der Fokus-Anlauf ist
  der Fallback für Browser ohne `visualViewport`.
- **Kein globales `scroll-behavior: smooth`.** Das würde auch
  `ScoreWheel` und `MinuteRuler` treffen, die ihre Startposition per
  `scrollTop` setzen — die würden beim Aufbau sichtbar dorthin fahren
  statt schon dort zu stehen.

### Bottom-Sheets (`useSheetDrag`)

Nach unten wischen schliesst ein Sheet. Ob eine Geste das darf,
entscheidet sich **beim Aufsetzen des Fingers** und gilt bis zum
Loslassen: nur wenn der Inhalt ganz oben steht (`scrollTop <= 0`).
Vorher wurde der Drag mitten in der Geste neu angekert, sobald die
Liste oben ankam — wer in einer langen Liste (erkannte Namen aus dem
Screenshot) zurueck nach oben wischte, hat damit das Sheet zugezogen
statt gescrollt.

Dazu entscheidet die erste Bewegung ueber 6 px die Achse; eine
waagerechte Geste gibt den Drag ganz ab. Innerhalb einer erlaubten
Geste bleibt der Anker stehen, waehrend die Liste noch scrollt — so
geht es ab dem Listenanfang nahtlos ins Ziehen ueber.

### Schnellzugriff im Konfigurator

Unter dem Titel steht eine Leiste aus vier Kacheln — Spieler, Courts,
Zeit, Runde. Jede zeigt ihren aktuellen Wert (die Leiste sagt also
etwas, auch ohne dass man tippt) und oeffnet per Tipp ein `QuickSheet`
mit genau dieser Einstellung. Das Formular darunter ist lang; diese
vier fasst man staendig an.

Entscheidend: ein Schnellzugriff stellt **genau einen Wert** — die
Anzahl, die Uhrzeit, die Dauer. Spieler und Courts bekommen einen
`QuickStepper` (grosse Zahl, Minus, Plus), Zeit die `TimeDial`, Runde
den `MinuteRuler`. Namen, Court-Namen, Platzkarte und die
Rundenempfehlung bleiben im Formular: wer zwischendurch schnell einen
Spieler mehr braucht, will nicht die halbe Konfiguration im Sheet
haben.

Ein erster Entwurf zeigte im Sheet die komplette Karte aus dem
Formular. Technisch huebsch (eine Quelle), in der Hand aber ein
zweites Formular im ersten — und genau das soll der Schnellzugriff ja
abkuerzen.

- Das Sheet traegt **nur das Ressort**, keine Ueberschrift: bei einem
  einzigen Bedienelement sagt der Wert selbst, worum es geht.
- Ein deaktivierter Stepper-Knopf bleibt stehen, statt zu
  verschwinden — eine Reihe, die ihre Breite aendert, springt.
- Im Online-Modus fehlen Spieler und Zeitfenster in der Leiste — dort
  gibt es beides im Formular auch nicht (Spieler joinen per PIN).
- Am Body und zweilagiger Grund wie beim `PlayerScanSheet`, aus
  denselben zwei Gruenden.

### Update-Newsletter („Was ist neu", `ritmo_whatsnew`)

Nach einem Update laeuft beim ersten Start **einmal** ein Newsletter:
ein Bild je Neuerung, ein Satz dazu, und im Bild sitzt eine orange
Marke auf der Stelle, um die es geht. Danach ist die Ausgabe abgehakt
und kommt nicht wieder.

**Eine neue Ausgabe veroeffentlichen** — drei Schritte:

1. Ausschnitte der **echten App** aufnehmen (keine Montagen) und als
   JPEG unter `public/assets/whatsnew/` ablegen. Ein Bild bleibt
   deutlich unter 100 kB; zusammen sollten sie 200 kB nicht reissen —
   sie liegen im Startbundle-Pfad und jeder laedt sie genau einmal.
2. Einen Eintrag in `RELEASES` (src/whatsNew.js) anhaengen: neue `id`,
   `kicker`, `title` und die `slides`. Jede Folie traegt `img`,
   `ratio` (das Seitenverhaeltnis DES AUSSCHNITTS, z. B. `'366 / 248'`),
   `title`, `text` und optional `spots`.
3. Fertig — die neue `id` steht in keinem Merker, also geht sie beim
   naechsten Start auf.

Was dabei leicht schiefgeht:

- **`ratio` muss zum Bild passen.** Die Marken sind Prozentangaben
  auf dem Bild; stimmt das Verhaeltnis nicht, sitzen sie daneben.
  Deshalb bringt jede Folie ihr eigenes mit, statt dass alle in ein
  3:4-Korsett gezwungen werden.
- **Die Marke sitzt auf der Sache, nicht auf ihrer Beschriftung.**
  Ein Schildchen, das genau das Wort zudeckt, um das es geht, ist
  schlimmer als gar keins. Hoechstens zwei Marken pro Bild.
- **Der Text ist fuer Nutzer, nicht fuer Entwickler.** „Leg deine
  festen Formate als Karte an" — nicht „neue Persistenzschicht fuer
  Schnellstarts". Keine Versionsnummern, keine Dateinamen, keine
  Schalter, die im Bild nicht vorkommen.
- **Beim allerersten Start wird alles still abgehakt** (erkannt am
  fehlenden Profil): wer die App gerade installiert hat, kennt nichts
  Altes und braucht keine Neuigkeiten.
- Gezeigt wird **nur auf Home** — waehrend Splash, Login, Onboarding
  oder einem laufenden Turnier hat niemand darauf gewartet.
- Abgehakt wird auch beim `×`: wer ihn drueckt, hat entschieden.

### Schnellstarts im Turnier-Bereich (`ritmo_quickstarts`)

Sie standen bis zur neuen Startseite im Spielen-Streifen auf Home und
liegen jetzt in `TournamentHub`, unter „Turnier starten / beitreten“:
wer einen Schnellstart will, will ein Turnier, und genau dorthin
fuehrt der Turnier-Knopf auf Home.

Die „Sofort"-Karten sind **keine feste Liste
mehr**. Wer jeden Dienstag dieselbe Runde spielt, legt sie einmal an —
Name, Format, Spieler, Courts, Rundendauer, Wertung — und tippt sie
danach nur noch an. Die vier mitgelieferten (`DEFAULT_QUICK_STARTS`)
sind die Startaufstellung, nicht das Gesetz: wer sie löscht, ist sie
los.

- Gespeichert wird **auch die leere Liste**. Den Schlüssel zu löschen
  würde beim nächsten Start die vier Standardkarten zurückholen —
  „ich will keine Schnellstarts" ist aber eine Entscheidung.
- `normQuickStarts` läuft beim Laden **und** bei jedem Schreiben
  (gleiche Regel wie `normLayout`): Formate, die es nicht mehr gibt,
  Spielerzahlen jenseits von 4–32 und mehr Courts als Viererfelder
  werden eingefangen, statt später im Konfigurator zu knallen.
- Die **Unterzeile wird gerechnet** (`quickStartSub`), nie getippt.
  Sonst steht auf der Karte „8 Spieler", während zehn drin sind. Auf
  der Karte ohne Rundendauer (`short`) — drei Angaben brechen dort in
  die dritte Zeile.
- Die Karte **startet**, der Stift oben rechts **ändert** — dieselbe
  Geste wie auf der Court-Karte. Ein Knopf im Knopf ist kein gültiges
  HTML, deshalb liegt der Stift als Geschwister daneben und die Karte
  darunter, beide in einem `position:relative`-Rahmen.
- Am Ende des Streifens steht die gestrichelte „+"-Karte (dieselbe
  Sprache wie die Papierkorb-Zeile in der Live-Liste). Ab `QS_MAX`
  (12) verschwindet sie.
- Der Schnellstart setzt jetzt auch den **Turniernamen** vor
  (`quickStartPreset` → `name`, im Konfigurator hinter `saved?.name`):
  ein wiederkehrendes Format heisst jeden Dienstag gleich.
- Gruppen (Mixicano) hängen am **Format**, nicht an einem zweiten
  Schalter im Datensatz — ein `groups:true`, das nicht zum Format
  passt, kann es damit nicht geben.
- Die Rückfrage vors Löschen liegt **im** Sheet-Overlay, dessen
  `onClick` schliesst. Sie braucht deshalb einen Wrapper, der den
  Klick abfängt, sonst macht „Behalten" beides zu.

### Turnier-Setup: Assistent zuerst

"Turnier starten" oeffnet den **Assistenten** (`TournamentWizard`) —
er liegt als Vollbild-Overlay ueber dem freien Konfigurator
(`TournamentSetup`), der dieselben States haelt. Schliessen bedeutet
deshalb nicht "abbrechen", sondern "frei weiterbauen": alles Getippte
steht im Formular darunter, und die Karte "Turnier-Assistent ›" fuehrt
zurueck.

Von allein geht er nur bei einem **frischen** Turnier auf
(`!isEdit && !seed`). Ein Entwurf, ein Schnellstart-Preset oder das
Bearbeiten eines laufenden Turniers bringt schon eine Konfiguration
mit — wer die oeffnet, will sie sehen und nicht in Schritt 1 von 7
landen.

Beide Wege zeigen dieselbe Spielerliste (Nummernkreis, Ressort, Name
auf einer Linie) und dieselben Bausteine (`MinuteRuler`, `CourtMap`,
Screenshot-Scan). Wer einen davon aendert, aendert beide.

**Keine Zwischensequenz mehr.** Bis zu diesem Stand lief vor dem
Assistenten `PadelIntro` („Ping Pong? Tennis? Pickleball? Meh." →
„Padel? Hell yeah.") — sie ist samt CSS raus. Dass beim automatischen
Aufgehen kein Formular durchblitzt, leistet allein `entrance=false`:
der Assistent steht im selben Frame deckend da, ohne Blende.

### `MinuteRuler` — die Rundendauer

Eine waagerechte Skala mit Schnappraster, darunter Zeiger und Dauer als
`mm:ss`. Sie steht an **beiden** Wegen zur selben Einstellung: im freien
Konfigurator (`TournamentSetup`) und im Schritt "Runden & Regeln" des
Assistenten (`TournamentWizard`). Der Assistent hatte dort lange ein
−/+‑Paar; zwei Wege zur selben Einstellung sollen nicht zwei
Bedienungen sein.

- Die Masse (`RL_*`) stammen aus einer Vorlage und sind gemessen, nicht
  geschätzt — wer sie ändert, misst nach.
- Der Wert läuft **während** des Wischens nur nach innen (`live`), nach
  aussen erst 110 ms nach dem letzten Scroll-Event. Sonst rendert der
  ganze Setup-Screen bei jedem Scroll-Tick neu.
- Der Zeiger folgt dem Wert auch von aussen (Empfehlung, geladener
  Entwurf), aber nicht, während der Nutzer selbst wischt (letzte
  500 ms) — sonst kämpfen Snap und Korrektur gegeneinander.
- Die Ränder blenden per CSS-Maske aus, **nicht** per Farbverlauf in
  `--card`: die Karte ist im Glass-Theme halbtransparent, ein Verlauf
  daraus legt einen hellen Schleier über den Rand. Dieselbe Falle wie
  beim Netz in `MatchSlotGrid`.
- `RL_TIME_FS` setzt auch die Ablesezeile der `TimeDial` im Zeit-Schritt
  des Assistenten. Zwei Zeitangaben im selben Assistenten sollen nicht
  aus zwei Uhren stammen — wer die Größe ändert, ändert beide.

### Endstand: die Titelseite (`TournamentLeaderboard`)

Der Endstand ist eine **Titelseite**: kein Kopf mit „Endstand", die
Schlagzeile IST der Siegername — `SIEGER` als Ressort, darunter der
Name mit Punkt in der kursiven Antiqua, so gross, wie er in die Zeile
passt (`nameFs`: 88 px bis 6 Zeichen, dann 68 / 52 / 42).

- Darunter **ein Satz zum Ausgang** (`story`), gerechnet und nie
  getippt: Vorsprung vor dem Zweiten in der gewaehlten Wertung, oder
  bei Gleichstand „punktgleich mit X — mehr Siege" (bzw.
  „siegegleich … — mehr Punkte").
- **Drei Zahlen** in Glaskacheln: Punkte, Siege, Matches; die Zahl der
  gewaehlten Wertung steht orange. Duenne Ziffern (Inter 300) wie die
  laufende Timer-Kapsel.
- **Die Tabelle klappt auf** („Ganze Tabelle", mit den Kugeln 2–4 als
  Vorschau), statt den Sieger nach oben zu schieben; daneben
  „Rundenverlauf" (Sheet). Danach „Teilen" (PDF) und „Neues Turnier".
- Die **Partikel-Szene** ueber dem Namen (Pokal → Ball → Konfetti,
  `WinnerParticles` samt `pc*`-Helfern) ist mit der Titelseite raus —
  wer sie zurueckwill, findet sie in der Git-Historie.

Das **Konfetti** (`ConfettiBurst`) fliegt aus der Mitte statt von oben
zu fallen: Schwerkraft, Luftwiderstand, Drall — und jedes Stück kippt
um seine eigene Achse (`scaleX` über einen Kosinus). Genau dieses
Kippen ist der Unterschied zwischen „Rechtecke fallen" und Konfetti.

- Es hängt per Portal **am Body**, nicht in der Sieger-Karte: die hat
  `overflow:hidden` für ihre runden Ecken, und Konfetti, das an einer
  Kante endet, ist keins.
- Die Stücke starten **versetzt** (bis 520 ms). Alles auf einmal ist
  ein Knall, der vorbei ist, bevor man hinsieht.
- Es läuft **einmal** und hält dann an — eine Endlosschleife am
  Endstand wäre Kirmes. Bei `prefers-reduced-motion` startet es gar
  nicht.

### `LbRow` — die Turniertabelle

Eine Zeile, vier Aufrufer: die Tabelle im laufenden Turnier (Tab
"Tabelle"), der Endstand, die Live-Teilnehmeransicht und der
Bestaetigungsschritt vor dem Beenden (`EndReviewSheet`). Aufbau von
links nach rechts:

`Farbkante | Medaille/Kreis + Name | SP S N P | Wertung`

- Die **Farbkante** (`LB_BAR`, 3 px, Spielerfarbe) sitzt bündig am
  Kartenrand. Sie hat den früheren Farbpunkt neben dem Namen ersetzt —
  zwei Träger derselben Information in einer Zeile.
- Der **Platz** ist Medaille für 1–3 (`MedalIcon`), sonst ein Kreis mit
  der Ziffer. Der Kreis hält die Spalte gleich breit; eine nackte Ziffer
  neben drei Medaillen sah aus, als fehle etwas. Der Erste trägt
  **keinen** orangen Zeilengrund mehr — die Goldmedaille sagt dasselbe.
  Die einzige getönte Zeile ist `highlight` (die eigene Zeile in der
  Teilnehmeransicht).
- **`LbStats`** zieht SP/S/N/P als echte Spalten mit Haarlinie davor
  (`rules`). Die Ligatabelle auf dem Home-Screen schaltet sie mit
  `rules={false}` ab — sie ist eine randlose Liste ohne Wertungsspalte.
- Der **Endstand** rollt als *eine* Seite: die Tabellenkarte wächst
  auf ihre volle Höhe, gescrollt wird der Screen. Vorher war sie
  `flex:1` mit eigenem Scrollbereich darin — der Sieger-Block nahm den
  Bildschirm, die Tabelle bekam ein Fenster von zwei Zeilen, und man
  scrollte in einer scrollenden Seite. Achtung beim Ändern: in der
  scrollenden Flex-Spalte schrumpfen Kinder von selbst, der
  Sieger-Block braucht `flexShrink:0` (ohne ihn blieb ein 48-px-Streifen
  Konfetti übrig).
- Die **Wertungsspalte** (`LB_PKT_W`, dunkleres Panel) nimmt die
  Wertung als `children`: im laufenden Turnier ein Knopf über die volle
  Zellenhöhe (Punkte anpassen — der Stift allein war ein 12-px-Ziel),
  sonst nur Text. Darin stapeln sich Zahl, Label und der
  `PauseBonusChip`. `LB_ROW_H` (58) und die 5 px Polsterung der Zelle
  sind für genau diesen Stapel bemessen: mit 54 px stieß der Chip unten
  durch die Trennlinie. Der Knopf darf deshalb auch nicht
  `height:'100%'` tragen, sonst kann die Zelle nicht mitwachsen.
  `LB_PKT_W` (62) ist nach **drei** Ziffern bemessen — ab 100 Punkten
  klebte die Zahl bei 50 px an beiden Rändern. Der Stift im laufenden
  Turnier hängt absolut am linken Zellenrand: inline schob er die Zahl
  aus der Mitte, und dreistellig stand sie sichtbar neben ihrem eigenen
  Label.

### Theming

Themes are defined as CSS variable sets in the `CSS` template literal in [`src/theme.js`](src/theme.js). Only `glass` (RITMO Liquid Glass) is selectable — the sets for `dark`, `light`, `padel`, `wimbledon` and `funky` are still in the file but no longer offered in Settings → Anpassung, and stored legacy values fall back to `glass`. The `T` object is the JS mirror — components use `T.bg`, `T.card`, etc., which all resolve to `var(--bg)`. The active theme is set via `document.documentElement.setAttribute('data-theme', theme)` plus a sync of the `--bg` value to `<body>` background and the `theme-color` meta tag (so iOS/Android system chrome matches).

When adding a styled element: use the `T.*` tokens. Never hardcode hex colors in components — the theme switch will break.

**Vier Rollen, vier Farben** — jede Farbe hat eine Aufgabe, und ein
Knopfstapel soll sich daran ablesen lassen:

| Token | Rolle | Beispiel |
|---|---|---|
| `T.o` | die Marke, „weiter" | `Weiter →` |
| `T.r` | Abbruch / Endgültiges | `Turnier jetzt beenden` |
| `T.blue` | nachsehen, Nebenhandlung | `Review` im Beenden-Sheet, `PauseBonusChip` |
| `T.yellow` | der Weg zurück | `Zurück`, `← Zurück zur Prüfung` |

Im Beenden-Sheet (`EndReviewSheet`) tragen die drei Wege aus Schritt 1
diese Farben als **Kreise nebeneinander** statt als drei Knopfzeilen
untereinander: `← Zurück` (gelb), `Review` (blau), `→ Weiter`
(orange), jeder mit weißer Beschriftung darunter. Drei volle Zeilen
für drei Wörter waren ein Drittel des Sheets, und drei gleich breite
Balken sagen nicht, welcher der Hauptweg ist. Das Wort steht *unter*
dem Kreis, nicht darin — im Kreis würde es die Farbe zerschneiden, und
ein farbiger Kreis allein ist ein Raten. Die Tinte im Kreis ist
`'#000'` bzw. `'#fff'`, nicht `T.bg`/`T.t1`: sie richtet sich nach der
Füllung, nicht nach dem Theme (gleiches Muster wie der orange
Weiter-Knopf, der seit jeher `'#000'` trägt).

**Beide Schritte liegen in derselben Rasterzelle** (`display:grid`,
beide auf `gridArea:'1 / 1'`, der inaktive auf `visibility:hidden`).
Die Zelle ist so hoch wie der höhere von beiden, und damit ist das
Sheet in beiden Schritten gleich hoch — der Knopfrand springt beim
„Weiter" nicht mehr um ~200 px nach unten. Keine feste Zahl: Schritt 2
misst je nach Feld und offenen Ergebnissen 580 bis 660 px, das Raster
misst selbst. Die Knopfreihe trägt `marginTop:'auto'`, damit sie in
beiden Schritten auf derselben Höhe sitzt.

**Schritt 2 trägt dieselbe Reihe** — `← Zurück` (gelb) und
`■ Turnier beenden` (rot) — und bewusst **dasselbe
Drei-Spalten-Raster** mit leerer dritter Spalte, obwohl dort nur zwei
Knöpfe stehen. So bleibt „Zurück" in beiden Schritten auf demselben
Pixel (x = 18 bei 390 px) statt zu wandern, wenn man hin und her geht.
Der Abstand ist zugleich der Schutz: zwischen den beiden Kreisen liegen
über 60 px, und „beenden" ist unwiderruflich.

`--yellow` / `--yellowSoft` stehen wie `--homeHeaderGrad` als
*abgeleitete* Tokens unter den Theme-Sätzen, nicht in jedem einzeln:
die Farbe gehört zu keiner Palette. Die hellen Sätze bekommen ein
dunkleres Amber — `#FFC93C` verschwindet auf Weiß. Vor dieser Rolle
trugen „zurück" und „nachsehen" beide die graue Standardkontur; in
einem Stapel aus drei Knöpfen sah der Ausweg aus wie die Nebensache
daneben.

### Tabs bleiben stehen (`KeepTab`)

Home, Profil, Live, Suche und Bibel werden nach dem ersten Besuch
**nicht mehr abgebaut**: `KeepTab` haelt sie gemountet und schaltet nur
`visibility`. Vorher wurde jeder Tab beim Verlassen weggeworfen — beim
Zurueckkommen neu gebaut, Bilder neu dekodiert, Einblenden von vorn,
Scrollposition weg. Das wirkte wie ein Neuladen bei jedem Tipp.

- **`visibility`, nicht `display:none`**: ein Element, das aus
  `display:none` zurueckkommt, startet seine CSS-Animationen neu
  (`.fu` & Co.) — genau das Refresh-Gefuehl.
- **Absolut im `#root`**, der dafuer `position:relative` traegt — nicht
  `fixed`: das Fenster ist in der iPhone-App zu kurz.
- Ein Tab wird erst beim ersten Besuch gebaut; beim Abmelden
  (`alive={loggedIn}`) fallen alle weg.
- Gehaltene Tabs blenden nur beim ersten Besuch ein (eigene
  `screenIn`-Regel auf `.keep-tab`), danach steht der Wechsel sofort —
  wie bei einer nativen Tab-Leiste.
- Ein gehaltener Tab rendert mit, wenn sich `App`-State aendert. Wer
  dort einen teuren Effekt oder Timer einbaut, denkt daran, dass er
  auch laeuft, solange der Tab unsichtbar ist.

### Tab-Leiste: einklappen wie iOS (`navStore`)

Die Leiste verhaelt sich wie die iOS-26-Tab-Leiste mit „minimize on
scroll": **kein Timer**. Sie klappt ein, wenn man im Inhalt nach unten
scrollt (mehr als 6 px am Stueck, ab 64 px Abstand vom Anfang), und auf
beim Zurueckscrollen, ganz oben (unter 24 px), beim Antippen des
Kreises und bei jedem Tab-Tipp.

- Vorher zog sie sich ausserhalb von Home nach 2,6 s von selbst
  zusammen. Seit die Tabs stehen bleiben (`KeepTab`), kamen Suche und
  Bibel dadurch schon eingeklappt zurueck — „sofort eingeklappt".
- **Ein Zustand fuer alle Leisten** (`navStore`, Modul-Ebene mit
  Abonnenten): jeder Tab-Screen hat seine eigene `TabBar`, und sie
  muessen beim Wechsel uebereinstimmen.
- Gehoert wird per `scroll`-Listener in der Capture-Phase am Dokument
  (scroll blubbert nicht), aber nur auf Scroller im **sichtbaren**
  `.keep-tab`.
- Eingeklappt steht ein Kreis (`NAV_MINI`, 52 pt) unten links mit dem
  Symbol des **aktiven** Tabs — vorher immer Home, man sah nicht mehr,
  wo man war. Ausgeklappt ist die Leiste `NAV_H` (62 pt) hoch; die
  Knopfleiste (`MatchBar`) steht auf derselben Mittellinie.
- Zusammenziehen 0,28 s ohne Anlauf, Aufgehen 0,46 s mit kaum
  sichtbarer Feder (`--ease-out-soft`), beides zur linken Kante hin.
  Aufgeklappt wird ohne Umweg: die Bar waechst direkt aus dem Kreis.

### Bewegung (theme.js)

Ein System, nicht dreissig Einzelfaelle. Die Kurven stehen als Tokens
in `:root`:

| Token | Wofuer |
|---|---|
| `--ease-out-quint` | alles, was hereinkommt (Screens, `.fu`, `.fi`) |
| `--ease-ios` | Bottom-Sheets und Wisch-Gesten (Einfahren, Zurueckschnappen) |
| `--ease-out-soft` | Feder mit kaum sichtbarem Ueberschwingen (Loslassen eines Knopfs, `.si`) |

- **Screenwechsel**: die Kinder jedes Screens (Kopf, Inhalt, Leisten)
  blenden ein und steigen 8 px auf, leicht gestaffelt; das Foto
  (`aria-hidden`) bleibt stehen. Die Regel steht unter `:where()`
  (Spezifitaet null) — eine eigene Animation gewinnt immer.
- **Nur `opacity` und die Einzel-Properties `translate`/`scale`**, nie
  `transform`, in Keyframes, die auf beliebige Elemente treffen: eine
  Animation ueberschreibt ein inline-`transform`, und viele Elemente
  positionieren sich damit (`translate(-50%,…)`, das Ziehen der Sheets).
  Endzustand `none`, nicht `translate(0)`: ein stehengebliebenes
  `translate`/`transform` macht das Element zum Bezugsrahmen fuer
  `position:fixed` darin.
- **`backwards` statt `both`**, wo das Element danach wieder seinen
  inline-Wert tragen muss (`.fi`, `.slide-up`, Screenwechsel).
- **Sheets** (`.slide-up`) fahren von ganz unten ein (0,56 s,
  `--ease-ios`). Vorher stand dort `var(--anim-base) ease` — zwei
  Zeitkurven im Shorthand machen die Deklaration ungueltig, die Sheets
  sprangen auf. Gleiches galt fuer `.slide-down`, `.slide-in-right`,
  `.press-pop`, `.nav-icon-active`, `.dot-pop`.
- **Druck auf Knoepfe**: hinein in 90 ms auf `scale(.965)`, zurueck mit
  der weichen Feder (420 ms). **Kein `filter`** dabei — auf einer
  Glasflaeche zwingt er die Unschaerfe dahinter neu zu rechnen. **Kein
  globales `will-change`** mehr: es legte fuer jeden Knopf eine eigene
  Grafik-Ebene an, hunderte auf langen Listen.
- Der Killswitch fuer `prefers-reduced-motion` bleibt unveraendert.

### Fonts

Three families, exposed as theme-independent tokens (`--font-sans`, `--font-text`,
`--font-display`) with the JS mirrors `T.fontSans`, `T.fontText`, `T.fontDisplay`
plus the `.txt` / `.display` utility classes:

| Token | Family | Loading |
|---|---|---|
| `T.fontSans` | Inter | `@fontsource/inter`, imported in [src/main.jsx](src/main.jsx) |
| `T.fontText` | SF Pro | system font on iOS/macOS, **never bundled** — Apple does not license it for self-hosting. Elsewhere the stack falls through to the platform's own grotesque |
| `T.fontDisplay` | Centauri | bundled from [src/fonts/](src/fonts/README.md) — **unicase** (lowercase renders as caps), German glyphs generated via [tools/extend-centauri.py](tools/extend-centauri.py) |

Bundled fonts (Inter, Centauri) are self-hosted via npm + Vite, never a CDN —
the CSP in `index.html` allows `font-src 'self' data:` only. Use the tokens instead of hardcoding
family names, same rule as for colors.

**Each family has one job** ("Sport meets Lifestyle" — the app should read
like a sports magazine, not like a settings dialog):

| Family | Used for | Never for |
|---|---|---|
| **Centauri** (`T.fontDisplay`) | Kickers/ressorts above a title, section labels (`SectionRule`), table column heads, long-form headings. Short words, generously letter-spaced (`letterSpacing` 1.6–3). | **Numbers** — the `0` is an empty rectangle and the `2` is barely distinguishable from a `Z`. Also anything longer than ~16 characters: at 15 px a line runs ~19 px per character, so it stops fitting 390 px screens. |
| **SF Pro** (`T.fontText`, `.txt`) | Subtitles under a screen title, card descriptions, legal/long-form body copy. Italic for sublines, upright for body. | Labels, buttons, anything functional. |
| **Inter** (`T.fontSans`) | Everything else — titles, body, buttons, all figures (with `fontVariantNumeric:'tabular-nums'`). | — |
| **Times** (`T.fontSerif`) | **Headlines in the Home language** — italic bold for screen titles (`ScreenHeader`) and section heads (`SectionRule`, via `HEAD_SERIF`), upright bold for card titles. A system font (Times New Roman / Liberation Serif), never bundled. | Body copy, labels, buttons, figures — those stay Inter / SF Pro. |

**Libre Caslon (Regular, aufrecht) steht an genau einer Stelle: dem
Turniernamen auf der Live-Karte** (`T.fontCard`, gebuendelt aus
[src/fonts/caslon.css](src/fonts/caslon.css), OFL). Sie lief kurz
app-weit als Antiqua und ging wieder zurueck auf Times — sie ist eine
Auszeichnung fuer den Namen, keine Hausschrift. Erst stand sie dort
kursiv; **Turnier-Karten tragen keine Kursive** (Live-Karte, „Deine
Spiele" auf Home, Schnellstarts im Turnier-Bereich — auch deren
Unterzeilen sind aufrecht). Ein Schnitt, gemeldet fuer 100–900: ein
`fontWeight:700` wuerde sonst eine Fett-Attrappe erzeugen.

**Turniere in der Live-Liste** (`LiveTourneyCard`, Variante „Buehne"):

- **Laufend** ist eine grosse Karte: Format als Ressort, „läuft"
  rechts, der Name gross in Caslon, darunter „Runde n" mit einem
  Segment **je Court der laufenden Runde** (orange = Ergebnis
  bestaetigt) — eine Rundenzahl gesamt gibt es nicht, die Courts
  schon. Unten die Spieler als `OrbStack` (vier Kugeln + „+n"), die
  Court-Zahl und „Weiter ›". Die Karte ist der Knopf; „Weiter" ist
  nur die Zusage.
- **Kein Timer auf der Karte**: die Rundenzeit tickt nur in
  `TournamentPlay`. Auf der Live-Liste stuende eine eingefrorene Zahl.
- **Beendet / Entwurf** sind schlanke Zeilen: Pokal bzw. Stift, Name,
  darunter „Sieger X · Datum" bzw. „Entwurf · Format · n Spieler".
- Match und Online-Turnier behalten ihre alte Karte samt Unterzeile.

**Leere Live-Liste**: Standfirst „Hier erscheinen deine laufenden
Matches und Turniere." und zwei gestrichelte Platzhalter in Kartenform
— „Neues Turnier" (startet wie der Hub direkt den Assistenten,
`onNewTourney`) und „Einzelnes Match". Vorher stand dort ein Satz in
der Antiqua als Fliesstext und ein Plus, das erst zwei Knoepfe
aufklappte.

**Spieler als Glaskugel** (`GlassOrb`, `OrbStack` in App.jsx) statt
farbiger Kreise — **farblos**: klares Glas mit Glanzpunkt oben links,
hellem Saum unten rechts und dunklem Gegenschatten. **Sie steht still**:
eine Weile morphte ihre Kontur (`orbMorph`), das lenkte im Turnier vom
Spielstand ab und ist wieder raus. Darin
steht die **Nummer** des Spielers (`label`; `pNum(list,id)` = Stelle
in der Turnierliste — die id ist im Setup ein Zaehler mit Luecken),
auf der Live-Karte die Initiale. Ueberall im Turnier: Spielerliste im
Assistenten und im Formular, `MatchSlotGrid` (Court-Karte und
Teilnehmeransicht, `numOf`), Aufstellungs-Sheet, Namenswahl beim
Beitreten. Die eigene Kugel traegt `ring` (orange). Die
Spielerfarbe lebt nur noch als Farbkante in der Tabelle.

**Assistent**:

- **Schritt 1** zeigt die Formate als **Kacheln** im Zweierraster
  (Modus-Glyph im Kreis oben, Plakette rechts, Name unten, Kurztext
  zweizeilig), die siebte ueber die volle Breite. Lange Namen
  („Team-Americano") stehen kleiner statt umzubrechen.
- **Schritt 2 und 3**: was per Plus dazukommt, fliegt von links ein
  (`useFlyIn`, `.fly-in`), was per Minus, × oder Wischen geht, fliegt
  nach rechts hinaus und klappt dabei zu (`useFlyOut`, `.fly-out`,
  `FLY_OUT_MS`). Geloescht wird erst nach der Animation; was beim
  Betreten des Schritts schon stand, fliegt nicht.
- **Schritt 6** (Wertung): hinter den beiden Karten ein Zeichen in
  der Sprache der Home-Deko (`WinModeDeco`, 26 % Weiss, gewaehlt
  42 %): Punkte als Punktmatrix „21", Siege als Haken aus drei Knoten.

Two shared components carry the pattern; prefer extending them over
re-inventing a header:

- `ScreenHeader({kicker,title,subtitle,rule,subtitleItalic})` — lettering
  (`ritmo-lettering.png`, as on Home) → ressort → headline in the Times
  italic of Home → orange hairline → italic standfirst. `rule={false}` drops the
  hairline where vertical space is tight (the running-tournament screen).
  `subtitleItalic={false}` drops the italic where the subline is not a
  standfirst but a **status row** — the running tournament's
  `Americano | Runde 4 | Bis 21:00 Uhr`. Italic belongs to prose; those
  are three separate readings with rules between them, not a sentence.
- `SectionRule({children,trailing})` — section label (Times italic, 25 px,
  since the Home redesign; Centauri before) plus a full-width
  hairline underneath. The hairline sits *below* the row on purpose: inline
  it collapsed to a stub whenever the label was long and a trailing action
  was present.

### Die soziale Schicht ist ausgebaut

Spielersuche, fremde Profile, Clubs samt Club-Chat und die
Follower-Listen sind **raus**. Was bleibt, ist das eigene Profil. Der
Grund war der Club-Chat: er lud beim Öffnen die ganze Liste plus
Unread-Zähler nach, und ein App-weiter Timer fragte alle 30 s
`totalUnreadCount()` — für einen Bereich, in dem nichts steht. Der
Rest hing daran: ohne fremde Profile gibt es niemanden zu folgen, und
ohne Folgen keine Follower-Zahl.

Entfernt wurden:

| Weg | Was dort war |
|---|---|
| Suche-Tab | Spieler, Clubs, Buchungsassistent — jetzt **nur** der Satz „Hier findest du bald einen Marketplace, Communities und Clubs." |
| RITMO Post | der Tab „Chats" (Club-Chat-Liste) samt Unread-Punkt auf der Home-Glocke |
| Profil | das Ressort „Community" (Follower / Folgt) |
| Match-Präferenzen | die Karte „Bevorzugte Spieler" — sie zog ihre Auswahl aus der Follower-Liste |
| Einstellungen | „Chat-Mitteilungen" und „Follower & Soziales" (Benachrichtigungen), das Ressort „Sichtbarkeit" (Privatsphäre) |
| [src/App.jsx](src/App.jsx) | `PlayerListItem`, `SocialScreen`, `PlayerSearch`, `PublicProfile`, `Clubs`, `ClubCreate`, `ClubDetail`, `ClubChat`, `FollowList` |
| [src/db.js](src/db.js) | der gesamte Social-Block (Suche, Follower, Clubs, Chat) — die Datei endet jetzt nach den Beta-Keys |

Vier Regeln, falls das jemand neu baut:

- **Kein toter Code als Vorlage.** Die Screens sind gelöscht, nicht
  auskommentiert oder hinter ein `false&&` gestellt. „Sauberes Remake"
  heißt neu bauen; ein Skelett, an dem man sich entlanghangelt, ist
  genau das, was hier nicht stehen soll.
- **Die Daten bleiben.** Die Flags im Profil (`private`, `hideDna`,
  `hideStats`, `hideMatches`) und in den Match-Präferenzen
  (`players`) stehen weiter im Datensatz. Es liest sie nur niemand
  mehr.
- **In der Datenbank fehlt noch der Nachzug.**
  [supabase/social-teardown.sql](supabase/social-teardown.sql) ist
  das Gegenstück zu `social-migration.sql` und wird von Hand im
  Supabase SQL Editor ausgeführt. Teil 1 (Policies) **eilt**: der
  anon-Key steht im ausgelieferten Bundle, und `public profile read`
  (`USING (is_public = TRUE)`) gibt den kompletten `data`-JSONB jedes
  nicht-privaten Profils an jeden heraus — solange es die
  Spielersuche gab, war das der Preis dafür, jetzt steht es nur noch
  offen. Teil 2 (`DROP TABLE`) steht auskommentiert da, weil er
  unwiderruflich ist.
- **Was auf eine gelöschte Sache zeigt, ist eine Lüge.** Ein Schalter
  „Andere können dich in der Spielersuche finden" ohne Spielersuche,
  ein Benachrichtigungs-Schalter für Club-Chats ohne Club-Chat, ein
  roter Punkt, der nie rot wird — deshalb gingen die mit raus und
  nicht erst beim Aufräumen.
- **Die Padel-Clubs in den Match-Präferenzen sind etwas anderes.** Das
  sind Spielorte auf einer Karte (`NEARBY_CLUBS`), kein Community-
  Feature, und sie bleiben.

### Auth — Supabase only

The `auth` object in [`src/auth.js`](src/auth.js) reads `window.supabase` (set up in `main.jsx`). If the client is missing, every method throws `SUPA_MISSING` immediately — there is no localStorage mock fallback. The single non-Supabase code path is the dev bypass: signing in as `ritmo` / `padelhaus` returns a synthetic test user without calling Supabase.

The tournament-sharing helpers in [src/db.js](src/db.js) target tables defined in [supabase/schema.sql](supabase/schema.sql) (`ritmo_sessions`, `ritmo_submissions`, `ritmo_profiles`, `ritmo_matches`). Row Level Security is enabled on the user-owned tables (`ritmo_profiles`, `ritmo_matches`) with `auth.uid() = user_id` policies; `ritmo_sessions` and `ritmo_submissions` are public on purpose (PIN-protected, no PII).

### Konto löschen — und wirklich aussperren

Drei Schichten, und nur eine davon liegt in Supabase.

**1. Löschen** (`supabase/functions/delete-account/index.ts`).
`auth.admin.deleteUser()` verlangt den Secret-Key (früher
`service_role`), und der darf nicht ins Bundle — also läuft der
Aufruf in einer Edge Function (`supabase functions deploy
delete-account`). **Die User-ID kommt nie aus dem Request**: die
Funktion liest sie aus dem JWT des Aufrufers (`getUser()` gegen den
Auth-Server, nicht nur dekodiert), sonst wäre ein Body mit fremder ID
eine Fernsteuerung für fremde Konten. Deshalb nimmt sie gar keinen
Body an. `ritmo_matches` und `ritmo_profiles` werden **vorher
ausdrücklich** gelöscht, obwohl sie per Fremdschlüssel an
`auth.users` hängen: ob dort `ON DELETE CASCADE` steht, weiß die
Funktion nicht, und ohne Cascade scheitert das Delete am
Fremdschlüssel.

**2. Aussperren geht nur halb.** Ein Supabase-Access-Token ist ein
stateless JWT und **lässt sich nicht widerrufen**. Das Löschen nimmt
dem Konto die Refresh-Tokens (die Session-Zeilen hängen per Cascade
an `auth.users`), neue Tokens gibt es also nicht mehr — das bereits
ausgestellte bleibt aber bis zu seinem `exp` gültig, per Default eine
Stunde. Der einzige Hebel ist die Ablaufzeit: Dashboard →
Authentication → Sessions → JWT expiry. Dasselbe gilt für
`auth.signOut()`, das in supabase-js v2 ohnehin im Default-Scope
`global` läuft (widerruft die Refresh-Tokens auf allen Geräten).

**3. Die App selbst war das eigentliche Loch.** `loggedIn` kommt aus
`ritmo_logged_in` in localStorage, der Splash fragt genau dieses
Flag, und beim Kaltstart hatte `getSession()` nur einen Zweig für
„Session da". Ein gelöschtes Konto benutzte die App also weiter, bis
der Client von sich aus einen Refresh versuchte — und ein von Hand
gesetztes Flag reichte ganz ohne Konto. Jetzt hat der Aufruf einen
else-Zweig, mit drei Bedingungen, damit niemand fälschlich
rausfliegt:

- **Nur online.** Offline lässt sich keine Session prüfen, und die
  App verspricht in der FAQ ausdrücklich, dass lokale Matches und
  Turniere ohne Netz laufen. Der Check holt das beim nächsten Start
  mit Netz nach.
- **Nur ohne Fehler.** Ein fehlgeschlagener Refresh (Funkloch mit
  `navigator.onLine === true`) liefert einen `error` — das ist kein
  Beweis, dass es die Session nicht mehr gibt.
- **Nur ohne Dev-Marker.** Der Test-User (`ritmo` / `padelhaus`) hat
  keine Supabase-Session und flöge sonst bei jedem Reload raus. Der
  Marker `ritmo_dev_user` wird **und** wird gelesen nur unter
  `import.meta.env.DEV` — in Production fällt beides beim Bundling
  weg, ein von Hand gesetzter Schlüssel nützt dort also nichts
  (nachgemessen: der Name steht in keinem dist-Chunk).

**Das Gerät wird mitgelöscht** (`wipeLocalData()` in utils.js, löscht
über den Präfix `ritmo_`, nicht über eine Liste — eine Liste vergisst
man beim nächsten neuen Schlüssel). RITMO ist local-first: Profil,
Turniere und Papierkorb liegen in localStorage, und auf dem Knopf
steht „alles wird unwiderruflich gelöscht". Danach ein harter Reload
statt einer Kette von Settern: in diesem Moment hängen zwei Dutzend
States an Daten, die es nicht mehr gibt, und jeder Persistenz-Effekt
würde seinen Schlüssel sofort neu schreiben.

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
