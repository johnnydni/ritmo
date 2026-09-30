/* ═══════════════════════════════════════════════════════════════
   delete-account — Konto-Löschung auf Zuruf des Kontoinhabers.

   Deployen:  supabase functions deploy delete-account
   Aufrufer:  auth.deleteAccount() in src/auth.js

   WARUM ES DIESE FUNKTION GIBT: auth.admin.deleteUser() verlangt den
   Secret-Key (frueher service_role). Der darf nicht ins Browser-
   Bundle — jeder koennte damit jeden Account loeschen. Also laeuft
   der Aufruf hier, wo der Key nur in der Laufzeitumgebung steht.

   DIE USER-ID KOMMT NIE AUS DEM REQUEST. Sie wird aus dem JWT des
   Aufrufers gelesen (getUser gegen den Auth-Server, nicht nur
   dekodiert) — sonst waere ein Body mit fremder ID eine Fernsteuerung
   fuer fremde Konten. Deshalb nimmt die Funktion auch gar keinen
   Body entgegen.

   Die eigenen Zeilen werden VORHER geloescht, obwohl sie per
   Fremdschluessel an auth.users haengen: ob das Hauptschema dort
   ON DELETE CASCADE stehen hat, weiss diese Funktion nicht, und ohne
   Cascade scheitert das Delete am Fremdschluessel. Zweimal loeschen
   schadet nicht, einmal zu wenig schon.
═══════════════════════════════════════════════════════════════ */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !secretKey) return json({ error: 'env_missing' }, 500);

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'no_token' }, 401);

  // 1. Wer ruft? getUser() fragt den Auth-Server — ein Token eines
  //    bereits geloeschten Users faellt hier durch, ein manipuliertes
  //    ebenfalls.
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  const uid = userData?.user?.id;
  if (userErr || !uid) return json({ error: 'invalid_token' }, 401);

  // 2. Ab hier mit dem Secret-Key, aber ausschliesslich auf uid.
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Eigene Zeilen zuerst (siehe Kopf).
  for (const table of ['ritmo_matches', 'ritmo_profiles']) {
    const { error } = await admin.from(table).delete().eq('user_id', uid);
    // Eine fehlende Tabelle ist kein Grund, die Loeschung abzubrechen —
    // ein echter Fehler schon: sonst meldet die App "geloescht",
    // waehrend die Daten noch dastehen.
    if (error && error.code !== '42P01') {
      return json({ error: 'cleanup_failed', table, detail: error.message }, 500);
    }
  }

  // 3. Das Konto selbst. Damit fallen auch die Sessions und die
  //    Refresh-Tokens (sie haengen per Cascade an auth.users) — neue
  //    Access-Tokens kann dieser Account danach nicht mehr ziehen.
  //    Das BEREITS ausgestellte Access-Token bleibt bis zu seinem exp
  //    gueltig; ein JWT laesst sich nicht widerrufen. Der Hebel dafuer
  //    ist die JWT-Ablaufzeit im Dashboard, nicht diese Funktion.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: 'delete_failed', detail: delErr.message }, 500);

  return json({ ok: true });
});
