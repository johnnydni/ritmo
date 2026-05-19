# RITMO Padel

Made by Team RITMO. With love for Padel ♡

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build → /dist
```

## Supabase Setup (Auth + DB)

### 1. Projekt anlegen
1. Konto bei [supabase.com](https://supabase.com) erstellen (free tier reicht)
2. Neues Project erstellen → Region: Frankfurt (eu-central-1)
3. Settings → API: URL + anon-public key kopieren

### 2. Env-Vars setzen
```bash
cp .env.example .env.local
# .env.local mit deinen Werten editieren
```

`.env.local` (NICHT committen!):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Für GitHub Actions: Repo Settings → Secrets → Actions:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Email Auth aktivieren
1. Supabase Dashboard → Authentication → Providers
2. **Email** ist by default aktiv
3. Settings: "Confirm email" aktiviert lassen für Verifikation
4. URL Configuration → Site URL: `https://<user>.github.io/ritmo-padel/`
5. Redirect URLs ergänzen: `https://<user>.github.io/ritmo-padel/**`

### 4. Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. OAuth 2.0 Client ID erstellen (Web application)
3. Authorized redirect URIs: `https://<your-project>.supabase.co/auth/v1/callback`
4. Client ID + Secret in Supabase → Auth → Providers → Google eintragen
5. Provider aktivieren

### 5. Datenbank-Sicherheit (Row Level Security)
Sobald du eigene Tabellen anlegst (z.B. für Tournaments):
```sql
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own tournaments" ON tournaments
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "users create their own" ON tournaments
  FOR INSERT WITH CHECK (auth.uid() = host_id);
```

RLS macht: jeder User sieht nur eigene Daten — auch wenn anon-key public ist.

## GitHub Pages Deployment

1. Repo erstellen, Code pushen
2. Settings → Pages → Source: **GitHub Actions**
3. Settings → Secrets → Actions: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` setzen
4. Workflow läuft automatisch → live unter `https://<USER>.github.io/<REPO>/`

## Spielstil-Bilder

Die 6 Bilder für die Spielstil-Cards in **`public/assets/`** ablegen:

| Datei | Spielstil |
|-------|-----------|
| `chicochica.jpeg` | Chico / Chica |
| `toro.jpeg` | Toro |
| `individuoso.jpeg` | Individuoso |
| `muro.jpeg` | Muro |
| `fantasma.jpeg` | Fantasma |
| `motor.jpeg` | Motor |

Bei fehlendem Bild zeigt die App einen farbigen Platzhalter.

## Auth Mock vs Real

Die App funktioniert **ohne Supabase-Setup** mit Mock-Auth (localStorage-basiert).
Sobald `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` gesetzt sind, schaltet
die App automatisch auf echte Supabase-Calls um.
