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
  // Estado efímero de controles visibles: nunca se persiste ni sustituye una lectura MySQL.
  const likeEntries = new Map(), pendingLikes = new Set();
  let likeTimer, likeSession = null;
  const sessionToken = () => typeof getAuthToken === 'function' ? getAuthToken() : null;
  function renderLikes(entry) {
    for (const widget of entry.widgets) {
      const value = entry.value;
      widget.count.textContent = value ? String(value.totalLikes) : '—';
      widget.path.setAttribute('fill', value?.likedByMe ? 'currentColor' : 'none');
      widget.button.classList.toggle('ludus-like--active', Boolean(value?.likedByMe));
      widget.button.disabled = !value || !likeSession || entry.busy || entry.reading;
      widget.button.setAttribute('aria-busy', String(entry.busy || entry.reading));
      if (value) widget.button.setAttribute('aria-pressed', String(value.likedByMe));
      else widget.button.removeAttribute('aria-pressed');
      widget.button.setAttribute('aria-label', value
        ? `${value.likedByMe ? 'Quitar' : 'Dar'} like · ${value.totalLikes} likes`
        : 'Likes pendientes de consultar');
      widget.status.textContent = entry.problem;
      widget.retry.hidden = !entry.problem || !likeSession;
      widget.retry.disabled = entry.busy || entry.reading;
    }
  }
  function connectedLikes() {
    const entries = [];
    for (const [key, entry] of likeEntries) {
      for (const widget of entry.widgets) if (!widget.root.isConnected) entry.widgets.delete(widget);
      if (entry.widgets.size) entries.push(entry);
      else if (!entry.busy) { likeEntries.delete(key); pendingLikes.delete(entry); }
    }
    return entries;
  }
  function queueLikes(entry) {
    pendingLikes.add(entry);
    if (!likeTimer) likeTimer = setTimeout(flushLikes, 0);
  }
  function syncLikeSession() {
    const token = sessionToken();
    if (token === likeSession) return false;
    likeSession = token;
    for (const entry of likeEntries.values()) {
      entry.serial++; entry.value = null; entry.busy = false; entry.reading = false;
      entry.uncertain = false; entry.problem = '';
      renderLikes(entry);
      if (token) queueLikes(entry);
    }
    return true;
  }
  function validLike(dto, expectedId) {
    if (!dto || String(dto.idResenia) !== expectedId || !Number.isSafeInteger(dto.totalLikes)
      || dto.totalLikes < 0 || typeof dto.likedByMe !== 'boolean'
      || (dto.likedByMe ? !/^[1-9]\d*$/.test(String(dto.idInteraccion)) : dto.idInteraccion !== null)) {
      throw new Error('El servidor devolvió un estado de likes no válido.');
    }
    return dto;
  }
  const likesError = error => ({
    401:'Tu sesión caducó. Inicia sesión de nuevo.',
    403:'No se pudo modificar el like: permiso denegado.',
    404:'Una reseña ya no está disponible. Actualiza las reseñas.',
    409:'El like cambió en otra solicitud. Se consultará su estado real.'
  }[error.status] || 'No se pudieron actualizar los likes. Intenta de nuevo.');
  async function readLikes(entries, token) {
    const versions = entries.map(entry => {
      entry.reading = true; renderLikes(entry);
      return ++entry.serial;
    });
    const current = (entry, i) => sessionToken() === token && likeSession === token && entry.serial === versions[i];
    try {
      const result = await consumeApi('/ludus/interaccion/resenias?ids=' + entries.map(entry => entry.id).join(','));
      if (!Array.isArray(result) || result.length !== entries.length) throw new Error('Lote de likes incompleto.');
      const byId = new Map(result.map(dto => [String(dto.idResenia), dto]));
      const values = entries.map(entry => validLike(byId.get(entry.id), entry.id));
      entries.forEach((entry, i) => {
        if (!current(entry, i)) return;
        entry.value = values[i]; entry.problem = ''; entry.uncertain = false;
      });
      return true;
    } catch (error) {
      entries.forEach((entry, i) => { if (current(entry, i)) entry.problem = likesError(error); });
      return false;
    } finally {
      entries.forEach((entry, i) => { if (current(entry, i)) {entry.reading = false; renderLikes(entry);} });
      syncLikeSession();
    }
  }
  async function flushLikes() {
    likeTimer = null; syncLikeSession();
    const visible = new Set(connectedLikes());
    const entries = [...pendingLikes].filter(entry => visible.has(entry) && !entry.busy);
    entries.forEach(entry => pendingLikes.delete(entry));
    const token = likeSession;
    if (!token) return;
    // El contrato admite 1..50 IDs por lote. No hay GET por tarjeta ni reintentos de escritura.
    for (let i = 0; i < entries.length; i += 50) {
      if (sessionToken() !== token) {syncLikeSession(); return;}
      await readLikes(entries.slice(i, i + 50), token);
    }
  }
  function refreshLikes() {
    syncLikeSession();
    for (const entry of connectedLikes()) if (!entry.busy) queueLikes(entry);
  }
  function notifyLikes(entry) {
    window.dispatchEvent(new CustomEvent('likes:actualizados', {detail:{idResenia:entry.id, idUsuario:entry.authorId}}));
  }
  async function toggleLike(entry) {
    if (syncLikeSession() || entry.busy || entry.reading || !entry.value || !likeSession) return;
    if (entry.uncertain) {queueLikes(entry); return;}
    const previous = entry.value, token = likeSession;
    entry.busy = true; entry.problem = ''; entry.serial++; pendingLikes.delete(entry); renderLikes(entry);
    let saved = false;
    try {
      const dto = await consumeApi('/ludus/interaccion/resenia/' + entry.id, {method:previous.likedByMe ? 'DELETE' : 'POST'});
      if (sessionToken() !== token || likeSession !== token) {syncLikeSession(); return;}
      saved = true;
      if (!previous.likedByMe) entry.value = validLike(dto, entry.id);
      // DELETE devuelve 204: jamás inferir totalLikes restando uno en cliente.
      const read = await readLikes([entry], token);
      if (sessionToken() === token && likeSession === token) {
        if (!read) {entry.uncertain = true; entry.problem = 'El cambio se guardó, pero no se pudo consultar el contador. Reintenta la lectura.';}
        notifyLikes(entry);
      }
    } catch (error) {
      if (sessionToken() !== token || likeSession !== token) {syncLikeSession(); return;}
      entry.value = previous; entry.problem = likesError(error);
      // Una respuesta perdida o un 409 requieren reconciliar por GET antes de otra escritura.
      if (!error.status || error.status === 409 || saved) {
        entry.uncertain = true;
        const read = await readLikes([entry], token);
        if (sessionToken() === token && likeSession === token) {
          if (read) notifyLikes(entry);
          entry.problem = read ? 'Estado actualizado desde el servidor.' : likesError(error);
        }
      }
    } finally {
      if (sessionToken() === token && likeSession === token) {
        entry.busy = false; renderLikes(entry);
        if (pendingLikes.has(entry)) queueLikes(entry);
      } else syncLikeSession();
    }
  }
  function likeControl(review) {
    syncLikeSession();
    const key = id(review.idResenia);
    let entry = likeEntries.get(key);
    if (!entry) {
      entry = {id:key, authorId:review.autor?.idUsuario, value:null, problem:'', busy:false, reading:false, uncertain:false, serial:0, widgets:new Set()};
      likeEntries.set(key, entry);
    }
    const root = el('div','','ludus-like'), control = button('',()=>toggleLike(entry),'btn ludus-btn ludus-btn--secondary ludus-like__button');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z');
    path.setAttribute('stroke','currentColor'); path.setAttribute('stroke-width','1.7'); svg.append(path);
    const count = el('span','—','ludus-like__count'), status = el('small','','ludus-like__status'); status.setAttribute('role','status');
    const retry = button('Reintentar',()=>queueLikes(entry),'ludus-like__retry');
    control.append(svg,count); root.append(control,status,retry);
    entry.widgets.add({root,button:control,path,count,status,retry}); renderLikes(entry);
    if (likeSession) queueLikes(entry);
    return root;
  }
  window.addEventListener('focus', refreshLikes);
  window.addEventListener('pageshow', refreshLikes);
  window.addEventListener('storage', syncLikeSession);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshLikes();});
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
      body.append(likeControl(r));
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
    footer.append(likeControl(r));
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
  return {el,button,id,query,page,igdb,games,me,profile,profileId,reviewPath,reviews,ownReview,image,link,gameLink,metadata,errorText,state,gameCard,reviewCard,editor,refreshLikes};
})();
