(async () => {
  const L=Ludus, $=id=>document.getElementById(id), list=$('lista-resenias');
  const modal=$('modal-resenia'), form=$('formulario-resenia'), name=$('nombre-juego'), text=$('texto-resenia');
  if(!isLoggedIn()){requireAuth();return;}
  const status=L.el('div');list.after(status);
  const more=L.button('Cargar más',()=>load());status.after(more);
  const formStatus=L.el('p','','text-danger');formStatus.setAttribute('role','status');form.querySelector('.modal-body').append(formStatus);
  $('imagen-juego').closest('.mb-3').hidden=true;
  text.maxLength=10000;text.required=true;name.readOnly=true;
  const submit=form.querySelector('[type="submit"]');submit.className='btn ludus-review-btn ludus-review-btn--primary';
  let me,p=0,busy=false,writing=false,editing=null,reviewVersion=0;
  const reviewIds=new Set(), bs=bootstrap.Modal.getOrCreateInstance(modal);
  try {
    me=await L.me();
    if(L.profileId&&String(L.profileId)!==String(me.idUsuario)){
      $('mis-resenias-titulo').textContent='Reseñas';document.querySelector('[href="#mis-resenias"]').textContent='Reseñas';
    }
  } catch(e){L.state(list,L.errorText(e),()=>location.reload());return;}
  const decimal=L.el('input','','form-control mt-2');decimal.id='review-decimal';decimal.type='number';decimal.min=1;decimal.max=5;decimal.step='any';decimal.required=true;decimal.setAttribute('aria-label','Calificación de 1 a 5');form.querySelector('fieldset').append(decimal);
  function syncStars(){
    form.querySelectorAll('.rate').forEach(label=>{
      const star=label.querySelector('.star'), value=Number(label.querySelector('input').value), filled=value<=Number(decimal.value);
      star.classList.toggle('fas',filled);star.classList.toggle('far',!filled);star.classList.remove('star-over');star.classList.toggle('rate-active',value===Number(decimal.value));
    });
  }
  decimal.oninput=syncStars;
  form.querySelectorAll('[name="calificacion-nueva"]').forEach(r=>r.addEventListener('change',()=>{decimal.value=r.value;syncStars();}));
  function open(review){
    if(!review||String(review.autor?.idUsuario)!==String(me.idUsuario)||writing)return;
    editing=review;form.reset();name.value=review.juego?.nombre || '';text.value=review.texto || '';decimal.value=review.calificacion;formStatus.textContent='';
    form.querySelectorAll('[name="calificacion-nueva"]').forEach(r=>r.checked=Number(r.value)===Number(review.calificacion));syncStars();
    $('modal-resenia-titulo').textContent='Editar reseña';submit.textContent='Guardar cambios';bs.show();
  }
  async function load(reset=false){
    if(busy&&!reset)return;
    const v=++reviewVersion;busy=true;more.disabled=true;
    if(reset){p=0;list.replaceChildren();reviewIds.clear();}L.state(status,'Cargando reseñas…');
    try {
      const own=!L.profileId||String(L.profileId)===String(me.idUsuario);
      const path=own?'/ludus/publicacion/me':'/ludus/publicacion/usuario/'+L.id(L.profileId);
      const data=await L.reviews(path,p);if(v!==reviewVersion)return;
      data.items.forEach(r=>{if(reviewIds.has(String(r.idResenia)))return;reviewIds.add(String(r.idResenia));list.append(L.reviewCard(r,me.idUsuario,open,refresh));});
      p++;more.hidden=!data.hasNext;L.state(status,list.children.length?'':'Todavía no hay reseñas.');
    }catch(e){if(v===reviewVersion)L.state(status,L.errorText(e),()=>load(reset));}
    finally{if(v===reviewVersion){busy=false;more.disabled=false;}}
  }
  async function refresh(){await load(true);window.dispatchEvent(new CustomEvent('resenias:actualizadas'));}
  form.onsubmit=async event=>{
    event.preventDefault();if(writing||!editing||String(editing.autor?.idUsuario)!==String(me.idUsuario))return;
    const texto=text.value.trim(),calificacion=Number(decimal.value);
    if(!texto||texto.length>10000||!Number.isFinite(calificacion)||calificacion<1||calificacion>5){formStatus.textContent='Escribe de 1 a 10000 caracteres y califica de 1 a 5.';return;}
    writing=true;submit.disabled=true;
    try{await consumeApi('/ludus/publicacion/'+L.id(editing.idResenia),{method:'PUT',body:{texto,calificacion}});bs.hide();await refresh();}
    catch(e){formStatus.textContent=e.status===409?e.message:L.errorText(e);}
    finally{writing=false;submit.disabled=false;}
  };
  await load();
})();
