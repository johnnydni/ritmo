# Schriften

Die App lädt ihre Schriften über npm-Pakete (Fontsource), gebündelt von
Vite — kein CDN, damit die Content-Security-Policy (`font-src 'self'`)
greift:

| Familie | Herkunft | Import |
|---|---|---|
| Inter | `@fontsource/inter` | `src/main.jsx` |
| Tinos (Times-New-Roman-Ersatz) | `@fontsource/tinos` | `src/main.jsx` |

Die Stacks stehen als Tokens in [`src/theme.js`](../../src/theme.js):
`--font-sans`, `--font-serif`, `--font-display` bzw. `T.fontSans`,
`T.fontSerif`, `T.fontDisplay`.

## Centauri nachrüsten

Centauri gibt es weder bei Google Fonts noch bei Fontsource, deshalb
liegt hier keine Datei. Aktuell greift die Schrift nur, wenn sie auf dem
Gerät installiert ist. Zum Ausliefern:

1. Lizenz prüfen — die Datei wird öffentlich mit der App ausgeliefert,
   also wird eine Webfont-/Embedding-Lizenz benötigt.
2. `centauri.woff2` (nur woff2 nötig, alle Zielbrowser können es) hier
   ablegen: `public/fonts/centauri.woff2`.
3. In `src/theme.js` den `@font-face`-Block ganz oben im `CSS`-Template
   einkommentieren.
4. Lizenzdatei danebenlegen, falls die Lizenz das verlangt.

Weitere Schnitte (Bold/Italic) als eigene `@font-face`-Blöcke mit
passendem `font-weight` / `font-style` ergänzen.
