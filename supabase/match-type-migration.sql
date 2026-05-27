-- ═══════════════════════════════════════════════════════════════
-- MATCH-TYPE MIGRATION
--
-- Trennt Spielwiese-Matches ("friendly") von gewerteten Begegnungen
-- ("competitive"). Nur competitive Matches zählen in die
-- Spielerstatistik und in die RITMO-DNA-Berechnung — friendly Matches
-- bleiben in der Historie, beeinflussen aber kein Niveau.
--
-- Anwendung: einmalig in Supabase SQL Editor ausführen. Default ist
-- 'friendly', damit bestehende Reihen sicher klassifiziert werden,
-- ohne dass die DNA-Stats rückwirkend kippen.
-- ═══════════════════════════════════════════════════════════════

alter table public.ritmo_matches
  add column if not exists match_type text
    not null default 'friendly'
    check (match_type in ('friendly','competitive'));

-- Index hilft beim Filtern in loadMatchStats — Userprofile-Aufruf
-- holt typischerweise die letzten N competitive Matches.
create index if not exists ritmo_matches_user_type_finished
  on public.ritmo_matches (user_id, match_type, finished_at desc);
