# RITMO Padel

Scoreboard für Padel-Matches und Turniere — React PWA, mobile-first.

## Schnellstart

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview   # local preview of build
```

---

## Deploy auf GitHub Pages

### Einmaliger Setup (5 Minuten)

1. **GitHub-Repo erstellen**
   - Auf github.com → "New repository"
   - Name: z.B. `ritmo-padel` (merken — wird Teil der URL)
   - Public (Pages funktioniert auch privat, aber dann braucht's Pro)
   - "Create repository"

2. **Code pushen** (lokal im Projekt-Ordner)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DEIN-USERNAME/ritmo-padel.git
   git push -u origin main
   ```

3. **Pages aktivieren**
   - Im Repo → Settings → Pages
   - Source: **GitHub Actions** (NICHT "Deploy from a branch")
   - Speichern

4. **Workflow läuft automatisch**
   - Beim nächsten Push (oder direkt nach Setup) startet `.github/workflows/deploy.yml`
   - Im "Actions"-Tab sichtbar
   - Nach ~1-2 Minuten ist die App live unter:
   ```
   https://DEIN-USERNAME.github.io/ritmo-padel/
   ```

### Updates deployen

```bash
git add .
git commit -m "Update"
git push
```

Der Workflow läuft automatisch bei jedem Push auf `main`. URL ändert sich nicht.

### Manueller Re-Deploy

Im GitHub-Repo → Actions → "Deploy to GitHub Pages" → "Run workflow".

---

## Architektur-Notizen

- **Single-File App**: `src/App.jsx` (~5100 Zeilen) enthält die komplette App. CSS-Variables im `CSS`-Konstanten-Block am Anfang, injected via `<style>{CSS}</style>` im JSX.
- **Themes**: 4 eingebaute (Dark, Light, Padelhaus Blue, Wimbledon Green) + Custom-Designs aus dem Design Wizard. Theme-Switch via `data-theme`-Attribut am `<html>`-Element.
- **State**: alles in `localStorage` mit `ritmo_*` Prefixes — Custom Themes, Match-State, Turnier, Settings.
- **Keine externen UI-Libraries**: alle Icons inline SVG, kein Tailwind, kein Lucide, kein CSS-Framework. Nur React + Vite.

## Base-Path-Konfiguration

GitHub Pages serviert unter `/<repo-name>/`. Der Workflow setzt automatisch `BASE_PATH=/<repo-name>/` beim Build (`vite.config.js` liest das Environment-Var). Wer das Repo anders benennt, muss nichts ändern — funktioniert automatisch.

Falls du auf eine eigene Domain (CNAME) deployen willst:
1. `public/CNAME` mit deiner Domain anlegen (z.B. `padel.example.com`)
2. Im Workflow `BASE_PATH=/` setzen (oder den env-Block entfernen)
3. Custom Domain im Repo-Settings → Pages konfigurieren

## Browser-Support

- Modern browsers (last 2 Jahre): voll funktional
- iOS Safari 15+: voll funktional inklusive Web Audio + Speech
- Custom Themes: Pointer Events API erforderlich

## Lizenz

Privates Projekt — Team RITMO. Made with love for Padel ♡
