(async () => {
  if (!isLoggedIn()) return;
  const L=Ludus, $=id=>document.getElementById(id), list=$('game-list'), browser=$('game-browser'), detail=$('game-detail');
  const params=new URLSearchParams(location.search);
  async function showDetail() {
    browser.classList.add('d-none'); detail.classList.remove('d-none'); L.state(detail,'Cargando juego…');
    try {
      let game, localOnly = false;
      if (params.has('igdbId')) game=await L.igdb('juegos/'+L.id(params.get('igdbId')));
      else {
        // El enlace antiguo identifica una fila MySQL, jamás un ID de IGDB.
        const local=await consumeApi('/ludus/juego/'+L.id(params.get('id')));
        let externalId = null;
        try { externalId = L.id(local.id_api); } catch { /* Identidad histórica no verificable. */ }
        game = {igdbId:externalId, localGameId:local.id_juego, nombre:local.nombre_juego,
          descripcion:local.descripcion, portadaUrl:local.imagen_url,
          generos:local.categoria ? [{nombre:local.categoria}] : [],
          plataformas:local.plataforma ? [{nombre:local.plataforma}] : []};
        localOnly = true;
        if (externalId) {
          try { game=await L.igdb('juegos/'+externalId); localOnly=false; }
          catch(error) { if (![404,502,503,504].includes(error.status)) throw error; }
        }
      }
      detail.replaceChildren(L.link('← Volver al catálogo','./juegos.html','btn btn-link px-0 mb-3'));
      const hero=L.el('section','','game-detail__hero mb-5'), info=L.el('div'); hero.append(L.image(game.portadaUrl,'game-detail__cover'),info);
      info.append(L.el('p','FICHA DEL JUEGO','small text-uppercase fw-semibold text-primary'),L.el('h1',game.nombre,'display-5 fw-bold'),L.el('p',L.metadata(game),'lead text-body-secondary'));
      if(game.descripcion) info.append(L.el('p',game.descripcion,'text-body-secondary'));
      if(game.lanzamiento!=null) info.append(L.el('p','Lanzamiento: '+new Date(game.lanzamiento*1000).toLocaleDateString('es-MX',{timeZone:'UTC'})));
      if(game.ratingIgdb!=null) info.append(L.el('p',`IGDB: ${game.ratingIgdb} / 100`));
      const rating=L.el('p','','fw-semibold text-success'); info.append(rating); detail.append(hero);
      if (localOnly) detail.append(L.el('p','Información local conservada. No se pudo verificar este juego en IGDB; no se habilitan publicaciones nuevas.','alert alert-warning'));
      if (!game.igdbId) return;
      if(game.screenshots?.length) { const shots=L.el('div','','row g-3 mb-4'); for(const shot of game.screenshots) { const cover=L.image(typeof shot==='string'?shot:shot.url,'col-6 col-md-4'); const img=cover.querySelector('img'); if(img) {img.className='img-fluid rounded';img.alt='Captura de '+game.nombre;} shots.append(cover); } detail.append(shots); }
      const row=L.el('section'), left=L.el('div'), right=L.el('div'), reviews=L.el('div'), status=L.el('div'), more=L.button('Cargar más',()=>loadReviews());
      const heading=L.el('div','','game-reviews__heading');heading.append(L.el('h2','Reseñas de jugadores','h3 fw-bold'),right);left.append(heading,reviews,status,more);row.append(left);detail.append(row);
      let ownId=null, own=null, p=0, busy=false, reviewVersion=0;
      const reviewIds=new Set();
      const renderEditor=(show=false)=> { if (!localOnly || own) { const open=L.editor(right,()=>game.igdbId,refresh,own);if(show)open(); } else L.state(right,'Elige un juego verificado desde el catálogo para publicar.'); };
      async function loadReviews(reset=false) {
        if(busy && !reset) return;
        const v=++reviewVersion; busy=true; more.disabled=true;
        if(reset) {p=0;reviews.replaceChildren();reviewIds.clear();} L.state(status,'Cargando reseñas…');
        try { const data=await L.reviews(L.reviewPath(game.igdbId),p); if(v!==reviewVersion)return;
          data.items.forEach(r=> { if(reviewIds.has(String(r.idResenia)))return; reviewIds.add(String(r.idResenia)); reviews.append(L.reviewCard(r,ownId,r=>{own=r;renderEditor(true);},refresh)); });
          p++; more.hidden=!data.hasNext; L.state(status,!reviews.children.length?'Este juego aún no tiene reseñas.':''); }
        catch(e) { if(v===reviewVersion)L.state(status,L.errorText(e),()=>loadReviews(reset)); } finally {if(v===reviewVersion){busy=false;more.disabled=false;}}
      }
      async function refresh() {
        const results=await Promise.allSettled([
          consumeApi(L.reviewPath(game.igdbId)+'/rating').then(r=>{rating.textContent=r.cantidad ? `LUDUS: ${r.promedio} / 5 · ${r.cantidad} reseñas` : 'Sin calificaciones LUDUS';}),
          (async()=>{ const me=await L.me(true); ownId=me.idUsuario; own=await L.ownReview(game.igdbId); renderEditor(); })()
        ]);
        if(results[0].status==='rejected') rating.textContent='No se pudo cargar la calificación LUDUS.';
        if(results[1].status==='rejected') L.state(right,L.errorText(results[1].reason),refresh);
        await loadReviews(true);
      }
      await refresh();
    } catch(e) { L.state(detail,L.errorText(e),showDetail); detail.append(L.link('Volver al catálogo','./juegos.html')); }
  }
  if(params.has('igdbId') || params.has('id')) { await showDetail(); return; }
  const controls=L.el('div','','row g-3 mb-4');
  function select(label,options) {const col=L.el('div','','col-sm-4'), lab=L.el('label',label,'form-label'), s=L.el('select','','form-select');lab.append(s);col.append(lab);controls.append(col);options.forEach(([v,t])=>s.append(new Option(t,v)));return s;}
  const genre=select('Género',[['','Todos']]), platform=select('Plataforma',[['','Todas']]), sort=select('Orden',[['rating','Mejor puntuación IGDB'],['lanzamiento','Lanzamiento'],['nombre','Nombre']]);
  list.before(controls); const status=L.el('div'), more=L.button('Cargar más',()=>load(false)); list.after(status,more); let version=0,p=0,busy=false,timer;
  const gameIds=new Set();
  async function load(reset=true) {
    if(!reset && busy) return; const v=++version; busy=true;more.disabled=true; if(reset) {p=0; list.replaceChildren();gameIds.clear();} const requestedPage=p;
    const nombre=$('game-search').value.trim(); sort.disabled=Boolean(nombre); L.state(status,'Cargando juegos…'); $('game-empty').classList.add('d-none');$('game-no-results').classList.add('d-none');
    try {const data=await L.games({page:requestedPage,size:12,nombre,sort:nombre?'relevancia':sort.value,genreId:genre.value,platformId:platform.value}); if(v!==version) return; if(!Array.isArray(data?.items)) throw new Error('Respuesta de catálogo no válida.'); data.items.forEach(g=>{if(gameIds.has(String(g.igdbId)))return;gameIds.add(String(g.igdbId));list.append(L.gameCard(g));});p=requestedPage+1;more.hidden=!data.hasNext;$('game-count').textContent=`${list.children.length} juegos cargados`;L.state(status,list.children.length?'':'No encontramos juegos con estos criterios.');}
    catch(e) {if(v===version) {more.hidden=true;L.state(status,L.errorText(e),()=>load(reset));}}finally{if(v===version){busy=false;more.disabled=false;}}
  }
  $('game-search').placeholder='Buscar por nombre';
  function schedule() {++version;busy=true;more.disabled=true;clearTimeout(timer);timer=setTimeout(()=>load(),350);}
  $('game-search').addEventListener('input',schedule); [genre,platform,sort].forEach(s=>s.addEventListener('change',schedule));
  async function lookup(kind,select) { try {let page=0;do {const data=await L.igdb(kind+'?page='+page+++'&size=20');if(!Array.isArray(data?.items)) throw new Error('Opciones no válidas.');data.items.forEach(x=>{const value=L.id(x.id);if(![...select.options].some(option=>option.value===value))select.append(new Option(x.nombre,value));});if(!data.hasNext)break;}while(true);}catch(e){const warning=L.el('div',`No se pudieron cargar ${kind}: ${L.errorText(e)}`,'small text-danger');warning.append(L.button('Reintentar',()=>{warning.remove();lookup(kind,select);}));controls.after(warning);} }
  await load(); lookup('generos',genre);lookup('plataformas',platform);
})();
