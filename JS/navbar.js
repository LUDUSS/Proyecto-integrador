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

  <!-- Selector de paleta -->
  <div class="dropdown">
    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button"
            id="selector-paleta" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="bi bi-palette-fill" aria-hidden="true"></i>
      <span class="d-none d-md-inline">Tema</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end shadow">
      <li>
        <button class="dropdown-item d-flex align-items-center gap-2" type="button" data-palette-set="neon">
          <span class="paleta-swatch" style="background: linear-gradient(135deg, #7c3aed, #06b6d4);"></span>
          Neón
        </button>
      </li>
      <li>
        <button class="dropdown-item d-flex align-items-center gap-2" type="button" data-palette-set="sunset">
          <span class="paleta-swatch" style="background: linear-gradient(135deg, #f97316, #ec4899);"></span>
          Atardecer
        </button>
      </li>
      <li>
        <button class="dropdown-item d-flex align-items-center gap-2" type="button" data-palette-set="forest">
          <span class="paleta-swatch" style="background: linear-gradient(135deg, #16a34a, #0d9488);"></span>
          Bosque
        </button>
      </li>
      <li>
        <button class="dropdown-item d-flex align-items-center gap-2" type="button" data-palette-set="cyber">
          <span class="paleta-swatch" style="background: linear-gradient(135deg, #e11d48, #8b5cf6);"></span>
          Cyberpunk
        </button>
      </li>
    </ul>
  </div>

  <!-- Modo oscuro -->
  <button id="theme-toggle" class="btn btn-outline-secondary btn-sm" type="button">
    <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
    <span>Modo oscuro</span>
  </button>

  <!-- Login / logout -->
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