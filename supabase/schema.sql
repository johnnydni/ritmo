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
