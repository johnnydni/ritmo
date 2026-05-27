-- ═══════════════════════════════════════════════════════════════
-- MATCH SESSIONS — Realtime Single-Match-Pairing
--
-- Diese Tabelle hält den Live-State eines laufenden Single-Matches.
-- Der Host schreibt seinen Score-Snapshot rein; eingeladene Spieler
-- subscribiert via Supabase Realtime auf die jeweilige Zeile und
-- bekommt Updates in Echtzeit.
--
-- Voraussetzungen: ritmo_profiles existiert (siehe schema.sql /
-- social-migration.sql). match-type-migration.sql ist optional —
-- diese Tabelle ist davon unabhängig.
--
-- Anwendung: einmalig in Supabase SQL Editor ausführen, dann in den
-- Realtime-Einstellungen den Insert/Update für die Tabelle
-- freischalten (Database → Replication → ritmo_match_sessions).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.ritmo_match_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,            -- vom Client erzeugte UUID (matchSessionId)
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open'
    check (status in ('open','started','finished','cancelled')),
  format text not null default 'bo3',
  match_type text not null default 'friendly'
    check (match_type in ('friendly','competitive')),
  golden_point_after int,
  -- 4 Slots, Slot-Index 1..4 == Array-Index 1..4 (Postgres 1-based)
  players_names text[] not null default array['','','',''],
  players_user_ids uuid[] not null default array[null,null,null,null]::uuid[],
  team_a_label text,
  team_b_label text,
  -- Live-State des Bo3-Reducers — JSONB, damit der Host es 1:1
  -- spiegeln kann ohne Schema-Lock-In auf einzelne Felder.
  state jsonb,
  winner text check (winner in ('A','B') or winner is null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists ritmo_match_sessions_host
  on public.ritmo_match_sessions (host_user_id, created_at desc);
create index if not exists ritmo_match_sessions_status
  on public.ritmo_match_sessions (status, updated_at desc);

alter table public.ritmo_match_sessions enable row level security;

-- SELECT: jede:r authentifizierte User darf JEDE Session lesen, sofern
-- sie die session_id kennt. Die session_id ist random UUID und nicht
-- enumerierbar — Auflistung aller offenen Sessions wäre theoretisch
-- möglich, ist aber kein Datenleck weil die Slots nur User-Profile
-- referenzieren, die ohnehin (sofern public) lesbar wären.
drop policy if exists ritmo_match_sessions_select on public.ritmo_match_sessions;
create policy ritmo_match_sessions_select
  on public.ritmo_match_sessions
  for select to authenticated
  using (true);

-- INSERT: Host muss = auth.uid() sein.
drop policy if exists ritmo_match_sessions_insert on public.ritmo_match_sessions;
create policy ritmo_match_sessions_insert
  on public.ritmo_match_sessions
  for insert to authenticated
  with check (host_user_id = auth.uid());

-- UPDATE: nur Host darf direkt schreiben (Score-Snapshots, Status-
-- Transitions). Joiner aktualisieren die Zeile via SECURITY DEFINER
-- RPC, das umgeht diese Policy gezielt.
drop policy if exists ritmo_match_sessions_update on public.ritmo_match_sessions;
create policy ritmo_match_sessions_update
  on public.ritmo_match_sessions
  for update to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

-- DELETE: nur Host (z. B. „Session abbrechen").
drop policy if exists ritmo_match_sessions_delete on public.ritmo_match_sessions;
create policy ritmo_match_sessions_delete
  on public.ritmo_match_sessions
  for delete to authenticated
  using (host_user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────
-- RPC: join_match_session
--
-- Ein eingeladener Spieler ruft diese Funktion mit der vom Host
-- geteilten session_id auf. Die Funktion claimt den ersten freien
-- Slot (oder gibt den bestehenden Slot zurück, wenn der User schon
-- drin ist) und schreibt Name + user_id in die Session-Zeile.
-- SECURITY DEFINER ist nötig, weil RLS sonst Updates nur dem Host
-- erlaubt.
-- ───────────────────────────────────────────────────────────────
create or replace function public.join_match_session(
  p_session_id text,
  p_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_session ritmo_match_sessions%rowtype;
  v_slot int;
  v_name text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_session from ritmo_match_sessions where session_id = p_session_id;
  if not found then
    raise exception 'session not found';
  end if;
  if v_session.status not in ('open','started') then
    raise exception 'session not joinable';
  end if;

  -- Display-Name auflösen: expliziter Parameter > Profil > „Spieler".
  if p_name is not null and length(trim(p_name)) > 0 then
    v_name := trim(p_name);
  else
    select display_name into v_name from ritmo_profiles where user_id = v_uid;
    if v_name is null or v_name = '' then v_name := 'Spieler'; end if;
  end if;

  -- Wenn der User schon in der Session ist: bestehenden Slot zurück.
  for v_slot in 1..4 loop
    if v_session.players_user_ids[v_slot] is not distinct from v_uid then
      return jsonb_build_object(
        'slot', v_slot,
        'session_id', p_session_id,
        'already_in', true
      );
    end if;
  end loop;

  -- Sonst ersten freien Slot (außer Slot 1 = Host) finden.
  v_slot := null;
  for i in 2..4 loop
    if v_session.players_user_ids[i] is null then
      v_slot := i;
      exit;
    end if;
  end loop;

  if v_slot is null then
    raise exception 'no open slot';
  end if;

  update ritmo_match_sessions
  set players_user_ids[v_slot] = v_uid,
      players_names[v_slot]    = v_name,
      updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object(
    'slot', v_slot,
    'session_id', p_session_id,
    'already_in', false
  );
end;
$$;

grant execute on function public.join_match_session(text, text) to authenticated;
