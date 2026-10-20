// Vitality service worker
// v3 — the HTML document is now network-first.
//
// v2 was cache-first for everything, so once index.html was cached the app
// never checked the network again: a new build only appeared if you deleted
// and re-added the home-screen icon. The page now tries the network first and
// falls back to cache when offline, while static assets (icons, manifest)
// stay cache-first since they rarely change.

const CACHE = "vitality-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isDocument =
    req.mode === "navigate" ||
    req.destination === "document" ||
    (req.destination === "" && req.url.endsWith(".html"));

  if (isDocument) {
    // Network-first: always pick up a fresh build when online.
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Everything else: cache-first, refilled in the background.
  e.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      })
    )
  );
});
