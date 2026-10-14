(() => {
    const STORAGE_KEY = 'resenias-videojuegos';
    const INITIAL_GAME_REMOVED_KEY = 'juego-inicial-eliminado';

    const button = document.getElementById('mostrar-formulario-resenia');
    const form = document.getElementById('formulario-resenia');
    const cancelButton = document.getElementById('cancelar-resenia');
    const reviewsList = document.getElementById('lista-resenias');

    if (!button || !form || !cancelButton || !reviewsList) {
        throw new Error('No se encontraron los elementos necesarios para agregar reseñas.');
    }

    let savedReviews;
    let editingIndex = null; // Variable para controlar si estamos editando una reseña

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
            const gameName = card.querySelector('.card-title')?.textContent.trim() || 'este juego';
            if (!window.confirm(`¿Eliminar la tarjeta de ${gameName}?`)) {
                return;
            }

            if (card.hasAttribute('data-juego-inicial')) {
                try {
                    localStorage.setItem(INITIAL_GAME_REMOVED_KEY, 'true');
                } catch (error) {
                    console.error('No se pudo guardar la eliminación de la tarjeta.', error);
                    alert('No se pudo eliminar la tarjeta. Revisa el almacenamiento del navegador.');
                    return;
                }
                card.remove();
                return;
            }

            const reviewIndex = Number(card.dataset.reviewIndex);
            if (!Number.isInteger(reviewIndex) || reviewIndex < 0 || reviewIndex >= savedReviews.length) {
                console.error('No se pudo identificar la reseña que se intentó eliminar.');
                alert('No se pudo eliminar la reseña. Recarga la página e inténtalo de nuevo.');
                return;
            }

            const updatedReviews = savedReviews.filter((_, index) => index !== reviewIndex);
            if (!saveReviews(updatedReviews)) {
                return;
            }

            renderReviews();
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
            
            // Marcar la estrella correspondiente
            const ratingInput = form.querySelector(`input[name="calificacion-nueva"][value="${reviewToEdit.rating}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
            }

            editingIndex = reviewIndex; // Guardamos el índice que estamos editando
            form.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            form.querySelector('#nombre-juego').focus();
            
            // Desplazar suavemente hacia el formulario
            form.scrollIntoView({ behavior: 'smooth' });
        }
    });

    function resetForm() {
        form.reset();
        editingIndex = null; // Limpiamos el estado de edición
        form.querySelectorAll('.rate .star').forEach((star) => {
            star.classList.remove('fas', 'rate-active', 'star-over');
            star.classList.add('far');
        });
    }

    button.addEventListener('click', () => {
        form.hidden = !form.hidden;
        button.setAttribute('aria-expanded', String(!form.hidden));
        if (!form.hidden) {
            editingIndex = null; // Asegurar modo creación si se abre desde el botón principal
            form.reset();
            form.querySelector('#nombre-juego').focus();
        }
    });

    cancelButton.addEventListener('click', () => {
        resetForm();
        form.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        button.focus();
    });

    // Procesa el formulario (Crear o Actualizar)
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const gameName = form.querySelector('#nombre-juego').value.trim();
        const reviewText = form.querySelector('#texto-resenia').value.trim();
        const imageFile = form.querySelector('#imagen-juego').files[0];
        const ratingInput = form.querySelector('input[name="calificacion-nueva"]:checked');

        if (!gameName || !reviewText || !ratingInput) {
            alert('Por favor, completa los campos obligatorios y selecciona una calificación.');
            return;
        }

        const rating = Number(ratingInput.value);

        // Si estamos editando y no seleccionamos nueva imagen, mantenemos la anterior
        if (editingIndex !== null && !imageFile) {
            const updatedReview = {
                gameName,
                reviewText,
                imageSource: savedReviews[editingIndex].imageSource,
                rating
            };

            savedReviews[editingIndex] = updatedReview;
            if (!saveReviews(savedReviews)) return;

            renderReviews();
            resetForm();
            form.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.focus();
            return;
        }

        // Si es creación o se seleccionó una nueva imagen
        if (!imageFile) {
            alert('Selecciona un archivo de imagen para la portada del videojuego.');
            return;
        }

        if (!imageFile.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen válido.');
            return;
        }

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
            resetForm();
            form.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.focus();
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
            && review.rating <= 5;
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

    function createReviewCard({ gameName, reviewText, imageSource, rating }, reviewIndex) {
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
        imageColumn.appendChild(image);

        const contentColumn = document.createElement('div');
        contentColumn.className = 'col-md-8 tarjeta-juego__contenido';

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