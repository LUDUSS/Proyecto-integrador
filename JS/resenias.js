(() => {
    // Clave que identifica las reseñas guardadas y eliminadas en el almacenamiento del navegador.
    const STORAGE_KEY = 'resenias-videojuegos';
    // Busca los elementos de la página que utiliza esta funcionalidad.
    const button = document.getElementById('mostrar-formulario-resenia');
    const form = document.getElementById('formulario-resenia');
    const modalElement = document.getElementById('modal-resenia');
    const reviewsList = document.getElementById('lista-resenias');
    const modalTitle = document.getElementById('modal-resenia-titulo');
    const nameInput = document.getElementById('nombre-juego');
    const gameSuggestions = document.getElementById('juegos-coincidentes');
    const selectedGamePreview = document.getElementById('juego-seleccionado');
    const selectedGameImage = document.getElementById('juego-seleccionado-imagen');
    const selectedGameName = document.getElementById('juego-seleccionado-nombre');
    const reviewInput = document.getElementById('texto-resenia');
    const ratingInputs = form
        ? Array.from(form.querySelectorAll('input[name="calificacion-nueva"]'))
        : [];
    const nameFeedback = document.getElementById('nombre-juego-feedback');
    const reviewFeedback = document.getElementById('texto-resenia-feedback');
    const ratingFeedback = document.getElementById('calificacion-feedback');
    // Detiene la inicialización y avisa si falta alguna parte necesaria del HTML.
    if (!button || !form || !modalElement || !modalTitle || !reviewsList
        || !nameInput || !gameSuggestions || !selectedGamePreview || !selectedGameImage
        || !selectedGameName || !reviewInput || !nameFeedback || !reviewFeedback
        || !ratingFeedback || ratingInputs.length === 0) {
        throw new Error('No se encontraron los elementos necesarios para agregar reseñas.');
    }

    const reviewModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
        throw new Error('No se encontró el botón para guardar la reseña.');
    }

    let savedReviews = [];
    let editingIndex = null; // Variable para controlar si estamos editando una reseña
    let imagePosition = { x: 50, y: 50 };
    let catalogGames = [];
    let selectedGame = null;
    let catalogLoadError = '';
    let catalogGamesPromise = null;
    let catalogGamesLoaded = false;
    let databaseReviewsError = '';

    // Renderiza las reseñas guardadas.
    function renderReviews() {
        reviewsList.innerHTML = '';
        savedReviews.forEach((review, index) => {
            const card = createReviewCard(review, index);
            reviewsList.appendChild(card);
        });
        if (databaseReviewsError) {
            const errorMessage = document.createElement('p');
            errorMessage.className = 'alert alert-warning mb-0';
            errorMessage.setAttribute('role', 'status');
            errorMessage.textContent = databaseReviewsError;
            reviewsList.appendChild(errorMessage);
        }
        updateReviewOverflow();
        window.dispatchEvent(new CustomEvent('resenias:actualizadas', {
            detail: savedReviews
        }));
    }

    function updateReviewOverflow() {
        reviewsList.querySelectorAll('.tarjeta-juego').forEach((card) => {
            const reviewText = card.querySelector('.tarjeta-juego__texto-resenia');
            const expandButton = card.querySelector('.tarjeta-juego__ver-mas');
            if (!reviewText || !expandButton) {
                return;
            }

            const wasExpanded = reviewText.classList.contains('is-expanded');
            reviewText.classList.remove('is-expanded');
            const collapsedHeight = reviewText.getBoundingClientRect().height;
            reviewText.classList.toggle('is-expanded', wasExpanded);
            const expandedText = reviewText.cloneNode(true);
            const computedStyle = window.getComputedStyle(reviewText);
            const inheritedStyles = [
                'font',
                'line-height',
                'letter-spacing',
                'word-spacing',
                'text-align',
                'text-indent',
                'text-transform',
                'white-space',
                'overflow-wrap',
                'word-break',
                'padding',
                'border',
                'box-sizing'
            ];

            expandedText.removeAttribute('id');
            expandedText.classList.add('is-expanded');
            expandedText.setAttribute('aria-hidden', 'true');
            expandedText.style.position = 'fixed';
            expandedText.style.top = '0';
            expandedText.style.left = '-100000px';
            expandedText.style.width = `${reviewText.getBoundingClientRect().width}px`;
            expandedText.style.height = 'auto';
            expandedText.style.minHeight = '0';
            expandedText.style.maxHeight = 'none';
            expandedText.style.margin = '0';
            expandedText.style.overflow = 'visible';
            expandedText.style.visibility = 'hidden';
            expandedText.style.flex = 'none';
            inheritedStyles.forEach((property) => {
                expandedText.style.setProperty(property, computedStyle.getPropertyValue(property));
            });

            document.body.appendChild(expandedText);
            const expandedHeight = expandedText.getBoundingClientRect().height;
            expandedText.remove();

            const hasOverflow = expandedHeight > collapsedHeight + 1;
            expandButton.hidden = !hasOverflow;
            if (!hasOverflow) {
                reviewText.classList.toggle('is-expanded', false);
                expandButton.textContent = 'Ver más';
                expandButton.setAttribute('aria-expanded', 'false');
            } else {
                reviewText.classList.toggle('is-expanded', wasExpanded);
                expandButton.textContent = wasExpanded ? 'Ver menos' : 'Ver más';
                expandButton.setAttribute('aria-expanded', String(wasExpanded));
            }
        });
    }

    let overflowCheckScheduled = false;
    window.addEventListener('resize', () => {
        if (overflowCheckScheduled) {
            return;
        }
        overflowCheckScheduled = true;
        window.requestAnimationFrame(() => {
            overflowCheckScheduled = false;
            updateReviewOverflow();
        });
    });

    window.addEventListener('load', updateReviewOverflow, { once: true });

    // Manejador de eventos para Eliminar y Editar
    reviewsList.addEventListener('click', async (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const deleteButton = event.target.closest('.btn-accion.eliminar');
        const editButton = event.target.closest('.btn-accion.editar');
        const likeButton = event.target.closest('.btn-accion.like');
        const expandButton = event.target.closest('.tarjeta-juego__ver-mas');
        const card = event.target.closest('.tarjeta-juego');

        if (!card) {
            return;
        }

        if (expandButton) {
            const reviewText = card.querySelector('.tarjeta-juego__texto-resenia');
            if (!reviewText) {
                return;
            }

            const isExpanded = reviewText.classList.toggle('is-expanded');
            expandButton.textContent = isExpanded ? 'Ver menos' : 'Ver más';
            expandButton.setAttribute('aria-expanded', String(isExpanded));
            return;
        }

        // ACCIÓN: LIKE
        if (likeButton) {
            const reviewIndex = Number(card.dataset.reviewIndex);
            const reviewToLike = savedReviews[reviewIndex];
            const currentUser = getCurrentUser();

            if (!reviewToLike) {
                return;
            }

            if (!currentUser) {
                requireAuth();
                return;
            }

            const userEmail = currentUser.email.trim().toLowerCase();
            const likedBy = new Set(reviewToLike.likedBy);
            if (likedBy.has(userEmail)) {
                likedBy.delete(userEmail);
            } else {
                likedBy.add(userEmail);
            }

            const updatedReviews = savedReviews.map((review, index) => (
                index === reviewIndex
                    ? { ...review, likedBy: Array.from(likedBy) }
                    : review
            ));
            savedReviews = updatedReviews;
            renderReviews();
            return;
        }

        // ACCIí“N: ELIMINAR
        if (deleteButton) {
            const gameName =
                card.querySelector('.card-title')?.textContent.trim() || 'este juego';

            Swal.fire({
                title: "Eliminar",
                text: `Â¿Estás seguro que quieres eliminar ${gameName}?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí­, eliminar",
                cancelButtonText: "Cancelar",
                reverseButtons: true
            }).then(async (result) => {

                // Solo eliminar si el usuario confirma
                if (!result.isConfirmed) {
                    return;
                }

                const reviewIndex = Number(card.dataset.reviewIndex);

                if (
                    !Number.isInteger(reviewIndex) ||
                    reviewIndex < 0 ||
                    reviewIndex >= savedReviews.length
                ) {
                    console.error(
                        'No se pudo identificar la reseña que se intentó eliminar.'
                    );

                    Swal.fire({
                        title: "Error",
                        text: "No se pudo eliminar la reseña. Recarga la página e inténtalo de nuevo.",
                        icon: "error"
                    });

                    return;
                }

                const reviewToDelete = savedReviews[reviewIndex];
                try {
                    if (Number.isInteger(reviewToDelete.databaseReviewId)) {
                        await consumeApi(`/ludus/publicacion/${reviewToDelete.databaseReviewId}`, {
                            method: "DELETE"
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        title: "Error",
                        text: error instanceof Error ? error.message : "No se pudo eliminar la reseña del servidor.",
                        icon: "error"
                    });
                    return;
                }

                const updatedReviews = savedReviews.filter(
                    (_, index) => index !== reviewIndex
                );

                savedReviews = updatedReviews;

                renderReviews();
                return;
            });

            return;
        }
        // ACCIí“N: EDITAR
        if (editButton) {
            if (catalogGamesPromise) await catalogGamesPromise;
            const reviewIndex = Number(card.dataset.reviewIndex);
            const reviewToEdit = savedReviews[reviewIndex];

            if (!reviewToEdit) return;

            // Cargar datos en el formulario
            selectedGame = catalogGames.find((game) =>
                String(game.id) === String(reviewToEdit.gameId)
                || game.name.trim().toLocaleLowerCase() === reviewToEdit.gameName.trim().toLocaleLowerCase()
            ) || null;
            nameInput.value = selectedGame ? selectedGame.name : reviewToEdit.gameName;
            nameInput.disabled = Number.isInteger(reviewToEdit.databaseReviewId);
            showSelectedGame(selectedGame);
            form.querySelector('#texto-resenia').value = reviewToEdit.reviewText;
            imagePosition = getImagePosition(reviewToEdit.imagePosition);

            // Marcar la estrella correspondiente
            const ratingInput = form.querySelector(`input[name="calificacion-nueva"][value="${reviewToEdit.rating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }

            editingIndex = reviewIndex; // Guardamos el í­ndice que estamos editando
            modalTitle.textContent = 'Editar reseña';
            submitButton.textContent = 'Guardar cambios';
            reviewModal.show(editButton);
        }
    });

    // Los datos anteriores que no tenían encuadre usan el centro de la imagen.
    function getImagePosition(position) {
        if (
            position &&
            Number.isFinite(position.x) &&
            Number.isFinite(position.y) &&
            position.x >= 0 &&
            position.x <= 100 &&
            position.y >= 0 &&
            position.y <= 100
        ) {
            return { x: position.x, y: position.y };
        }
        return { x: 50, y: 50 };
    }

    function showSelectedGame(game) {
        selectedGamePreview.hidden = !game;
        selectedGameName.textContent = game ? game.name : '';
        const imageSource = game ? game.imageUrl : '';
        selectedGameImage.hidden = true;
        selectedGameImage.removeAttribute('src');
        selectedGameImage.onload = null;
        selectedGameImage.onerror = null;
        if (isSafeImageSource(imageSource)) {
            selectedGameImage.onload = () => {
                selectedGameImage.hidden = false;
            };
            selectedGameImage.onerror = () => {
                selectedGameImage.hidden = true;
                selectedGameImage.removeAttribute('src');
            };
            selectedGameImage.src = imageSource;
            selectedGameImage.alt = `Portada de ${game ? game.name : 'juego seleccionado'}`;
        } else {
            selectedGameImage.alt = '';
        }
    }

    function isSafeImageSource(value) {
        if (typeof value !== 'string') return false;
        if (value.startsWith('data:image/')) return true;
        try {
            return ['http:', 'https:'].includes(new URL(value, window.location.href).protocol);
        } catch (error) {
            return false;
        }
    }

    function renderGameSuggestions(query = '') {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) {
            gameSuggestions.replaceChildren();
            gameSuggestions.hidden = true;
            nameInput.setAttribute('aria-expanded', 'false');
            return;
        }
        const matches = catalogGames.filter((game) =>
            game.name.toLocaleLowerCase().includes(normalizedQuery)
            || game.platform.toLocaleLowerCase().includes(normalizedQuery)
        ).slice(0, 20);
        gameSuggestions.replaceChildren();
        matches.forEach((game) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'list-group-item list-group-item-action';
            option.setAttribute('role', 'option');
            option.textContent = [game.name, game.platform].filter(Boolean).join(' · ');
            option.addEventListener('click', () => {
                selectedGame = game;
                nameInput.value = game.name;
                nameInput.classList.remove('is-invalid');
                nameInput.classList.add('is-valid');
                gameSuggestions.hidden = true;
                nameInput.setAttribute('aria-expanded', 'false');
                showSelectedGame(game);
            });
            gameSuggestions.appendChild(option);
        });
        if (!matches.length && normalizedQuery) {
            const emptyOption = document.createElement('div');
            emptyOption.className = 'list-group-item text-body-secondary';
            emptyOption.textContent = 'No se encontraron juegos.';
            gameSuggestions.appendChild(emptyOption);
        }
        gameSuggestions.hidden = matches.length === 0 && !normalizedQuery;
        nameInput.setAttribute('aria-expanded', String(!gameSuggestions.hidden));
    }

    async function loadCatalogGames() {
        nameInput.disabled = true;
        nameInput.placeholder = 'Cargando juegos...';
        nameFeedback.textContent = 'Cargando juegos del catálogo...';
        nameFeedback.classList.add('d-block');
        try {
            const response = await consumeApi('/ludus/juego/');
            if (!Array.isArray(response)) {
                throw new Error('El servidor devolvió un catálogo de juegos no válido.');
            }
            catalogGames = response.map((game) => {
                if (!game || !Number.isInteger(game.id_juego)
                    || typeof game.nombre_juego !== 'string'
                    || typeof game.imagen_url !== 'string'
                    || typeof game.plataforma !== 'string') {
                    throw new Error('El servidor devolvió un juego con datos incompletos.');
                }
                return {
                    id: game.id_juego,
                    name: game.nombre_juego,
                    imageUrl: game.imagen_url,
                    platform: game.plataforma
                };
            });
            savedReviews = savedReviews.map((review) => {
                const game = catalogGames.find((item) =>
                    String(item.id) === String(review.gameId)
                    || item.name.trim().toLocaleLowerCase() === review.gameName.trim().toLocaleLowerCase()
                );
                return game
                    ? { ...review, gameId: String(game.id), imageSource: game.imageUrl }
                    : review;
            });
            catalogLoadError = '';
            catalogGamesLoaded = true;
            nameInput.placeholder = 'Escribe para buscar un juego';
            nameInput.disabled = false;
            nameFeedback.textContent = '';
            nameFeedback.classList.remove('d-block');

            try {
                const [user, publications] = await Promise.all([
                    getCurrentUserDetails(),
                    consumeApi('/ludus/publicacion/')
                ]);
                if (!user || !Array.isArray(publications)) {
                    throw new Error('No se pudieron cargar las reseñas publicadas en Juegos.');
                }

                const userReviews = publications
                    .filter((review) => review && review.id_usuario === user.id_usuario)
                    .map((review) => {
                        if (!Number.isInteger(review.id_resenia) || !Number.isInteger(review.id_juego)
                            || typeof review.calificacion !== 'number'
                            || !Number.isFinite(review.calificacion)
                            || typeof review.texto_resenia !== 'string') {
                            throw new Error('El servidor devolvió una reseña con datos incompletos.');
                        }
                        const game = catalogGames.find((item) => item.id === review.id_juego);
                        return {
                            id: review.id_resenia,
                            databaseReviewId: review.id_resenia,
                            databaseSourced: true,
                            gameId: String(review.id_juego),
                            gameName: game ? game.name : 'Juego no disponible',
                            reviewText: review.texto_resenia,
                            imageSource: game ? game.imageUrl : '',
                            rating: review.calificacion,
                            createdAt: review.fecha_publicacion,
                            likedBy: [],
                            legacyLikeCount: 0
                        };
                    });
                userReviews.forEach((review) => {
                    if (savedReviews.some((savedReview) =>
                        savedReview.databaseReviewId === review.databaseReviewId
                    )) {
                        return;
                    }
                    const matchingLocalReview = savedReviews.find((savedReview) =>
                        !savedReview.databaseReviewId
                        && String(savedReview.gameId) === review.gameId
                        && savedReview.rating === review.rating
                        && savedReview.reviewText.trim().toLocaleLowerCase()
                            === review.reviewText.trim().toLocaleLowerCase()
                    );
                    if (matchingLocalReview) {
                        matchingLocalReview.databaseReviewId = review.databaseReviewId;
                        matchingLocalReview.createdAt = review.createdAt;
                        matchingLocalReview.imageSource = review.imageSource || matchingLocalReview.imageSource;
                        return;
                    }
                    const duplicate = savedReviews.some((savedReview) =>
                        String(savedReview.gameId) === review.gameId
                        && savedReview.rating === review.rating
                        && savedReview.reviewText.trim().toLocaleLowerCase()
                            === review.reviewText.trim().toLocaleLowerCase()
                    );
                    if (!duplicate) savedReviews.push(review);
                });
                databaseReviewsError = '';
            } catch (error) {
                databaseReviewsError = error instanceof Error
                    ? `No se pudieron cargar algunas reseñas del servidor: ${error.message}`
                    : 'No se pudieron cargar algunas reseñas del servidor.';
            }
            renderReviews();
        } catch (error) {
            catalogLoadError = error instanceof Error
                ? error.message
                : 'No se pudo cargar el catálogo de juegos.';
            nameInput.placeholder = 'Catálogo no disponible';
            nameFeedback.textContent = catalogLoadError;
            nameFeedback.classList.add('d-block');
        }
    }

    nameInput.addEventListener('focus', () => {
        if (!nameInput.disabled) renderGameSuggestions(nameInput.value);
    });

    nameInput.addEventListener('input', () => {
        selectedGame = null;
        showSelectedGame(null);
        nameInput.classList.remove('is-valid', 'is-invalid');
        renderGameSuggestions(nameInput.value);
    });

    function resetForm() {
        form.reset();
        nameInput.disabled = !catalogGamesLoaded;
        nameInput.setAttribute('aria-expanded', 'false');
        gameSuggestions.hidden = true;
        showSelectedGame(null);
        selectedGame = null;
        imagePosition = { x: 50, y: 50 };
        // Al reiniciar el formulario, dejamos de editar una reseña existente.
        editingIndex = null;
        // Quitamos los estilos Bootstrap que indican campos válidos o inválidos.
        [nameInput, reviewInput, ...ratingInputs].forEach((input) => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        // Borramos los mensajes de validación y ocultamos sus contenedores.
        [nameFeedback, reviewFeedback, ratingFeedback].forEach((feedback) => {
            feedback.textContent = '';
            feedback.classList.remove('d-block');
        });
        if (catalogLoadError) {
            nameFeedback.textContent = catalogLoadError;
            nameFeedback.classList.add('d-block');
        }
        form.querySelectorAll('.rate .star').forEach((star) => {
            star.classList.remove('fas', 'rate-active', 'star-over');
            star.classList.add('far');
        });
    }

    modalElement.addEventListener('show.bs.modal', () => {
        button.setAttribute('aria-expanded', 'true');
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
        resetForm();
        modalTitle.textContent = 'Escribe una reseña';
        submitButton.textContent = 'Publicar reseña';
        submitButton.disabled = false;
        button.setAttribute('aria-expanded', 'false');
    });

    button.addEventListener('click', () => {
        resetForm();
        reviewModal.show(button);
        modalElement.addEventListener('shown.bs.modal', () => nameInput.focus(), { once: true });
    });

    // Procesa el formulario (Crear o Actualizar)
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const gameName = selectedGame ? selectedGame.name : '';
        const reviewText = form.querySelector('#texto-resenia').value.trim();
        const ratingInput = form.querySelector('input[name="calificacion-nueva"]:checked');
        let isValid = true;

        [nameInput, reviewInput, ...ratingInputs].forEach((input) => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        [nameFeedback, reviewFeedback, ratingFeedback].forEach((feedback) => {
            feedback.textContent = '';
            feedback.classList.remove('d-block');
        });

        if (!selectedGame || !isSafeImageSource(selectedGame.imageUrl)) {
            nameFeedback.textContent = 'Selecciona un juego del catálogo con una portada válida.';
            nameInput.classList.add('is-invalid');
            isValid = false;
        } else {
            nameInput.classList.add('is-valid');
        }

        if (!reviewText || reviewText.length > 10000) {
            reviewFeedback.textContent = reviewText
                ? 'La reseña no puede superar los 10000 caracteres.'
                : 'El campo reseña no puede estar vací­o.';
            reviewInput.classList.add('is-invalid');
            isValid = false;
        } else {
            reviewInput.classList.add('is-valid');
        }

        if (!ratingInput) {
            ratingFeedback.textContent = 'Selecciona una calificación.';
            ratingFeedback.classList.add('d-block');
            ratingInputs[0].classList.add('is-invalid');
            isValid = false;
        } else {
            ratingInput.classList.add('is-valid');
        }

        if (!isValid) {
            form.querySelector('.is-invalid')?.focus();
            return;
        }

        submitButton.disabled = true;
        const rating = Number(ratingInput.value);

        const updatedReview = {
            ...(editingIndex === null
                ? { likedBy: [], legacyLikeCount: 0 }
                : savedReviews[editingIndex]),
            databaseSourced: true,
            gameId: selectedGame.id,
            gameName,
            reviewText,
            imageSource: selectedGame.imageUrl,
            imagePosition: { ...imagePosition },
            rating
        };

        try {
            if (editingIndex === null) {
                updatedReview.databaseReviewId = await createDatabaseReview(selectedGame, rating, reviewText);
            } else {
                await updateDatabaseReview(updatedReview, gameName, rating, reviewText);
            }
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: error instanceof Error ? error.message : "No se pudo guardar la reseña.",
                icon: "error"
            });
            submitButton.disabled = false;
            return;
        }

        if (editingIndex !== null) {
            savedReviews[editingIndex] = updatedReview;
        } else {
            savedReviews.push(updatedReview);
        }

        renderReviews();
        reviewModal.hide();
    });

    async function createDatabaseReview(game, rating, reviewText) {
        const user = await getCurrentUserDetails();
        if (!user) {
            requireAuth();
            throw new Error('Inicia sesión para publicar una reseña.');
        }
        if (!Number.isInteger(game.id)) {
            throw new Error('Selecciona un juego válido del catálogo.');
        }

        const createdReview = await consumeApi('/ludus/publicacion/', {
            method: 'POST',
            body: {
                id_usuario: user.id_usuario,
                id_juego: game.id,
                calificacion: rating,
                texto_resenia: reviewText,
                fecha_publicacion: formatLocalDateTime()
            }
        });
        if (!createdReview || !Number.isInteger(createdReview.id_resenia)) {
            throw new Error('El servidor no confirmó la creación de la reseña.');
        }
        return createdReview.id_resenia;
    }

    async function updateDatabaseReview(review, gameName, rating, reviewText) {
        if (!Number.isInteger(review.databaseReviewId)) return;
        if (gameName.trim().toLocaleLowerCase() !== review.gameName.trim().toLocaleLowerCase()) {
            throw new Error('No puedes cambiar el juego de una reseña ya publicada.');
        }

        const params = new URLSearchParams({
            calificacion: String(rating),
            texto_resenia: reviewText
        });
        await consumeApi(`/ludus/publicacion/${review.databaseReviewId}?${params}`, {
            method: 'PUT'
        });
    }

    function createReviewCard(reviewData, reviewIndex) {
        const {
            gameId,
            gameName,
            reviewText,
            imageSource,
            imagePosition: savedImagePosition,
            rating,
            likedBy,
            legacyLikeCount,
            createdAt
        } = reviewData;
        const article = document.createElement('article');
        article.className = 'card tarjeta-juego tarjeta-juego--compact';
        article.dataset.reviewIndex = String(reviewIndex);

        // Contenedor de botones de acción
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'tarjeta-acciones';

        const currentUser = getCurrentUser();
        const isLiked = currentUser
            ? likedBy.includes(currentUser.email.trim().toLowerCase())
            : false;
        const likeCount = legacyLikeCount + likedBy.length;
        const likeButton = document.createElement('button');
        likeButton.type = 'button';
        likeButton.className = `btn-accion like${isLiked ? ' is-liked' : ''}`;
        likeButton.title = isLiked ? 'Quitar me gusta' : 'Me gusta';
        likeButton.setAttribute('aria-label', `${likeCount} likes${isLiked ? ', te gusta' : ''}`);
        likeButton.setAttribute('aria-pressed', String(isLiked));
        const likeIcon = document.createElement('i');
        likeIcon.className = `bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`;
        likeIcon.setAttribute('aria-hidden', 'true');
        const likeCountLabel = document.createElement('span');
        likeCountLabel.textContent = String(likeCount);
        likeButton.append(likeIcon, likeCountLabel);

        // Botón Editar
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn-accion editar';
        editButton.title = 'Editar reseña';
        editButton.setAttribute('aria-label', 'Editar reseña');
        const editIcon = document.createElement('i');
        editIcon.className = 'bi bi-pencil';
        editIcon.setAttribute('aria-hidden', 'true');
        editButton.appendChild(editIcon);

        // Botón Eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn-accion eliminar';
        deleteButton.title = 'Eliminar reseña';
        deleteButton.setAttribute('aria-label', 'Eliminar reseña');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'bi bi-trash';
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteButton.appendChild(deleteIcon);

                // Si estamos viendo el perfil de otro usuario, solo mostramos Me gusta (sin editar ni eliminar)
        const urlParams = new URLSearchParams(window.location.search);
        const idEnUrl = urlParams.get('id');
        const idPropio = sessionStorage.getItem('ludus_id_usuario');
        const esOtroPerfil = idEnUrl && idEnUrl !== idPropio;

        if (!esOtroPerfil) {
            actionsContainer.append(editButton, deleteButton);
        }
        article.appendChild(actionsContainer);

        const row = document.createElement('div');
        row.className = 'row g-0 tarjeta-juego__fila';

        const imageColumn = document.createElement('div');
        imageColumn.className = 'col-4 col-md-3 tarjeta-juego__imagen';
        const image = document.createElement('img');
        if (isSafeImageSource(imageSource)) {
            image.src = imageSource;
            image.addEventListener('error', () => {
                imageColumn.replaceChildren();
                const fallback = document.createElement('i');
                fallback.className = 'bi bi-controller';
                fallback.setAttribute('aria-hidden', 'true');
                imageColumn.appendChild(fallback);
            }, { once: true });
            imageColumn.appendChild(image);
        } else {
            const fallback = document.createElement('i');
            fallback.className = 'bi bi-controller';
            fallback.setAttribute('aria-hidden', 'true');
            imageColumn.appendChild(fallback);
        }
        image.alt = `Portada de ${gameName}`;
        const cardImagePosition = getImagePosition(savedImagePosition);
        image.style.objectPosition = `${cardImagePosition.x}% ${cardImagePosition.y}%`;

        const contentColumn = document.createElement('div');
        contentColumn.className = 'col-8 col-md-9 tarjeta-juego__contenido';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body tarjeta-juego__cuerpo';

        const description = document.createElement('div');
        description.className = 'tarjeta-juego__descripcion';

        const title = document.createElement('h5');
        title.className = 'card-title';
        if (gameId !== undefined && gameId !== null && String(gameId)) {
            const gameLink = document.createElement('a');
            gameLink.href = `./juegos.html?id=${encodeURIComponent(gameId)}`;
            gameLink.textContent = gameName;
            title.appendChild(gameLink);
        } else {
            title.textContent = gameName;
        }

        const review = document.createElement('p');
        review.className = 'card-text tarjeta-juego__texto-resenia';
        review.id = `resenia-texto-${reviewIndex}`;
        review.textContent = reviewText;

        const expandButton = document.createElement('button');
        expandButton.type = 'button';
        expandButton.className = 'tarjeta-juego__ver-mas';
        expandButton.textContent = 'Ver más';
        expandButton.setAttribute('aria-controls', review.id);
        expandButton.setAttribute('aria-expanded', 'false');
        expandButton.hidden = true;

        const note = document.createElement('p');
        note.className = 'card-text';
        const noteText = document.createElement('small');
        noteText.className = 'text-body-secondary review-date';
        const reviewDate = createdAt ? new Date(createdAt) : null;
        noteText.textContent = reviewDate && !Number.isNaN(reviewDate.getTime())
            ? reviewDate.toLocaleDateString('es-MX')
            : 'Tu reseña.';
        note.appendChild(noteText);

        description.append(title, review, expandButton, note);

        const ratingSection = document.createElement('div');
        ratingSection.className = 'tarjeta-juego__calificacion';

        const ratingTitle = document.createElement('h6');
        ratingTitle.className = 'card-title';
        ratingTitle.textContent = 'Tu calificación';

        const ratingDescription = document.createElement('p');
        ratingDescription.className = 'card-text';
        ratingDescription.textContent = `Calificación: ${rating} de 5 estrellas`;

        const wrap = document.createElement('div');
        wrap.className = 'wrap';
        const stars = document.createElement('div');
        stars.className = 'stars';

        const ratingName = `calificacion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const starClasses = ['one-star', 'two-star', 'three-star', 'four-star', 'five-star'];

        starClasses.forEach((starClass, index) => {
            const value = index + 1;
            const label = document.createElement('label');
            label.className = 'rate';
            label.setAttribute('aria-label', `${value} ${value === 1 ? 'estrella' : 'estrellas'}`);

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = ratingName;
            input.value = String(value);
            input.checked = value === rating;
            input.disabled = true;

            const face = document.createElement('div');
            face.className = 'face';

            const icon = document.createElement('i');
            icon.className = `${value <= rating ? 'fas' : 'far'} fa-star star ${starClass}`;

            label.append(input, face, icon);
            stars.appendChild(label);
        });

        wrap.appendChild(stars);
        ratingSection.append(ratingTitle, ratingDescription, wrap);
        cardBody.append(description, ratingSection);
        contentColumn.appendChild(cardBody);
        row.append(imageColumn, contentColumn);
        article.appendChild(row);

        return article;
    }

    // Inicializar renderizado de reseñas guardadas al cargar
    renderReviews();
    catalogGamesPromise = loadCatalogGames();
})();