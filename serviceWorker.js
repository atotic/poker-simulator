/*
Learning ServiceWorker API

ServiceWorker is a script that runs in a background.
Lifecycle of a service worker:
download: 
install: create a cache, download assets. Call skipWaiting for immediate upgrade.
activate: clean up old caches

ServiceWorker does not become active by default until all old clients are closed.
Override this with  ServiceWorkerGlobalScope.skipWaiting(), Clients.claim().

API used by the web page:

navigator.serviceWorker is a ServiceWorkerContainer
ServiceWorkerContainer 
  register(url) => ServiceWorkerRegistration
  
ServiceWorkerRegistration
  active: currently active worker
  installing: worker currently installing
  waiting: installed worker, waiting to become active
  updatefound event: fires when new service worker enters installing state

APIs used by ServiceWorker

ServiceWorkerGlobalScope JavaScript scope service workers run in
  clients: clients associated with this scope.
  registration: 
  all events ServiceWorker responds to are fired here: install, activate, message

  caches is a CacheStorage global, but not defined in spec on GlobalScope?

CacheStorage
  open()
  keys() returns a list of all cache keys
Cache

Client

References:
https://whatwebcando.today/articles/handling-service-worker-updates/
https://felixgerschau.com/how-to-communicate-with-service-workers/

My first service worker project
https://web.dev/learn/pwa/service-workers/
Clearing out buggy service workers: https://developer.chrome.com/docs/workbox/remove-buggy-service-workers/
- i might need this. Creates a null worker.
https://whatwebcando.today/articles/handling-service-worker-updates/

*/
/* 
 ServiceWorker strategy:
 - precache resources, wipe out any old caches, skipWaiting
 - claim all clients on activation
*/
'use strict'

let PRE_CACHED_RESOURCES = ["/", "index.html", "playing_card.css", "pokerEngine.js", "favicon.ico", "icons/512.png"];
let SW_VERSION = `PSW_${Math.floor(Math.random() * 10000000)}`;
let CACHE_NAME = 'v2';

async function precacheResources() {
  await caches.delete(CACHE_NAME);  // Brute force, just deletes previous cache that might be live.
  let cache = await caches.open(CACHE_NAME);
  // Cache all static resources.
  return cache.addAll(PRE_CACHED_RESOURCES);
}

async function deleteOldCaches() {
  caches.keys()
  .then(keys => {
    Promise.all(
      keys.map(key => {
        if (key != CACHE_NAME)
          return caches.delete(key);
      })
    );
  });
}

self.addEventListener("install", ev => {
  console.log("Service worker install in progress");
  self.skipWaiting(); // activates new service worker immediately
  ev.waitUntil(precacheResources());
});

self.addEventListener("activate", ev => {
  clients.claim()
    .then(deleteOldCaches);
  console.log(`Service worker  ${CACHE_NAME} ${SW_VERSION} activated`);
});

let NOT_CACHED = ["/manifest.json"];

self.addEventListener("fetch", ev => {
  // https://developer.chrome.com/docs/workbox/caching-strategies-overview
  ev.respondWith(
    caches.open(CACHE_NAME)
      .then(async cache => {
        return cache.match(ev.request.url);
      })
      .then(async response => {
        if (response)
          return response;
        let url = new URL(ev.request.url);
        if (!url.pathname.startsWith("/test")) {
          let should_be_cached = true;
          for (let path of NOT_CACHED) {
            if (url.pathname == path) {
              should_be_cached = false;
              break;
            }
          }
          if (should_be_cached)
            console.error(`Fetching in service worker ${ev.request.url}`);
        }
        return fetch(ev.request);
      })
  );
});

// Message events are only used for testing
self.addEventListener("message", ev => {
  if (!ev.data)
    return;
  console.log("sw message", ev.data.type);
  switch (ev.data.type) {
    case "POKER_TEST_GETVERSION": {
      ev.source.postMessage({
        type: "POKER_TEST_GETVERSION_REPLY",
        version: SW_VERSION
      });
    }
    break;
    case 'POKER_TEST_LISTCACHE': {
      caches.open(CACHE_NAME)
        .then(cache => cache.keys())
        .then(requests => {
          let cacheList = [];
          for (let r of requests)
            cacheList.push(r.url.replace("http://", ""));
          ev.source.postMessage({
            type: "POKER_TEST_LISTCACHE_REPLY",
            cacheList: cacheList.join("\n")
          });
        });
    }
    break;
    case 'POKER_CLEAR_CACHE': {
      let deleteCount = 0;
      caches.keys()
      .then( keys => {
        Promise.all(
          keys.map( key => {
            console.log("sw: deleting cache ", key);
            deleteCount++;
            return caches.delete(key);
          })
        )
      })
      .then( 
        result => {
          ev.source.postMessage({
            type: "POKER_CLEAR_CACHE_REPLY",
            result: result
          });
        },
        error => {
          ev.source.postMessage({
            type: "POKER_CLEAR_CACHE_REPLY",
            error: error
          });
        }
      )
    }
    break;
    default:
      console.error("Unexpected sw message", ev.data.type);
  }
});
