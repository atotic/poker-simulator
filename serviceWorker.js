/* 
 ServiceWorker simple strategy:
 - delete old cache on install, precache resources
 - fetch: cache first, then network. Store network responses in cache
*/
'use strict'

let CACHE_NAME = 'v1';
let SW_VERSION = `SW_${String.fromCharCode(Math.round(65+Math.random()*26))} ${CACHE_NAME}`;

let PRE_CACHED_RESOURCES = [
  "./", 
  "index.html", 
  "playing_card.css", 
  "pokerEngine.js", 
  "favicon.ico", 
  "icons/512.png"
];

async function precacheResources() {
  await caches.delete(CACHE_NAME);  // Brute force, just deletes previous cache that might be live.
  let cache = await caches.open(CACHE_NAME);
  // Cache all static resources.
  return cache.addAll(PRE_CACHED_RESOURCES);
}

async function deleteOldCaches() {
  let keys = await caches.keys();
  return Promise.all(
    keys.map(key => {
      if (key != CACHE_NAME)
        return caches.delete(key);
    })
  );
}

let NOT_CACHED = ["/manifest.json"];
function shouldCache(path) {
  let url = new URL(path);
  if (url.pathname.startsWith("/test"))
    return false;
  for (let path of NOT_CACHED)
    if (url.pathname == path)
    return false;
  return true;
}

self.addEventListener("install", async (ev) => {
  // console.log("Service worker install in progress");
  self.skipWaiting(); // activates new service worker immediately
  ev.waitUntil(precacheResources());
});

self.addEventListener("activate", async ev => {
  await clients.claim();
  await deleteOldCaches();
  console.log(`Service worker  ${CACHE_NAME} ${SW_VERSION} activated`);
});

self.addEventListener("fetch", ev => {
  // Stragegy: cache first; store network responses in cache
  ev.respondWith(
    (async () => {
      let cache = await caches.open(CACHE_NAME);
      let response = await cache.match(ev.request.url);
      if (response)
        return response;
      response = await fetch(ev.request);
      if (response.ok && shouldCache(ev.request.url)) {
        console.log(`sw: storing network response ${ev.request.url}`);
        cache.put(ev.request.url, response.clone());
      }
      return response;
    })()
  );
});

// TESTING ONLY
self.addEventListener("message", async ev => {
  if (!ev.data)
    return;
  console.log("sw message", ev.data.type);
  if (ev.data.type == "POKER_TEST_GETVERSION") {
    ev.source.postMessage({
      type: "POKER_TEST_GETVERSION_REPLY",
      version: SW_VERSION
    });
  } else if (ev.data.type == 'POKER_TEST_LISTCACHE') {
    let cache = await caches.open(CACHE_NAME);
    let requests = await cache.keys();
    let cacheList = requests.map( r => r.url.replace("http://", ""));
    ev.source.postMessage({
      type: "POKER_TEST_LISTCACHE_REPLY",
      cacheList: cacheList.join("\n")
    });
  } else if (ev.data.type == 'POKER_CLEAR_CACHE') {
    let deleteCount = 0;
    let keys = await caches.keys();
    try {
      let deletions = await Promise.all(
        keys.map( key => {
          console.log("sw: deleting cache ", key);
          deleteCount++;
          return caches.delete(key);
        }));
      ev.source.postMessage({type: "POKER_CLEAR_CACHE_REPLY", result: deletions });
    } catch(err) {
      ev.source.postMessage({type: "POKER_CLEAR_CACHE_REPLY", error: err });
    }
  } else
    console.error("Unexpected sw message", ev.data.type);
});
