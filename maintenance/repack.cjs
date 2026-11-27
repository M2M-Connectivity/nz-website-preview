// Run: node maintenance/repack.cjs /path/to/source-project < password-input
// Reads password from stdin only. Does not write it into the package.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),z=require('node:zlib'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]||''),dist=path.join(source,'dist');
if(!process.argv[2]||!fs.existsSync(path.join(dist,'index.html')))throw Error('Pass the source project containing dist/index.html');
const password=fs.readFileSync(0,'utf8').trim();if(!password)throw Error('Password required');
const sample=fs.readFileSync(path.join(root,'page.bin')),salt=sample.subarray(0,16),key=crypto.pbkdf2Sync(password,salt,600000,32,'sha256');
function decrypt(data,k){const c=crypto.createDecipheriv('aes-256-gcm',k,data.subarray(16,28));c.setAuthTag(data.subarray(-16));return Buffer.concat([c.update(data.subarray(28,-16)),c.final()]);}
decrypt(sample,key); // Verify the current password before touching any output.
function encrypt(bytes){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([salt,iv,c.update(bytes),c.final(),c.getAuthTag()]);}
const base='/nz-website-preview/';
const mime={'.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};
function dataURL(file){return 'data:'+(mime[path.extname(file)]||'application/octet-stream')+';base64,'+fs.readFileSync(file).toString('base64');}
const assetMap={};for(const file of fs.readdirSync(path.join(dist,'assets')))if(mime[path.extname(file)])assetMap['/assets/'+file]=dataURL(path.join(dist,'assets',file));
function prefix(text){return text.replace(/(["'`])\/(?!\/|assets\/|api\/|nz-website-preview)/g,'$1'+base);}
function css(file){return fs.readFileSync(file,'utf8').replace(/url\(([^)]+)\)/g,(whole,url)=>{url=url.trim().replace(/^["']|["']$/g,'');if(url.startsWith('data:')||url.startsWith('http'))return whole;return `url("${dataURL(path.resolve(path.dirname(file),url))}")`;});}
function js(file){let text=fs.readFileSync(file,'utf8');
 text=text.replace("'/assets/'+asset+'.webp'","window.__previewAssets['/assets/'+asset+'.webp']");
 text=text.replace("'/assets/'+['new-zealand','payments','tracking','devices'][index]+'.webp'","window.__previewAssets['/assets/'+['new-zealand','payments','tracking','devices'][index]+'.webp']");
 text=text.replace(/(["'])(\/assets\/[^"']+\.(?:webp|svg|woff2|png|jpg))\1/g,(_,q,url)=>JSON.stringify(assetMap[url]));
 // API is separately hosted; this static preview must never POST into GitHub Pages.
 if(path.basename(file)==='forms.js')text=text.replace("data.source=location.pathname;","data.source=location.pathname.replace('/nz-website-preview','');").replace("const response=await fetch('/api/enquiries'", "throw new Error('Online enquiries are not connected on this preview. Please email info@m2mone.co.nz or call 0508 888 626. Your details remain in the form.'); const response=await fetch('/api/enquiries'");
 return prefix(text);
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const gate=fs.readFileSync(path.join(root,'index.html'),'utf8');let count=0;
for(const file of walk(dist).filter(p=>p.endsWith('/index.html'))){
 let html=fs.readFileSync(file,'utf8'),scripts=[];
 html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,url)=>{scripts.push(js(path.join(dist,url)));return '';});
 html=html.replace(/<link\b[^>]*>/g,tag=>{const href=tag.match(/href="([^"]+)"/)?.[1];if(!href?.startsWith('/assets/'))return tag;if(tag.includes('rel="stylesheet"'))return '<style>'+css(path.join(dist,href))+'</style>';return tag.replace(href,assetMap[href]||href);});
 html=html.replace(/(src|poster)="(\/assets\/[^\"]+)"/g,(_,attr,url)=>`${attr}="${assetMap[url]}"`);
 html=prefix(html).replace('<head>','<head><meta name="robots" content="noindex,nofollow,noarchive">');
 for(const script of scripts)new (require('node:vm').Script)(script);
 for(const m of html.matchAll(/(?:href|action)="(\/nz-website-preview\/[^"]*)"/g)){const pathname=m[1].split(/[?#]/)[0].slice(base.length);if(pathname==='api/enquiries')continue;const destination=path.join(dist,pathname,pathname.endsWith('/')||!pathname?'index.html':'');if(!fs.existsSync(destination))throw Error('Missing preview destination: '+m[1]);}
 const setup='window.__previewAssets='+JSON.stringify(assetMap)+';';
 html=html.replace('</body>','<script>'+setup+'</script>'+scripts.map(s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>').join('')+'</body>');
 if(/(?:src|href)="\/assets\//.test(html)||html.includes('="undefined"'))throw Error('Unresolved asset: '+file);
 const target=path.join(root,path.relative(dist,file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,gate);const encrypted=encrypt(z.gzipSync(html));fs.writeFileSync(path.join(path.dirname(target),'page.bin'),encrypted);
 if(z.gunzipSync(decrypt(encrypted,key)).toString()!==html)throw Error('Roundtrip failed');count++;
}
const archive=cp.execFileSync('tar',['czf','-','-C',dist,'.'],{maxBuffer:100*1024*1024});fs.writeFileSync(path.join(root,'maintenance/site-source.enc'),encrypt(archive));
const project=cp.execFileSync('git',['-C',source,'archive','--format=tar.gz','HEAD'],{maxBuffer:100*1024*1024});fs.writeFileSync(path.join(root,'maintenance/project-source.enc'),encrypt(project));
if(!decrypt(fs.readFileSync(path.join(root,'maintenance/project-source.enc')),key).equals(project))throw Error('Project archive verification failed');
console.log(`Packaged and verified ${count} encrypted pages plus static and full source archives.`);
