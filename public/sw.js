/*
 * Chrona's service worker: keeps a copy of the app so the room still opens
 * without internet. Nothing here talks to a server of ours; it only caches
 * what the browser already downloaded.
 */

const VERSION = "chrona-v1";
const PAGES = ["/", "/pomodoro", "/timer", "/stopwatch", "/world-clock", "/alarms", "/settings", "/feedback"];
const STATIC = /^\/(_next\/static\/|sounds\/|icons\/|icon\.png|apple-icon\.png|favicon\.ico|manifest\.webmanifest)/;

/* Cache a page and every script and stylesheet it names. */
async function keepPage(cache, path) {
  const response = await fetch(path, { cache: "no-cache" });

  if (!response.ok) {
    return;
  }

  const html = await response.clone().text();
  await cache.put(path, response);

  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  await Promise.all(
    [...assets].map((asset) =>
      cache.match(asset).then((hit) => hit ?? cache.add(asset).catch(() => {}))
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.all(PAGES.map((path) => keepPage(cache, path).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/* Each update leaves old files behind; let go of the oldest now and then. */
const LIMIT = 800;

async function trim(cache) {
  const keys = await cache.keys();

  if (keys.length > LIMIT) {
    const old = keys.filter((request) => new URL(request.url).pathname.startsWith("/_next/static/"));
    await Promise.all(old.slice(0, keys.length - LIMIT + 100).map((request) => cache.delete(request)));
  }
}

/* Built files never change under the same name: the cache is enough. */
async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);

  if (hit) {
    return hit;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
    void trim(cache);
  }

  return response;
}

/* Pages: the newest version when online, the kept one when not. */
async function networkFirst(request, fallback) {
  const cache = await caches.open(VERSION);

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // A page is the same page whichever headers asked for it.
    const loose = { ignoreVary: Boolean(fallback) };
    const hit = (await cache.match(request, loose)) ?? (fallback ? await cache.match(fallback, loose) : undefined);

    if (hit) {
      return hit;
    }

    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (STATIC.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    const path = PAGES.includes(url.pathname) ? url.pathname : "/";
    event.respondWith(networkFirst(request, path));
  } else if (request.headers.get("RSC")) {
    // Moving between tools in the app. Offline and not kept, this fails and
    // Next.js loads the page itself instead, which the case above answers.
    event.respondWith(networkFirst(request));
  }
});
