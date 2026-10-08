// Offline support. The app is a single page ("/") plus hashed build files, so:
//  - the page is served from cache at once and refreshed in the background,
//  - build files are cached forever (their names change when their content does),
//  - a photo of a book page is kept once it has been looked at.
const CACHE = "omasuomi-v1";
const ASSET = /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\\\s)<>]+/g;

/** Every build file a page refers to, as absolute paths. */
function assetsOf(html) {
  const found = new Set();
  for (const hit of html.match(ASSET) ?? []) {
    found.add(hit.startsWith("/_next/") ? hit : `/_next/${hit}`);
  }
  return [...found];
}

/**
 * Fetch the page and everything it needs, and only then replace the cached copy.
 * Swapping the page first could leave a new page pointing at files that were never cached.
 */
async function refreshPage() {
  const response = await fetch("/", { cache: "no-store" });
  if (!response.ok) return response;
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  const arrived = await Promise.all(
    assetsOf(html).map(async (url) => {
      if (await cache.match(url)) return true;
      return cache.add(url).then(
        () => true,
        () => false,
      );
    }),
  );
  // One file short, the new page would not start offline: the page already cached stays.
  if (arrived.every(Boolean)) await cache.put("/", response.clone());
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    refreshPage()
      .then(() => caches.open(CACHE))
      .then((cache) => cache.addAll(["/manifest.webmanifest", "/icons/icon-192.png"]).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// The first visit loads before this worker is in control; the page then reports what it loaded.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-urls") return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls.map(async (url) => {
          if (!(await cache.match(url))) await cache.add(url).catch(() => {});
        }),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cached) => {
        const fresh = refreshPage().catch(() => cached);
        if (cached) {
          event.waitUntil(fresh);
          return cached;
        }
        return fresh;
      }),
    );
    return;
  }

  // Only a photo that loaded is kept: a locked one (401) is asked for again.
  const photo = url.pathname.startsWith("/api/pages/") && url.pathname !== "/api/pages/unlock";
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || photo) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
            }
            return response;
          }),
      ),
    );
  }
});
