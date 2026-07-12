// Service worker minimal — tujuannya cuma supaya PWA bisa di-install.
// Data jurnal TETAP selalu diambil langsung dari server (network), tidak di-cache,
// supaya Anda selalu lihat data terbaru. Yang di-cache cuma "kerangka" tampilan (app shell).

const CACHE_NAME = 'jurnal-mengajar-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan pernah cache panggilan API — selalu ambil data terbaru dari server.
  if (url.pathname === '/api') {
    return; // biarkan request jalan normal (network), tidak disentuh service worker
  }

  // Untuk file app shell: coba jaringan dulu (biar selalu update kalau ada koneksi),
  // kalau gagal (offline) baru pakai cache.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
