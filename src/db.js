/* ═══════════════════════════════════════════════════════════════
   DB — Supabase data access layer

   Spielerprofile und Match-Logs werden hier persistiert. Wenn kein
   window.supabase verfügbar ist (Test-User / kein Supabase-Konfig),
   sind alle Funktionen stille No-ops, damit die App weiterläuft.

   Tabellen: ritmo_profiles, ritmo_matches (siehe supabase/schema.sql).
═══════════════════════════════════════════════════════════════ */

function sb() {
  if (typeof window === 'undefined' || !window.supabase) return null;
  return window.supabase;
}

async function currentUserId() {
  const c = sb();
  if (!c) return null;
  try {
    const { data } = await c.auth.getUser();
    return data?.user?.id || null;
  } catch { return null; }
}

/* ───────── PROFILE ───────── */

export async function loadProfile() {
  const c = sb();
  if (!c) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await c
      .from('ritmo_profiles')
      .select('data')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) {
      console.warn('[db] loadProfile failed:', error.message);
      return null;
    }
    return data?.data || null;
  } catch (e) {
    console.warn('[db] loadProfile exception:', e?.message || e);
    return null;
  }
}

export async function saveProfile(profile) {
  const c = sb();
  if (!c) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await c
      .from('ritmo_profiles')
      .upsert({
        user_id: uid,
        data: profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) console.warn('[db] saveProfile failed:', error.message);
  } catch (e) {
    console.warn('[db] saveProfile exception:', e?.message || e);
  }
}

/* ───────── MATCH LOGGING ───────── */

/**
 * Loggt ein abgeschlossenes Match.
 * @param {object} match
 *   - format: 'bo3' | 'americano' | 'tournament-americano' | 'tournament-mexicano'
 *   - player_names: string[]
 *   - score_a, score_b: number
 *   - sets: array (bo3) | null
 *   - user_team: 'A' | 'B' | null
 *   - user_won: boolean | null
 *   - tournament_id?: string
 *   - round_index?: number
 */
export async function logMatch(match) {
  const c = sb();
  if (!c) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await c.from('ritmo_matches').insert({
      user_id: uid,
      format: match.format,
      player_names: match.player_names || [],
      score_a: match.score_a ?? null,
      score_b: match.score_b ?? null,
      sets: match.sets ?? null,
      user_team: match.user_team || null,
      user_won: match.user_won ?? null,
      tournament_id: match.tournament_id || null,
      round_index: match.round_index ?? null,
      finished_at: new Date().toISOString(),
    });
    if (error) console.warn('[db] logMatch failed:', error.message);
  } catch (e) {
    console.warn('[db] logMatch exception:', e?.message || e);
  }
}

/* ───────── STATS ───────── */

/**
 * Lädt die letzten 200 Matches des Users und berechnet Aggregate.
 * Returns null wenn keine Session / kein Supabase.
 */
export async function loadMatchStats() {
  const c = sb();
  if (!c) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await c
      .from('ritmo_matches')
      .select('format,score_a,score_b,user_team,user_won,sets,finished_at')
      .eq('user_id', uid)
      .order('finished_at', { ascending: false })
      .limit(200);
    if (error || !data) {
      if (error) console.warn('[db] loadMatchStats failed:', error.message);
      return null;
    }
    return computeStats(data);
  } catch (e) {
    console.warn('[db] loadMatchStats exception:', e?.message || e);
    return null;
  }
}

function computeStats(rows) {
  const total = rows.length;
  const wins = rows.filter(r => r.user_won === true).length;
  const losses = rows.filter(r => r.user_won === false).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Form trend: last 12 matches (oldest → newest), Sieg=5, Niederlage=1, sonst 3.
  const last12 = rows.slice(0, 12).reverse();
  const formTrend = last12.map(r => r.user_won === true ? 5 : (r.user_won === false ? 1 : 3));

  // Weekly matches: rolling last 7 weeks (oldest → newest).
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const weeks = [0, 0, 0, 0, 0, 0, 0];
  const weekDays = ['M', 'D', 'M', 'D', 'F', 'S', 'S']; // visual labels
  rows.forEach(r => {
    if (!r.finished_at) return;
    const t = new Date(r.finished_at).getTime();
    const diff = now - t;
    const w = Math.floor(diff / WEEK);
    if (w >= 0 && w < 7) weeks[6 - w]++; // oldest at index 0
  });

  // Durchschnittliche Sätze: nur bo3 mit sets-Array
  const bo3Rows = rows.filter(r => r.format === 'bo3' && Array.isArray(r.sets));
  const avgSets = bo3Rows.length
    ? (bo3Rows.reduce((s, r) => s + r.sets.length, 0) / bo3Rows.length).toFixed(1)
    : '0';

  return {
    matches: total,
    wins,
    losses,
    winRate,
    formTrend,
    weeklyMatches: weeks,
    weekDays,
    avgSets,
  };
}

/* ═══════════════════════════════════════════════════════════════
   ONLINE TOURNAMENT (ritmo_sessions Tabelle)

   PIN-basierte Session, Daten als JSONB. Host erstellt → Player
   joinen via PIN/QR → Host approved → Tournament läuft.
═══════════════════════════════════════════════════════════════ */

function genPin() {
  // 6-stelliger Pin, easy zu tippen wenn QR nicht klappt.
  // Buchstaben/Ziffern ohne 0/o/1/l für Lesbarkeit.
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars[Math.floor(Math.random() * chars.length)];
  }
  return pin;
}

/**
 * Erzeugt eine neue Online-Tournament-Session.
 * @param {object} data — Tournament-Setup (format, winMode, numCourts, roundDurationMin, hostName, hostId?)
 * @returns {Promise<string>} der PIN
 */
export async function createOnlineTournament(data) {
  const c = sb();
  if (!c) throw new Error('Online-Modus nicht verfügbar.');
  const sessionData = {
    ...data,
    status: 'lobby',           // lobby | playing | finished
    participants: data.hostName ? [{
      id: 'host',
      name: data.hostName,
      approved: true,
      isHost: true,
      joinedAt: new Date().toISOString(),
    }] : [],
    createdAt: new Date().toISOString(),
  };
  // Bis zu 5 Versuche, einen freien PIN zu finden.
  for (let i = 0; i < 5; i++) {
    const pin = genPin();
    const { error } = await c
      .from('ritmo_sessions')
      .insert({ pin, data: sessionData });
    if (!error) return pin;
    // Bei Unique-Constraint-Violation einfach neuen PIN probieren.
    if (error.code !== '23505') {
      console.warn('[db] createOnlineTournament:', error.message);
      throw new Error('Tournament konnte nicht erstellt werden.');
    }
  }
  throw new Error('Konnte keinen freien PIN finden, bitte erneut versuchen.');
}

/** Liest Session-Daten zum PIN. Null wenn nicht da. */
export async function fetchOnlineTournament(pin) {
  const c = sb();
  if (!c || !pin) return null;
  try {
    const { data, error } = await c
      .from('ritmo_sessions')
      .select('data')
      .eq('pin', pin.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return data.data;
  } catch (e) {
    console.warn('[db] fetchOnlineTournament:', e?.message || e);
    return null;
  }
}

/** Überschreibt die data-Spalte. Sollte vom Host gerufen werden. */
export async function updateOnlineTournament(pin, data) {
  const c = sb();
  if (!c || !pin) return;
  try {
    const { error } = await c
      .from('ritmo_sessions')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('pin', pin.toLowerCase());
    if (error) console.warn('[db] updateOnlineTournament:', error.message);
  } catch (e) {
    console.warn('[db] updateOnlineTournament:', e?.message || e);
  }
}

/**
 * Ein Player tritt einer Session bei. Atomar (read-modify-write):
 * holt aktuelle data, fügt sich in participants ein, schreibt zurück.
 * @returns {Promise<string>} participant id
 */
export async function joinOnlineTournament(pin, username) {
  const c = sb();
  if (!c) throw new Error('Online-Modus nicht verfügbar.');
  const name = (username || '').trim();
  if (!name) throw new Error('Bitte gib einen Namen ein.');
  const p = (pin || '').trim().toLowerCase();
  const session = await fetchOnlineTournament(p);
  if (!session) throw new Error('Tournament nicht gefunden — PIN prüfen.');
  if (session.status && session.status !== 'lobby') {
    throw new Error('Dieses Tournament läuft bereits oder ist beendet.');
  }
  const participants = session.participants || [];
  if (participants.some(x => x.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Dieser Name ist schon vergeben.');
  }
  const participantId = 'p_' + Math.random().toString(36).slice(2, 10);
  participants.push({
    id: participantId,
    name,
    approved: false,
    isHost: false,
    joinedAt: new Date().toISOString(),
  });
  await updateOnlineTournament(p, { ...session, participants });
  return participantId;
}

/**
 * Realtime-Subscription auf eine Session. Callback bekommt das
 * frische data-Objekt bei jeder Änderung. Returns cleanup function.
 */
export function subscribeToTournament(pin, onChange) {
  const c = sb();
  if (!c || !pin) return () => {};
  const p = pin.toLowerCase();
  try {
    const channel = c
      .channel('ritmo-session-' + p)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ritmo_sessions', filter: 'pin=eq.' + p },
        (payload) => {
          if (payload.new && payload.new.data) onChange(payload.new.data);
        })
      .subscribe();
    return () => { try { c.removeChannel(channel); } catch {} };
  } catch (e) {
    console.warn('[db] subscribeToTournament:', e?.message || e);
    return () => {};
  }
}

/* ───── PHASE 2: Live-Sync + Score-Submission + Ready-Check ───── */

/**
 * Host publiziert seinen lokalen Tournament-State (Runden, Timer,
 * Courts, etc.) zur Session, damit alle Teilnehmer ihn live sehen.
 */
export async function publishTournamentState(pin, tournamentState) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  await updateOnlineTournament(pin, { ...session, tournamentState });
}

/**
 * Player reicht ein Match-Ergebnis ein. Dupes vom selben Submitter
 * für denselben Court/Runde werden ersetzt (resubmit overrides).
 */
export async function submitScore(pin, submission) {
  const session = await fetchOnlineTournament(pin);
  if (!session) throw new Error('Tournament nicht gefunden.');
  const subs = (session.scoreSubmissions || []).filter(s =>
    !(s.courtId === submission.courtId
      && s.roundIndex === submission.roundIndex
      && s.submittedBy === submission.submittedBy)
  );
  const id = 'sub_' + Math.random().toString(36).slice(2, 10);
  subs.push({
    ...submission,
    id,
    submittedAt: new Date().toISOString(),
  });
  await updateOnlineTournament(pin, { ...session, scoreSubmissions: subs });
  return id;
}

/**
 * Host approved eine Submission und wendet die finalen Scores auf
 * den Court an (= setzt court.s1/s2 + court.done=true). Submission
 * verschwindet aus der Pending-Liste.
 */
export async function approveScore(pin, submissionId, finalScoreA, finalScoreB) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  const sub = (session.scoreSubmissions || []).find(s => s.id === submissionId);
  if (!sub || !session.tournamentState) return;
  const ts = session.tournamentState;
  const rounds = (ts.rounds || []).map((r, i) => {
    if (i !== sub.roundIndex) return r;
    return {
      ...r,
      courts: r.courts.map(c => c.id === sub.courtId
        ? { ...c, s1: finalScoreA, s2: finalScoreB, done: true }
        : c),
    };
  });
  const newState = { ...ts, rounds };
  const newSubs = (session.scoreSubmissions || []).filter(s => s.id !== submissionId);
  await updateOnlineTournament(pin, {
    ...session,
    tournamentState: newState,
    scoreSubmissions: newSubs,
  });
}

/** Host verwirft eine Submission (Player muss neu submitten). */
export async function rejectScore(pin, submissionId) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  const newSubs = (session.scoreSubmissions || []).filter(s => s.id !== submissionId);
  await updateOnlineTournament(pin, { ...session, scoreSubmissions: newSubs });
}

/**
 * Host startet einen Ready-Check für eine bestimmte Runde. Bestätigte
 * Player tragen sich in confirmedBy ein, der Host sieht den Fortschritt.
 */
export async function sendReadyCheck(pin, roundIndex) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  await updateOnlineTournament(pin, {
    ...session,
    readyCheck: {
      roundIndex,
      requestedAt: new Date().toISOString(),
      confirmedBy: [],
    },
  });
}

/** Player bestätigt seine Bereitschaft für den aktuellen Ready-Check. */
export async function confirmReady(pin, participantId) {
  const session = await fetchOnlineTournament(pin);
  if (!session || !session.readyCheck) return;
  const cb = session.readyCheck.confirmedBy || [];
  if (cb.includes(participantId)) return;
  await updateOnlineTournament(pin, {
    ...session,
    readyCheck: { ...session.readyCheck, confirmedBy: [...cb, participantId] },
  });
}

/** Host löscht den Ready-Check (z.B. nach Rundenstart). */
export async function clearReadyCheck(pin) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  const { readyCheck, ...rest } = session;
  await updateOnlineTournament(pin, rest);
}
