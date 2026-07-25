const CACHE_NAME = 'imperio-batista-v1';
const ASSETS = [
  './', './index.html', './admin.html', './manifest.json', './css/style.css',
  './js/firebase.js', './js/core.js', './js/pages.js', './js/app.js', './js/admin.js', './js/page-bridge.js',
  './pages/home.html', './pages/membros.html', './pages/cultos.html', './pages/agenda.html', './pages/atividades.html', './pages/celula.html', './pages/perfil.html', './pages/postar.html', './pages/quiz.html',
  './assets/logo.png', './assets/favicon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html'))));
});
