(() => {
    // Clave que identifica las reseñas guardadas y eliminadas en el almacenamiento del navegador.
    const STORAGE_KEY = 'resenias-videojuegos';
    const INITIAL_GAME_REMOVED_KEY = 'juego-inicial-eliminado';
    // Busca los elementos de la página que utiliza esta funcionalidad.
    const button = document.getElementById('mostrar-formulario-resenia');
    const form = document.getElementById('formulario-resenia');
    const modalElement = document.getElementById('modal-resenia');
    const reviewsList = document.getElementById('lista-resenias');
    const modalTitle = document.getElementById('modal-resenia-titulo');
    const imageInput = document.getElementById('imagen-juego');
    const imagePreview = document.getElementById('imagen-juego-preview');
    const imageCrop = document.getElementById('imagen-juego-encuadre');
    const imageHelp = document.getElementById('imagen-juego-ayuda');
    const nameInput = document.getElementById('nombre-juego');
    const reviewInput = document.getElementById('texto-resenia');
    const ratingInputs = form
        ? Array.from(form.querySelectorAll('input[name="calificacion-nueva"]'))
        : [];
    const nameFeedback = document.getElementById('nombre-juego-feedback');
    const reviewFeedback = document.getElementById('texto-resenia-feedback');
    const imageFeedback = document.getElementById('imagen-juego-feedback');
    const ratingFeedback = document.getElementById('calificacion-feedback');
    // Detiene la inicialización y avisa si falta alguna parte necesaria del HTML.
    if (!button || !form || !modalElement || !modalTitle || !reviewsList
        || !imageInput || !imagePreview || !imageCrop || !imageHelp
        || !nameInput || !reviewInput || !nameFeedback || !reviewFeedback || !imageFeedback
        || !ratingFeedback || ratingInputs.length === 0) {
        throw new Error('No se encontraron los elementos necesarios para agregar reseñas.');
    }

    const reviewModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
        throw new Error('No se encontró el botón para guardar la reseña.');
    }

    // Recupera las reseñas previas; si los datos no se pueden leer, evita permitir
    // nuevos registros para no reemplazar accidentalmente información guardada.
    let savedReviews;
    let editingIndex = null; // Variable para controlar si estamos editando una reseña
    let imagePosition = { x: 50, y: 50 };
    let previewObjectUrl = null;

    try {
        savedReviews = loadReviews();

        if (localStorage.getItem(INITIAL_GAME_REMOVED_KEY) === 'true') {
            reviewsList.querySelector('[data-juego-inicial]')?.remove();
        }
    } catch (error) {
        console.error('No se pudieron cargar las reseñas guardadas.', error);
        alert('No se pudieron cargar las reseñas guardadas. Revisa el almacenamiento del navegador.');
        button.disabled = true;
        return;
    }

    // Función para renderizar todas las reseñas nuevamente
    function renderReviews() {
        // Mantiene la tarjeta inicial si existe y limpia el resto de reseñas guardadas
        const initialCard = reviewsList.querySelector('[data-juego-inicial]');
        reviewsList.innerHTML = '';
        if (initialCard) {
            reviewsList.appendChild(initialCard);
        }

        savedReviews.forEach((review, index) => {
            reviewsList.appendChild(createReviewCard(review, index));
        });
    }

    // Manejador de eventos para Eliminar y Editar
    reviewsList.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const deleteButton = event.target.closest('.btn-accion.eliminar');
        const editButton = event.target.closest('.btn-accion.editar');
        const card = event.target.closest('.tarjeta-juego');

        if (!card) {
            return;
        }

        // ACCIÓN: ELIMINAR
        if (deleteButton) {
            const gameName =
                card.querySelector('.card-title')?.textContent.trim() || 'este juego';

            Swal.fire({
                title: "Eliminar",
                text: `¿Estás seguro que quieres eliminar ${gameName}?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                reverseButtons: true
            }).then((result) => {

                // Solo eliminar si el usuario confirma
                if (!result.isConfirmed) {
                    return;
                }

                if (card.hasAttribute('data-juego-inicial')) {
                    try {
                        localStorage.setItem(INITIAL_GAME_REMOVED_KEY, 'true');
                    } catch (error) {
                        console.error(
                            'No se pudo guardar la eliminación de la tarjeta.',
                            error
                        );

                        Swal.fire({
                            title: "Error",
                            text: "No se pudo eliminar la tarjeta. Revisa el almacenamiento del navegador.",
                            icon: "error"
                        });

                        return;
                    }

                    card.remove();
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

                const updatedReviews = savedReviews.filter(
                    (_, index) => index !== reviewIndex
                );

                if (!saveReviews(updatedReviews)) {
                    return;
                }

                renderReviews();
                return;
            });

            return;
        }
        // ACCIÓN: EDITAR
        if (editButton) {
            if (card.hasAttribute('data-juego-inicial')) {
                alert('La tarjeta predeterminada no se puede editar.');
                return;
            }

            const reviewIndex = Number(card.dataset.reviewIndex);
            const reviewToEdit = savedReviews[reviewIndex];

            if (!reviewToEdit) return;

            // Cargar datos en el formulario
            form.querySelector('#nombre-juego').value = reviewToEdit.gameName;
            form.querySelector('#texto-resenia').value = reviewToEdit.reviewText;
            imageInput.value = '';
            imageInput.required = false;
            imagePreview.src = reviewToEdit.imageSource;
            imagePosition = getImagePosition(reviewToEdit.imagePosition);
            updateImagePosition();
            imageCrop.hidden = false;
            imageHelp.hidden = false;

            // Marcar la estrella correspondiente
            const ratingInput = form.querySelector(`input[name="calificacion-nueva"][value="${reviewToEdit.rating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }

            editingIndex = reviewIndex; // Guardamos el índice que estamos editando
            modalTitle.textContent = 'Editar reseña';
            submitButton.textContent = 'Guardar cambios';
            reviewModal.show(editButton);
        }
    });

    // Actualiza el encuadre mostrado en la vista previa con porcentajes persistibles.
    function updateImagePosition() {
        imagePreview.style.objectPosition = `${imagePosition.x}% ${imagePosition.y}%`;
    }

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

    // Libera la URL temporal que se usa para mostrar una imagen recién seleccionada.
    function clearPreviewObjectUrl() {
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = null;
        }
    }

    // Al cambiar de archivo, carga su vista previa y comienza con el encuadre centrado.
    imageInput.addEventListener('change', () => {
        const imageFile = imageInput.files[0];
        if (!imageFile) {
            return;
        }

        clearPreviewObjectUrl();
        if (!imageFile.type.startsWith('image/')) {
            imageCrop.hidden = true;
            imageHelp.hidden = true;
            imagePreview.removeAttribute('src');
            return;
        }

        previewObjectUrl = URL.createObjectURL(imageFile);
        imagePreview.src = previewObjectUrl;
        imagePosition = { x: 50, y: 50 };
        updateImagePosition();
        imageCrop.hidden = false;
        imageHelp.hidden = false;
    });

    // Permite arrastrar el recorte con mouse, lápiz o pantalla táctil.
    let activeDrag = null;
    imageCrop.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || imagePreview.naturalWidth === 0) {
            return;
        }

        const bounds = imageCrop.getBoundingClientRect();
        const scale = Math.max(
            bounds.width / imagePreview.naturalWidth,
            bounds.height / imagePreview.naturalHeight
        );

        activeDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPosition: { ...imagePosition },
            overflowX: Math.max(0, imagePreview.naturalWidth * scale - bounds.width),
            overflowY: Math.max(0, imagePreview.naturalHeight * scale - bounds.height)
        };
        imageCrop.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    imageCrop.addEventListener('pointermove', (event) => {
        if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
            return;
        }

        imagePosition = {
            x: activeDrag.overflowX
                ? clampPosition(
                    activeDrag.startPosition.x
                        - ((event.clientX - activeDrag.startX) / activeDrag.overflowX) * 100
                )
                : activeDrag.startPosition.x,
            y: activeDrag.overflowY
                ? clampPosition(
                    activeDrag.startPosition.y
                        - ((event.clientY - activeDrag.startY) / activeDrag.overflowY) * 100
                )
                : activeDrag.startPosition.y
        };
        updateImagePosition();
    });

    function clampPosition(position) {
        return Math.min(100, Math.max(0, position));
    }

    function finishImageDrag(event) {
        if (activeDrag?.pointerId === event.pointerId) {
            activeDrag = null;
        }
    }

    imageCrop.addEventListener('pointerup', finishImageDrag);
    imageCrop.addEventListener('pointercancel', finishImageDrag);
    imageCrop.addEventListener('lostpointercapture', finishImageDrag);

    // Las flechas permiten ajustar el encuadre sin arrastrar con el puntero.
    imageCrop.addEventListener('keydown', (event) => {
        const step = event.shiftKey ? 10 : 2;
        const direction = {
            ArrowLeft: { x: step, y: 0 },
            ArrowRight: { x: -step, y: 0 },
            ArrowUp: { x: 0, y: step },
            ArrowDown: { x: 0, y: -step }
        }[event.key];

        if (!direction) {
            return;
        }

        event.preventDefault();
        imagePosition = {
            x: clampPosition(imagePosition.x + direction.x),
            y: clampPosition(imagePosition.y + direction.y)
        };
        updateImagePosition();
    });

    function resetForm() {
        form.reset();
        clearPreviewObjectUrl();
        imageInput.required = true;
        imagePreview.removeAttribute('src');
        imageCrop.hidden = true;
        imageHelp.hidden = true;
        imagePosition = { x: 50, y: 50 };
        activeDrag = null;
        // Al reiniciar el formulario, dejamos de editar una reseña existente.
        editingIndex = null;
        // Quitamos los estilos Bootstrap que indican campos válidos o inválidos.
        [nameInput, reviewInput, imageInput, ...ratingInputs].forEach((input) => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        // Borramos los mensajes de validación y ocultamos sus contenedores.
        [nameFeedback, reviewFeedback, imageFeedback, ratingFeedback].forEach((feedback) => {
            feedback.textContent = '';
            feedback.classList.remove('d-block');
        });
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
        button.setAttribute('aria-expanded', 'false');
    });

    button.addEventListener('click', () => {
        resetForm();
        reviewModal.show(button);
        modalElement.addEventListener('shown.bs.modal', () => nameInput.focus(), { once: true });
    });

    // Procesa el formulario (Crear o Actualizar)
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const gameName = form.querySelector('#nombre-juego').value.trim();
        const reviewText = form.querySelector('#texto-resenia').value.trim();
        const imageFile = imageInput.files[0];
        const ratingInput = form.querySelector('input[name="calificacion-nueva"]:checked');
        let isValid = true;

        [nameInput, reviewInput, imageInput, ...ratingInputs].forEach((input) => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        [nameFeedback, reviewFeedback, imageFeedback, ratingFeedback].forEach((feedback) => {
            feedback.textContent = '';
            feedback.classList.remove('d-block');
        });

        if (gameName.length < 3 || gameName.length > 50) {
            nameFeedback.textContent = gameName
                ? (gameName.length < 3
                    ? 'El nombre del videojuego es muy corto (mínimo 3 caracteres).'
                    : 'El nombre del videojuego no puede superar los 100 caracteres.')
                : 'El nombre del videojuego no puede estar vacío.';
            nameInput.classList.add('is-invalid');
            isValid = false;
        } else {
            nameInput.classList.add('is-valid');
        }

        if (!reviewText || reviewText.length > 1000) {
            reviewFeedback.textContent = reviewText
                ? 'La reseña no puede superar los 1000 caracteres.'
                : 'El campo reseña no puede estar vacío.';
            reviewInput.classList.add('is-invalid');
            isValid = false;
        } else {
            reviewInput.classList.add('is-valid');
        }

        if (!imageFile && editingIndex === null) {
            imageFeedback.textContent = 'Selecciona una imagen para la portada del videojuego.';
            imageInput.classList.add('is-invalid');
            isValid = false;
        } else if (imageFile && !imageFile.type.startsWith('image/')) {
            imageFeedback.textContent = 'Selecciona un archivo de imagen válido.';
            imageInput.classList.add('is-invalid');
            isValid = false;
        } else {
            imageInput.classList.add('is-valid');
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

        const rating = Number(ratingInput.value);

        // Si estamos editando y no seleccionamos nueva imagen, mantenemos la anterior
        if (editingIndex !== null && !imageFile) {
            const updatedReview = {
                gameName,
                reviewText,
                imageSource: savedReviews[editingIndex].imageSource,
                imagePosition: { ...imagePosition },
                rating
            };

            savedReviews[editingIndex] = updatedReview;
            if (!saveReviews(savedReviews)) return;

            renderReviews();
            reviewModal.hide();
            return;
        }

        // Si es creación o se seleccionó una nueva imagen
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result !== 'string') {
                alert('No se pudo cargar la imagen seleccionada.');
                return;
            }

            const newReviewData = {
                gameName,
                reviewText,
                imageSource: reader.result,
                imagePosition: { ...imagePosition },
                rating
            };

            if (editingIndex !== null) {
                // Actualizar existente con nueva imagen
                savedReviews[editingIndex] = newReviewData;
            } else {
                // Crear nueva reseña
                savedReviews.push(newReviewData);
            }

            if (!saveReviews(savedReviews)) {
                return;
            }

            renderReviews();
            reviewModal.hide();
        });

        reader.addEventListener('error', () => {
            alert('No se pudo leer la imagen seleccionada.');
        });
        reader.readAsDataURL(imageFile);
    });

    function loadReviews() {
        const storedReviews = localStorage.getItem(STORAGE_KEY);
        if (storedReviews === null) {
            return [];
        }
        const reviews = JSON.parse(storedReviews);
        if (!Array.isArray(reviews) || !reviews.every(isValidReview)) {
            throw new Error('El formato de las reseñas guardadas no es válido.');
        }
        return reviews;
    }

    function isValidReview(review) {
        return review !== null
            && typeof review === 'object'
            && typeof review.gameName === 'string'
            && typeof review.reviewText === 'string'
            && typeof review.imageSource === 'string'
            && review.imageSource.startsWith('data:image/')
            && Number.isInteger(review.rating)
            && review.rating >= 1
            && review.rating <= 5
            // comprobar la posición de una imagen dentro de la tarjeta.
            && (
                review.imagePosition === undefined
                || (
                    review.imagePosition !== null
                    && typeof review.imagePosition === 'object'
                    && Number.isFinite(review.imagePosition.x)
                    && review.imagePosition.x >= 0
                    && review.imagePosition.x <= 100
                    && Number.isFinite(review.imagePosition.y)
                    && review.imagePosition.y >= 0
                    && review.imagePosition.y <= 100
                )
            );
    }

    function saveReviews(updatedReviews) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
        } catch (error) {
            console.error('No se pudieron guardar los cambios en localStorage.', error);
            alert('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador.');
            return false;
        }
        savedReviews = updatedReviews;
        return true;
    }

    function createReviewCard(
        { gameName, reviewText, imageSource, imagePosition: savedImagePosition, rating },
        reviewIndex
    ) {
        const article = document.createElement('article');
        article.className = 'card tarjeta-juego';
        article.dataset.reviewIndex = String(reviewIndex);

        // Contenedor de botones de acción (Editar y Eliminar)
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'tarjeta-acciones';

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

        actionsContainer.append(editButton, deleteButton);
        article.appendChild(actionsContainer);

        const row = document.createElement('div');
        row.className = 'row g-0 tarjeta-juego__fila';

        const imageColumn = document.createElement('div');
        imageColumn.className = 'col-md-4 tarjeta-juego__imagen';
        const image = document.createElement('img');
        image.src = imageSource;
        image.alt = `Portada de ${gameName}`;
        const cardImagePosition = getImagePosition(savedImagePosition);
        image.style.objectPosition = `${cardImagePosition.x}% ${cardImagePosition.y}%`;
        imageColumn.appendChild(image);

        const contentColumn = document.createElement('div');
        contentColumn.className = 'col-md-12 tarjeta-juego__contenido';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body tarjeta-juego__cuerpo';

        const description = document.createElement('div');
        description.className = 'tarjeta-juego__descripcion';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = gameName;

        const review = document.createElement('p');
        review.className = 'card-text';
        review.textContent = reviewText;

        const note = document.createElement('p');
        note.className = 'card-text';
        const noteText = document.createElement('small');
        noteText.className = 'text-body-secondary';
        noteText.textContent = 'Tu reseña.';
        note.appendChild(noteText);

        description.append(title, review, note);

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
})();