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
| [src/utils.js](src/utils.js) | `lsGet` / `lsSet` (safe localStorage), `getAssetBase`, `getInitials`, `readImageAsDataUrl`, `resizeImage`. | Pure JS; no React. |
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
- **Next-round preview**: while a round runs, `TournamentPlay` already draws the *following* round and keeps it on `tourney.nextPreview = {forRound, round}`; `nextRound()` then plays exactly that draw instead of generating a fresh one. This is what feeds the "Danach" page in the live participant view. It only happens for formats in `PREVIEWABLE_FORMATS` (`americano`, `teamamericano`, `mixicano`) whose pairings depend on the *history* of who played with/against whom. Mexicano and Team-Mexicano draw from the leaderboard, King of the Court and Knockout from the current round's winners — previewing those would fix the pairings before the results exist and stop them being the format the host picked, so they show an honest "steht noch nicht fest" instead.

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

The participant's match view is a two-page swipe (`MatchPager`, scroll-snap — same mechanism as the Home "Spielen" strip): **Jetzt** shows the running match as a 2×2 grid (`MatchSlotGrid`), **Danach** shows the next match on a blue padel court (`PadelCourtBlue`, real 20 m × 10 m proportions) plus a Mit/Gegen readout. The pager sits outside the score-submission card on purpose so players who are sitting out still see what is coming.

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

Der Kopf trägt links `COURT 1 · 1V1`, rechts die `✓ FERTIG`-Plakette
und den Stift für die **Aufstellung**. Sonst nichts.

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

### `MatchBar` im laufenden Turnier — das Werkzeug-Fach

Die Leiste zeigt im Ruhezustand nur **Home**, den **Werkzeug-Schalter**
(`ToolsIcon`, vier Kacheln) und — wenn die Runde fertig ist —
**Nächste Runde**. Beenden, Live teilen, Ansagen und Bearbeiten liegen
im Fach: vier Knöpfe, die man pro Runde vielleicht einmal anfasst,
standen dauerhaft über dem Turnier, das man ständig ansieht.

- Ein `rightButtons`-Eintrag mit **`items`** ist ein Fach. Seine Knöpfe
  liegen **absolut** links neben dem Schalter (`right: calc(100% + 10px)`)
  und wachsen nach links — nicht im Fluss. Grund ist Arithmetik: sechs
  runde Knöpfe passen bei 390 px nicht nebeneinander (vier Werkzeuge
  230 px + Schalter + Weiter + Home = 376 von 342). Im Fluss müsste
  etwas schrumpfen; *über* der Leiste darf es einfach liegen.
- Animiert wird **`max-width`, nicht `width`** — von `width:auto` auf 0
  gibt es keinen Übergang.
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

Two shared components carry the pattern; prefer extending them over
re-inventing a header:

- `ScreenHeader({kicker,title,subtitle,rule,subtitleItalic})` — ressort →
  headline → orange hairline → italic standfirst. `rule={false}` drops the
  hairline where vertical space is tight (the running-tournament screen).
  `subtitleItalic={false}` drops the italic where the subline is not a
  standfirst but a **status row** — the running tournament's
  `Americano | Runde 4 | Bis 21:00 Uhr`. Italic belongs to prose; those
  are three separate readings with rules between them, not a sentence.
- `SectionRule({children,trailing})` — section label plus a full-width
  hairline underneath. The hairline sits *below* the row on purpose: inline
  it collapsed to a stub whenever the label was long and a trailing action
  was present.

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
