/* 
Service Worker context is:
ServiceWorkerGlobalScope: clients
WindowOrWorkerGlobalScope: caches
*/
'use strict'

let CACHE_NAME = "DEBUG_CACHE";

// Logging/messaging utilities
let timestampFormat =  Intl.DateTimeFormat('en-us', {
  hour12: false, minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3});
let oldMessages = [];
let debug = true;

let RANDOM_PREFIX = String.fromCharCode(Math.round(65+Math.random()*26));

function messageClient(msg) {
  if (debug) console.log(msg);
  let tsMessage = `${RANDOM_PREFIX} ${timestampFormat.format(new Date())} ${msg}`;
  clients.matchAll({includeUncontrolled: true})
    .then(myClients => {
      if (myClients.length == 0) { // save messages for later
        oldMessages.push(tsMessage);
      } else {
        while (oldMessages.length > 0) {
          for (let c of myClients)
            c.postMessage(oldMessages.shift());
        }
        for (let c of myClients)
          c.postMessage(tsMessage);
      }
    })
    .catch(err => { //
      console.error("Error in messageClient", err);
    })
}

// SW events
self.addEventListener("install", ev => {
  messageClient("sw install");
  // deleteOldCaches()
  self.skipWaiting(); // activates new service worker immediately
  // ev.waitUntil(precacheResources());
});

self.addEventListener("activate", ev => {
  messageClient("sw activate");
  clients.claim();
    // .then(deleteOldCaches);
});

self.addEventListener("fetch", ev => {
  messageClient(`sw fetch ${ev.request.url}`);
  ev.respondWith(
    (async () => {
      let cache = await caches.open(CACHE_NAME);
      let response = await cache.match(ev.request.url);
      if (response) {
        messageClient(`sw fetch success ${ev.request.url}`);
        return response;
      }
      messageClient(`sw fetch miss ${ev.request.url}`);
      response = await fetch(ev.request);
      if (response.ok) {
        messageClient(`sw fetch storing ${ev.request.url}`);
        cache.put(ev.request.url, response.clone());
        messageClient(`sw fetch remote success ${ev.request.url}`);
        return response;
      }
      messageClient(`sw fetch remote failure ${ev.request.url}`);
      return response;
    })()
  );
});

// Message handlers
async function listCache() {
  let cache = await caches.open(CACHE_NAME);
  let requests = await cache.keys();
  let listMsg = `list cache ${CACHE_NAME}<br>`;
  if (requests.length == 0)
    listMsg += "empty!";
  for (let r of requests)
    listMsg += `${r.url}<br>`;
  messageClient(listMsg);
}

async function clearCache() {
  let wasDeleted = await caches.delete(CACHE_NAME);
  if (wasDeleted)
    messageClient(`${CACHE_NAME} deleted`);
  else
    messageClient(`${CACHE_NAME} not found`);
}

async function addToCache(path) {
  let cache = await caches.open(CACHE_NAME);
  try {
    await cache.add(path);
    messageClient(`success adding ${path}`);
  } catch(err) {
    messageClient(`error adding ${path}: ${err}`);
  }
}

// Message events are only used for testing
self.addEventListener("message", ev => {
  // if (debug)
  //   console.log(ev.data);
  if (!ev.data) {
    messageClient("got message, no data");
    return;
  }
  if (ev.data.type == "listCache") {
    listCache();
  } else if (ev.data.type == "clearCache") {
    clearCache();
  } else if (ev.data.type == "addToCache") {
    addToCache(ev.data.path);
  } else {
    messageClient(`unknown message ${ev.data}`);
  }
  if (!ev.data)
    return;
});
