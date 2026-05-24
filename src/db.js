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

/** Player-Search nach Display-Name (case-insensitive substring). */
export async function searchPlayers(query, { limit = 20 } = {}) {
  const c = sb();
  if (!c) return [];
  const q = (query || '').trim();
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

/** Liste aller Follower / Followees mit aufgelöstem Profil. */
export async function listFollowers(userId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !userId) return [];
  try {
    const { data, error } = await c.from('ritmo_followers')
      .select('follower_id,created_at,profile:ritmo_profiles!ritmo_followers_follower_id_fkey(user_id,display_name,data)')
      .eq('followee_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listFollowers:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}
export async function listFollowing(userId, { limit = 100 } = {}) {
  const c = sb();
  if (!c || !userId) return [];
  try {
    const { data, error } = await c.from('ritmo_followers')
      .select('followee_id,created_at,profile:ritmo_profiles!ritmo_followers_followee_id_fkey(user_id,display_name,data)')
      .eq('follower_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listFollowing:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}

/* ───────── CLUBS ───────── */

export async function listClubs({ query = '', limit = 50 } = {}) {
  const c = sb();
  if (!c) return [];
  try {
    let q = c.from('ritmo_clubs').select('id,name,city,description,owner_id,created_at')
      .order('created_at', { ascending: false }).limit(limit);
    if (query.trim()) q = q.or(`name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`);
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
      .select('id,name,city,description,owner_id,created_at')
      .eq('id', clubId).maybeSingle();
    if (error) { console.warn('[db] fetchClub:', error.message); return null; }
    return data || null;
  } catch (e) { return null; }
}

export async function createClub({ name, city, description }) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  if (!name || !name.trim()) throw new Error('Club-Name fehlt.');
  const { data, error } = await c.from('ritmo_clubs')
    .insert({ owner_id: uid, name: name.trim(),
              city: city?.trim() || null, description: description?.trim() || null })
    .select('id,name,city,description,owner_id,created_at').single();
  if (error) throw new Error(error.message || 'Club konnte nicht angelegt werden.');
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
      .select('user_id,role,joined_at,profile:ritmo_profiles!ritmo_club_members_user_id_fkey(user_id,display_name,data)')
      .eq('club_id', clubId).order('joined_at').limit(limit);
    if (error) { console.warn('[db] clubMembers:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
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

/* ───────── BOOKABLE MATCHES ───────── */

export async function listBookings({ clubId = null, mine = false, limit = 50 } = {}) {
  const c = sb();
  if (!c) return [];
  try {
    let q = c.from('ritmo_bookable_matches')
      .select('id,host_id,club_id,court_label,starts_at,duration_min,level_min,level_max,format,total_slots,notes,created_at')
      .gte('starts_at', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
      .order('starts_at').limit(limit);
    if (clubId) q = q.eq('club_id', clubId);
    if (mine) {
      const uid = await currentUserId();
      if (!uid) return [];
      q = q.eq('host_id', uid);
    }
    const { data, error } = await q;
    if (error) { console.warn('[db] listBookings:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}

export async function fetchBooking(id) {
  const c = sb();
  if (!c || !id) return null;
  try {
    const { data, error } = await c.from('ritmo_bookable_matches')
      .select('*').eq('id', id).maybeSingle();
    if (error) { console.warn('[db] fetchBooking:', error.message); return null; }
    return data || null;
  } catch (e) { return null; }
}

export async function createBooking(input) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  if (!input?.starts_at) throw new Error('Startzeit fehlt.');
  const payload = {
    host_id: uid,
    club_id: input.club_id || null,
    court_label: input.court_label?.trim() || null,
    starts_at: input.starts_at,
    duration_min: input.duration_min || 90,
    level_min: input.level_min ?? null,
    level_max: input.level_max ?? null,
    format: input.format || 'bo3',
    total_slots: input.total_slots || 4,
    notes: input.notes?.trim() || null,
  };
  const { data, error } = await c.from('ritmo_bookable_matches')
    .insert(payload).select('*').single();
  if (error) throw new Error(error.message || 'Match konnte nicht angelegt werden.');
  // Host nimmt automatisch slot 0.
  await c.from('ritmo_match_slots').insert({ match_id: data.id, slot_index: 0, user_id: uid });
  return data;
}

export async function bookingSlots(matchId) {
  const c = sb();
  if (!c || !matchId) return [];
  try {
    const { data, error } = await c.from('ritmo_match_slots')
      .select('match_id,slot_index,user_id,joined_at,profile:ritmo_profiles!ritmo_match_slots_user_id_fkey(user_id,display_name,data)')
      .eq('match_id', matchId).order('slot_index');
    if (error) { console.warn('[db] bookingSlots:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}

export async function joinSlot(matchId, slotIndex) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  const { error } = await c.from('ritmo_match_slots')
    .insert({ match_id: matchId, slot_index: slotIndex, user_id: uid });
  if (error) throw new Error(error.message || 'Slot konnte nicht belegt werden.');
  return true;
}

export async function leaveSlot(matchId) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_match_slots')
      .delete().eq('match_id', matchId).eq('user_id', uid);
    if (error) { console.warn('[db] leaveSlot:', error.message); return false; }
    return true;
  } catch (e) { return false; }
}

/* ───────── INVITES ───────── */

export async function listIncomingInvites({ limit = 50 } = {}) {
  const c = sb();
  if (!c) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    const { data, error } = await c.from('ritmo_match_invites')
      .select('id,match_id,from_user_id,status,created_at,responded_at,'
        + 'from_profile:ritmo_profiles!ritmo_match_invites_from_user_id_fkey(user_id,display_name,data),'
        + 'match:ritmo_bookable_matches(id,starts_at,court_label,format,total_slots)')
      .eq('to_user_id', uid).order('created_at', { ascending: false }).limit(limit);
    if (error) { console.warn('[db] listIncomingInvites:', error.message); return []; }
    return data || [];
  } catch (e) { return []; }
}

export async function sendInvite(matchId, toUserId) {
  const c = sb();
  if (!c) throw new Error('Verbindung nicht verfügbar.');
  const uid = await currentUserId();
  if (!uid) throw new Error('Bitte zuerst anmelden.');
  if (uid === toUserId) throw new Error('Selbst-Einladungen sind nicht erlaubt.');
  const { error } = await c.from('ritmo_match_invites')
    .insert({ match_id: matchId, from_user_id: uid, to_user_id: toUserId, status: 'pending' });
  if (error && error.code !== '23505') {
    throw new Error(error.message || 'Einladung konnte nicht gesendet werden.');
  }
  return true;
}

export async function respondInvite(inviteId, accept) {
  const c = sb();
  if (!c) return false;
  const uid = await currentUserId();
  if (!uid) return false;
  try {
    const { error } = await c.from('ritmo_match_invites')
      .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
      .eq('id', inviteId).eq('to_user_id', uid);
    if (error) { console.warn('[db] respondInvite:', error.message); return false; }
    return true;
  } catch (e) { return false; }
}
