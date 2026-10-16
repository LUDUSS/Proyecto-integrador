(() => {
    // -----------------------------------------------------------------------
    // RESEÑAS DE LA COMUNIDAD
    // Datos fijos que simulan reseñas escritas por otros usuarios.
    // Agrega más objetos aquí para mostrar más tarjetas.
    // -----------------------------------------------------------------------
    const RESENAS_COMUNIDAD = [
        {
            usuario: "Abraham",
            gameName: "Elden Ring",
            reviewText: "Una obra maestra del género soulslike. Su mundo abierto está lleno de secretos y jefes memorables que te mantienen enganchado por horas.",
            imageSource: "./IMAGE/juegos/elden.jpg",
            rating: 5,
            fecha: "12 de marzo, 2026"
        },
        {
            usuario: "Neto",
            gameName: "Baldur's Gate 3",
            reviewText: "Cada rincón del mapa es un descubrimiento nuevo. Las decisiones que tomas realmente cambian la historia. Un RPG imprescindible.",
            imageSource: "./IMAGE/juegos/baldurs.jpg",
            rating: 5,
            fecha: "10 de marzo, 2026"
        },
        {
            usuario: "Kula",
            gameName: "The Legend of Zelda: Tears of the Kingdom",
            reviewText: "La mecánica de construcción transforma por completo la experiencia. Nunca pensé que pudiera pasar tantas horas armando vehículos.",
            imageSource: "./IMAGE/juegos/zelda.jpg",
            rating: 5,
            fecha: "8 de marzo, 2026"
        },
        {
            usuario: "Jinx",
            gameName: "Gran Turismo 7",
            reviewText: "La simulación es muy fuerte. Los detalles de cada coche son impresionantes. Ideal para los amantes de la conducción.",
            imageSource: "./IMAGE/juegos/granturismo.jpg",
            rating: 4,
            fecha: "5 de marzo, 2026"
        },
        {
            usuario: "Diego",
            gameName: "Hollow Knight",
            reviewText: "Metroidvania con un estilo artístico precioso, controles precisos y una atmósfera inigualable. Un imprescindible.",
            imageSource: "./IMAGE/juegos/hollow.jpg",
            rating: 5,
            fecha: "2 de marzo, 2026"
        },
        {
            usuario: "María",
            gameName: "Red Dead Redemption 2",
            reviewText: "Una historia profunda y un mundo abierto increíblemente detallado. Cada rincón cuenta algo. Una experiencia inolvidable.",
            imageSource: "./IMAGE/juegos/rdr2.jpg",
            rating: 5,
            fecha: "28 de febrero, 2026"
        }
    ];

    // Contenedor donde se insertarán las tarjetas
    const reviewsList = document.getElementById('lista-resenas-comunidad');

    if (!reviewsList) {
        throw new Error('No se encontró el contenedor #lista-resenas-comunidad.');
    }

    // -----------------------------------------------------------------------
    // Crea la tarjeta HTML para una reseña de la comunidad.
    // Es prácticamente la misma estructura que las tarjetas de perfil,
    // pero SIN botones de editar/eliminar y con estrellas deshabilitadas.
    // -----------------------------------------------------------------------
    function createCommunityCard({ usuario, gameName, reviewText, imageSource, rating, fecha }) {
        const article = document.createElement('article');
        article.className = 'card tarjeta-juego';

        const row = document.createElement('div');
        row.className = 'row g-0 tarjeta-juego__fila';

        // Columna de la imagen
        const imageColumn = document.createElement('div');
        imageColumn.className = 'col-md-4 tarjeta-juego__imagen';

        const image = document.createElement('img');
        image.src = imageSource;
        image.alt = `Portada de ${gameName}`;
        imageColumn.appendChild(image);

        // Columna de contenido
        const contentColumn = document.createElement('div');
        contentColumn.className = 'col-md-8 tarjeta-juego__contenido';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body tarjeta-juego__cuerpo';

        // Descripción
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
        noteText.textContent = `Reseña de ${usuario} · ${fecha}`;
        note.appendChild(noteText);

        description.append(title, review, note);

        // Calificación
        const ratingSection = document.createElement('div');
        ratingSection.className = 'tarjeta-juego__calificacion';

        const ratingTitle = document.createElement('h6');
        ratingTitle.className = 'card-title';
        ratingTitle.textContent = 'Calificación del usuario';

        const ratingDescription = document.createElement('p');
        ratingDescription.className = 'card-text';
        ratingDescription.textContent = `${rating} de 5 estrellas`;

        const wrap = document.createElement('div');
        wrap.className = 'wrap';
        const stars = document.createElement('div');
        stars.className = 'stars';

        const starClasses = ['one-star', 'two-star', 'three-star', 'four-star', 'five-star'];

        starClasses.forEach((starClass, index) => {
            const value = index + 1;
            const label = document.createElement('label');
            label.className = 'rate';
            label.setAttribute('aria-label', `${value} de 5 estrellas`);

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `comunidad-${gameName}-${usuario}`;
            input.value = String(value);
            input.checked = value === rating;
            input.disabled = true;   // ← no se puede interactuar

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

    // -----------------------------------------------------------------------
    // Renderiza todas las reseñas de la comunidad.
    // -----------------------------------------------------------------------
    RESENAS_COMUNIDAD.forEach((review) => {
        reviewsList.appendChild(createCommunityCard(review));
    });
})();