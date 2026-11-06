/* Servicios compartidos: todas las identidades y escrituras proceden de LUDUS. */
const Ludus = (() => {
  const el = (tag, text = '', cls = '') => { const n = document.createElement(tag); n.textContent = text; n.className = cls; return n; };
  const button = (text, action, cls = 'btn ludus-btn ludus-btn--secondary') => { const b = el('button', text, cls); b.type = 'button'; b.onclick = event => action(event); return b; };
  const id = value => { if (!/^[1-9]\d*$/.test(String(value))) throw new Error('Identificador no válido.'); return String(value); };
  const query = params => new URLSearchParams(Object.entries(params).filter(([,v]) => v !== '' && v != null)).toString();
  const page = async path => { const data = await consumeApi(path); if (!Array.isArray(data?.items) || typeof data.hasNext !== 'boolean') throw new Error('Respuesta paginada no válida.'); return data; };
  let queue = Promise.resolve(), last = 0;
  // Serializa IGDB y espacia inicios para respetar el límite incluso con lookups.
  const igdb = path => { const request = queue.then(async () => { await new Promise(r => setTimeout(r, Math.max(0, 280 - (Date.now() - last)))); last = Date.now(); return consumeApi('/ludus/igdb/' + path); }); queue = request.catch(() => {}); return request; };
  const games = params => igdb((params.nombre ? 'buscar?' : 'juegos?') + query(params));
  let mePromise;
  const me = (fresh = false) => { if (fresh || !mePromise) mePromise = consumeApi('/ludus/perfil/me').catch(e => { mePromise = null; throw e; }); return mePromise; };
  const profileId = new URLSearchParams(location.search).get('idUsuario');
  const profile = () => profileId ? consumeApi('/ludus/perfil/' + id(profileId)) : me(true);
  const reviewPath = igdbId => '/ludus/publicacion/juego/igdb/' + id(igdbId);
  const reviews = (path, p = 0, size = 20) => page(path + '?' + query({page:p,size}));
  const ownReview = async igdbId => {
    let p = 0;
    do {
      const data = await reviews('/ludus/publicacion/me',p++);
      const found = data.items.find(r => String(r.juego?.igdbId) === String(igdbId));
      if (found || !data.hasNext) return found || null;
    } while (true);
  };
  const image = (url, cls = '') => {
    const wrap = el('div', '', cls), fallback = () => wrap.replaceChildren(el('i', '', 'bi bi-controller'));
    try { const u = new URL(url?.startsWith('//') ? 'https:' + url : url); if (u.protocol !== 'https:') throw new Error(); const img = el('img'); img.src = u.href; img.alt = 'Portada del videojuego'; img.loading = 'lazy'; img.onerror = fallback; wrap.append(img); } catch { fallback(); } return wrap;
  };
  const link = (text, href, cls = '') => { const a = el('a', text, cls); a.href = href; return a; };
  const gameLink = game => './juegos.html?igdbId=' + id(game.igdbId);
  const metadata = game => [...(game.generos || []), ...(game.plataformas || [])].map(x => x.nombre).join(' · ');
  const errorText = e => ({403:'No tienes permiso para realizar esta acción.',404:'No se encontró el recurso.',409:'Ya tienes una reseña de este juego. Puedes editarla o eliminarla.',502:'IGDB no está disponible. Intenta más tarde.',503:'Servicio temporalmente no disponible. Intenta más tarde.',504:'IGDB tardó demasiado. Intenta más tarde.'}[e.status] || e.message || 'No se pudo conectar con LUDUS.');
  const state = (host, text, retry) => { host.replaceChildren(el('p', text, 'text-body-secondary')); host.setAttribute('role','status'); if (retry) host.append(button('Reintentar', retry)); };
  function gameCard(game, home = false) {
    const col = el('div','','col'), card = el('article','',home ? 'card h-100 border-0 shadow-sm rounded-3 bg-body-tertiary' : 'card h-100 border-0 shadow-sm game-card');
    const cover = image(game.portadaUrl, home ? 'p-2' : 'game-card__cover'); if (home) { cover.style.minHeight='220px'; const img = cover.querySelector('img'); if (img) { img.className='card-img-top rounded-3'; img.style.cssText='height:220px;object-fit:cover'; } }
    card.append(cover); const body = el('div','','card-body d-flex flex-column'); body.append(el('h3',game.nombre,'h5 card-title fw-bold'),el('p',metadata(game),'small text-body-secondary'),link('Ver juego',gameLink(game),'btn ludus-btn ludus-btn--primary mt-auto')); card.append(body); col.append(card); return col;
  }
  function reviewCard(r, ownId, edit, refresh, home = false) {
    // El inicio conserva sus tarjetas; ficha y perfil comparten el componente compacto.
    if (home) {
      const card=el('article','','card h-100'), header=el('div','','card-header header-red'), body=el('div','','card-body');
      header.append(el('div',(r.autor?.nombre || 'J').slice(0,1),'avatar'));
      if(r.juego?.igdbId) body.append(link(r.juego.nombre,gameLink(r.juego),'h5 card-name'));
      if(r.autor?.idUsuario) body.append(link(r.autor.nombre,'./perfil.html?idUsuario='+id(r.autor.idUsuario),'d-block top-tag'));
      body.append(el('p',r.texto?.length>180?r.texto.slice(0,180)+'…':r.texto,'card-text'),el('p',`${r.calificacion} / 5 LUDUS`));
      if(r.fechaPublicacion) body.append(el('small',new Date(r.fechaPublicacion).toLocaleDateString('es-MX'),'text-body-secondary'));
      card.append(header,body); return card;
    }
    const profileView=Boolean(document.getElementById('lista-resenias'));
    const card=el('article','','ludus-review'+(profileView?' ludus-review--profile':' game-review'));
    if(profileView) card.append(image(r.juego?.portadaUrl,'ludus-review__cover'));
    const content=el('div','','ludus-review__content'), header=el('header','','ludus-review__header'), identity=el('div','','ludus-review__identity');
    if(r.juego?.igdbId) identity.append(link(r.juego.nombre,gameLink(r.juego),'ludus-review__title'));
    if(r.autor?.idUsuario) identity.append(link(r.autor.nombre,'./perfil.html?idUsuario='+id(r.autor.idUsuario),'ludus-review__author'));
    const score=el('span','','ludus-review__score'), star=el('span','★','ludus-review__star');star.setAttribute('aria-hidden','true');
    score.setAttribute('aria-label',`Calificación LUDUS: ${r.calificacion} de 5`);
    score.append(star,el('strong',String(r.calificacion)),el('span','/ 5 LUDUS')); header.append(identity,score);
    const body=el('div','','ludus-review__body'), text=el('p',r.texto,'ludus-review__text');body.append(text);
    if(r.texto?.length>400){
      text.textContent=r.texto.slice(0,400)+'…';
      const expand=button('Ver más',()=>{const full=expand.getAttribute('aria-expanded')!=='true';text.textContent=full?r.texto:r.texto.slice(0,400)+'…';expand.textContent=full?'Ver menos':'Ver más';expand.setAttribute('aria-expanded',String(full));},'ludus-review__expand');
      expand.setAttribute('aria-expanded','false');body.append(expand);
    }
    const footer=el('footer','','ludus-review__footer');
    if(r.fechaPublicacion){const date=el('time',new Date(r.fechaPublicacion).toLocaleDateString('es-MX'),'ludus-review__date');date.dateTime=r.fechaPublicacion;footer.append(date);}
    if(ownId!=null&&String(r.autor?.idUsuario)===String(ownId)){
      const actions=el('div','','ludus-review__actions');actions.setAttribute('aria-label','Acciones de reseña');
      actions.append(button('Editar',()=>edit(r),'btn ludus-review-btn ludus-review-btn--secondary'),button('Eliminar',async event=>{
        if(!confirm('¿Eliminar esta reseña?'))return;
        const target=event.currentTarget;target.disabled=true;
        try{await consumeApi('/ludus/publicacion/'+id(r.idResenia),{method:'DELETE'});await refresh();}
        catch(e){alert(e.status===409?`No se pudo eliminar la reseña: ${e.message}`:errorText(e));}
        finally{target.disabled=false;}
      },'btn ludus-review-btn ludus-review-btn--danger'));footer.append(actions);
    }
    content.append(header,body,footer);card.append(content);return card;
  }
  function editor(host, getGame, refresh, existing = null) {
    const previous=host.querySelector('.modal');
    if(previous) bootstrap.Modal.getInstance?.(previous)?.dispose();
    host.replaceChildren();
    const launcher=button(existing?'Editar mi reseña':'Escribe una reseña',()=>modal.show(),'btn ludus-review-btn ludus-review-btn--primary');
    const modalElement=el('div','','modal fade ludus-review-modal');modalElement.id='game-review-modal';modalElement.tabIndex=-1;modalElement.setAttribute('aria-labelledby','game-review-modal-title');modalElement.setAttribute('aria-hidden','true');
    const dialog=el('div','','modal-dialog modal-dialog-centered modal-dialog-scrollable');
    const form=el('form','','modal-content'), header=el('div','','modal-header'), body=el('div','','modal-body'), footer=el('div','','modal-footer');
    const title=el('h2',existing ? 'Editar reseña' : 'Escribe una reseña','modal-title fs-5');title.id='game-review-modal-title';
    const close=button('',()=>modal.hide(),'btn-close');close.setAttribute('aria-label','Cerrar');header.append(title,close);
    dialog.append(form);modalElement.append(dialog);host.append(launcher,modalElement);
    const modal=bootstrap.Modal.getOrCreateInstance(modalElement);
    const rating=el('input','','form-control mb-3'); rating.type='number'; rating.min=1; rating.max=5; rating.step='any'; rating.required=true; rating.value=existing?.calificacion || 5;
    const text=el('textarea','','form-control mb-3'); text.rows=5; text.required=true; text.maxLength=10000; text.value=existing?.texto || '';
    const ratingLabel=el('label','Calificación (1 a 5)','form-label'); ratingLabel.append(rating); const textLabel=el('label','Tu opinión','form-label'); textLabel.append(text);
    const status=el('p','','text-danger'), submit=el('button',existing ? 'Guardar cambios' : 'Publicar reseña','btn ludus-review-btn ludus-review-btn--primary'); submit.type='submit';
    status.setAttribute('role','status');
    const cancel=button('Cancelar',()=>modal.hide(),'btn ludus-review-btn ludus-review-btn--secondary');
    body.append(ratingLabel,textLabel,status);footer.append(cancel,submit);form.append(header,body,footer);let busy=false;
    async function dismiss() {
      if(!modalElement.classList.contains('show'))return;
      await new Promise(resolve=>{modalElement.addEventListener('hidden.bs.modal',resolve,{once:true});modal.hide();});
    }
    form.onsubmit=async event => { event.preventDefault(); if(busy) return; const texto=text.value.trim(), calificacion=Number(rating.value); if (!texto || texto.length>10000 || !Number.isFinite(calificacion) || calificacion<1 || calificacion>5) { status.textContent='Escribe entre 1 y 10000 caracteres y una calificación de 1 a 5.'; return; }
      busy=true; submit.disabled=true;
      try { await consumeApi(existing ? '/ludus/publicacion/'+id(existing.idResenia) : '/ludus/publicacion/igdb/'+id(getGame()),{method:existing?'PUT':'POST',body:{texto,calificacion}}); await dismiss(); await refresh(); }
      catch(e) { status.textContent=existing && e.status===409 ? e.message : errorText(e); if(!existing && e.status===409) { await dismiss(); await refresh(); const notice=el('p',errorText(e),'alert alert-warning'); host.prepend(notice); } }
      finally { busy=false; submit.disabled=false; }
    };
    return ()=>{modal.show();text.focus();};
  }
  return {el,button,id,query,page,igdb,games,me,profile,profileId,reviewPath,reviews,ownReview,image,link,gameLink,metadata,errorText,state,gameCard,reviewCard,editor};
})();
