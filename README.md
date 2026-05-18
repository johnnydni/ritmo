# RITMO Padel

> Mobile-first Padel-Scoreboard PWA. Made by Team RITMO. With love for Padel ♡

## Features

- 🎾 Bo3 Match-Scoring mit 4-Spieler-Setup
- 🏆 Americano & Mexicano Turniere
- 🎨 5 Themes (Bauhaus Dark / Federleicht / Padelhaus Blue / Wimbledon Green / Funky)
- 🔊 Sprachansagen via Custom Audio-URL
- 👤 Player-Profile mit RITMO-Level-Estimator (0.30–5.80 in 0.03-Schritten)
- 🎭 Padel Personality Quiz → 6 Spielstile (Chico/Toro/Individuoso/Muro/Fantasma/Motor)
- 📖 Regelwerk + Spieler-Journey mit Swipe-Navigation

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Öffnet `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview   # local production preview
```

## Deployment zu GitHub Pages

1. Repo zu GitHub pushen
2. Settings → Pages → Source: **GitHub Actions** auswählen
3. Beim nächsten Push auf `main` deployt der Workflow automatisch
4. App erreichbar unter `https://<username>.github.io/<repo-name>/`

`BASE_PATH=/<repo-name>/` wird vom Workflow automatisch gesetzt.

## Spielstil-Bilder

6 JPEGs in `public/assets/` ablegen. Details siehe `public/assets/README.md`.

## Projektstruktur

```
ritmo-padel/
├── .github/workflows/deploy.yml
├── public/
│   ├── 404.html
│   ├── favicon.svg
│   └── assets/         Spielstil-Bilder
├── src/
│   ├── main.jsx
│   └── App.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Demo-Login

Username: `dev` · Password: `ritmodev` (überspringt Onboarding)

Oder **Registrieren** klicken → Onboarding-Flow.
