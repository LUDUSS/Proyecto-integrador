/**
 * juegosDestacados.js — Carrusel dinámico de juegos destacados para index.html
 * Carga los videojuegos directamente desde la base de datos MySQL (/ludus/juego/).
 */

// Lista de respaldo con los juegos registrados en la base de datos (garantiza que nunca se muestre vacío)
const JUEGOS_BASE_DATOS_RESPALDO = [
  { id_juego: 1, nombre_juego: "God of War", categoria: "Acción", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/header.jpg" },
  { id_juego: 2, nombre_juego: "The Witcher 3", categoria: "RPG", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg" },
  { id_juego: 3, nombre_juego: "Red Dead Redemption 2", categoria: "Aventura", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg" },
  { id_juego: 4, nombre_juego: "Grand Theft Auto V", categoria: "Acción", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg" },
  { id_juego: 5, nombre_juego: "Elden Ring", categoria: "RPG", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg" },
  { id_juego: 6, nombre_juego: "Cyberpunk 2077", categoria: "RPG", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg" },
  { id_juego: 7, nombre_juego: "Hogwarts Legacy", categoria: "Aventura", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/990080/header.jpg" },
  { id_juego: 8, nombre_juego: "Resident Evil 4", categoria: "Terror", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/header.jpg" },
  { id_juego: 9, nombre_juego: "Minecraft", categoria: "Sandbox", plataforma: "PC / Mobile / Consolas", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/header.jpg" },
  { id_juego: 10, nombre_juego: "Assassins Creed Valhalla", categoria: "Acción", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/2208920/header.jpg" },
  { id_juego: 11, nombre_juego: "Spider-Man Remastered", categoria: "Acción", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/header.jpg" },
  { id_juego: 12, nombre_juego: "Days Gone", categoria: "Supervivencia", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1259420/header.jpg" },
  { id_juego: 13, nombre_juego: "Horizon Zero Dawn", categoria: "Acción", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/header.jpg" },
  { id_juego: 14, nombre_juego: "Doom Eternal", categoria: "Shooter", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/782330/header.jpg" },
  { id_juego: 15, nombre_juego: "Sekiro Shadows Die Twice", categoria: "Acción", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/814380/header.jpg" },
  { id_juego: 16, nombre_juego: "Forza Horizon 5", categoria: "Carreras", plataforma: "PC / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg" },
  { id_juego: 17, nombre_juego: "FIFA 23", categoria: "Deportes", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1811260/header.jpg" },
  { id_juego: 18, nombre_juego: "Call of Duty Modern Warfare III", categoria: "Shooter", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/2519060/header.jpg" },
  { id_juego: 19, nombre_juego: "Starfield", categoria: "RPG", plataforma: "PC / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg" },
  { id_juego: 20, nombre_juego: "Baldurs Gate 3", categoria: "RPG", plataforma: "PC / PlayStation / Xbox", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg" },
  { id_juego: 21, nombre_juego: "Hades", categoria: "Acción", plataforma: "PC / Consolas", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/header.jpg" },
  { id_juego: 22, nombre_juego: "Ghost of Tsushima", categoria: "Acción", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/header.jpg" },
  { id_juego: 26, nombre_juego: "God of War Ragnarök", categoria: "Acción", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/header.jpg" },
  { id_juego: 31, nombre_juego: "Helldivers 2", categoria: "Shooter", plataforma: "PC / PlayStation", imagen_url: "https://cdn.cloudflare.steamstatic.com/steam/apps/553850/header.jpg" }
];

const imagenRespaldo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 200 130'><rect width='100%' height='100%' fill='%231f242d'/><text x='50%' y='50%' fill='%236c757d' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'>LUDUS GAME</text></svg>";

async function cargarJuegosDestacados() {
  const contenedor = document.getElementById("container-juegos-destacados");
  if (!contenedor) return;

  let listaJuegos = [];

  try {
    let response = null;
    if (typeof consumeApi === "function") {
      response = await consumeApi("/ludus/juego/", { auth: false }).catch(() => null);
    }
    if (!response) {
      const resp = await fetch("https://backend-ludus.onrender.com/ludus/juego/");
      if (resp.ok) response = await resp.json();
    }

    if (Array.isArray(response) && response.length > 0) {
      listaJuegos = response;
    } else if (response && Array.isArray(response.items) && response.items.length > 0) {
      listaJuegos = response.items;
    } else {
      listaJuegos = JUEGOS_BASE_DATOS_RESPALDO;
    }
  } catch (error) {
    console.warn("Usando lista local de respaldo para juegos destacados:", error);
    listaJuegos = JUEGOS_BASE_DATOS_RESPALDO;
  }

  // Filtrar juegos con datos básicos válidos
  listaJuegos = listaJuegos.filter(j => j && (j.nombre_juego || j.nombre));

  contenedor.innerHTML = "";

  // 4 tarjetas por slide en pantallas grandes
  const itemsPorSlide = 4;
  const totalSlides = Math.ceil(listaJuegos.length / itemsPorSlide);

  for (let i = 0; i < totalSlides; i++) {
    const slide = document.createElement("div");
    slide.classList.add("carousel-item");
    if (i === 0) slide.classList.add("active");

    const row = document.createElement("div");
    row.className = "row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4 px-5";

    const grupo = listaJuegos.slice(i * itemsPorSlide, (i + 1) * itemsPorSlide);

    grupo.forEach((juego) => {
      const idJuego = juego.id_juego || juego.id || juego.localGameId || "";
      const nombre = juego.nombre_juego || juego.nombre || "Videojuego";
      const categoria = juego.categoria || "General";
      const plataforma = juego.plataforma || "Multiplataforma";
      const srcImagen = (juego.imagen_url && juego.imagen_url.trim()) || imagenRespaldo;

      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <a href="./juegos.html?id=${idJuego}" class="text-decoration-none">
          <div class="card h-100 border-0 shadow-sm rounded-4 bg-body-tertiary transition-card overflow-hidden">
            <div class="overflow-hidden position-relative">
              <img src="${srcImagen}" class="card-img-top object-fit-cover" 
                   alt="${nombre}"
                   loading="lazy"
                   style="height: 180px; width: 100%; transition: transform 0.3s ease;"
                   onerror="this.src='${imagenRespaldo}'">
              <span class="badge bg-dark bg-opacity-75 text-light position-absolute top-0 end-0 m-2 px-2 py-1 small rounded-pill">
                ${categoria}
              </span>
            </div>
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <h3 class="card-title text-body mb-1 fw-bold fs-6 text-truncate" title="${nombre}">
                  ${nombre}
                </h3>
                <p class="card-text text-body-secondary mb-0 small text-truncate">
                  <i class="bi bi-display me-1"></i>${plataforma}
                </p>
              </div>
              <div class="mt-2 text-primary small fw-semibold d-flex align-items-center gap-1">
                <span>Ver reseñas</span>
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </a>
      `;
      row.appendChild(col);
    });

    slide.appendChild(row);
    contenedor.appendChild(slide);
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarJuegosDestacados);
} else {
  cargarJuegosDestacados();
}
