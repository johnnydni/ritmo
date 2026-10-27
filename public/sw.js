/* ═══════════════════════════════════════════════════════════════
   RITMO SERVICE WORKER — macht die App zur vollwertigen PWA:
   Offline-Fähigkeit + schnellere Starts durch lokales Caching.

   Strategie:
   - Navigationen (index.html): NETWORK-FIRST — Updates kommen sofort
     an, offline greift die zuletzt gecachte Shell.
   - Same-Origin-Assets (gehashte Bundles, Bilder, Videos, Fonts):
     CACHE-FIRST — einmal geladen, danach lokal.
   - Cross-Origin (Supabase REST/Realtime etc.) und Non-GET werden
     NIE angefasst — Live-Daten bleiben live.
   - Nur Status-200-Antworten werden gecacht (206-Range-Antworten
     der Videos verträgt die Cache-API nicht).

   Update-Mechanik: CACHE-Namen bumpen → activate räumt alte Caches
   weg; skipWaiting/clients.claim aktivieren den neuen Worker sofort.

   Ein Bump muss die alte App WIRKLICH verdraengen (gebraucht fuer die
   Beta-Pause, siehe CLAUDE.md). Drei Luecken, die v1 offen liess:
   - Offline lieferte der Cache die alte Shell samt alter Bundles.
     → activate loescht JEDEN fremden Cache, nicht nur ritmo-*.
   - Eine offene App laedt nicht von selbst neu, nur weil ein neuer
     Worker da ist — sie liefe mit dem alten Bundle weiter.
     → activate laedt alle Fenster einmal neu (activate feuert je
       Worker genau einmal, eine Schleife entsteht nicht).
   - GitHub Pages schickt index.html mit max-age=600: bis zu zehn
     Minuten kam auch "online" noch die alte Shell aus dem HTTP-Cache.
     → Navigationen gehen mit cache:'no-cache' raus (Revalidierung).
═══════════════════════════════════════════════════════════════ */
const CACHE = 'ritmo-v5';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      // NICHT auf das Neuladen warten: dessen Navigation geht durch
      // diesen Worker und wartet auf 'activated' — und das kaeme erst,
      // wenn waitUntil durch ist. Verkettet haengt der Worker fuer
      // immer in 'activating' (gemessen).
      .then(() => { self.clients.matchAll({ type: 'window' })
        .then(cs => cs.forEach(c => c.navigate(c.url).catch(() => {}))); })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => {
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
