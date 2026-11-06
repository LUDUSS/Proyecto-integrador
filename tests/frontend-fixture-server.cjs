const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const mock = `<script>
window.__calls=[];window.__errors=[];window.onerror=(m)=>window.__errors.push(String(m));window.onunhandledrejection=e=>window.__errors.push(String(e.reason));
sessionStorage.setItem('ludus_access_token','fixture-token');sessionStorage.setItem('ludus_access_token_expiry',String(Date.now()+600000));sessionStorage.setItem('ludus_session','fixture@example.test');
window.confirm=()=>true;window.alert=m=>window.__alert=m;
window.bootstrap={Modal:{getOrCreateInstance(element){return {show(){element.dispatchEvent(new Event('show.bs.modal'));element.classList.add('show');element.style.display='block';},hide(){element.classList.remove('show');element.style.display='none';element.dispatchEvent(new Event('hidden.bs.modal'));}}}}};
const game={igdbId:42,localGameId:null,nombre:'Juego <seguro>',descripcion:'Descripcion real de prueba',portadaUrl:'https://example.test/cover.png',generos:[{id:1,nombre:'RPG'}],plataformas:[{id:2,nombre:'PC'}],lanzamiento:1609459200,ratingIgdb:90,screenshots:[]};
const me={idUsuario:Number(new URLSearchParams(location.search).get('as'))||7,nombre:'Jugador API',sobreMi:'Biografia API',cantidadResenias:3,juegosResenados:1,promedioCalificacion:4,totalLikes:0};
let own=null;const other={idResenia:9,texto:'Opinion de otro <img src=x onerror=alert(1)>',fechaPublicacion:'2026-11-05T12:30:00',calificacion:4,autor:{idUsuario:8,nombre:'Otro'},juego:game};
window.__forbidden=false;window.__duplicate=false;window.__fail=false;
window.__held=[];
if(new URLSearchParams(location.search).has('paging')) own={...other,idResenia:10,autor:{idUsuario:7,nombre:me.nombre}};
window.fetch=async(url,opts={})=>{
 const u=new URL(url,location.href),p=u.pathname,b=opts.body?JSON.parse(opts.body):null,m=opts.method||'GET';window.__calls.push({path:p,query:u.search,method:m,body:b,headers:opts.headers});
 let data=null,status=200;
 if(opts.headers?.Authorization!=='Bearer fixture-token'){status=401;data={status:401,error:'Se requiere un JWT LUDUS valido'};}
 else if(window.__fail){status=503;data={message:'Servicio no disponible'};}
 else if(p==='/ludus/perfil/me'){if(m==='PUT')Object.assign(me,b);data=me;}
 else if(p.startsWith('/ludus/perfil/')) data={...me,idUsuario:8,nombre:'Otro perfil'};
 else if(p.endsWith('/rating'))data={promedio:own?4.5:4,cantidad:own?2:1};
 else if(p.startsWith('/ludus/igdb/generos')){
   const paging=new URLSearchParams(location.search).has('lookup');
   if(paging&&u.searchParams.get('page')==='1'&&!window.__lookupFailed){window.__lookupFailed=true;status=503;data={status:503,error:'Cuota temporal'};}
   else data={items:[{id:u.searchParams.get('page')==='1'?3:1,nombre:u.searchParams.get('page')==='1'?'Aventura':'RPG'}],page:Number(u.searchParams.get('page')),size:20,hasNext:paging&&u.searchParams.get('page')==='0'};
 }
 else if(p.startsWith('/ludus/igdb/plataformas'))data={items:[{id:2,nombre:'PC'}],page:0,size:20,hasNext:false};
 else if(p==='/ludus/igdb/juegos/42')data=game;
 else if(p==='/ludus/juego/1')data={id_juego:1,id_api:42,nombre_juego:'Juego local',categoria:'RPG',plataforma:'PC',descripcion:'Detalle local',imagen_url:null};
 else if(p==='/ludus/juego/2')data={id_juego:2,id_api:999,nombre_juego:'Historico local',descripcion:'Dato conservado',categoria:'Prueba',plataforma:'PC',imagen_url:null};
 else if(p==='/ludus/juego/3')data={id_juego:3,id_api:null,nombre_juego:'Sin identidad externa',descripcion:null,imagen_url:null};
 else if(p==='/ludus/igdb/juegos'||p==='/ludus/igdb/buscar')data={items:u.searchParams.get('nombre')==='vacio'?[]:u.searchParams.get('page')==='1'?[game,{...game,igdbId:43,nombre:'Pagina siguiente'}]:[game],page:Number(u.searchParams.get('page')),size:12,hasNext:!u.searchParams.get('nombre')&&u.searchParams.get('page')==='0'};
 else if(p==='/ludus/publicacion/igdb/42'){if(own||window.__duplicate){status=409;data={message:'Duplicada'};}else{own={...other,idResenia:10,autor:{idUsuario:7,nombre:me.nombre},...b};status=201;data=own;}}
 else if(p==='/ludus/publicacion/10'){if(window.__conflict){status=409;data={status:409,error:'Conflicto de integridad'};}else if(window.__forbidden){status=403;data={message:'Prohibido'};}else if(m==='DELETE'){own=null;status=204;}else{Object.assign(own,b);data=own;}}
 else if(p.startsWith('/ludus/publicacion/'))data={items:p.includes('/me')?(own?[own]:[]):p.includes('/usuario/')?[other]:[other,...(own?[own]:[])],page:Number(u.searchParams.get('page')),size:20,hasNext:new URLSearchParams(location.search).has('paging')&&u.searchParams.get('page')==='0'};
 else{status=404;data={message:'No encontrado'};}
 const response=new Response(status===204?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Retry-After':'2'}});
 if(window.__hold?.(p,u.searchParams,m))await new Promise(resolve=>window.__held.push({resolve,path:p,query:u.search}));
 return response;
};
</script>`;
const keep = /JS\/(auth|api|ludus|catalogoJuegos|perfilUsuario|resenias|juegosDestacados)\.js/;
http.createServer((req,res)=>{
 try {const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);if(name==='/')name='/tests/frontend-browser.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error();let data=fs.readFileSync(file);if(name.endsWith('.html')&&!name.includes('/tests/')){let s=data.toString('utf8').replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/g,(all,src)=>keep.test(src)?all:'');s=s.replace(/<video[\s\S]*?<\/video>/g,'');s=s.replace('<head>','<head>'+mock);data=s;}res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}
}).listen(5510,'127.0.0.1',()=>console.log('Fixture server http://127.0.0.1:5510'));

