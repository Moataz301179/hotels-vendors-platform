/**
 * HotelsVendors Service Worker — RETIREMENT build.
 *
 * The previous cache-first SW ("wasla-v5") caused users to see stale, broken
 * versions of the app indefinitely: it served old CSS/JS from cache after every
 * deploy. The reliable fix is to STOP using a service worker for caching.
 *
 * This version does exactly one job: on install/activate it (1) deletes every
 * cache bucket the old SW ever created, and (2) unregisters itself so no future
 * service worker intercepts requests. The page is then served entirely by the
 * network — always fresh — which is the correct behavior for this app.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Do NOT intercept any requests. Let everything hit the network directly.
