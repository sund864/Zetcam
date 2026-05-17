// public/sw.js
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Chrome strictly requires a fetch handler that returns a response
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response("App is running.");
    })
  );
});