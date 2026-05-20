-- ─── RITMO Padel – Supabase Schema ──────────────────────────────
-- Dieses Script im Supabase SQL Editor ausführen:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Turniersessions (Host publiziert, Spieler lesen)
CREATE TABLE IF NOT EXISTS ritmo_sessions (
  pin         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ergebnis-Einsendungen (Spieler schreiben, Host liest)
CREATE TABLE IF NOT EXISTS ritmo_submissions (
  pin         TEXT NOT NULL,
  court_id    TEXT NOT NULL,
  score_a     INT NOT NULL DEFAULT 0,
  score_b     INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (pin, court_id)
);

-- Row Level Security aktivieren (öffentlicher Zugriff für die App)
ALTER TABLE ritmo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritmo_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write sessions"
  ON ritmo_sessions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Public read/write submissions"
  ON ritmo_submissions FOR ALL
  USING (true) WITH CHECK (true);

-- Alte Sessions automatisch nach 24h löschen (optional)
-- Requires pg_cron extension (Supabase Pro feature)
-- SELECT cron.schedule('cleanup-ritmo', '0 * * * *',
--   $$DELETE FROM ritmo_sessions WHERE updated_at < NOW() - INTERVAL '24 hours';
--     DELETE FROM ritmo_submissions WHERE updated_at < NOW() - INTERVAL '24 hours';$$
-- );

-- ─── Spielerprofile (user-spezifisch) ───────────────────────────
-- Profil als JSONB-Blob, damit Feld-Erweiterungen während der
-- Entwicklung kein Schema-Migration brauchen. Ein Profil pro User.
CREATE TABLE IF NOT EXISTS ritmo_profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ritmo_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON ritmo_profiles;
CREATE POLICY "own profile read" ON ritmo_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own profile write" ON ritmo_profiles;
CREATE POLICY "own profile write" ON ritmo_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own profile update" ON ritmo_profiles;
CREATE POLICY "own profile update" ON ritmo_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Match-Logs (Singles + Turnier-Court-Matches) ───────────────
-- Ein Eintrag pro abgeschlossenem Match. Stats werden daraus
-- berechnet (matches, wins, win rate, form trend).
CREATE TABLE IF NOT EXISTS ritmo_matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format        TEXT NOT NULL,                 -- 'bo3' | 'americano' | 'tournament-americano' | 'tournament-mexicano'
  player_names  TEXT[]   NOT NULL DEFAULT '{}',
  score_a       INT,
  score_b       INT,
  sets          JSONB,                          -- bo3: array of sets, sonst null
  user_team     CHAR(1),                        -- 'A' oder 'B'
  user_won      BOOLEAN,                        -- null wenn unentschieden / unklar
  tournament_id TEXT,                           -- nullable; gruppiert Turnier-Matches
  round_index   INT,                            -- nullable; Index der Turnier-Runde
  finished_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ritmo_matches_user_finished_idx
  ON ritmo_matches (user_id, finished_at DESC);

ALTER TABLE ritmo_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own matches read" ON ritmo_matches;
CREATE POLICY "own matches read" ON ritmo_matches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own matches insert" ON ritmo_matches;
CREATE POLICY "own matches insert" ON ritmo_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own matches delete" ON ritmo_matches;
CREATE POLICY "own matches delete" ON ritmo_matches
  FOR DELETE USING (auth.uid() = user_id);
