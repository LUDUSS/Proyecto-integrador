const footerContainer = document.getElementById('footer');

footerContainer.innerHTML = `
  <footer class="bg-dark text-white pt-5 pb-3">
    <div class="container">
      <div class="row g-4">
        
        <!-- Información del proyecto -->
        <div class="col-12 col-md-5">
          <h5 class="fw-bold">LUDUS</h5>
          <p class="text-secondary">
            Descubre nuevos videojuegos, comparte tus opiniones y conoce las reseñas de otros jugadores.
          </p>
        </div>

        <!-- Navegación -->
        <div class="col-12 col-md-3">
          <h5 class="fw-bold">Navegación</h5>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="inicio.html" class="text-white text-decoration-none">Inicio</a></li>
            <li class="mb-2"><a href="#juegosDestacados" class="text-white text-decoration-none">Juegos destacados</a></li>
            <li class="mb-2"><a href="./contactanos.html" class="text-white text-decoration-none">Contáctanos</a></li>
            <li><a href="acercade.html" class="text-white text-decoration-none">Acerca de nosotros</a></li>
          </ul>
        </div>

        <!-- Redes sociales -->
        <div class="col-12 col-md-4">
          <h5 class="fw-bold">Síguenos</h5>
          <p class="text-secondary">Mantente al día con las novedades de nuestra comunidad.</p>
          <div class="d-flex gap-3">
            <a href="https://www.facebook.com/" class="text-white fs-4" target="_blank"><i class="bi bi-facebook"></i></a>
            <a href="https://www.instagram.com/" class="text-white fs-4" target="_blank"><i class="bi bi-instagram"></i></a>
            <a href="https://x.com/" class="text-white fs-4" target="_blank"><i class="bi bi-twitter-x"></i></a>
          </div>
        </div>

      </div>

      <hr class="border-secondary my-4">

      <div class="text-center text-secondary">
        <small>© LUDUS. Todos los derechos reservados.</small>
      </div>
    </div>
  </footer>`