// Minimal service worker — enables "Add to Home Screen" install prompt
// and caches the app shell so it opens instantly.

const CACHE = "streambox-v1";
const SHELL = ["./", "index.html", "style.css", "script.js", "manifest.webmanifest", "icon-512.png"];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);
    // Never cache TMDB API/image calls — always fresh.
    if (url.hostname.includes("themoviedb.org") || url.hostname.includes("tmdb.org")) return;

    e.respondWith(
        caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
});
