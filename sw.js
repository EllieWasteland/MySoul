// Define un nombre y una versión para tu caché.
// Cambiar la versión forzará al navegador a actualizar el service worker y la caché.
const CACHE_NAME = 'mysoul-cache-v1';

// Lista de archivos y recursos esenciales para que la app funcione sin conexión.
const urlsToCache = [
  '/',
  'index.html',
  'mytime.html',
  'mymemory.html',
  'style.css',
  'script.js',
  'manifest.json',
  
  // Iconos de la app
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',

  // Recursos externos (Fuentes, Imágenes, etc.)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@400;600&family=Inter:wght@300;400&display=swap',
  'https://fonts.googleapis.com/css2?family=Kdam+Thmor+Pro&family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@400;600&family=Inter:wght@300;400;500&display=swap',
  'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/flowers.jpg',
  
  // Sonidos del modo Zen (de MyTime)
  'https://www.soundjay.com/nature/rain-light-2.mp3',
  'https://www.soundjay.com/nature/forest-reverb-1.mp3',
  'https://www.soundjay.com/nature/white-noise-1.mp3'
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
        // Usamos { cache: 'reload' } para asegurar que obtenemos las versiones más recientes de la red durante la instalación.
        const promises = urlsToCache.map(url => {
            return fetch(url, { cache: 'reload' })
                .then(response => {
                    if (!response.ok) {
                        // Si una fuente externa como Google Fonts falla, no rompemos toda la instalación.
                        console.warn(`No se pudo cachear ${url}. Estado: ${response.status}`);
                        return Promise.resolve(); // Resuelve para no fallar el Promise.all
                    }
                    return cache.put(url, response);
                })
                .catch(error => {
                    console.error(`Falló la petición para ${url}:`, error);
                });
        });
        return Promise.all(promises);
      })
      .then(() => {
        console.log('Todos los recursos esenciales han sido cacheados.');
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
        return fetch(event.request).then(
          networkResponse => {
            // Opcional: Podemos cachear la nueva respuesta para futuras peticiones.
            // Esto es útil para recursos dinámicos o no esenciales.
            // No lo incluimos por defecto para no llenar la caché con contenido no esencial.
            return networkResponse;
          }
        );
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
