// Agenda Autoescuela – funcionamiento sin conexión y actualizaciones.
// Con Internet: descarga SIEMPRE la versión más reciente publicada (sin usar copias viejas).
// Sin Internet, o con la web cerrada temporalmente: usa la última copia guardada en el dispositivo.
// Los datos de los alumnos NO pasan por aquí: están guardados aparte en el dispositivo.
const CACHE = "agenda-autoescuela-v8-1";
const FICHEROS = ["./", "./index.html", "./tablet.html", "./manifest.webmanifest",
                  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    FICHEROS.map(f => fetch(f, {cache: "no-cache"}).then(r => r.ok && c.put(f, r)).catch(() => {}))
  )));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // WhatsApp y enlaces externos no se tocan
  const clave = url.origin + url.pathname;
  e.respondWith(
    fetch(clave, {cache: "no-cache"})
      .then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(clave, copia)); return r; }
        // Web cerrada temporalmente (404): los dispositivos que ya tienen la app siguen usándola
        return caches.match(clave, {ignoreSearch: true}).then(c => c || r);
      })
      .catch(() => caches.match(clave, {ignoreSearch: true})
        .then(r => r || caches.match("./tablet.html"))
        .then(r => r || caches.match("./index.html")))
  );
});
