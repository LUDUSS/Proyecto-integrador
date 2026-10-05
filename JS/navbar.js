const navbar = document.getElementById("navbar");

navbar.innerHTML=`

  <nav class="navbar navbar-expand-lg nav-custom border-bottom">
    <div class="container-fluid px-lg-5">

      <!-- LOGO Y TÍTULO -->
      <a class="navbar-brand d-flex align-items-center gap-2 brand-ludus" href="./inicio.html">
        <img src="IMAGE/logo_dark.png" alt="Logo LUDUS" class="brand-logo-img logo-dark">
        <img src="IMAGE/logo_light.png" alt="Logo LUDUS" class="brand-logo-img logo-light">
        <span>LUDUS</span>
      </a>

      <!-- BOTÓN RESPONSIVO PARA MÓVILES -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
        aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- CONTENIDO COLAPSABLE -->
      <div class="collapse navbar-collapse" id="navbarContent">
        <!-- Menú Centrado con separación idéntica (gap-3) -->
        <ul class="navbar-nav mx-auto align-items-center gap-3 mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link" href="./inicio.html">Inicio</a>
          </li>
          <li class="nav-item">
            <a class="nav-link text-nowrap" href="./inicio.html#juegosDestacados">Juegos Destacados</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./contactanos.html">Contáctanos</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./acercade.html">Acerca de nosotros</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./perfil.html">Mi perfil</a>
          </li>
        </ul>

        <!-- BOTONES DERECHA -->
        <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <button id="theme-toggle" class="btn btn-outline-secondary btn-sm">
            Modo oscuro
          </button>
          <button class="btn btn-login text-nowrap" type="button">Iniciar sesión</button>
        </div>
      </div>

    </div>
  </nav>
`;

let paginaActual = window.location.pathname.split("/").pop();

console.log(paginaActual)

if (paginaActual === "") {
    paginaActual = "inicio.html";
}

const enlaces = document.querySelectorAll(".nav-link");

enlaces.forEach(enlace => {

    let paginaEnlace = enlace.getAttribute("href");

    paginaEnlace = paginaEnlace.replace("./", "");

    if (paginaEnlace === paginaActual) {
        enlace.classList.add("nav-link-active");
    }

});