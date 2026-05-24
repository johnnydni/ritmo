# RITMO Shop — Mock Landing

Statische Single-Page Mockup-Shop für RITMO Padel im **Bauhaus Dark**
Design. Acht Mock-Produkte (Schläger, Bälle, Apparel, Print-Editionen)
mit interaktivem Kategoriefilter und Newsletter-Vormerkung.

Kein Backend, kein Checkout, kein Tracking — reine Statik. Die
"Vormerken"- und "Vormerken lassen"-Buttons sind Front-End-Stubs.

## Was drin ist

| Datei | Inhalt |
|-------|--------|
| `index.html` | Komplette Shop-Page (HTML + Inline-CSS + Inline-SVG, keine externen Assets) |
| `404.html`   | Schlichte 404-Seite |
| `README.md`  | Diese Anleitung |

## Fallback-Grafiken

Jede Produktkarte hat zwei Layer:

```html
<div class="prod-img">
  <svg class="fallback">…</svg>                <!-- Bauhaus-Placeholder -->
  <img src="assets/products/foo.jpg" onerror="this.remove()">
</div>
```

Der Bauhaus-SVG liegt unten, das `<img>` oben drauf. Sobald du echte
Produktfotos hast, leg sie unter `assets/products/` mit den im HTML
referenzierten Dateinamen ab — sie überlagern dann den Placeholder
automatisch. Schlägt das Bild fehl (Datei fehlt, Pfad falsch), entfernt
der `onerror`-Handler das `<img>` und der SVG-Fallback bleibt sichtbar.

Erwartete Dateinamen:

```
assets/products/schlaeger-pro.jpg
assets/products/schlaeger-edge.jpg
assets/products/balls-tournament.jpg
assets/products/balls-3pack.jpg
assets/products/tee-schwarz.jpg
assets/products/hoodie-crew.jpg
assets/products/poster-app-live.jpg
assets/products/print-dna.jpg
```

Empfohlenes Format: JPG/PNG, 800×640 px (5:4 Seitenverhältnis), unter
200 KB pro Bild.

## One-time Deploy (eigenes Repo)

1. **Neues GitHub-Repo** anlegen, z.B. `ritmopadel-shop` (public, leer).

2. **Inhalt dieser Mappe pushen:**

   ```bash
   cp -r shop/ /tmp/ritmopadel-shop
   cd /tmp/ritmopadel-shop
   git init -b main
   git add .
   git commit -m "initial shop mockup"
   git remote add origin git@github.com:<USER>/ritmopadel-shop.git
   git push -u origin main
   ```

3. **GitHub Pages aktivieren:** Settings → Pages → Source:
   **Deploy from a branch**, `main` / `/ (root)` → Save.

4. **(Optional) Custom Domain** — wenn der Shop auf einer eigenen
   Sub-Domain laufen soll (z.B. `shop.ritmopadel.app`):

   - Im Repo-Root eine Datei `CNAME` mit dem Hostnamen anlegen:
     ```
     shop.ritmopadel.app
     ```
   - Beim DNS-Provider einen CNAME-Eintrag setzen:
     ```
     shop   CNAME   <USER>.github.io.
     ```
   - Settings → Pages → Custom domain → `shop.ritmopadel.app` →
     Save → *Enforce HTTPS*.

   Alternativ als Apex-Domain (z.B. `ritmopadel-shop.de`): vier
   A-Records auf die GitHub-Pages-IPs setzen
   (`185.199.108.153` – `185.199.111.153`), `CNAME`-Datei entsprechend
   anpassen.

5. **Verify** in Inkognito: `https://<deine-domain>/` zeigt den Shop.

## Updates pflegen

- **Produkt hinzufügen:** den `<article class="card-prod">`-Block in
  `index.html` kopieren, Texte/Bild-Pfad/Preis ändern, fertig.
- **Filter erweitern:** neue Kategorie? Ein neuer `<button class="chip-btn"
  data-cat="…">` plus passendes `data-cat="…"` auf den Karten. Die
  Filter-Logik im `<script>` läuft automatisch.
- **Echte Bilder einbinden:** Datei in `assets/products/` ablegen, der
  bestehende Pfad im `<img src>` zieht. Nichts weiter zu tun.

## Design-Spec

- **Hintergrund:** `#0A0A0A` (near-black)
- **Primär:** Orange `#FF7A1A` (CTA, Akzente, Cart-Badge)
- **Bauhaus-Quartet:** Gelb `#FFD60A`, Blau `#0A84FF`, Rot `#E84545`, Weiß
- **Typo:** System Sans-Serif, Headlines `font-weight:900` + `italic`
- **Geometrie:** Kreis / Quadrat / Dreieck im Hero, abstrakte
  Bauhaus-Kompositionen als Produkt-Placeholder
- **Rhythmus:** 5-Farben-Bauhaus-Streifen am Seitenende
- **Responsive:** Mobile-first, Produkt-Grid wechselt automatisch
  von 4 → 3 → 2 → 1 Spalten

Keine externen Fonts, keine CDN-Scripts, keine Dependencies — alles
inline.
