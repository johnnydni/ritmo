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
 *   - match_type: 'friendly' | 'competitive' (default 'friendly')
 *   - player_names: string[]
 *   - score_a, score_b: number
 *   - sets: array (bo3) | null
 *   - user_team: 'A' | 'B' | null
 *   - user_won: boolean | null
 *   - tournament_id?: string
 *   - round_index?: number
 *
 * match_type entscheidet, ob das Match in Spielniveau-/DNA-Aggregate
 * einfließt. Nur 'competitive' zählt — 'friendly' bleibt nur Historie.
 * Tournament-Matches gelten automatisch als competitive.
 */
export async function logMatch(match) {
  const c = sb();
  if (!c) return;
  const uid = await currentUserId();
  if (!uid) return;
  // Tournament-Runden zählen immer als competitive; Singles erben
  // das explizite Flag oder fallen auf 'friendly' zurück.
  const matchType = match.match_type
    || (String(match.format||'').startsWith('tournament-') ? 'competitive' : 'friendly');
  try {
    const { error } = await c.from('ritmo_matches').insert({
      user_id: uid,
      format: match.format,
      match_type: matchType,
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
    if (error) {
      // Wenn die Spalte match_type in der DB fehlt (Migration noch
      // nicht ausgeführt), versuchen wir den Insert ohne sie. So
      // bleibt die App auch vor dem Apply funktional.
      if (/column .*match_type/i.test(error.message)) {
        const retry = await c.from('ritmo_matches').insert({
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
        if (retry.error) console.warn('[db] logMatch fallback failed:', retry.error.message);
      } else {
        console.warn('[db] logMatch failed:', error.message);
      }
    }
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
    // match_type wird mitselektiert; falls die Spalte fehlt (Migration
    // nicht ausgeführt), kommt der Fehler hier — wir fallen dann auf
    // den alten SELECT zurück, damit ältere DBs nicht brechen.
    let { data, error } = await c
      .from('ritmo_matches')
      .select('format,match_type,score_a,score_b,user_team,user_won,sets,finished_at')
      .eq('user_id', uid)
      .order('finished_at', { ascending: false })
      .limit(200);
    if (error && /column .*match_type/i.test(error.message)) {
      const retry = await c
        .from('ritmo_matches')
        .select('format,score_a,score_b,user_team,user_won,sets,finished_at')
        .eq('user_id', uid)
        .order('finished_at', { ascending: false })
        .limit(200);
      data = retry.data;
      error = retry.error;
    }
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
  // Competitive-Subset = Datenbasis für Spielniveau + RITMO DNA.
  // Wenn die match_type-Spalte fehlt (alte DB), gelten alle Bo3+
  // Tournament-Matches als competitive — das matched das frühere
  // Verhalten und kippt keine bestehenden Profile.
  const isCompetitive = (r) => {
    if (typeof r.match_type === 'string') return r.match_type === 'competitive';
    return r.format === 'bo3' || String(r.format||'').startsWith('tournament-');
  };
  const competitiveRows = rows.filter(isCompetitive);

  const total = rows.length;
  const wins = rows.filter(r => r.user_won === true).length;
  const losses = rows.filter(r => r.user_won === false).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Competitive-Aggregate — getrennt geführt, damit die DNA-Schätzung
  // nur darauf zugreift.
  const cMatches = competitiveRows.length;
  const cWins = competitiveRows.filter(r => r.user_won === true).length;
  const cLosses = competitiveRows.filter(r => r.user_won === false).length;
  const cWinRate = cMatches > 0 ? Math.round((cWins / cMatches) * 100) : 0;

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
    // Competitive-only Spiegel für DNA-Konsumenten.
    competitiveMatches: cMatches,
    competitiveWins: cWins,
    competitiveLosses: cLosses,
    competitiveWinRate: cWinRate,
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
   SOCIAL LAYER
   - Player search across public profiles
   - Followers (one-sided)
   - Clubs + members
   - Bookable matches + slots
   - Match invites

   Alle Helpers no-op'en still wenn window.supabase fehlt — die App
   bleibt im Test-User / Offline-Mode benutzbar.
═══════════════════════════════════════════════════════════════ */

/** Public profile lookup für andere Spieler:innen. */
export async function fetchPublicProfile(userId) {
  const c = sb();
  if (!c || !userId) return null;
  try {
    const { data, error } = await c
      .from('ritmo_profiles')
      .select('user_id,data,display_name,is_public,updated_at')
      .eq('user_id', userId)
      .eq('is_public', true)
      .maybeSingle();
    if (error) { console.warn('[db] fetchPublicProfile:', error.message); return null; }
    return data || null;
  } catch (e) { console.warn('[db] fetchPublicProfile threw:', e?.message); return null; }
}

/** Striped User-Input für LIKE/.or()-Filter:
 *  - %, _  → SQL-LIKE-Wildcards; ungestrippt könnten sie DoS-Queries
 *           gegen den lower(display_name)-Index erzeugen.
 *  - , ()  → brechen PostgREST's .or()-Filter-Parser; .or-Bypass möglich.
 *  - Limit auf 64 Zeichen verhindert outsized payloads. */
function sanitizeSearch(s) {
  return (s || '').toString().replace(/[%_,()]/g, '').slice(0, 64).trim();
}

/** Player-Search nach Display-Name (case-insensitive substring). */
export async function searchPlayers(query, { limit = 20 } = {}) {
  const c = sb();
  if (!c) return [];
  const q = sanitizeSearch(query);
  if (!q) return [];
  try {
    const { data, error } = await c
      .from('ritmo_profiles')
      .select('user_id,display_name,data')
      .ilike('display_name', `%${q}%`)
      .eq('is_public', true)
      .limit(limit);
    if (error) { console.warn('[db] searchPlayers:', error.message); return []; }
    return data || [];
  } catch (e) { console.warn('[db] searchPlayers threw:', e?.message); return []; }
}

/* ───────── FOLLOWERS ───────── */

export async function followUser(followeeId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid || uid === followeeId) return false;
  try {
    const { error } = await c.from('ritmo_followers')
      .insert({ follower_id: uid, followee_id: followeeId });
    if (error && error.code !== '23505') {  // 23505 = duplicate key (already following)
      console.warn('[db] followUser:', error.message);
      return false;
    }
    return true;
  } catch (e) { console.warn('[db] followUser threw:', e?.message); return false; }
}

export async function unfollowUser(followeeId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_followers').delete()
      .eq('follower_id', uid).eq('followee_id', followeeId);
    if (error) { console.warn('[db] unfollowUser:', error.message); return false; }
    return true;
  } catch (e) { console.warn('[db] unfollowUser threw:', e?.message); return false; }
}

/** Counters via head:true + count → spart Payload. */
export async function followCounts(userId) {
  const c = sb();
  if (!c || !userId) return { followers: 0, following: 0 };
  try {
    const [a, b] = await Promise.all([
      c.from('ritmo_followers').select('*', { count: 'exact', head: true })
        .eq('followee_id', userId),
      c.from('ritmo_followers').select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);
    return { followers: a.count || 0, following: b.count || 0 };
  } catch (e) { return { followers: 0, following: 0 }; }
}

export async function isFollowing(followeeId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { count, error } = await c.from('ritmo_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', uid).eq('followee_id', followeeId);
    if (error) return false;
    return (count || 0) > 0;
  } catch (e) { return false; }
}

/* PostgREST kann ritmo_followers ↔ ritmo_profiles nicht automatisch
   joinen — beide Tabellen referenzieren auth.users(id), aber es gibt
   keinen direkten FK zwischen ihnen. Wir fetchen daher in zwei
   Schritten: erst die Beziehungs-Rows, dann die Profile zu den
   beteiligten user_ids, und mergen client-seitig. */
async function _attachProfiles(c, rows, key) {
  if (!rows || rows.length === 0) return rows || [];
  const ids = Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));
  if (ids.length === 0) return rows;
  const { data, error } = await c
    .from('ritmo_profiles')
    .select('user_id,display_name,data,is_public')
    .in('user_id', ids);
  if (error) { console.warn('[db] _attachProfiles:', error.message); return rows; }
  const map = Object.fromEntries((data || []).map(p => [p.user_id, p]));
  return rows.map(r => ({ ...r, profile: map[r[key]] || null }));
}

/** Liste aller Follower / Followees mit aufgelöstem Profil. */
export async function listFollowers(userId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !userId) return [];
  try {
    const { data, error } = await c.from('ritmo_followers')
      .select('follower_id,created_at')
      .eq('followee_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listFollowers:', error.message); return []; }
    return await _attachProfiles(c, data || [], 'follower_id');
  } catch (e) { return []; }
}
export async function listFollowing(userId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !userId) return [];
  try {
    const { data, error } = await c.from('ritmo_followers')
      .select('followee_id,created_at')
      .eq('follower_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listFollowing:', error.message); return []; }
    return await _attachProfiles(c, data || [], 'followee_id');
  } catch (e) { return []; }
}

/* ───────── CLUBS ───────── */

export async function listClubs({ query = '', limit = 50 } = {}) {
  const c = sb();
  if (!c) return [];
  try {
    let q = c.from('ritmo_clubs').select('id,name,city,description,cover,owner_id,created_at')
      .order('created_at', { ascending: false }).limit(limit);
    // sanitizeSearch entfernt LIKE-Wildcards UND die .or()-Filter-Sonderzeichen
    // (",()"). Ohne das könnte `query='evil),(name.eq.something'` den
    // PostgREST-Filter-Parser hijacken und ein anderes Statement erzwingen.
    const qs = sanitizeSearch(query);
    if (qs) q = q.or(`name.ilike.%${qs}%,city.ilike.%${qs}%`);
    const { data, error } = await q;
    if (error) { console.warn('[db] listClubs:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}

export async function fetchClub(clubId) {
  const c = sb();
  if (!c || !clubId) return null;
  try {
    const { data, error } = await c.from('ritmo_clubs')
      .select('id,name,city,description,cover,owner_id,created_at')
      .eq('id', clubId).maybeSingle();
    if (error) { console.warn('[db] fetchClub:', error.message); return null; }
    return data || null;
  } catch (e) { return null; }
}

/** Liefert die ID des Clubs den der aktuelle User besitzt, oder null. */
export async function myOwnedClubId() {
  const c = sb();
  if (!c) return null;
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await c.from('ritmo_clubs')
      .select('id').eq('owner_id', uid).limit(1).maybeSingle();
    if (error) { console.warn('[db] myOwnedClubId:', error.message); return null; }
    return data?.id || null;
  } catch (e) { return null; }
}

export async function createClub({ name, city, description, cover }) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  if (!name || !name.trim()) throw new Error('Club-Name fehlt.');

  // Max 1 Club pro Account — client-seitiger Pre-Check für nette
  // Fehlermeldung; das UNIQUE-Index im Schema fängt Race-Conditions ab.
  const ownedId = await myOwnedClubId();
  if (ownedId) {
    throw new Error('Du hast bereits einen Club. Pro Account ist nur ein Club erlaubt.');
  }

  // Cover wird direkt mit insert geschrieben, damit nichts zwischen
  // Insert und Update verlorengeht. Wenn die Datenbank das cover-Feld
  // noch nicht hat (Migration nicht angewendet), schickt PostgREST
  // einen 400er — wir surfacen das verständlich.
  const payload = {
    owner_id: uid,
    name: name.trim(),
    city: city?.trim() || null,
    description: description?.trim() || null,
  };
  if (cover) payload.cover = cover;

  const { data, error } = await c.from('ritmo_clubs')
    .insert(payload)
    .select('id,name,city,description,cover,owner_id,created_at').single();
  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('cover')) {
      throw new Error('Cover-Bild konnte nicht gespeichert werden — Datenbank-Migration läuft noch nicht. Bitte supabase/social-migration.sql neu anwenden.');
    }
    if (msg.includes('one_per_owner') || msg.includes('unique')) {
      throw new Error('Du hast bereits einen Club. Pro Account ist nur ein Club erlaubt.');
    }
    throw new Error(error.message || 'Club konnte nicht angelegt werden.');
  }
  // Owner automatisch als admin-Member eintragen.
  await c.from('ritmo_club_members').insert({ club_id: data.id, user_id: uid, role: 'admin' });
  return data;
}

export async function joinClub(clubId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_club_members')
      .insert({ club_id: clubId, user_id: uid, role: 'member' });
    if (error && error.code !== '23505') {
      console.warn('[db] joinClub:', error.message); return false;
    }
    return true;
  } catch (e) { return false; }
}

export async function leaveClub(clubId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_club_members')
      .delete().eq('club_id', clubId).eq('user_id', uid);
    if (error) { console.warn('[db] leaveClub:', error.message); return false; }
    return true;
  } catch (e) { return false; }
}

export async function clubMembers(clubId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !clubId) return [];
  try {
    const { data, error } = await c.from('ritmo_club_members')
      .select('user_id,role,joined_at')
      .eq('club_id', clubId).order('joined_at').limit(limit);
    if (error) { console.warn('[db] clubMembers:', error.message); return []; }
    return await _attachProfiles(c, data || [], 'user_id');
  } catch (e) { return []; }
}

/** Schnelle Count-Query ohne Profile — wird in der Club-Card und
 *  Club-Header benutzt, damit auch nicht-Mitglieder die Größe sehen. */
export async function clubMemberCount(clubId) {
  const c = sb();
  if (!c || !clubId) return 0;
  try {
    const { count, error } = await c.from('ritmo_club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId);
    if (error) { console.warn('[db] clubMemberCount:', error.message); return 0; }
    return count || 0;
  } catch (e) { return 0; }
}

export async function isClubMember(clubId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { count, error } = await c.from('ritmo_club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId).eq('user_id', uid);
    if (error) return false;
    return (count || 0) > 0;
  } catch (e) { return false; }
}

/* ───────── CLUB UPDATE (cover + desc) ─────────
   Patcht einen Club. RLS lässt das nur durch den Owner durch. */
export async function updateClub(clubId, patch) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  if (!clubId) throw new Error('Club-ID fehlt.');
  const allowed = {};
  ['name', 'city', 'description', 'cover'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(patch, k)) allowed[k] = patch[k];
  });
  const { data, error } = await c.from('ritmo_clubs')
    .update(allowed).eq('id', clubId).select('*').single();
  if (error) throw new Error(error.message || 'Club konnte nicht aktualisiert werden.');
  return data;
}

/* ═══════════════════════════════════════════════════════════════
   CLUB CHAT
   - Nachrichten lesen / posten (RLS-gated auf Mitglieder)
   - Read-State pro User (für unread-Counter)
   - Realtime-Subscribe pro Club
═══════════════════════════════════════════════════════════════ */

/** Lädt die letzten N Nachrichten eines Clubs (chronologisch).
 *  Profile werden client-seitig gemerged (siehe _attachProfiles). */
export async function listClubMessages(clubId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !clubId) return [];
  try {
    const { data, error } = await c.from('ritmo_club_messages')
      .select('id,club_id,user_id,body,created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listClubMessages:', error.message); return []; }
    const merged = await _attachProfiles(c, data || [], 'user_id');
    return merged.reverse(); // oldest first für die UI
  } catch (e) { return []; }
}

/** Postet eine Nachricht im Club-Chat. Liefert die neue Row. */
export async function sendClubMessage(clubId, body) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  const text = (body || '').toString().trim();
  if (!text) throw new Error('Leere Nachricht.');
  if (text.length > 2000) throw new Error('Nachricht zu lang (max. 2000 Zeichen).');
  const { data, error } = await c.from('ritmo_club_messages')
    .insert({ club_id: clubId, user_id: uid, body: text })
    .select('id,club_id,user_id,body,created_at').single();
  if (error) throw new Error(error.message || 'Nachricht konnte nicht gesendet werden.');
  return data;
}

/** Markiert einen Chat als gelesen (last_read_at = NOW()). */
export async function markChatRead(clubId) {
  const c = sb();
  if (!c || !clubId) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_chat_reads')
      .upsert({ user_id: uid, club_id: clubId, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,club_id' });
    if (error) { console.warn('[db] markChatRead:', error.message); return false; }
    return true;
  } catch (e) { return false; }
}

/** Liefert für den aktuellen User die Chat-Liste: alle Clubs in
 *  denen er Mitglied ist + letzte Nachricht + unread-Count.
 *  Wird auf dem RITMO-Post-Chats-Tab gerendert. */
export async function listMyChats() {
  const c = sb();
  if (!c) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    // 1. Clubs in denen ich Mitglied bin
    const { data: mems, error: e1 } = await c.from('ritmo_club_members')
      .select('club_id,joined_at').eq('user_id', uid);
    if (e1 || !mems || mems.length === 0) return [];
    const ids = mems.map(m => m.club_id);

    // 2. Club-Stammdaten
    const { data: clubs, error: e2 } = await c.from('ritmo_clubs')
      .select('id,name,city,cover').in('id', ids);
    if (e2) { console.warn('[db] listMyChats clubs:', e2.message); return []; }

    // 3. Letzte Nachricht pro Club (eine Query, dann clientseitig
    //    nach club_id mappen). Limit hoch ansetzen, damit pro Club
    //    eine kommt.
    const { data: msgs, error: e3 } = await c.from('ritmo_club_messages')
      .select('id,club_id,user_id,body,created_at')
      .in('club_id', ids)
      .order('created_at', { ascending: false })
      .limit(ids.length * 5);
    if (e3) { console.warn('[db] listMyChats msgs:', e3.message); }
    const lastByClub = {};
    (msgs || []).forEach(m => { if (!lastByClub[m.club_id]) lastByClub[m.club_id] = m; });

    // 4. Read-State pro Club für mich
    const { data: reads } = await c.from('ritmo_chat_reads')
      .select('club_id,last_read_at').eq('user_id', uid);
    const readsByClub = Object.fromEntries((reads || []).map(r => [r.club_id, r.last_read_at]));

    // 5. Unread-Counts: lookup ungelesen per Club via einzelnen
    //    count-queries (für die Beta günstig genug). Bei vielen
    //    Clubs sollte das später eine RPC ersetzen.
    const unreadCounts = await Promise.all(ids.map(async cid => {
      const since = readsByClub[cid] || '1970-01-01T00:00:00Z';
      const { count } = await c.from('ritmo_club_messages')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', cid)
        .gt('created_at', since)
        .neq('user_id', uid);  // eigene Nachrichten zählen nicht
      return { cid, unread: count || 0 };
    }));
    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.cid, u.unread]));

    // 6. Zusammenführen
    const clubsById = Object.fromEntries((clubs || []).map(cl => [cl.id, cl]));
    return ids
      .map(cid => ({
        club: clubsById[cid] || { id: cid, name: '—' },
        lastMessage: lastByClub[cid] || null,
        unread: unreadMap[cid] || 0,
      }))
      .sort((a, b) => {
        // Sort: ungelesene zuerst, dann nach letzter Nachricht.
        if ((b.unread > 0) !== (a.unread > 0)) return (b.unread > 0) ? 1 : -1;
        const ta = a.lastMessage?.created_at || '';
        const tb = b.lastMessage?.created_at || '';
        return tb.localeCompare(ta);
      });
  } catch (e) { console.warn('[db] listMyChats threw:', e?.message); return []; }
}

/** Aggregierte Unread-Zahl über alle Chats des Users — für den
 *  roten Punkt am Post-Icon auf dem Home-Screen. */
export async function totalUnreadCount() {
  const chats = await listMyChats();
  return chats.reduce((s, c) => s + (c.unread || 0), 0);
}

/** Realtime-Subscribe auf neue Nachrichten eines Clubs.
 *  Liefert eine unsubscribe-Funktion zurück. */
export function subscribeClubMessages(clubId, onInsert) {
  const c = sb();
  if (!c || !clubId) return () => {};
  const channel = c.channel(`club-msg-${clubId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'ritmo_club_messages',
      filter: `club_id=eq.${clubId}`,
    }, (payload) => {
      if (typeof onInsert === 'function') onInsert(payload.new);
    })
    .subscribe();
  return () => { try { c.removeChannel(channel); } catch (e) {} };
}
