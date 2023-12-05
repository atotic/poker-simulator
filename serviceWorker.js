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
Cache
CacheStorage
Client

References:
https://whatwebcando.today/articles/handling-service-worker-updates/

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
self.addEventListener("install", ev => {
  let OLD_CACHES=[];
  let CACHE_NAME="";
  let ASSETS=['index.html', 'playing_card.css', 'pokerEngine.js'];
  console.log("Service worker install in progress");
  self.skipWaiting(); // activates new service worker immediately

  ev.waitUntil( _ => {
    clients.claim();
    // TODO populate cache
    return Promise.resolve();
  });
});

self.addEventListener("activate", ev => {
  // clear out stale caches here
  console.log("Service worker activated");
});
self.addEventListener("message", ev => {
  console.log("SW: message", ev);
});
self.addEventListener("fetch", ev => {
  // https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent
  return;
});