const CACHE_NAME = 'imperio-batista-v4';
const ASSETS = [
  './', './index.html', './admin.html', './manifest.json', './css/style.css',
  './js/vendor-qrcode.js', './js/security.js', './js/firebase.js', './js/core.js', './js/editor.js', './js/ai.js', './js/pix.js', './js/pages.js', './js/app.js', './js/admin.js', './js/page-bridge.js',
  './pages/home.html', './pages/membros.html', './pages/cultos.html', './pages/agenda.html', './pages/versiculo.html', './pages/palavra.html', './pages/atividades.html', './pages/celula.html', './pages/perfil.html', './pages/postar.html', './pages/quiz.html',
  './pages/dizimo.html', './pages/oracao.html', './pages/midia.html', './pages/leitura.html', './pages/aniversarios.html', './pages/sobre.html', './pages/contato.html',
  './assets/logo.png', './assets/favicon.png', './assets/logo-azul.png', './assets/favicon-azul.png', './assets/logo-roxo.png', './assets/favicon-roxo.png',
  './assets/icon-96.png', './assets/icon-144.png', './assets/icon-192.png', './assets/icon-256.png', './assets/icon-384.png', './assets/icon-512.png',
  './assets/icon-maskable-512.png', './assets/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  // addAll falha inteiro se um único arquivo faltar; cacheia item a item para o SW sempre instalar.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(asset => cache.add(asset).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Chamadas de API (DeepSeek, Firebase) nunca entram em cache.
  if (/api\.deepseek\.com|firebaseio\.com|googleapis\.com|mercadopago/.test(request.url)) return;
  event.respondWith(fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html'))));
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'SHOW_NOTIFICATION') return;
  const options = Object.assign({
    icon: './assets/logo.png',
    badge: './assets/favicon.png',
    data: { url: './index.html' }
  }, data.options || {});
  event.waitUntil(self.registration.showNotification(data.title || 'Igreja Imperial Batista', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    for (const client of clientList) {
      if ('focus' in client) {
        client.navigate(targetUrl).catch(() => {});
        return client.focus();
      }
    }
    return clients.openWindow(targetUrl);
  }));
});
