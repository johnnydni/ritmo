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
