-- ═══════════════════════════════════════════════════════════════
-- MATCH-PARTICIPANTS RPC
--
-- log_match_for_participants() schreibt ein abgeschlossenes Bo3-Match
-- für JEDEN registrierten Teilnehmer in ritmo_matches — so taucht das
-- Match in der Statistik aller Spieler:innen auf, nicht nur beim Host.
--
-- Sicherheitsannahmen:
--   * SECURITY DEFINER umgeht die per-user RLS-Policies; der Bypass
--     ist gerechtfertigt, weil wir mit einem auth.uid()-Check
--     sicherstellen, dass der Aufrufer SELBST unter den Teilnehmern
--     gelistet ist. So kann niemand fremden Profilen Matches
--     unterjubeln.
--   * Nur Bo3 nutzt das RPC (Client-seitige Wahl); die Funktion
--     prüft kein Format zusätzlich — der Caller-Check reicht.
--
-- Anwendung: einmalig in Supabase SQL Editor ausführen. Setzt
-- match-type-migration.sql voraus (Spalte match_type).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.log_match_for_participants(
  p_format text,
  p_match_type text,
  p_player_names text[],     -- 4 entries, slot 1..4
  p_player_user_ids uuid[],  -- 4 entries, NULL für nicht-registrierte Slots
  p_score_a int,
  p_score_b int,
  p_sets jsonb,
  p_winner text              -- 'A' | 'B'
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slot int;
  v_uid uuid;
  v_team text;
  v_won boolean;
  v_caller uuid := auth.uid();
begin
  -- Aufrufer-Check: nur eingeloggte User dürfen schreiben.
  if v_caller is null then
    raise exception 'not authenticated';
  end if;
  -- Strukturelle Validierung: wir erwarten genau 4 Slots.
  if array_length(p_player_user_ids, 1) is distinct from 4 then
    raise exception 'expected 4 player_user_ids, got %', array_length(p_player_user_ids, 1);
  end if;
  if array_length(p_player_names, 1) is distinct from 4 then
    raise exception 'expected 4 player_names, got %', array_length(p_player_names, 1);
  end if;
  if p_winner not in ('A','B') then
    raise exception 'winner must be ''A'' or ''B'', got %', p_winner;
  end if;
  if p_match_type not in ('friendly','competitive') then
    raise exception 'match_type must be friendly or competitive';
  end if;

  -- Anti-Abuse: Caller muss selbst im Roster sein. Sonst könnten
  -- Fremde anderen Profilen beliebige Matches anhängen und so die
  -- DNA-Schätzung manipulieren.
  if not (v_caller = any(p_player_user_ids)) then
    raise exception 'caller not in participants';
  end if;

  for v_slot in 1..4 loop
    v_uid := p_player_user_ids[v_slot];
    if v_uid is null then
      continue;
    end if;

    v_team := case when v_slot in (1,2) then 'A' else 'B' end;
    v_won := (v_team = p_winner);

    insert into public.ritmo_matches (
      user_id, format, match_type, player_names,
      score_a, score_b, sets,
      user_team, user_won, finished_at
    ) values (
      v_uid, p_format, p_match_type, p_player_names,
      p_score_a, p_score_b, p_sets,
      v_team, v_won, now()
    );
  end loop;
end;
$$;

-- Authenticated users dürfen die Funktion aufrufen — der Caller-
-- Check im Body verhindert Missbrauch.
grant execute on function public.log_match_for_participants(
  text, text, text[], uuid[], int, int, jsonb, text
) to authenticated;
