// Service worker « réseau d'abord » : le jeu est TOUJOURS chargé depuis Internet quand on est en ligne,
// donc jamais d'ancienne version. La copie gardée n'est utilisée que si le réseau est coupé.
const CACHE = "siecle-noir-secours";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // Firebase, polices… : on ne touche à rien
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || Response.error()))
  );
});
