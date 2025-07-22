// Define un nombre y una versión para tu caché.
// Cambiar la versión (ej. v1.1) forzará al navegador a actualizar el service worker y la caché.
const CACHE_NAME = 'foco-cache-v1.1';

// Lista de archivos y recursos esenciales para que la app funcione sin conexión.
// CORRECCIÓN: Se añadieron style.css, script.js y manifest.json a la lista.
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  
  // Recursos externos
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Kdam+Thmor+Pro&family=Inter:wght@400;600;700&display=swap',
  'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg',
  
  // Sonidos del modo Zen
  'https://www.soundjay.com/nature/rain-light-2.mp3',
  'https://www.soundjay.com/nature/forest-reverb-1.mp3',
  'https://www.soundjay.com/nature/white-noise-1.mp3',
  
  // Iconos de la app
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  // Espera hasta que la promesa dentro de waitUntil se resuelva.
  event.waitUntil(
    // Abre la caché con el nombre que definimos.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta y lista para guardar archivos.');
        // Añade todos los recursos de nuestra lista a la caché.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falló el precaching de archivos:', error);
      })
  );
});

// Evento 'fetch': Se dispara cada vez que la app realiza una petición (pide un archivo, una imagen, etc.).
self.addEventListener('fetch', event => {
  // Se implementa una estrategia "Cache First".
  event.respondWith(
    // Intenta encontrar una respuesta para esta petición en nuestra caché.
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en la caché, la devolvemos inmediatamente.
        if (response) {
          return response;
        }
        // Si no, realizamos la petición a la red como se haría normalmente.
        return fetch(event.request);
      })
  );
});

// Evento 'activate': Se dispara cuando un nuevo Service Worker se activa.
// Es el lugar ideal para limpiar cachés antiguas y obsoletas.
self.addEventListener('activate', event => {
  // Lista blanca de cachés que queremos mantener.
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
