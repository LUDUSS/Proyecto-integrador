// 1. Array con los 10 juegos
const juegosDestacados = [
  { id: 1, imagen: "./IMAGE/juegos/eldenring.jpg", nombre: "Elden Ring", categoria: "RPG", consola: "PC/PS5/XBOX" },
  { id: 2, imagen: "./IMAGE/juegos/baldurs.jpg", nombre: "Baldur's Gate 3", categoria: "RPG", consola: "PC/PS5" },
  { id: 3, imagen: "./IMAGE/juegos/ragnarok.jpg", nombre: "God of War Ragnarok", categoria: "Accion", consola: "PS5/PS4" },
  { id: 4, imagen: "./IMAGE/juegos/zelda.jpg", nombre: "Zelda: Tears of the Kingdom", categoria: "Aventura", consola: "Nintendo Switch" },
  { id: 5, imagen: "./IMAGE/juegos/gearsE.jpg", nombre: "Gears E-DAY", categoria: "FPS", consola: "PC/XBOX" },
  { id: 6, imagen: "./IMAGE/juegos/wolverine.jpg", nombre: "Wolverine", categoria: "Juego muy interactivo", consola: "Play Station 4/5" },
  { id: 7, imagen: "./IMAGE/juegos/hell.jpg", nombre: "Helldivers", categoria: "Accion", consola: "PC/XBOX/PS5" },
  { id: 8, imagen: "./IMAGE/juegos/spiderman1.jpg", nombre: "The Marvel Spiderman 1", categoria: "Superheroes", consola: "PC/PS5/PS4" },
  { id: 9, imagen: "./IMAGE/juegos/spiderman2.jpg", nombre: "The Marvel Spiderman 2", categoria: "Superheroes", consola: "PC/PS5/PS4" },
  { id: 10, imagen: "./IMAGE/juegos/halo.jpg", nombre: "Halo Reach", categoria: "FPS", consola: "PC/XBOX" }
];

// Imagen de respaldo en caso de que falte alguna
const imagenRespaldo = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 200 200'><rect width='100%' height='100%' fill='%23e2e2e2'/><path d='M60 140 L90 100 L115 125 L135 95 L165 140 Z' fill='%23cccccc'/><circle cx='90' cy='80' r='10' fill='%23cccccc'/></svg>";

function cargarJuegosDestacados() {
  const contenedor = document.getElementById("container-juegos-destacados");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  
  // Definimos cuantas tarjetas queremos por slide (4 para escritorio)
  const itemsPorSlide = 4; 
  const totalSlides = Math.ceil(juegosDestacados.length / itemsPorSlide);

  for (let i = 0; i < totalSlides; i++) {
    // Creamos el contenedor del slide
    const slide = document.createElement("div");
    slide.classList.add("carousel-item");
    if (i === 0) slide.classList.add("active"); // El primero debe estar activo

    // Creamos la fila de Bootstrap
    const row = document.createElement("div");
    row.className = "row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4 px-5"; // px-5 para que no choque con las flechas

    // Cortamos el array para sacar los juegos de este slide
    const grupo = juegosDestacados.slice(i * itemsPorSlide, (i + 1) * itemsPorSlide);

    grupo.forEach((juego) => {
      const srcImagen = juego.imagen && juego.imagen.trim() !== "" ? juego.imagen : imagenRespaldo;
      
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <div class="card h-100 border-0 shadow-sm rounded-3 bg-body-tertiary">
          <div class="p-2">
            <img src="${srcImagen}" class="card-img-top rounded-3" 
                 alt="${juego.nombre}"
                 loading="lazy"
                 style="height: 220px; object-fit: cover; background-color: #e2e2e2;">
          </div>
          <div class="card-body pt-1 pb-3 px-3 d-flex flex-column justify-content-end">
            <p class="card-title text-body mb-1 fw-normal" style="font-size: 0.95rem;">
              ${juego.nombre}
            </p>
            <p class="card-text fw-bold text-body mb-1" style="font-size: 0.9rem;">
              ${juego.categoria}
            </p>
            <p class="card-text text-body-secondary mb-0" style="font-size: 0.8rem; font-weight: 500;">
              ${juego.consola}
            </p>
          </div>
        </div>
      `;
      row.appendChild(col);
    });

    slide.appendChild(row);
    contenedor.appendChild(slide);
  }
}

// Ejecutamos la funcion cuando el DOM este listo
document.addEventListener("DOMContentLoaded", cargarJuegosDestacados);
