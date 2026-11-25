(()=>{
 if(!('serviceWorker' in navigator))return;
 const root='/nz-website-preview/';
 const ready=navigator.serviceWorker.register(root+'preview-worker.js',{scope:root}).then(()=>navigator.serviceWorker.ready).catch(()=>null);
 let sequence=0;
 document.addEventListener('click',async event=>{
  const a=event.target.closest?.('a[href]');
  if(!a||event.defaultPrevented||event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const to=new URL(a.href);
  if(to.origin!==location.origin||!to.pathname.startsWith(root)||!to.pathname.endsWith('/')||(to.pathname===location.pathname&&to.search===location.search&&to.hash))return;
  const key=sessionStorage.getItem('nz-preview-session-v1');if(!key)return;
  event.preventDefault();
  const turn=++sequence;
  try{
   const reg=await ready;if(turn!==sequence)return;
   if(!reg?.active)throw Error('worker unavailable');
   const token=crypto.randomUUID(),channel=new MessageChannel();
   await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('navigation setup timed out')),2000);
    channel.port1.onmessage=()=>{clearTimeout(timer);channel.port1.close();resolve()};
    reg.active.postMessage({token,key,path:to.pathname},[channel.port2]);
   });
   if(turn!==sequence)return;
   to.searchParams.set('_nznav',token);
  }catch{if(turn!==sequence)return}
  location.assign(to.href);
 });
})();
