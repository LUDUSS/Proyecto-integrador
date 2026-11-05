(() => {
  const REVIEWS_KEY = "ludus_catalogo_resenias";
  const listSection = document.getElementById("game-browser");
  const listElement = document.getElementById("game-list");
  const searchInput = document.getElementById("game-search");
  const countElement = document.getElementById("game-count");
  const emptyElement = document.getElementById("game-empty");
  const noResultsElement = document.getElementById("game-no-results");
  const detailElement = document.getElementById("game-detail");
  let games = [];

  function readReviews() {
    const saved = localStorage.getItem(REVIEWS_KEY);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new Error(`Los datos guardados en ${REVIEWS_KEY} no tienen un formato válido.`);
    }
    return parsed;
  }

  function getReviews() {
    return readReviews().filter((review) =>
      review && typeof review.gameId === "string" && Number.isInteger(review.rating)
    );
  }

  async function loadGames() {
    const response = await consumeApi("/ludus/juego/");
    if (!Array.isArray(response)) {
      throw new Error("El servidor devolvió un catálogo de juegos no válido.");
    }

    return response.map((game) => {
      if (!game || !Number.isInteger(game.id_juego)
        || typeof game.nombre_juego !== "string"
        || typeof game.categoria !== "string"
        || typeof game.plataforma !== "string"
        || typeof game.descripcion !== "string"
        || typeof game.imagen_url !== "string") {
        throw new Error("El servidor devolvió un juego con datos incompletos.");
      }

      return {
        id: String(game.id_juego),
        name: game.nombre_juego,
        category: game.categoria,
        platform: game.plataforma,
        description: game.descripcion,
        imageUrl: game.imagen_url
      };
    });
  }

  function saveReviews(reviews) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }

  function getAverageRating(reviews) {
    if (!reviews.length) return null;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }

  function makeId() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function addText(parent, tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
  }

  function safeImageUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function createCover(imageUrl, className) {
    const cover = document.createElement("div");
    cover.className = className;
    const safeUrl = safeImageUrl(imageUrl);
    if (safeUrl) {
      const image = document.createElement("img");
      image.src = safeUrl;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        cover.replaceChildren();
        const icon = document.createElement("i");
        icon.className = "bi bi-controller";
        icon.setAttribute("aria-hidden", "true");
        cover.appendChild(icon);
      }, { once: true });
      cover.appendChild(image);
    } else {
      const icon = document.createElement("i");
      icon.className = "bi bi-controller";
      icon.setAttribute("aria-hidden", "true");
      cover.appendChild(icon);
    }
    return cover;
  }

  function renderCatalog() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filteredGames = games.filter((game) =>
      [game.name, game.category, game.platform]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query))
    );

    listElement.replaceChildren();
    countElement.textContent = `${filteredGames.length} ${filteredGames.length === 1 ? "juego" : "juegos"}`;
    emptyElement.classList.toggle("d-none", games.length > 0);
    noResultsElement.classList.toggle("d-none", games.length === 0 || filteredGames.length > 0);

    const allReviews = getReviews();
    filteredGames.forEach((game) => {
      const column = document.createElement("div");
      column.className = "col";
      const card = document.createElement("article");
      card.className = "card h-100 border-0 shadow-sm game-card";
      card.appendChild(createCover(game.imageUrl, "game-card__cover"));
      const body = document.createElement("div");
      body.className = "card-body d-flex flex-column";
      addText(body, "h3", game.name, "h5 card-title fw-bold");
      addText(body, "p", [game.category, game.platform].filter(Boolean).join(" · ") || "Videojuego",
        "small text-body-secondary mb-3");
      const reviews = allReviews.filter((review) => review.gameId === game.id);
      const average = getAverageRating(reviews);
      addText(body, "p", average === null ? "Sin calificaciones" : `Calificación ${average.toFixed(1)} / 5`,
        "small fw-semibold text-success mb-2");
      addText(body, "p", `${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"}`,
        "small text-body-secondary mt-auto");
      const link = document.createElement("a");
      link.className = "btn btn-outline-primary";
      link.href = `./juegos.html?id=${encodeURIComponent(game.id)}`;
      link.textContent = "Ver juego";
      body.appendChild(link);
      card.appendChild(body);
      column.appendChild(card);
      listElement.appendChild(column);
    });
  }

  function renderReview(review) {
    const article = document.createElement("article");
    article.className = "game-review p-3 p-md-4 mb-3";
    const header = document.createElement("div");
    header.className = "d-flex gap-3 align-items-start";
    const score = addText(header, "div", String(review.rating), "review-score");
    score.setAttribute("aria-label", `Calificación ${review.rating} de 5`);
    const content = document.createElement("div");
    content.className = "flex-grow-1";
    addText(content, "h3", review.userName || "Jugador", "h6 fw-bold mb-1");
    addText(content, "p", new Date(review.createdAt).toLocaleDateString("es-MX"),
      "small text-body-secondary mb-2");
    addText(content, "p", review.text, "mb-0 text-break");
    header.appendChild(content);
    article.appendChild(header);
    return article;
  }

  function renderDetail(game) {
    const reviews = getReviews().filter((review) => review.gameId === game.id);
    const average = getAverageRating(reviews);
    detailElement.replaceChildren();

    const back = document.createElement("a");
    back.href = "./juegos.html";
    back.className = "btn btn-link px-0 mb-3";
    back.innerHTML = '<i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Volver al catálogo';
    detailElement.appendChild(back);

    const hero = document.createElement("section");
    hero.className = "game-detail__hero mb-5";
    hero.appendChild(createCover(game.imageUrl, "game-detail__cover"));
    const info = document.createElement("div");
    addText(info, "p", "FICHA DEL JUEGO", "small text-uppercase fw-semibold text-primary");
    addText(info, "h1", game.name, "display-5 fw-bold");
    const metadata = [game.category, game.platform].filter(Boolean).join(" · ");
    if (metadata) addText(info, "p", metadata, "lead text-body-secondary");
    if (game.description) addText(info, "p", game.description, "text-body-secondary");
    addText(info, "p", `${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"} de la comunidad`,
      "small text-body-secondary mb-0");
    addText(info, "p", average === null ? "Sin calificaciones aún" : `Calificación de la comunidad: ${average.toFixed(1)} / 5`,
      "fw-semibold text-success mt-3 mb-0");
    hero.appendChild(info);
    detailElement.appendChild(hero);

    const section = document.createElement("section");
    section.className = "row g-4";
    const reviewColumn = document.createElement("div");
    reviewColumn.className = "col-lg-7";
    addText(reviewColumn, "h2", "Reseñas de jugadores", "h3 fw-bold mb-3");
    if (reviews.length) {
      reviews.slice().reverse().forEach((review) => reviewColumn.appendChild(renderReview(review)));
    } else {
      addText(reviewColumn, "p", "Este juego aún no tiene reseñas. Puedes ser el primero.",
        "text-body-secondary p-4 border rounded-3");
    }

    const formColumn = document.createElement("div");
    formColumn.className = "col-lg-5";
    const formCard = document.createElement("div");
    formCard.className = "card border-0 shadow-sm";
    const formBody = document.createElement("div");
    formBody.className = "card-body p-4";
    addText(formBody, "h2", "Escribe una reseña", "h4 fw-bold");
    const formMessage = document.createElement("div");
    formMessage.className = "alert d-none";
    formMessage.setAttribute("role", "status");
    formBody.appendChild(formMessage);

    const form = document.createElement("form");
    const ratingGroup = document.createElement("div");
    ratingGroup.className = "mb-3";
    const ratingLabel = addText(ratingGroup, "label", "Calificación", "form-label");
    ratingLabel.htmlFor = `rating-${game.id}`;
    const ratingSelect = document.createElement("select");
    ratingSelect.id = ratingLabel.htmlFor;
    ratingSelect.className = "form-select";
    ratingSelect.required = true;
    for (let rating = 5; rating >= 1; rating -= 1) {
      const option = new Option(`${rating} de 5`, String(rating));
      ratingSelect.appendChild(option);
    }
    ratingGroup.appendChild(ratingSelect);
    form.appendChild(ratingGroup);

    const textGroup = document.createElement("div");
    textGroup.className = "mb-3";
    const textLabel = addText(textGroup, "label", "Tu opinión", "form-label");
    textLabel.htmlFor = `review-${game.id}`;
    const textInput = document.createElement("textarea");
    textInput.id = textLabel.htmlFor;
    textInput.className = "form-control";
    textInput.rows = 5;
    textInput.maxLength = 10000;
    textInput.required = true;
    textInput.placeholder = "¿Qué te pareció este juego?";
    textGroup.appendChild(textInput);
    form.appendChild(textGroup);

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn-primary w-100";
    submit.textContent = "Publicar reseña";
    form.appendChild(submit);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      formMessage.className = "alert d-none";

      const currentUser = getCurrentUser();
      if (!currentUser) {
        sessionStorage.setItem("ludus_redirect_after_login", `${window.location.pathname.split("/").pop()}${window.location.search}`);
        requireAuth();
        return;
      }

      const text = textInput.value.trim();
      if (!text) {
        formMessage.textContent = "Escribe tu opinión antes de publicar.";
        formMessage.className = "alert alert-danger";
        return;
      }

      try {
        const allReviews = getReviews();
        allReviews.push({
          id: makeId(),
          gameId: game.id,
          userEmail: currentUser.email,
          userName: currentUser.name || currentUser.email,
          rating: Number(ratingSelect.value),
          text,
          createdAt: new Date().toISOString()
        });
        saveReviews(allReviews);
        renderDetail(game);
      } catch (error) {
        formMessage.textContent = error instanceof Error
          ? error.message
          : "No se pudo guardar la reseña en este navegador.";
        formMessage.className = "alert alert-danger";
      }
    });

    formBody.appendChild(form);
    formCard.appendChild(formBody);
    formColumn.appendChild(formCard);
    section.append(reviewColumn, formColumn);
    detailElement.appendChild(section);
  }

  searchInput.addEventListener("input", renderCatalog);

  async function initializeCatalog() {
    countElement.textContent = "Cargando juegos...";
    try {
      games = await loadGames();
      const gameId = new URLSearchParams(window.location.search).get("id");
      if (gameId) {
        const game = games.find((item) => item.id === gameId);
        if (game) {
          listSection.classList.add("d-none");
          detailElement.classList.remove("d-none");
          renderDetail(game);
        } else {
          detailElement.classList.remove("d-none");
          addText(detailElement, "h1", "No encontramos ese juego", "h3");
          addText(detailElement, "p", "Puede que ya no esté disponible en el catálogo.", "text-body-secondary");
          const back = addText(detailElement, "a", "Volver al catálogo", "btn btn-outline-primary");
          back.href = "./juegos.html";
        }
      } else {
        renderCatalog();
      }
    } catch (error) {
      countElement.textContent = "";
      emptyElement.classList.add("d-none");
      noResultsElement.classList.add("d-none");
      listElement.replaceChildren();
      listSection.classList.remove("d-none");
      addText(listElement, "p", error instanceof Error ? error.message : "No se pudo cargar el catálogo.",
        "alert alert-danger col-12");
    }
  }

  initializeCatalog();
})();
