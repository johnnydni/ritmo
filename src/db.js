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
      .select('format,score_a,score_b,user_team,user_won,sets,finished_at,tournament_id')
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

/**
 * Löscht alle geloggten Matches des aktuellen Users (Stats-Reset).
 * RLS erlaubt dem Owner das Delete (auth.uid() = user_id). No-op ohne
 * Session / Supabase — dann gibt es serverseitig nichts zu löschen.
 */
export async function deleteMyMatches() {
  const c = sb();
  if (!c) return;
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await c.from('ritmo_matches').delete().eq('user_id', uid);
    if (error) console.warn('[db] deleteMyMatches failed:', error.message);
  } catch (e) {
    console.warn('[db] deleteMyMatches exception:', e?.message || e);
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

  // Split Einzel vs. Turnier: Turnier-Matches tragen tournament_id
  // (Supabase) bzw. das 'tournament-'-Format-Präfix (beide Pfade).
  // tournaments = verschiedene Turniere (distinct tournament_id) —
  // ältere lokale Einträge ohne id zählen nur als Turnier-Matches.
  const isTourney = r => r.tournament_id != null || String(r.format || '').startsWith('tournament-');
  const tRows = rows.filter(isTourney);
  const singleMatches = total - tRows.length;
  const tournamentMatches = tRows.length;
  const tournaments = new Set(tRows.filter(r => r.tournament_id != null).map(r => r.tournament_id)).size;

  return {
    matches: total,
    wins,
    losses,
    winRate,
    formTrend,
    weeklyMatches: weeks,
    weekDays,
    avgSets,
    singleMatches,
    tournamentMatches,
    tournaments,
  };
}

/* ───────── LOKALES MATCH-LOG (Fallback ohne Supabase) ─────────
   Damit gespielte Matches (Single Match Best-of-3, Turniere) auch ohne
   Backend in die Profil-Statistik einfliessen, spiegeln wir jedes
   geloggte Match nach localStorage. loadMatchStats() (Supabase) hat
   Vorrang; fehlt Backend/Session, greift loadMatchStatsLocal(). */
const MATCHLOG_KEY = 'ritmo_matchlog';
function readMatchLog() {
  try {
    const r = JSON.parse(localStorage.getItem(MATCHLOG_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch { return []; }
}
export function logMatchLocal(match) {
  try {
    const log = readMatchLog();
    log.push({
      format: match.format,
      user_won: match.user_won ?? null,
      sets: match.sets ?? null,
      tournament_id: match.tournament_id ?? null,
      finished_at: new Date().toISOString(),
    });
    localStorage.setItem(MATCHLOG_KEY, JSON.stringify(log.slice(-200)));
  } catch (e) { /* Quota / Private Mode → still ignorieren */ }
}
export function loadMatchStatsLocal() {
  const log = readMatchLog();
  if (!log.length) return null;
  // computeStats erwartet neueste zuerst (slice(0,12) = jüngste Matches).
  return computeStats([...log].reverse());
}
export function clearMatchLog() {
  try { localStorage.removeItem(MATCHLOG_KEY); } catch (e) {}
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
    // Mirror-Sessions (lokales Turnier live geteilt) starten direkt
    // in 'playing' — normale Online-Sessions in der Lobby.
    status: data.status || 'lobby', // lobby | playing | finished
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
  // Mirror-Sessions (allowLateJoin) erlauben Beitritt auch während
  // 'playing' — Spieler vor Ort steigen jederzeit ein und sind sofort
  // approved (der Host verwaltet das Turnier lokal weiter).
  if (session.status && session.status !== 'lobby' && !session.allowLateJoin) {
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
    approved: session.allowLateJoin ? true : false,
    isHost: false,
    joinedAt: new Date().toISOString(),
  });
  await updateOnlineTournament(p, { ...session, participants });
  return participantId;
}

/**
 * Player verlässt die Session: entfernt sich aus participants und
 * räumt eigene offene Score-Submissions mit ab. Idempotent — ein
 * bereits entfernter Teilnehmer ist ein No-op.
 */
export async function leaveOnlineTournament(pin, participantId) {
  const c = sb();
  if (!c || !pin || !participantId) return;
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  const participants = (session.participants || []).filter(p => p.id !== participantId);
  const scoreSubmissions = (session.scoreSubmissions || []).filter(s => s.submittedBy !== participantId);
  await updateOnlineTournament(pin, { ...session, participants, scoreSubmissions });
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

/* ───── DNA CUP — Cloud-Sync (gleiche ritmo_sessions-Tabelle) ─────
   Eine Cup-Session ist eine ritmo_sessions-Row mit data.kind='dnacup'
   und dem kompletten Cup-State in data.cup. Schreibmuster ist IMMER
   fetch-fresh → Mutatoren anwenden → zurückschreiben: die Geräte
   (Admin/Tickets/Courts) schreiben disjunkte Felder, dürfen aber nie
   ihren womöglich veralteten lokalen State blind überschreiben —
   sonst verliert z. B. ein frischer Court-Score gegen einen
   gleichzeitigen Check-in (Lost Update). */

/** Erstellt eine Cup-Sync-Session mit dem aktuellen State. @returns Code (PIN). */
export async function createCupSync(cupState) {
  const c = sb();
  if (!c) throw new Error('Cloud-Sync nicht verfügbar — keine Verbindung.');
  for (let i = 0; i < 5; i++) {
    const pin = genPin();
    const { error } = await c.from('ritmo_sessions').insert({
      pin,
      data: { kind: 'dnacup', cup: cupState, createdAt: new Date().toISOString() },
    });
    if (!error) return pin;
    if (error.code !== '23505') {
      console.warn('[db] createCupSync:', error.message);
      throw new Error('Cloud-Sync konnte nicht erstellt werden.');
    }
  }
  throw new Error('Kein freier Code gefunden — bitte erneut versuchen.');
}

/** Liest den Cup-State zum Code. Null wenn kein Cup-Sync unter dem Code liegt. */
export async function fetchCupSync(pin) {
  const d = await fetchOnlineTournament(pin);
  return (d && d.kind === 'dnacup' && d.cup) ? d.cup : null;
}

/**
 * Merge-Write: holt den FRISCHEN Remote-State, wendet die Mutatoren
 * (fn(cup)=>cup, in Reihenfolge) darauf an und schreibt zurück.
 * @returns der neue Remote-State. Wirft bei Netz-/Session-Fehlern.
 */
export async function pushCupSync(pin, mutators) {
  const c = sb();
  if (!c || !pin) throw new Error('SYNC_OFFLINE');
  const p = pin.toLowerCase();
  const { data, error } = await c
    .from('ritmo_sessions').select('data').eq('pin', p).maybeSingle();
  if (error) throw error;
  if (!data || data.data?.kind !== 'dnacup') throw new Error('SYNC_GONE');
  let cup = data.data.cup;
  mutators.forEach(fn => { cup = fn(cup); });
  const { error: e2 } = await c
    .from('ritmo_sessions')
    .update({ data: { ...data.data, cup }, updated_at: new Date().toISOString() })
    .eq('pin', p);
  if (e2) throw e2;
  return cup;
}

/** Realtime-Subscription auf eine Cup-Session. Returns cleanup function. */
export function subscribeCupSync(pin, onChange) {
  return subscribeToTournament(pin, d => {
    if (d && d.kind === 'dnacup' && d.cup) onChange(d.cup);
  });
}

/* ───── DNA LIGA — Cloud-Sync (identische Mechanik, kind='liga').
   Eine Liga-Saison ist eine ritmo_sessions-Row mit data.kind='liga'
   und dem Saison-State in data.liga. Merge-Write wie beim Cup. */

export async function createLigaSync(ligaState) {
  const c = sb();
  if (!c) throw new Error('Cloud-Sync nicht verfügbar — keine Verbindung.');
  for (let i = 0; i < 5; i++) {
    const pin = genPin();
    const { error } = await c.from('ritmo_sessions').insert({
      pin,
      data: { kind: 'liga', liga: ligaState, createdAt: new Date().toISOString() },
    });
    if (!error) return pin;
    if (error.code !== '23505') {
      console.warn('[db] createLigaSync:', error.message);
      throw new Error('Liga konnte nicht erstellt werden.');
    }
  }
  throw new Error('Kein freier Code gefunden — bitte erneut versuchen.');
}

export async function fetchLigaSync(pin) {
  const d = await fetchOnlineTournament(pin);
  return (d && d.kind === 'liga' && d.liga) ? d.liga : null;
}

export async function pushLigaSync(pin, mutators) {
  const c = sb();
  if (!c || !pin) throw new Error('SYNC_OFFLINE');
  const p = pin.toLowerCase();
  const { data, error } = await c
    .from('ritmo_sessions').select('data').eq('pin', p).maybeSingle();
  if (error) throw error;
  if (!data || data.data?.kind !== 'liga') throw new Error('SYNC_GONE');
  let liga = data.data.liga;
  mutators.forEach(fn => { liga = fn(liga); });
  const { error: e2 } = await c
    .from('ritmo_sessions')
    .update({ data: { ...data.data, liga }, updated_at: new Date().toISOString() })
    .eq('pin', p);
  if (e2) throw e2;
  return liga;
}

export function subscribeLigaSync(pin, onChange) {
  return subscribeToTournament(pin, d => {
    if (d && d.kind === 'liga' && d.liga) onChange(d.liga);
  });
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
 * Host beendet die Live-Übertragung: Session bleibt bestehen (die
 * Ergebnisse sollen abrufbar sein), bekommt aber status 'ended' —
 * daran erkennen beigetretene Spieler, dass nichts mehr nachkommt.
 */
export async function endOnlineTournament(pin) {
  const session = await fetchOnlineTournament(pin);
  if (!session) return;
  await updateOnlineTournament(pin, { ...session, status: 'ended' });
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

/* ───────── BETA KEYS ─────────
   Zwei dünne Wrappers um die SECURITY-DEFINER-RPCs im Schema.
   Die Tabelle ritmo_beta_keys ist nicht direkt erreichbar — alle
   Lese- und Schreiboperationen laufen ausschließlich über diese
   beiden Funktionen.

   Flow im Register-Screen:
     1. checkBetaKey(code) → true → User darf die E-Mail/Passwort-
        Form ausfüllen.
     2. auth.signUpWithEmail(...) → bei Erfolg:
     3. redeemBetaKey(code, email) → Key wird atomar verbraucht.

   Wenn (3) später durch eine Race schlägt, hat der User trotzdem
   einen funktionierenden Account — der Key ist dann nur jemand
   anderem zugutegekommen. Akzeptable Beta-Edge-Case.
*/

/** Normalisiert eine Eingabe: trim + uppercase. Liefert '' wenn leer. */
function normalizeBetaCode(code) {
  return (code || '').toString().trim().toUpperCase();
}

/** Prüft, ob ein Beta-Key existiert UND noch nicht eingelöst wurde.
 *  Wirft bei fehlender Supabase-Konfig, damit der Register-Flow
 *  nicht stillschweigend unter dem Beta-Gate hindurchrutscht. */
export async function checkBetaKey(code) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const norm = normalizeBetaCode(code);
  if (!norm) throw new Error('Bitte Beta-Key eingeben.');
  const { data, error } = await c.rpc('check_beta_key', { p_code: norm });
  if (error) throw new Error(error.message || 'Beta-Key-Prüfung fehlgeschlagen.');
  return data === true;
}

/** Löst einen Beta-Key atomar ein. Liefert true bei Erfolg, false
 *  wenn der Key zwischen Check und Redeem von jemand anderem
 *  verbraucht wurde. Niemals doppelt verbrauchbar. */
export async function redeemBetaKey(code, email) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const norm = normalizeBetaCode(code);
  if (!norm) throw new Error('Bitte Beta-Key eingeben.');
  const { data, error } = await c.rpc('redeem_beta_key', {
    p_code: norm,
    p_email: (email || '').toString().trim().toLowerCase(),
  });
  if (error) throw new Error(error.message || 'Beta-Key konnte nicht eingelöst werden.');
  return data === true;
}

/* ═══════════════════════════════════════════════════════════════
   DIE SOZIALE SCHICHT IST AUSGEBAUT

   Hier standen die Helper fuer Spielersuche, fremde Profile,
   Follower, Clubs und den Club-Chat. Sie sind mit ihren Screens
   zusammen raus (siehe App.jsx); die Tabellen in Supabase bleiben
   unangetastet, es greift nur niemand mehr darauf zu.

   Was bleibt: ritmo_profiles fuer das EIGENE Profil (loadProfile /
   saveProfile ganz oben in dieser Datei).
═══════════════════════════════════════════════════════════════ */
