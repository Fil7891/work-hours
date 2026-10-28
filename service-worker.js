const CACHE="work-hours-v16";
const ASSETS=[
  "./","index.html","timesheets.html","salary.html","invoice.html","tax-year.html","settings.html",
  "css/style.css?v=16","js/db.js?v=16","js/app.js?v=16","js/timesheets.js?v=16",
  "js/salary.js?v=16","js/invoice.js?v=16","js/tax-year.js?v=16","js/settings.js?v=16","js/tax-table.js?v=16",
  "manifest.json?v=16","icons/work-hours-v14-180.png","icons/work-hours-v14-192.png","icons/work-hours-v14-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const isAppAsset=sameOrigin && (event.request.mode==="navigate" || /\.(?:html|css|js|json)$/.test(url.pathname));

  if(isAppAsset){
    event.respondWith(
      fetch(event.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("index.html")))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
