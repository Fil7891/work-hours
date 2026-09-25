const CACHE="work-hours-v6";
const ASSETS=[
  "./","index.html","timesheets.html","salary.html","settings.html",
  "css/style.css","js/db.js","js/app.js","js/timesheets.js",
  "js/salary.js","js/settings.js","js/tax-table.js",
  "manifest.json","icons/icon.svg","icons/icon-192.png","icons/icon-512.png"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>e.respondWith(
  caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return resp;
  }).catch(()=>caches.match("index.html")))
));
