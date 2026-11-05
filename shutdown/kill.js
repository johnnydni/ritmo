/* Raeumt im Browser auf, falls die Seite noch unter dem alten Worker
   laeuft: Worker dieser App abmelden, alle Caches loeschen.
   Daten in localStorage (Profil, Turniere) bleiben unangetastet. */
(function () {
  var base = location.origin + '__BASE__';
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        rs.forEach(function (r) { if (r.scope.indexOf(base) === 0) r.unregister(); });
      });
    }
    if (window.caches) {
      caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); });
    }
  } catch (e) {}
})();
