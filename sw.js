// Service worker per «Agenda personale» — offline completo.
// Funziona solo via HTTPS (es. GitHub Pages) o localhost; su file:// viene ignorato dall'app.
// Dopo il primo caricamento online, l'app si apre anche senza rete.
const CACHE = 'agenda-personale-v1';
const ASSETS = ['./', './Agenda_personale.html', './agenda-icon.png', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // le chiamate a GitHub/Gist vanno sempre alla rete

  // Il documento si carica network-first: gli aggiornamenti online arrivano subito;
  // offline si usa la copia in cache.
  if (request.mode === 'navigate' || url.pathname.endsWith('Agenda_personale.html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('./Agenda_personale.html')))
    );
    return;
  }

  // Asset statici: cache-first.
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
