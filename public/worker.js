// Another app on this origin registered a cache-first worker at /worker.js.
// It keeps serving an old Next client bundle, so the server HTML has
// href="/work/" while that bundle hydrates href="/work". Browsers only
// replace a worker when this URL returns new JavaScript. Clear the cache
// and unregister so the next load uses the current bundle.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      await Promise.all(windows.map((client) => client.navigate(client.url)))
    })(),
  )
})
