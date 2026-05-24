-- ═══════════════════════════════════════════════════════════════
--  RITMO — Social Layer Migration
--  ───────────────────────────────────────────────────────────────
--  Diese Datei wird MANUELL im Supabase SQL Editor ausgeführt
--  (Dashboard → SQL Editor → New Query → paste → Run).
--
--  Sie ergänzt die bestehende Datenbank um die Social-Features:
--   - Public-Profile-Sichtbarkeit (display_name + is_public)
--   - Followers (one-sided)
--   - Clubs + Club-Members
--   - Bookable Matches + Match-Slots
--   - Match-Invites
--
--  Die Datei ist idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS
--  / CREATE OR REPLACE) — kann beliebig oft erneut ausgeführt werden.
--
--  Voraussetzung: ritmo_profiles existiert bereits (siehe Haupt-
--  schema). Nur Tabellen und Policies, die unten neu hinzukommen,
--  werden hier angelegt.
-- ═══════════════════════════════════════════════════════════════

-- ─── Public-Profile Spalten (Sichtbarkeit + Suche) ──────────────
--
-- Die Profile-Daten liegen weiterhin in ritmo_profiles.data (JSONB).
-- Für zwei Hot Paths brauchen wir aber dedizierte Spalten:
--   - display_name → für die LIKE-Suche im Player-Search
--   - is_public    → für die RLS-Sichtbarkeits-Policy
-- Ein Trigger synchronisiert beide aus dem JSONB-Blob — JSONB
-- bleibt damit die Source-of-Truth, die Spalten sind cache only.

ALTER TABLE ritmo_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_public    BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION sync_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.display_name := NULLIF(TRIM(COALESCE(NEW.data->>'name','')), '');
  -- Public = default. private:true im JSONB schaltet das Profil unsichtbar.
  NEW.is_public := COALESCE((NEW.data->>'private')::boolean, FALSE) = FALSE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_columns ON ritmo_profiles;
CREATE TRIGGER trg_sync_profile_columns
  BEFORE INSERT OR UPDATE OF data ON ritmo_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_columns();

-- One-shot Backfill für bereits existierende Profile (mit aktuellem Trigger-Lauf)
UPDATE ritmo_profiles SET data = data WHERE display_name IS NULL;

CREATE INDEX IF NOT EXISTS ritmo_profiles_dn_idx
  ON ritmo_profiles (lower(display_name));
CREATE INDEX IF NOT EXISTS ritmo_profiles_public_idx
  ON ritmo_profiles (is_public);

-- Zusätzliche Read-Policy: öffentliche Profile sind für alle
-- authentifizierten User sichtbar. Eigenes Profil bleibt durch
-- die bestehende "own profile read" Policy weiterhin lesbar.
DROP POLICY IF EXISTS "public profile read" ON ritmo_profiles;
CREATE POLICY "public profile read" ON ritmo_profiles
  FOR SELECT USING (is_public = TRUE);

-- ─── Followers (one-sided, Twitter-Modell) ──────────────────────
CREATE TABLE IF NOT EXISTS ritmo_followers (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS ritmo_followers_followee_idx
  ON ritmo_followers (followee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ritmo_followers_follower_idx
  ON ritmo_followers (follower_id, created_at DESC);

ALTER TABLE ritmo_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "followers public read" ON ritmo_followers;
DROP POLICY IF EXISTS "followers self insert" ON ritmo_followers;
DROP POLICY IF EXISTS "followers self delete" ON ritmo_followers;
CREATE POLICY "followers public read" ON ritmo_followers
  FOR SELECT USING (TRUE);
CREATE POLICY "followers self insert" ON ritmo_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "followers self delete" ON ritmo_followers
  FOR DELETE USING (auth.uid() = follower_id);

-- ─── Clubs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ritmo_clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  city         TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ritmo_clubs_name_idx ON ritmo_clubs (lower(name));
CREATE INDEX IF NOT EXISTS ritmo_clubs_city_idx ON ritmo_clubs (lower(city));

ALTER TABLE ritmo_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs public read"  ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs auth insert"  ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs owner update" ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs owner delete" ON ritmo_clubs;
CREATE POLICY "clubs public read"  ON ritmo_clubs FOR SELECT USING (TRUE);
CREATE POLICY "clubs auth insert"  ON ritmo_clubs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clubs owner update" ON ritmo_clubs FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clubs owner delete" ON ritmo_clubs FOR DELETE
  USING (auth.uid() = owner_id);

-- ─── Club Members ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ritmo_club_members (
  club_id    UUID NOT NULL REFERENCES ritmo_clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',   -- 'member' | 'admin'
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS ritmo_club_members_user_idx ON ritmo_club_members (user_id);

ALTER TABLE ritmo_club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club members public read" ON ritmo_club_members;
DROP POLICY IF EXISTS "club members self join"   ON ritmo_club_members;
DROP POLICY IF EXISTS "club members self leave"  ON ritmo_club_members;
CREATE POLICY "club members public read" ON ritmo_club_members FOR SELECT USING (TRUE);
CREATE POLICY "club members self join"   ON ritmo_club_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club members self leave"  ON ritmo_club_members FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Bookable Matches (offene Spielangebote) ────────────────────
-- Ein User legt einen offenen Slot an ("Sa 14 Uhr, 4 Plätze frei").
-- Andere User füllen die Plätze über ritmo_match_slots.
CREATE TABLE IF NOT EXISTS ritmo_bookable_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id      UUID REFERENCES ritmo_clubs(id) ON DELETE SET NULL,
  court_label  TEXT,
  starts_at    TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 90,
  level_min    NUMERIC(4,2),
  level_max    NUMERIC(4,2),
  format       TEXT NOT NULL DEFAULT 'bo3',     -- 'bo3' | 'americano'
  total_slots  INT NOT NULL DEFAULT 4,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ritmo_bookings_starts_idx ON ritmo_bookable_matches (starts_at);
CREATE INDEX IF NOT EXISTS ritmo_bookings_host_idx   ON ritmo_bookable_matches (host_id);
CREATE INDEX IF NOT EXISTS ritmo_bookings_club_idx   ON ritmo_bookable_matches (club_id);

ALTER TABLE ritmo_bookable_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings public read" ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host insert" ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host update" ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host delete" ON ritmo_bookable_matches;
CREATE POLICY "bookings public read" ON ritmo_bookable_matches FOR SELECT USING (TRUE);
CREATE POLICY "bookings host insert" ON ritmo_bookable_matches FOR INSERT
  WITH CHECK (auth.uid() = host_id);
CREATE POLICY "bookings host update" ON ritmo_bookable_matches FOR UPDATE
  USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "bookings host delete" ON ritmo_bookable_matches FOR DELETE
  USING (auth.uid() = host_id);

-- ─── Match Slots ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ritmo_match_slots (
  match_id    UUID NOT NULL REFERENCES ritmo_bookable_matches(id) ON DELETE CASCADE,
  slot_index  INT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (match_id, slot_index),
  UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS ritmo_match_slots_user_idx ON ritmo_match_slots (user_id);

ALTER TABLE ritmo_match_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slots public read" ON ritmo_match_slots;
DROP POLICY IF EXISTS "slots self join"   ON ritmo_match_slots;
DROP POLICY IF EXISTS "slots self leave"  ON ritmo_match_slots;
CREATE POLICY "slots public read" ON ritmo_match_slots FOR SELECT USING (TRUE);
CREATE POLICY "slots self join"   ON ritmo_match_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "slots self leave"  ON ritmo_match_slots FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Match Invites ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ritmo_match_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES ritmo_bookable_matches(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (match_id, to_user_id),
  CHECK (from_user_id <> to_user_id),
  CHECK (status IN ('pending','accepted','declined'))
);

CREATE INDEX IF NOT EXISTS ritmo_invites_to_idx
  ON ritmo_match_invites (to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ritmo_invites_from_idx
  ON ritmo_match_invites (from_user_id, created_at DESC);

ALTER TABLE ritmo_match_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites participants read" ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites sender insert"     ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites recipient update"  ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites sender delete"     ON ritmo_match_invites;
CREATE POLICY "invites participants read" ON ritmo_match_invites
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "invites sender insert" ON ritmo_match_invites
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "invites recipient update" ON ritmo_match_invites
  FOR UPDATE USING (auth.uid() = to_user_id) WITH CHECK (auth.uid() = to_user_id);
CREATE POLICY "invites sender delete" ON ritmo_match_invites
  FOR DELETE USING (auth.uid() = from_user_id);
