const grants=new Map();
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 const {token,key,path}=event.data||{};
 if(!event.source?.url.startsWith(self.registration.scope)||typeof token!=='string'||typeof key!=='string'||typeof path!=='string')return;
 const now=Date.now();for(const [id,g] of grants)if(g.expires<now)grants.delete(id);
 grants.set(token,{key,path,expires:now+15000});event.ports[0]?.postMessage(true);
});
self.addEventListener('fetch',event=>{
 if(event.request.mode!=='navigate')return;
 const url=new URL(event.request.url),token=url.searchParams.get('_nznav');if(!token)return;
 const grant=grants.get(token);grants.delete(token);url.searchParams.delete('_nznav');
 if(!grant||url.pathname!==grant.path||grant.expires<Date.now()){event.respondWith(Response.redirect(url.href));return;}
 event.respondWith((async()=>{
  try{
   const response=await fetch(new URL('page.bin',url));if(!response.ok)throw Error('page unavailable');
   const data=new Uint8Array(await response.arrayBuffer());
   const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(grant.key),c=>c.charCodeAt(0)),'AES-GCM',false,['decrypt']);
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:data.subarray(16,28)},key,data.subarray(28));
   const html=await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
   const setup='<script>const previewURL=new URL(location.href);previewURL.searchParams.delete("_nznav");history.replaceState(history.state,"",previewURL.href);</script><script defer src="/nz-website-preview/transition.js"></script>';
   return new Response(html.replace('<head>','<head>'+setup),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  }catch{return Response.redirect(url.href)}
 })());
});
