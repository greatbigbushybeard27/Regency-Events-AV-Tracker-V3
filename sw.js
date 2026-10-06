
const CACHE='avtracker-regency-v53-clean';
const ASSETS=['./','./index.html','./app.js','./v51.js','./v52.js','./v53.js','./manifest.webmanifest','./icon.svg','./regency-logo.png','./regency-banner.png','./regency-app-logo.png','./portaloo-icon.svg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(async r=>{
        const text=await r.text();
        let injected=text;
        if(!/v52\.js/.test(injected))
          injected=injected.replace('</body>','<script src="./v52.js?v=53-clean"></script></body>');
        if(!/v53\.js/.test(injected))
          injected=injected.replace('</body>','<script src="./v53.js?v=53-clean"></script></body>');
        return new Response(injected,{status:r.status,statusText:r.statusText,headers:r.headers});
      }).catch(()=>caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
