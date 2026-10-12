(() => {
    // Clave que identifica las reseñas guardadas en el almacenamiento del navegador.
    const STORAGE_KEY = 'resenias-videojuegos';

    // Busca los elementos de la página que utiliza esta funcionalidad.
    const button = document.getElementById('mostrar-formulario-resenia');
    const form = document.getElementById('formulario-resenia');
    const cancelButton = document.getElementById('cancelar-resenia');
    const reviewsList = document.getElementById('lista-resenias');

    // Detiene la inicialización y avisa si falta alguna parte necesaria del HTML.
    if (!button || !form || !cancelButton || !reviewsList) {
        throw new Error('No se encontraron los elementos necesarios para agregar reseñas.');
    }

    // Recupera las reseñas previas; si los datos no se pueden leer, evita permitir
    // nuevos registros para no reemplazar accidentalmente información guardada.
    let savedReviews;
    try {
        savedReviews = loadReviews();
    } catch (error) {
        console.error('No se pudieron cargar las reseñas guardadas.', error);
        alert('No se pudieron cargar las reseñas guardadas. Revisa el almacenamiento del navegador.');
        button.disabled = true;
        return;
    }

    // Limpia los campos y devuelve los iconos de las estrellas a su apariencia inicial.
    function resetForm() {
        form.reset();
        form.querySelectorAll('.rate .star').forEach((star) => {
            star.classList.remove('fas', 'rate-active', 'star-over');
            star.classList.add('far');
        });
    }

    // Muestra u oculta el formulario y actualiza su estado accesible.
    button.addEventListener('click', () => {
        form.hidden = !form.hidden;
        button.setAttribute('aria-expanded', String(!form.hidden));

        // Coloca el cursor en el primer campo cuando se abre el formulario.
        if (!form.hidden) {
            form.querySelector('#nombre-juego').focus();
        }
    });

    // Cancela la creación de una reseña, limpia los campos y devuelve el foco al botón.
    cancelButton.addEventListener('click', () => {
        resetForm();
        form.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        button.focus();
    });

    // Procesa el formulario y crea una tarjeta cuando todos los datos son válidos.
    form.addEventListener('submit', (event) => {
        // Evita que el navegador recargue la página al enviar el formulario.
        event.preventDefault();

        // Lee y limpia los datos escritos, y obtiene el archivo y la calificación.
        const gameName = form.querySelector('#nombre-juego').value.trim();
        const reviewText = form.querySelector('#texto-resenia').value.trim();
        const imageFile = form.querySelector('#imagen-juego').files[0];
        const ratingInput = form.querySelector('input[name="calificacion-nueva"]:checked');

        // No continúa si falta alguno de los datos obligatorios.
        if (!gameName || !reviewText || !imageFile || !ratingInput) {
            return;
        }

        // Comprueba que el archivo seleccionado tenga un tipo de imagen.
        if (!imageFile.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen para la portada del videojuego.');
            return;
        }

        // Convierte la imagen a una cadena que se puede guardar junto con la reseña.
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result !== 'string') {
                alert('No se pudo cargar la imagen seleccionada.');
                return;
            }

            // Agrupa todos los datos de la reseña en un solo objeto.
            const newReview = {
                gameName,
                reviewText,
                imageSource: reader.result,
                rating: Number(ratingInput.value)
            };

            // Primero guarda los datos; solo agrega la tarjeta si el guardado fue exitoso.
            if (!saveReview(newReview)) {
                return;
            }

            // Inserta la reseña en la página y deja el formulario listo para otro registro.
            reviewsList.appendChild(createReviewCard(newReview));

            resetForm();
            form.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.focus();
        });

        // Informa si el navegador no pudo leer el archivo seleccionado.
        reader.addEventListener('error', () => {
            alert('No se pudo leer la imagen seleccionada. Inténtalo de nuevo.');
        });
        reader.readAsDataURL(imageFile);
    });

    // Lee las reseñas guardadas y comprueba que tengan la estructura esperada.
    function loadReviews() {
        const storedReviews = localStorage.getItem(STORAGE_KEY);

        // Cuando aún no hay reseñas, empieza con una lista vacía.
        if (storedReviews === null) {
            return [];
        }

        // Convierte el JSON y valida cada reseña antes de usarla.
        const reviews = JSON.parse(storedReviews);
        if (!Array.isArray(reviews) || !reviews.every(isValidReview)) {
            throw new Error('El formato de las reseñas guardadas no es válido.');
        }

        return reviews;
    }

    // Verifica los tipos de datos, el formato de la imagen y el rango de la calificación.
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

    // Guarda la lista actualizada; devuelve false y muestra un aviso si falla el almacenamiento.
    function saveReview(review) {
        const updatedReviews = [...savedReviews, review];

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
        } catch (error) {
            console.error('No se pudo guardar la reseña en localStorage.', error);
            alert('No se pudo guardar la reseña. El almacenamiento del navegador puede estar lleno.');
            return false;
        }

        savedReviews = updatedReviews;
        return true;
    }

    // Construye una tarjeta de reseña usando elementos del DOM y texto seguro.
    function createReviewCard({ gameName, reviewText, imageSource, rating }) {
        const article = document.createElement('article');
        article.className = 'card tarjeta-juego';

        // Crea las columnas de la tarjeta: imagen a la izquierda y contenido a la derecha.
        const row = document.createElement('div');
        row.className = 'row g-0 tarjeta-juego__fila';

        const imageColumn = document.createElement('div');
        imageColumn.className = 'col-md-4 tarjeta-juego__imagen';

        const image = document.createElement('img');
        image.src = imageSource;
        image.alt = `Portada de ${gameName}`;
        imageColumn.appendChild(image);

        // Prepara el cuerpo de la tarjeta y el bloque con el nombre y la reseña.
        const contentColumn = document.createElement('div');
        contentColumn.className = 'col-md-8 tarjeta-juego__contenido';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body tarjeta-juego__cuerpo';

        const description = document.createElement('div');
        description.className = 'tarjeta-juego__descripcion';

        // textContent inserta estos valores como texto y no como código HTML.
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

        // Muestra la puntuación numérica y prepara los cinco iconos de estrellas.
        const ratingSection = document.createElement('div');
        ratingSection.className = 'tarjeta-juego__calificacion';

        const ratingTitle = document.createElement('h6');
        ratingTitle.className = 'card-title';
        ratingTitle.textContent = 'Califica tu experiencia';

        const ratingDescription = document.createElement('p');
        ratingDescription.className = 'card-text';
        ratingDescription.textContent = `Calificación: ${rating} de 5 estrellas`;

        const wrap = document.createElement('div');
        wrap.className = 'wrap';
        const stars = document.createElement('div');
        stars.className = 'stars';

        // Cada tarjeta usa un nombre de grupo único para que sus radios sean independientes.
        const ratingName = `calificacion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const starClasses = ['one-star', 'two-star', 'three-star', 'four-star', 'five-star'];

        // Crea los cinco controles y marca visualmente las estrellas de la calificación elegida.
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

            const face = document.createElement('div');
            face.className = 'face';

            const icon = document.createElement('i');
            icon.className = `${value <= rating ? 'fas' : 'far'} fa-star star ${starClass}`;

            label.append(input, face, icon);
            stars.appendChild(label);
        });

        // Ensambla los elementos ya creados y devuelve la tarjeta terminada.
        wrap.appendChild(stars);
        ratingSection.append(ratingTitle, ratingDescription, wrap);
        cardBody.append(description, ratingSection);
        contentColumn.appendChild(cardBody);
        row.append(imageColumn, contentColumn);
        article.appendChild(row);

        return article;
    }

    // Al iniciar la página, vuelve a dibujar todas las reseñas recuperadas del almacenamiento.
    savedReviews.forEach((review) => {
        reviewsList.appendChild(createReviewCard(review));
    });
})();
