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
═══════════════════════════════════════════════════════════════ */
const CACHE = 'ritmo-v1';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
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
