const API_URL = "http://localhost:8080/ludus";
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
          <ul class="navbar-nav mx-auto align-items-center gap-2 mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="./index.html">Inicio</a></li>
            ${currentUser ? '<li class="nav-item"><a class="nav-link text-nowrap" href="./juegos.html">Juegos</a></li>' : ''}
            <li class="nav-item"><a class="nav-link" href="./contactanos.html">Contáctanos</a></li>
            <li class="nav-item"><a class="nav-link" href="./acercade.html">Acerca de nosotros</a></li>
            ${currentUser ? '<li class="nav-item"><a class="nav-link" href="./perfil.html" id="nav-mi-perfil-link">Mi perfil</a></li>' : ''}
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

            <!-- Login / logout y Registro -->
            ${currentUser
              ? `<span id="nav-greeting" class="small text-body-secondary d-none d-xl-inline">Hola</span>
                 <button id="auth-action" class="btn btn-login text-nowrap" type="button">Cerrar sesión</button>`
              : `<a class="btn btn-login text-nowrap" href="./login.html">Iniciar sesión</a>
                 <a class="btn btn-outline-secondary text-nowrap" href="./registro.html">Crear cuenta</a>`}
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

  // Inicializar buscador de usuarios si el usuario inició sesión
  if (currentUser) {
    inicializarBuscadorNavbar();
    sincronizarUsuarioBackend(currentUser);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

/**
 * Conecta el buscador de la navbar con el endpoint de búsqueda en Spring Boot.
 */
function inicializarBuscadorNavbar() {
  const buscarInput = document.getElementById("navbar-buscar-input");
  const resultadosMenu = document.getElementById("navbar-buscar-resultados");

  if (!buscarInput || !resultadosMenu) return;

  let debounceTimer = null;

  buscarInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = buscarInput.value.trim();

    if (!query) {
      resultadosMenu.style.display = "none";
      resultadosMenu.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`${API_URL}/usuario/buscar?q=${encodeURIComponent(query)}`);
        if (!resp.ok) throw new Error("Error en la búsqueda");
        const usuarios = await resp.json();

        resultadosMenu.innerHTML = "";

        if (!usuarios || usuarios.length === 0) {
          resultadosMenu.innerHTML = `
            <li class="px-3 py-2 text-center text-body-secondary small">
              <i class="bi bi-search me-1"></i> No se encontraron jugadores
            </li>`;
        } else {
          usuarios.forEach((user) => {
            const li = document.createElement("li");
            const juegoTexto = user.juego_activo
              ? `<small class="text-success text-truncate d-block"><i class="bi bi-controller me-1"></i>${escapeHtml(user.juego_activo)}</small>`
              : '<small class="text-body-secondary text-truncate d-block">Perfil de jugador</small>';

            li.innerHTML = `
              <a class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded" href="./perfil.html?id=${user.id_usuario}">
                <i class="bi bi-person-circle fs-5 text-primary" aria-hidden="true"></i>
                <div class="text-truncate">
                  <div class="fw-semibold text-truncate">${escapeHtml(user.nombre)}</div>
                  ${juegoTexto}
                </div>
              </a>`;
            resultadosMenu.appendChild(li);
          });
        }

        resultadosMenu.style.display = "block";
      } catch (err) {
        console.warn("No se pudo conectar con el servidor de búsqueda:", err);
      }
    }, 250);
  });

  // Cerrar el menú si se hace clic fuera del buscador
  document.addEventListener("click", (e) => {
    if (!buscarInput.contains(e.target) && !resultadosMenu.contains(e.target)) {
      resultadosMenu.style.display = "none";
    }
  });

  // Reabrir al hacer foco si ya hay texto
  buscarInput.addEventListener("focus", () => {
    if (buscarInput.value.trim() && resultadosMenu.children.length > 0) {
      resultadosMenu.style.display = "block";
    }
  });
}

/**
 * Sincroniza al usuario autenticado con MySQL a través de Spring Boot.
 * Garantiza que siempre tengamos su ID numérico de BD disponible en sessionStorage.
 */
async function sincronizarUsuarioBackend(currentUser) {
  try {
    const usuarios = await getApiUsers();
    const correoActual = currentUser.email.trim().toLowerCase();
    const data = usuarios.find((usuario) =>
      usuario && typeof usuario.correo === "string"
      && usuario.correo.trim().toLowerCase() === correoActual
    );

    if (data) {
      actualizarSaludoNavbar(data.nombre, currentUser);
      if (data.id_usuario) {
        sessionStorage.setItem("ludus_id_usuario", String(data.id_usuario));
        return data.id_usuario;
      }
    }

    // Si aún no está en la base de datos de MySQL, lo registramos para que se pueda interactuar
    const nuevoUsuario = {
      nombre: currentUser.name,
      correo: currentUser.email,
      contrasenia: "LudusPass2026*",
      telefono: "5551234567",
      sobre_mi: "¡Hola! Estoy jugando en LUDUS.",
      perfil_publico: true,
      juego_activo: ""
    };

    const regResp = await fetch(`${API_URL}/usuario/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoUsuario)
    });

    if (regResp.ok) {
      const creado = await regResp.json();
      actualizarSaludoNavbar(creado && creado.nombre, currentUser);
      if (creado && creado.id_usuario) {
        sessionStorage.setItem("ludus_id_usuario", String(creado.id_usuario));
        return creado.id_usuario;
      }
    }
  } catch (error) {
    console.warn("Aviso de sincronización con Spring Boot:", error);
  }
  return null;
}

function actualizarSaludoNavbar(nombre, currentUser) {
  const saludo = document.getElementById("nav-greeting");
  if (!saludo) return;

  const correo = currentUser.email.trim().toLowerCase();
  const nombreValido = [nombre, currentUser.name].find((candidato) =>
    typeof candidato === "string"
    && candidato.trim()
    && candidato.trim().toLowerCase() !== correo
  );
  if (nombreValido) saludo.textContent = `Hola, ${nombreValido.trim()}`;
}

const boton = document.getElementById("registrate");
if (boton) {
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  boton.innerHTML = `
  <div class="d-flex gap-2">
            <a class="btn btn-primary px-4 py-2" href="#juegosDestacados">Explorar juegos</a>
            ${currentUser ? '' : '<a id= "registrate" class="btn ludus-btn ludus-btn--secondary px-4 py-2" href="./registro.html">Crear cuenta</a>'}
          </div>
        </div>
        `;}