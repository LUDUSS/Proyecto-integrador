const navbar = document.getElementById("navbar");

if (navbar) {
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  navbar.innerHTML = `
    <nav class="navbar navbar-expand-lg nav-custom border-bottom">
      <div class="container-fluid px-lg-5">
        <a class="navbar-brand d-flex align-items-center gap-2 brand-ludus" href="./index.html">
          <img src="IMAGE/logo_dark.png" alt="Logo LUDUS" class="brand-logo-img logo-dark">
          <img src="IMAGE/logo_light.png" alt="Logo LUDUS" class="brand-logo-img logo-light">                                                                                                                                         
          <span>LUDUS</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
          aria-controls="navbarContent" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="navbar-nav mx-auto align-items-center gap-3 mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="./index.html">Inicio</a></li>
            ${currentUser ? '<li class="nav-item"><a class="nav-link text-nowrap">Juegos</a></li>' : ''}
            <li class="nav-item"><a class="nav-link" href="./contactanos.html">Contáctanos</a></li>
            <li class="nav-item"><a class="nav-link" href="./acercade.html">Acerca de nosotros</a></li>
            ${currentUser ? '<li class="nav-item"><a class="nav-link" href="./perfil.html">Mi perfil</a></li>' : ''}
          </ul>

          <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
            <button id="theme-toggle" class="btn btn-outline-secondary btn-sm" type="button">
              <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
              <span>Modo oscuro</span>
            </button>
            ${currentUser
              ? `<span class="small text-body-secondary d-none d-xl-inline">Hola, ${escapeHtml(currentUser.name)}</span>
                 <button id="auth-action" class="btn btn-login text-nowrap" type="button">Cerrar sesión</button>`
              : '<a class="btn btn-login text-nowrap" href="./login.html">Iniciar sesión</a>'}
          </div>
        </div>
      </div>
    </nav>
  `;
  

  const pageName = window.location.pathname.split("/").pop() || "index.html";
  navbar.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.split("#")[0].replace(/^\.\//, "") === pageName) {
      link.classList.add("nav-link-active");
    }
  });

  const authAction = document.getElementById("auth-action");
  if (authAction) authAction.addEventListener("click", logoutUser);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}


  const boton = document.getElementById("registrate");

  if (boton) {
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : boton;

  boton.innerHTML = `
  <div class="d-flex gap-2">
            <a class="btn btn-primary px-4 py-2" href="#juegosDestacados">Explorar juegos</a>
            ${currentUser ? '' : '<a id= "registrate" class="btn btn-outline-secondary px-4 py-2" href="./registro.html">Crear cuenta</a>'}
          </div>
        </div>
        `;}