/* RITMO — Abschalt-Worker.
   Ersetzt den alten Service Worker auf den Geraeten der Nutzer: er
   loescht alle Caches, meldet sich selbst ab und laedt offene Fenster
   neu. Danach kommt die App nicht mehr aus dem Geraet, sondern nur
   noch vom Server — und dort steht die Abschalt-Seite.
   Kein fetch-Handler: alles geht direkt ans Netz. */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
      // Neu laden NICHT abwarten (siehe public/sw.js): verkettet haengt
      // der Worker sonst in 'activating'.
      .then(() => { self.clients.matchAll({ type: 'window' })
        .then(cs => cs.forEach(c => c.navigate(c.url).catch(() => {}))); })
      .catch(() => {})
  );
});
