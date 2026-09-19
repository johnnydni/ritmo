-- ═══════════════════════════════════════════════════════════════
--  RITMO — Social Layer Teardown
--  ───────────────────────────────────────────────────────────────
--  Gegenstueck zu social-migration.sql. Die App hat die soziale
--  Schicht ausgebaut (Spielersuche, fremde Profile, Clubs, Chat,
--  Follower) — hier wird nachgezogen, was davon in der Datenbank
--  steht.
--
--  MANUELL im Supabase SQL Editor ausfuehren
--  (Dashboard → SQL Editor → New Query → paste → Run).
--
--  ZWEI TEILE, bewusst getrennt:
--
--    TEIL 1  schliesst den oeffentlichen Lesezugriff. Kein Datensatz
--            wird angefasst. Das ist der Teil, der eilt.
--    TEIL 2  loescht die Tabellen. UNWIDERRUFLICH — vorher ein
--            Backup ziehen (Dashboard → Database → Backups) und
--            nachsehen, ob ueberhaupt etwas drinsteht (Query ganz
--            unten).
--
--  Teil 1 allein ist ein vollstaendiger, sicherer Zustand: die Daten
--  liegen dann unerreichbar da, bis jemand Teil 2 ausfuehrt.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
--  VORHER PRUEFEN: bleibt das eigene Profil lesbar?
-- ───────────────────────────────────────────────────────────────
--  Teil 1 nimmt ritmo_profiles die Policy "public profile read".
--  Danach traegt nur noch die Policy aus dem Hauptschema
--  (auth.uid() = user_id) den Profil-Sync der App. Diese Query muss
--  MINDESTENS EINE Zeile mit qual ~ 'auth.uid()' liefern — sonst
--  erst die eigene Policy anlegen und dann weitermachen.

SELECT policyname, cmd, qual
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'ritmo_profiles';


-- ═══════════════════════════════════════════════════════════════
--  TEIL 1 — oeffentlichen Lesezugriff schliessen (keine Daten weg)
-- ═══════════════════════════════════════════════════════════════
--
--  Warum das eilt: der anon-Key steht im ausgelieferten JS-Bundle —
--  das ist bei Supabase so vorgesehen, aber es heisst, dass jede
--  Policy mit USING (TRUE) bzw. ohne auth-Bedingung faktisch fuer
--  jeden im Netz gilt. Solange es die Spielersuche gab, war das der
--  Preis dafuer. Jetzt liest das niemand mehr — es steht nur noch
--  offen.
--
--  "public profile read" ist dabei die wichtigste: sie gibt den
--  KOMPLETTEN data-JSONB jedes nicht-privaten Profils heraus (Name,
--  Bio, Level, Avatar, Statistik).

DROP POLICY IF EXISTS "public profile read"      ON ritmo_profiles;

DROP POLICY IF EXISTS "followers public read"    ON ritmo_followers;
DROP POLICY IF EXISTS "followers self insert"    ON ritmo_followers;
DROP POLICY IF EXISTS "followers self delete"    ON ritmo_followers;

DROP POLICY IF EXISTS "clubs public read"        ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs auth insert"        ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs owner update"       ON ritmo_clubs;
DROP POLICY IF EXISTS "clubs owner delete"       ON ritmo_clubs;

DROP POLICY IF EXISTS "club members public read" ON ritmo_club_members;
DROP POLICY IF EXISTS "club members self join"   ON ritmo_club_members;
DROP POLICY IF EXISTS "club members self leave"  ON ritmo_club_members;

DROP POLICY IF EXISTS "bookings public read"     ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host insert"     ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host update"     ON ritmo_bookable_matches;
DROP POLICY IF EXISTS "bookings host delete"     ON ritmo_bookable_matches;

DROP POLICY IF EXISTS "slots public read"        ON ritmo_match_slots;
DROP POLICY IF EXISTS "slots self join"          ON ritmo_match_slots;
DROP POLICY IF EXISTS "slots self leave"         ON ritmo_match_slots;

DROP POLICY IF EXISTS "invites participants read" ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites sender insert"     ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites recipient update"  ON ritmo_match_invites;
DROP POLICY IF EXISTS "invites sender delete"     ON ritmo_match_invites;

DROP POLICY IF EXISTS "club msg member read"     ON ritmo_club_messages;
DROP POLICY IF EXISTS "club msg member write"    ON ritmo_club_messages;

DROP POLICY IF EXISTS "reads self all"           ON ritmo_chat_reads;

--  RLS bleibt auf allen Tabellen AN. Eine Tabelle mit aktivem RLS
--  und ohne Policy ist fuer anon und authenticated dicht; nur der
--  service_role-Key (Server, Dashboard) kommt noch dran. Genau das
--  ist hier gewollt.

--  Realtime: der Club-Chat hing an postgres_changes. Falls die
--  Tabelle im Dashboard zur Publication hinzugefuegt wurde, hier
--  wieder raus. Der DO-Block laeuft auch durch, wenn sie nie drin war.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE ritmo_club_messages;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ritmo_club_messages war nicht in supabase_realtime';
END $$;


-- ═══════════════════════════════════════════════════════════════
--  TEIL 2 — Tabellen loeschen (UNWIDERRUFLICH)
-- ═══════════════════════════════════════════════════════════════
--
--  Erst ausfuehren, wenn das Backup steht. CASCADE nimmt Indizes,
--  Policies und Fremdschluessel mit. Reihenfolge egal, CASCADE
--  regelt die Abhaengigkeiten (Messages/Reads/Members haengen an
--  Clubs, Slots/Invites an den Bookable Matches).

-- DROP TABLE IF EXISTS ritmo_chat_reads       CASCADE;
-- DROP TABLE IF EXISTS ritmo_club_messages    CASCADE;
-- DROP TABLE IF EXISTS ritmo_club_members     CASCADE;
-- DROP TABLE IF EXISTS ritmo_clubs            CASCADE;
-- DROP TABLE IF EXISTS ritmo_match_invites    CASCADE;
-- DROP TABLE IF EXISTS ritmo_match_slots      CASCADE;
-- DROP TABLE IF EXISTS ritmo_bookable_matches CASCADE;
-- DROP TABLE IF EXISTS ritmo_followers        CASCADE;

--  ritmo_profiles BLEIBT — dort liegt das eigene Profil. Nur die
--  beiden Cache-Spalten der Spielersuche und ihr Trigger gehen mit:
--  die App liest und schreibt ausschliesslich data (JSONB), und der
--  Trigger fuellte display_name/is_public nur fuer Suche und Policy.

-- DROP TRIGGER  IF EXISTS trg_sync_profile_columns ON ritmo_profiles;
-- DROP FUNCTION IF EXISTS sync_profile_columns();
-- DROP INDEX    IF EXISTS ritmo_profiles_dn_idx;
-- DROP INDEX    IF EXISTS ritmo_profiles_public_idx;
-- ALTER TABLE ritmo_profiles
--   DROP COLUMN IF EXISTS display_name,
--   DROP COLUMN IF EXISTS is_public;


-- ═══════════════════════════════════════════════════════════════
--  Steht ueberhaupt etwas drin? (vor Teil 2 ausfuehren)
-- ═══════════════════════════════════════════════════════════════

-- SELECT 'followers'        AS tabelle, count(*) FROM ritmo_followers
-- UNION ALL SELECT 'clubs',            count(*) FROM ritmo_clubs
-- UNION ALL SELECT 'club_members',     count(*) FROM ritmo_club_members
-- UNION ALL SELECT 'club_messages',    count(*) FROM ritmo_club_messages
-- UNION ALL SELECT 'chat_reads',       count(*) FROM ritmo_chat_reads
-- UNION ALL SELECT 'bookable_matches', count(*) FROM ritmo_bookable_matches
-- UNION ALL SELECT 'match_slots',      count(*) FROM ritmo_match_slots
-- UNION ALL SELECT 'match_invites',    count(*) FROM ritmo_match_invites;
