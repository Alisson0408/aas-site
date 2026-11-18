/*
  AAS Music — © 2026 Alisson · AAS Tecnologia Editorial. Todos os direitos reservados.
  Software proprietário, protegido pela Lei 9.609/1998 (Lei do Software) e pela Lei 9.610/1998 (Direitos Autorais).
  É proibido copiar, modificar, redistribuir, revender, sublicenciar ou criar sistemas derivados deste código,
  no todo ou em parte, sem autorização por escrito do autor. Uso permitido somente a clientes licenciados.
  Autoria registrada no histórico de versões de github.com/Alisson0408/aas-site (desde 17/11/2026).
  ID de autoria: AAS-AASM-2026-F03625E8
*/
/* AAS Music — service worker: rede primeiro, cópia local se estiver sem internet */
const CACHE='aasmusic-v1';
const SHELL=['./','index.html','aluno.html','demo.html','manual.html','engine.js','config.js','planos.js','icon.svg','icon-mask.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
});
