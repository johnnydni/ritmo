# Centauri

Display-Schrift für Headlines und Akzente. Eingebunden über
[`centauri.css`](centauri.css) → `src/main.jsx`, gebündelt von Vite
(kein CDN — die CSP der App erlaubt nur `font-src 'self'`).

Im Code nie hart setzen, sondern das Token benutzen:
`style={{fontFamily:T.fontDisplay}}` oder `className="display"`.

## Wichtig: unicase + ergänzte Zeichen

Centauri ist eine **Versalschrift** — Klein- und Großbuchstaben teilen
sich dieselben Formen. Kleinbuchstaben erscheinen also als Versalien;
für Fließtext ist die Schrift nicht gedacht.

Die Originaldatei (Version 1.00, 87 Glyphen) deckt nur ASCII ab. In
einer komplett deutschsprachigen App fehlten damit ausgerechnet die
häufigsten Zeichen — jede zweite Headline wäre mitten im Wort auf die
Ersatzschrift gefallen. Ergänzt wurden deshalb, abgeleitet aus den
vorhandenen Glyphen der Schrift:

| Zeichen | Woraus |
|---|---|
| `Ä Ö Ü ä ö ü` | Grundbuchstabe + zwei Punkt-Glyphen als Trema |
| `ß` | zwei `S` — die korrekte Versalform (`Straße` → `STRASSE`) |
| `– —` | Bindestrich-Balken in En-/Em-Länge |
| `…` | drei Punkt-Glyphen |
| `+ ×` | Balken in der Strichstärke der Schrift |
| `„` | Anführungszeichen auf die Grundlinie gesetzt |
| `" '` | auf die typografischen Zeichen der Schrift gemappt |

Reproduzierbar über [`tools/extend-centauri.py`](../../tools/extend-centauri.py)
(Eingabe: die Original-TTF, Ausgabe: erweiterte TTF → woff2).

Weiterhin **nicht** enthalten und damit im Fallback: `→ ✓ € @ $ * ~`
sowie Akzentbuchstaben (`í`, `é`, …). Für solche Stellen die Grund-
oder Serifenschrift verwenden.

## Lizenz

Die Datei stammt aus einem Free-Font-Portal; das `fsType`-Flag der
Schrift steht auf 8 (*editable embedding*), erlaubt das Einbetten also
technisch. Da die Datei öffentlich mit der App ausgeliefert wird, vor
einem kommerziellen Launch bitte die Herkunft und eine Webfont-Lizenz
beim Urheber prüfen.
