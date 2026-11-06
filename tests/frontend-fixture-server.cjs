const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const mock = `<script>
window.__calls=[];window.__errors=[];window.onerror=(m)=>window.__errors.push(String(m));window.onunhandledrejection=e=>window.__errors.push(String(e.reason));
sessionStorage.setItem('ludus_access_token','fixture-token'+(new URLSearchParams(location.search).get('as')?'-'+new URLSearchParams(location.search).get('as'):''));sessionStorage.setItem('ludus_access_token_expiry',String(Date.now()+600000));sessionStorage.setItem('ludus_session','fixture@example.test');
const fixtureFetch=window.fetch.bind(window);
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
 const actor=Number(opts.headers?.Authorization?.match(/^Bearer fixture-token-(\\d+)$/)?.[1])||7;
 if(!/^Bearer fixture-token(?:-\\d+)?$/.test(opts.headers?.Authorization||'')){status=401;data={status:401,error:'Se requiere un JWT LUDUS valido'};}
 else if(window.__fail){status=503;data={message:'Servicio no disponible'};}
 else if(p.startsWith('/ludus/interaccion/')){
   const failure=window.__likeFailure?.method===m?window.__likeFailure:null;
   if(!failure||failure.commit){const reply=await fixtureFetch('/__fixture'+p+u.search,opts);status=reply.status;data=status===204?null:await reply.json();}
   if(failure){if(failure.status===0)throw new TypeError('Failed to fetch');status=failure.status;data={status,error:'Error de likes de prueba'};}
 }
 else if(p==='/ludus/perfil/me'){if(m==='PUT')Object.assign(me,b);const stats=await (await fixtureFetch('/__fixture/profile-likes/'+actor)).json();data={...me,idUsuario:actor,totalLikes:stats.totalLikes};}
 else if(p.startsWith('/ludus/perfil/')){const stats=await (await fixtureFetch('/__fixture/profile-likes/8')).json();data={...me,idUsuario:8,nombre:'Otro perfil',totalLikes:stats.totalLikes};}
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
 else if(p==='/ludus/publicacion/10'){if(window.__conflict){status=409;data={status:409,error:'Conflicto de integridad'};}else if(window.__forbidden){status=403;data={message:'Prohibido'};}else if(m==='DELETE'){own=null;status=204;await fixtureFetch('/__fixture/review/10',{method:'DELETE'});}else{Object.assign(own,b);data=own;}}
 else if(p.startsWith('/ludus/publicacion/'))data={items:p.includes('/me')?(own?[own]:[]):p.includes('/usuario/')?[other]:[other,...(own?[own]:[])],page:Number(u.searchParams.get('page')),size:20,hasNext:new URLSearchParams(location.search).has('paging')&&u.searchParams.get('page')==='0'};
 else{status=404;data={message:'No encontrado'};}
 const response=new Response(status===204?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Retry-After':'2'}});
 if(window.__hold?.(p,u.searchParams,m))await new Promise(resolve=>window.__held.push({resolve,path:p,query:u.search}));
 return response;
};
</script>`;
const keep = /JS\/(auth|api|ludus|catalogoJuegos|perfilUsuario|resenias|juegosDestacados)\.js/;
// Backend simulado en memoria: persiste entre documentos, nunca usa MySQL/localStorage.
let interactionId=100;
const fixtureReviews=new Map([[9,8],[10,7]]), fixtureLikes=new Map();
function likeState(review,user){const rows=[...fixtureLikes.values()].filter(x=>x.review===review);const mine=rows.find(x=>x.user===user);return {idResenia:review,totalLikes:rows.length,likedByMe:!!mine,idInteraccion:mine?.id??null};}
http.createServer(async(req,res)=>{
 const fixtureUrl=new URL(req.url,'http://localhost');
 if(fixtureUrl.pathname.startsWith('/__fixture')){
   const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(status===204?'':JSON.stringify(data));};
   if(fixtureUrl.pathname==='/__fixture/reset'){
     let body='';for await(const chunk of req)body+=chunk;
     const seed=body?JSON.parse(body):{};fixtureLikes.clear();fixtureReviews.clear();fixtureReviews.set(9,8);fixtureReviews.set(10,7);
     (seed.reviews||[]).forEach(x=>fixtureReviews.set(x.id,x.author||8));
     (seed.likes||[]).forEach(x=>fixtureLikes.set(x.user+':'+x.review,{...x,id:interactionId++}));send(200,{ok:true});return;
   }
   if(fixtureUrl.pathname.startsWith('/__fixture/profile-likes/')){const author=Number(fixtureUrl.pathname.split('/').pop());send(200,{totalLikes:[...fixtureLikes.values()].filter(x=>fixtureReviews.get(x.review)===author).length});return;}
   if(fixtureUrl.pathname==='/__fixture/review/10'){for(const [key,row] of fixtureLikes)if(row.review===10)fixtureLikes.delete(key);send(204);return;}
   const token=req.headers.authorization?.match(/^Bearer fixture-token(?:-(\d+))?$/);
   if(!token){send(401,{status:401,error:'JWT de prueba requerido'});return;}
   const user=Number(token[1])||7;
   if(fixtureUrl.pathname==='/__fixture/ludus/interaccion/resenias'){
     const ids=(fixtureUrl.searchParams.get('ids')||'').split(',').map(Number);
     if(ids.length>50||ids.some(x=>!Number.isInteger(x)||x<1)){send(400,{status:400,error:'IDs invalidos'});return;}
     if(ids.some(x=>!fixtureReviews.has(x))){send(404,{status:404,error:'Reseña inexistente'});return;}
     send(200,[...new Set(ids)].map(review=>likeState(review,user)));return;
   }
   const match=fixtureUrl.pathname.match(/^\/__fixture\/ludus\/interaccion\/resenia\/(\d+)$/);
   if(match){
     const review=Number(match[1]), key=user+':'+review;
     if(!fixtureReviews.has(review)){send(404,{status:404,error:'Reseña inexistente'});return;}
     if(req.method==='POST'){if(fixtureLikes.has(key)){send(409,{status:409,error:'Ya diste like a esta resena'});return;}fixtureLikes.set(key,{review,user,id:interactionId++});send(201,likeState(review,user));return;}
     if(req.method==='DELETE'){fixtureLikes.delete(key);send(204);return;}
     send(200,likeState(review,user));return;
   }
   send(404,{status:404,error:'Ruta de prueba inexistente'});return;
 }
 try {const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);if(name==='/')name='/tests/frontend-browser.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error();let data=fs.readFileSync(file);if(name.endsWith('.html')&&!name.includes('/tests/')){let s=data.toString('utf8').replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/g,(all,src)=>keep.test(src)?all:'');s=s.replace(/<video[\s\S]*?<\/video>/g,'');s=s.replace('<head>','<head>'+mock);data=s;}res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}
}).listen(5510,'127.0.0.1',()=>console.log('Fixture server http://127.0.0.1:5510'));

