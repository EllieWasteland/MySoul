// Define un nombre y una versión para tu caché.
// Cambiar la versión forzará al navegador a actualizar el service worker y la caché.
const CACHE_NAME = 'mysoul-cache-v2';

// Lista de archivos y recursos esenciales para que la app funcione sin conexión.
// Usamos rutas relativas para que funcione en cualquier directorio.
const urlsToCache = [
  './',
  './index.html',
  './mytime.html',
  './mymemory.html',
  './style.css',
  './script.js',
  './data-manager.js',
  './manifest.json',
  
  // Iconos de la app
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',

  // Recursos externos (Fuentes, Imágenes, etc.)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@400;600&family=Inter:wght@300;400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Kdam+Thmor+Pro&family=Inter:wght@400;500;600;700&display=swap',
  'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg',
  
  // Sonidos del modo Zen (de MyTime)
  'https://www.soundjay.com/nature/rain-light-2.mp3',
  'https://www.soundjay.com/nature/forest-reverb-1.mp3',
  'https://www.soundjay.com/nature/white-noise-1.mp3'
];

// Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta, guardando archivos...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falló el precaching de archivos:', error);
      })
  );
});

// Evento 'fetch': Se dispara cada vez que la app realiza una petición.
self.addEventListener('fetch', event => {
  // Estrategia "Cache First"
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en la caché, la devolvemos.
        if (response) {
          return response;
        }
        // Si no, realizamos la petición a la red.
        return fetch(event.request);
      })
  );
});

// Evento 'activate': Se dispara cuando un nuevo Service Worker se activa.
// Es el lugar ideal para limpiar cachés antiguas y obsoletas.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si una caché no está en nuestra lista blanca, la eliminamos.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
