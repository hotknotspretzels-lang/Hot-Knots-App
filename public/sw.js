// Intentionally does no caching. Its only job is to exist and register a
// fetch handler so the browser considers the app installable — this is a
// business tool backed by a live database, and caching JS/data here risks
// serving stale code or stale numbers, which is worse than not caching at
// all. Every request just passes straight through to the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request normally.
});
