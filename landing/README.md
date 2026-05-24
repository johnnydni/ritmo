# ritmopadel.de — Landing Page

Statische Single-Page-Landing für `ritmopadel.de`:

- Hinweis, dass die App unter [ritmopadel.app](https://ritmopadel.app/) zu finden ist.
- "Coming Soon"-Sektion für RITMO Events, Shop und mehr.
- Impressum-Sektion (Pflichtangaben gemäß § 5 TMG).
- RITMO **Bauhaus Dark** Design — schwarzes Fundament, geometrische
  Primärfarben (Orange / Gelb / Blau / Rot), fette italic Wortmarke.

Kein automatischer Redirect — der Link zur App ist ein normaler
`<a href>`-Button, den der Besucher anklickt.

## Dateien

| Datei | Inhalt |
|-------|--------|
| `index.html` | Landing Page (HTML + Inline-CSS + Inline-SVG, keine externen Assets) |
| `404.html`   | Schlichte 404-Seite für unbekannte Pfade |
| `CNAME`      | `ritmopadel.de` — bindet GH Pages an die Domain |
| `README.md`  | Diese Anleitung |

Keine Build-Tools, keine Dependencies. Browser öffnet HTML, fertig.

## ✏️ Vor dem Deploy: Impressum ausfüllen

Im `index.html` sind die Felder mit `[…]`-Platzhaltern markiert
(`[Name / Firma]`, `[Straße + Hausnummer]`, `[PLZ + Ort]`,
`[Vor- und Nachname]`). Diese **muss** der Betreiber durch echte
Daten ersetzen, sonst ist das Impressum nicht rechtsgültig.

Such-and-Replace im Editor reicht — alle Platzhalter stehen unter dem
`<section class="impressum">` Block.

## One-time Deploy

1. **Neues Repo** auf GitHub anlegen, z.B. `ritmopadel-de` (public, leer).

2. **Inhalt dieser Mappe pushen:**

   ```bash
   cp -r landing/ /tmp/ritmopadel-de
   cd /tmp/ritmopadel-de
   git init -b main
   git add .
   git commit -m "initial landing page"
   git remote add origin git@github.com:<USER>/ritmopadel-de.git
   git push -u origin main
   ```

3. **GitHub Pages aktivieren** im neuen Repo:
   - Settings → Pages → Source: **Deploy from a branch**
   - Branch: `main` · Folder: `/ (root)` → Save
   - Erste Deploy-Welle dauert ca. 1 Minute.

4. **DNS für `ritmopadel.de`** beim Domain-Provider (gleicher wie für `.app`):

   ```
   @   A   185.199.108.153
   @   A   185.199.109.153
   @   A   185.199.110.153
   @   A   185.199.111.153
   ```

   Optional IPv6:

   ```
   @   AAAA   2606:50c0:8000::153
   @   AAAA   2606:50c0:8001::153
   @   AAAA   2606:50c0:8002::153
   @   AAAA   2606:50c0:8003::153
   ```

   Für `www.ritmopadel.de`:

   ```
   www   CNAME   <USER>.github.io.
   ```

5. **Pages Custom Domain:** Settings → Pages → Custom domain →
   `ritmopadel.de` → Save. DNS-Check kann 10 min – 24 h dauern. Sobald
   grün: **Enforce HTTPS** aktivieren (Let's-Encrypt-Cert wird auto-
   provisioniert; erste Cert-Generierung max. 30 min).

6. **Verify** im Inkognito-Fenster:
   - `https://ritmopadel.de/` → zeigt die Landing-Page.
   - `https://ritmopadel.de/blabla` → zeigt die 404-Seite mit Link zur App.

## Updates pflegen

Beim Release neuer Coming-Soon-Inhalte (Events, Shop) einfach den
HTML-Block in `index.html` editieren und ins Repo pushen. GH Pages
deployt innerhalb von 30 s.

## Design-Spec (kurz)

- **Hintergrund:** `#0A0A0A` (near-black)
- **Primär:** Orange `#FF7A1A` (Brand-CTA, Akzente)
- **Sekundär:** Gelb `#FFD60A`, Blau `#0A84FF`, Rot `#E84545` (Bauhaus-Quartet)
- **Typo:** System Sans-Serif, headlines `font-weight:900` + `italic`
- **Geometrie:** Kreis, Quadrat, Dreieck im Hero — überlappend, unbalanciert
- **Rhythmus:** Bauhaus-Streifen am Seitenende (5 Farben)
- **Responsive:** Mobile-first, Hero-Headline skaliert mit `clamp()`

Komplett im `index.html` enthalten, keine externen Fonts/Bilder.
