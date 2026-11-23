const CACHE_NAME = 'frutiva-app-v13';
const RUNTIME_CACHE = 'frutiva-runtime-v1';
const APP_SHELL = [
  './index.html', './menu.html', './promociones.html', './nosotros.html', './pedido.html', './offline.html',
  './manifest.webmanifest', './js/productos-fallback.js', './js/productos.js', './js/productos.json',
  './css/styles.css', './css/responsive.css', './css/animations.css', './css/carrito.css',
  './js/vendor/jquery-3.7.1.min.js', './js/eventos.js', './js/theme.js', './js/menu.js',
  './js/validaciones.js', './js/catalogo.js', './js/formulario.js', './js/main.js',
  './js/accessibility.js', './js/auditorias.js', './js/supabase-config.js', './js/sincronizacion.js', './js/gestion.js', './js/pwa.js', './js/hmr-runtime.js',
  './js/spa.js', './js/spa-views.js', './js/carrito.js', './js/entry-redirect.js',
  './img/logo/logo.svg', './img/banners/hero.svg',
  './img/productos/p1.svg', './img/app/icon-192.png', './img/app/icon-512.png', './img/app/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('frutiva-') && ![CACHE_NAME, RUNTIME_CACHE].includes(key))
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (request.destination !== 'image') return;
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') await cache.put(request, response.clone());
        return response.ok || response.type === 'opaque' ? response : (await caches.match('./img/productos/p1.svg')) || response;
      } catch (error) {
        return (await caches.match('./img/productos/p1.svg')) || Response.error();
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch (error) {
        return (await caches.match(request, { ignoreSearch: true })) || (await caches.match('./index.html')) || (await caches.match('./offline.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});



