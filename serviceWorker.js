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
Design of my first service worker:
1) service worker will cache html/js/css so poker can work offline.
  
2) when service worker is updated, all clients should reload immediately. 
  Data loss is limited to current game.

Implementation: 
navigator.serviceWorker is a ServiceWorkerContainer
My design:
- simplest design would not cache anything, but then it would not work offline.
- 
*/
'use strict'

let SW_LOG = "";

let CACHE_NAME = "v1";
let PRE_CACHED_RESOURCES = ["/", "index.html", "playing_card.css", "pokerEngine.js"];

async function precacheResources() {
  const cache = await caches.open(CACHE_NAME);
  // Cache all static resources.
  cache.addAll(PRE_CACHED_RESOURCES);
}

self.addEventListener("install", ev => {
  console.log("Service worker install in progress");
  self.skipWaiting(); // activates new service worker immediately
  ev.waitUntil(precacheResources());
});

self.addEventListener("activate", ev => {
  // clear out stale caches here
  console.log("Service worker activated");
});

self.addEventListener("message", ev => {
  if (!ev.data)
    return;
  console.log("sw message", ev.data.type);
  switch (ev.data.type) {
    case "POKER_TEST_GETLOG": {
      ev.source.postMessage({
        type: "POKER_TEST_GETLOG_REPLY",
        log: SW_LOG
      });
    }
    break;
    case 'POKER_TEST_LISTCACHE': {
      caches.open(CACHE_NAME)
        .then((cache) => cache.keys())
        .then((requests) => {
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


self.addEventListener("fetch", ev => {
  // https://developer.chrome.com/docs/workbox/caching-strategies-overview
  // Network-first, copied from google
  if (ev.request.mode === 'navigate') {
    // Open the cache
    ev.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      // Go to the network first
      return fetch(ev.request.url).then((fetchedResponse) => {
        if (ev.request.url.match("test/") == null) // Do not put test files into the cache
          cache.put(ev.request, fetchedResponse.clone());
        return fetchedResponse;
      }).catch(() => {
        // If the network is unavailable, get
        return cache.match(ev.request.url);
      });
    }));
  } else {
    return;
  }
});