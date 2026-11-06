(async () => {
    let PROFILE_STORAGE_KEY = 'ludus_visual_profile';
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
    const ABOUT_ICONS = [
        { name: 'bi-controller', label: 'Control de videojuego' },
        { name: 'bi-joystick', label: 'Joystick' },
        { name: 'bi-headset', label: 'Audí­fonos' },
        { name: 'bi-trophy', label: 'Trofeo' },
        { name: 'bi-stars', label: 'Estrellas' }
    ];
    const LINES_COLORS = [
        { value: '#ff1744', label: 'Rojo neón' },
        { value: '#39ff14', label: 'Verde neón' },
        { value: '#00f5ff', label: 'Azúl neón' },
        { value: '#ff00e5', label: 'Rosa neón' },
        { value: '#ff6d00', label: 'Naranja neón' },
        { value: '#6f00ff', label: 'Morado neón' },
        { value: '#000000', label: 'Negro' },
        { value: '#8b8484fa', label: 'Gris' },
        { value: 'transparent', label: 'Sin color' } 
    ];
    const DEFAULT_LINES_COLOR = '#8b8484fa';
    const AVATAR_PRESETS = [
        { label: 'Avatar 1', source: './IMAGE/perfil/avatar-1.png' },
        { label: 'Avatar 2', source: './IMAGE/perfil/avatar-2.png' },
        { label: 'Avatar 3', source: './IMAGE/perfil/avatar-3.png' },
        { label: 'Avatar 4', source: './IMAGE/perfil/avatar-4.png' },
        { label: 'Avatar 5', source: './IMAGE/perfil/avatar-5.png' },
        { label: 'Avatar 6', source: './IMAGE/perfil/avatar-6.png' },
        { label: 'Avatar 7', source: './IMAGE/perfil/avatar-7.png' },
        { label: 'Avatar 8', source: './IMAGE/perfil/avatar-8.png' },
        { label: 'Avatar 9', source: './IMAGE/perfil/avatar-9.png' },
        { label: 'Avatar 10', source: './IMAGE/perfil/avatar-10.png' },
        { label: 'Avatar 11', source: './IMAGE/perfil/avatar-11.png' },
        { label: 'Avatar 12', source: './IMAGE/perfil/avatar-12.png' }
    ];
    const alias = document.getElementById('perfil-alias');
    const aliasInput = document.getElementById('perfil-alias-input');
    const description = document.getElementById('perfil-descripcion');
    const descriptionInput = document.getElementById('perfil-descripcion-input');
    const aboutIcon = document.getElementById('perfil-sobre-mi-icono');
    const aboutIconSelector = document.getElementById('perfil-iconos-sobre-mi');
    const linesColorSelector = document.getElementById('perfil-colores-lineas');
    const profileContent = document.querySelector('.perfil-content');
    const editForm = document.getElementById('formulario-editar-perfil');
    const editModalElement = document.getElementById('modal-editar-perfil');
    const avatarInput = document.getElementById('perfil-avatar-input');
    const avatarImage = document.getElementById('perfil-avatar-imagen');
    const avatarPlaceholder = document.querySelector('.perfil-avatar__placeholder');
    const avatarPresets = document.getElementById('perfil-avatares-predeterminados');
    const avatarCrop = document.getElementById('perfil-avatar-recorte');
    const avatarCropImage = document.getElementById('perfil-avatar-recorte-imagen');
    const avatarHelp = document.getElementById('perfil-avatar-ayuda');
    const coverInput = document.getElementById('perfil-portada-input');
    const coverImage = document.getElementById('perfil-portada-imagen');
    const coverCrop = document.getElementById('perfil-portada-recorte');
    const coverCropImage = document.getElementById('perfil-portada-recorte-imagen');
    const coverHelp = document.getElementById('perfil-portada-ayuda');
    const message = document.getElementById('perfil-mensaje');
    const editError = document.getElementById('perfil-edicion-error');
    const totalLikes = document.getElementById('perfil-total-likes');
    const averageRating = document.getElementById('perfil-promedio-calificacion');
    const reviewedGames = document.getElementById('perfil-juegos-resenados');
    const nombreUsuario = document.getElementById('nombre-usuario');
    let localReviews = [];

    if (
        !alias || !aliasInput || !description || !descriptionInput || !aboutIcon
        || !aboutIconSelector || !linesColorSelector || !profileContent || !editForm
        || !editModalElement || !avatarInput || !avatarImage || !avatarPlaceholder
        || !avatarPresets || !avatarCrop || !avatarCropImage || !avatarHelp
        || !coverInput || !coverImage || !coverCrop || !coverCropImage || !coverHelp
        || !message || !editError || !totalLikes || !averageRating
        || !reviewedGames || !nombreUsuario
    ) {
        throw new Error('No se encontraron los elementos necesarios para mostrar el perfil.');
    }

    if (!isLoggedIn()) { requireAuth(); return; }
    let serverProfile, owner;
    const editButton = document.getElementById('editar-perfil');
    editButton.disabled = true;
    try {
        const me = await Ludus.me();
        serverProfile = await Ludus.profile();
        owner = String(me.idUsuario) === String(serverProfile.idUsuario);
        PROFILE_STORAGE_KEY += ':' + serverProfile.idUsuario;
    } catch (error) {
        message.textContent = Ludus.errorText(error);
        message.appendChild(Ludus.button('Reintentar', () => location.reload()));
        return;
    }
    editButton.hidden = !owner;
    editButton.disabled = !owner;
    const editModal = bootstrap.Modal.getOrCreateInstance(editModalElement);

    function getImagePosition(position) {
        if (
            position && Number.isFinite(position.x) && Number.isFinite(position.y)
            && position.x >= 0 && position.x <= 100
            && position.y >= 0 && position.y <= 100
        ) {
            return { x: position.x, y: position.y };
        }
        return { x: 50, y: 50 };
    }

    function loadProfile() {
        // La clave histórica no identifica propietario: no asignarla a otra cuenta.
        const storedProfile = owner ? localStorage.getItem(PROFILE_STORAGE_KEY) : null;
        if (storedProfile === null) {
            return {
                alias: serverProfile.nombre,
                description: serverProfile.sobreMi || '',
                aboutIcon: 'bi-controller',
                'lines-color': DEFAULT_LINES_COLOR,
                avatar: '',
                avatarPosition: { x: 50, y: 50 },
                cover: '',
                coverPosition: { x: 50, y: 50 }
            };
        }

        const profile = JSON.parse(storedProfile);
        if (
            typeof profile !== 'object' || profile === null
            || typeof profile.alias !== 'string'
            || typeof profile.avatar !== 'string'
            || typeof profile.cover !== 'string'
            || (profile.description !== undefined && typeof profile.description !== 'string')
        ) {
            throw new Error('El formato del perfil guardado no es válido.');
        }

        return {
            alias: serverProfile.nombre,
            description: serverProfile.sobreMi || '',
            aboutIcon: ABOUT_ICONS.some((icon) => icon.name === profile.aboutIcon)
                ? profile.aboutIcon
                : 'bi-controller',
            'lines-color': LINES_COLORS.some((color) => color.value === profile['lines-color'])
                ? profile['lines-color']
                : DEFAULT_LINES_COLOR,
            avatar: profile.avatar,
            avatarPosition: getImagePosition(profile.avatarPosition),
            cover: profile.cover,
            coverPosition: getImagePosition(profile.coverPosition)
        };
    }

    function saveProfile(updatedProfile) {
        try {
            const {alias, description, ...visual} = updatedProfile;
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({...visual, alias: '', description: ''}));
            message.textContent = '';
            return true;
        } catch (error) {
            console.error('No se pudo guardar el perfil en el navegador.', error);
            editError.textContent = 'No se pudieron guardar los cambios. Revisa el espacio disponible en el navegador.';
            editError.hidden = false;
            return false;
        }
    }

    function showProfile(profile) {
        nombreUsuario.textContent = serverProfile.nombre;
        alias.textContent = profile.alias || 'Jugador';
        description.textContent = profile.description || 'Aún no has agregado una descripción. Cuéntanos un poco sobre ti.';
        aboutIcon.className = `bi ${profile.aboutIcon}`;
        profileContent.style.setProperty('--lines-color', profile['lines-color']);

        avatarImage.hidden = !profile.avatar;
        avatarPlaceholder.hidden = Boolean(profile.avatar);
        if (profile.avatar) {
            avatarImage.src = profile.avatar;
            avatarImage.style.objectPosition = `${profile.avatarPosition.x}% ${profile.avatarPosition.y}%`;
        } else {
            avatarImage.removeAttribute('src');
        }

        coverImage.hidden = !profile.cover;
        if (profile.cover) {
            coverImage.src = profile.cover;
            coverImage.style.objectPosition = `${profile.coverPosition.x}% ${profile.coverPosition.y}%`;
        } else {
            coverImage.removeAttribute('src');
        }
    }

    function showCropPreview(element, image, help, source, position) {
        element.hidden = !source;
        help.hidden = !source;
        if (!source) {
            image.removeAttribute('src');
            return;
        }
        image.src = source;
        image.style.objectPosition = `${position.x}% ${position.y}%`;
    }

    let profile;
    try {
        profile = loadProfile();
        showProfile(profile);
    } catch (error) {
        console.error('No se pudo cargar el perfil guardado.', error);
        message.textContent = 'No se pudo cargar tu perfil guardado.';
        profile = {
            alias: serverProfile.nombre,
            description: serverProfile.sobreMi || '',
            aboutIcon: 'bi-controller',
            'lines-color': DEFAULT_LINES_COLOR,
            avatar: '',
            avatarPosition: { x: 50, y: 50 },
            cover: '',
            coverPosition: { x: 50, y: 50 }
        };
        showProfile(profile);
    }

    let avatarPosition = { ...profile.avatarPosition };
    let coverPosition = { ...profile.coverPosition };
    let pendingAvatar = null;
    let pendingCover = null;
    let avatarSelection = Promise.resolve(null);
    let coverSelection = Promise.resolve(null);
    let avatarReadVersion = 0;
    let coverReadVersion = 0;
    let selectedAboutIcon = profile.aboutIcon;
    let selectedLinesColor = profile['lines-color'];

    function renderAboutIconOptions() {
        ABOUT_ICONS.forEach(({ name, label }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'perfil-icono-opcion';
            button.dataset.icon = name;
            button.setAttribute('aria-label', label);
            button.title = label;

            const icon = document.createElement('i');
            icon.className = `bi ${name}`;
            icon.setAttribute('aria-hidden', 'true');
            button.appendChild(icon);
            aboutIconSelector.appendChild(button);
        });
    }

    function updateSelectedAboutIcon() {
        aboutIconSelector.querySelectorAll('.perfil-icono-opcion').forEach((button) => {
            const isSelected = button.dataset.icon === selectedAboutIcon;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
    }

    renderAboutIconOptions();
    aboutIconSelector.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const option = event.target.closest('.perfil-icono-opcion');
        if (!(option instanceof HTMLButtonElement)) {
            return;
        }
        selectedAboutIcon = option.dataset.icon || 'bi-controller';
        updateSelectedAboutIcon();
    });

    function renderLinesColorOptions() {
        LINES_COLORS.forEach(({ value, label }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'perfil-color-linea';
            button.dataset.color = value;
            button.style.setProperty('--swatch-color', value);
            button.setAttribute('aria-label', label);
            button.title = label;

            const swatch = document.createElement('span');
            swatch.className = 'perfil-color-linea__muestra';
            swatch.style.setProperty('--swatch-color', value);
            swatch.setAttribute('aria-hidden', 'true');
            button.appendChild(swatch);
            linesColorSelector.appendChild(button);
        });
    }

    function updateSelectedLinesColor() {
        linesColorSelector.querySelectorAll('.perfil-color-linea').forEach((button) => {
            const isSelected = button.dataset.color === selectedLinesColor;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
    }

    renderLinesColorOptions();
    linesColorSelector.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const option = event.target.closest('.perfil-color-linea');
        if (!(option instanceof HTMLButtonElement)) {
            return;
        }
        selectedLinesColor = option.dataset.color || DEFAULT_LINES_COLOR;
        updateSelectedLinesColor();
    });

    function createCropper(element, image, getPosition, setPosition) {
        let activeDrag = null;

        function updatePosition() {
            const position = getPosition();
            image.style.objectPosition = `${position.x}% ${position.y}%`;
        }

        function clampPosition(position) {
            return Math.min(100, Math.max(0, position));
        }

        element.addEventListener('pointerdown', (event) => {
            if (!event.isPrimary || image.naturalWidth === 0) {
                return;
            }

            const bounds = element.getBoundingClientRect();
            const scale = Math.max(
                bounds.width / image.naturalWidth,
                bounds.height / image.naturalHeight
            );
            activeDrag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startPosition: { ...getPosition() },
                overflowX: Math.max(0, image.naturalWidth * scale - bounds.width),
                overflowY: Math.max(0, image.naturalHeight * scale - bounds.height)
            };
            element.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        element.addEventListener('pointermove', (event) => {
            if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
                return;
            }
            setPosition({
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
            });
            updatePosition();
        });

        function finishDrag(event) {
            if (activeDrag?.pointerId === event.pointerId) {
                activeDrag = null;
            }
        }

        element.addEventListener('pointerup', finishDrag);
        element.addEventListener('pointercancel', finishDrag);
        element.addEventListener('lostpointercapture', finishDrag);
        element.addEventListener('keydown', (event) => {
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
            const position = getPosition();
            setPosition({
                x: clampPosition(position.x + direction.x),
                y: clampPosition(position.y + direction.y)
            });
            updatePosition();
        });
    }

    createCropper(
        avatarCrop,
        avatarCropImage,
        () => avatarPosition,
        (position) => { avatarPosition = position; }
    );
    createCropper(
        coverCrop,
        coverCropImage,
        () => coverPosition,
        (position) => { coverPosition = position; }
    );

    function renderAvatarPresets() {
        AVATAR_PRESETS.forEach(({ label, source }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'perfil-avatar-preset';
            button.disabled = true;
            button.dataset.avatarPreset = source;
            button.setAttribute('aria-label', `Usar ${label}`);

            const preview = document.createElement('span');
            preview.className = 'perfil-avatar-preset__vista';
            const placeholder = document.createElement('i');
            placeholder.className = 'bi bi-person-fill';
            placeholder.setAttribute('aria-hidden', 'true');
            const image = document.createElement('img');
            image.alt = '';
            image.hidden = true;
            preview.append(placeholder, image);

            const caption = document.createElement('span');
            caption.className = 'perfil-avatar-preset__nombre';
            caption.textContent = label;
            button.append(preview, caption);

            image.addEventListener('load', () => {
                image.hidden = false;
                placeholder.hidden = true;
                button.disabled = false;
            });
            image.addEventListener('error', () => {
                image.hidden = true;
                button.disabled = true;
            });
            image.src = source;
            avatarPresets.appendChild(button);
        });
    }

    renderAvatarPresets();

    function updateSelectedPreset() {
        const selectedSource = pendingAvatar || profile.avatar;
        avatarPresets.querySelectorAll('.perfil-avatar-preset').forEach((button) => {
            const isSelected = button.dataset.avatarPreset === selectedSource;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
    }

    avatarPresets.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const preset = event.target.closest('.perfil-avatar-preset');
        if (!(preset instanceof HTMLButtonElement) || preset.disabled) {
            return;
        }

        pendingAvatar = preset.dataset.avatarPreset || null;
        avatarInput.value = '';
        avatarReadVersion += 1;
        avatarSelection = Promise.resolve(null);
        avatarPosition = { x: 50, y: 50 };
        showCropPreview(avatarCrop, avatarCropImage, avatarHelp, pendingAvatar, avatarPosition);
        updateSelectedPreset();
    });

    function readImage(input) {
        const file = input.files?.[0];
        if (!file) {
            return Promise.resolve(null);
        }
        if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('Selecciona un archivo de imagen válido.'));
        }
        if (file.size > MAX_IMAGE_SIZE) {
            return Promise.reject(new Error('Cada imagen debe pesar menos de 2 MB.'));
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (typeof reader.result !== 'string') {
                    reject(new Error('No se pudo cargar una de las imágenes seleccionadas.'));
                    return;
                }
                resolve(reader.result);
            });
            reader.addEventListener('error', () => {
                reject(new Error('No se pudo leer una de las imágenes seleccionadas.'));
            });
            reader.readAsDataURL(file);
        });
    }

    function handleImageSelection(input, imageKind) {
        const isAvatar = imageKind === 'avatar';
        const readVersion = isAvatar ? ++avatarReadVersion : ++coverReadVersion;
        const selection = readImage(input);
        if (isAvatar) {
            avatarSelection = selection;
        } else {
            coverSelection = selection;
        }

        selection.then((source) => {
            if (readVersion !== (isAvatar ? avatarReadVersion : coverReadVersion)) {
                return;
            }
            if (!source) {
                return;
            }
            if (isAvatar) {
                pendingAvatar = source;
                avatarPosition = { x: 50, y: 50 };
                showCropPreview(avatarCrop, avatarCropImage, avatarHelp, source, avatarPosition);
                updateSelectedPreset();
            } else {
                pendingCover = source;
                coverPosition = { x: 50, y: 50 };
                showCropPreview(coverCrop, coverCropImage, coverHelp, source, coverPosition);
            }
            editError.textContent = '';
            editError.hidden = true;
        }).catch((error) => {
            if (readVersion !== (isAvatar ? avatarReadVersion : coverReadVersion)) {
                return;
            }
            editError.textContent = error instanceof Error
                ? error.message
                : 'No se pudo procesar una imagen seleccionada.';
            editError.hidden = false;
            input.value = '';
        });
    }

    avatarInput.addEventListener('change', () => handleImageSelection(avatarInput, 'avatar'));
    coverInput.addEventListener('change', () => handleImageSelection(coverInput, 'cover'));

    editModalElement.addEventListener('show.bs.modal', () => {
        aliasInput.value = profile.alias;
        descriptionInput.value = profile.description;
        avatarInput.value = '';
        coverInput.value = '';
        pendingAvatar = null;
        pendingCover = null;
        selectedAboutIcon = profile.aboutIcon;
        selectedLinesColor = profile['lines-color'];
        avatarReadVersion += 1;
        coverReadVersion += 1;
        avatarPosition = { ...profile.avatarPosition };
        coverPosition = { ...profile.coverPosition };
        avatarSelection = Promise.resolve(null);
        coverSelection = Promise.resolve(null);
        showCropPreview(
            avatarCrop,
            avatarCropImage,
            avatarHelp,
            profile.avatar,
            avatarPosition
        );
        showCropPreview(
            coverCrop,
            coverCropImage,
            coverHelp,
            profile.cover,
            coverPosition
        );
        editError.textContent = '';
        editError.hidden = true;
        aliasInput.classList.remove('is-invalid');
        updateSelectedPreset();
        updateSelectedAboutIcon();
        updateSelectedLinesColor();
    });

    let saving = false;
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!owner || saving) return;
        editError.textContent = '';
        editError.hidden = true;

        const newAlias = aliasInput.value.trim();
        if (!newAlias) {
            aliasInput.classList.add('is-invalid');
            aliasInput.focus();
            return;
        }
        aliasInput.classList.remove('is-invalid');

        saving = true;
        editForm.querySelector('[type=submit]').disabled = true;
        try {
            const [avatarFile, coverFile] = await Promise.all([
                avatarSelection,
                coverSelection
            ]);
            const updatedProfile = {
                ...profile,
                alias: newAlias,
                description: descriptionInput.value.trim(),
                aboutIcon: selectedAboutIcon,
                'lines-color': selectedLinesColor,
                avatar: pendingAvatar || avatarFile || profile.avatar,
                avatarPosition,
                cover: pendingCover || coverFile || profile.cover,
                coverPosition
            };

            await consumeApi('/ludus/perfil/me', {method:'PUT', body:{nombre:newAlias, sobreMi:updatedProfile.description}});
            serverProfile = await Ludus.me(true);
            if (saveProfile(updatedProfile)) {
                profile = updatedProfile;
                showProfile(profile);
                editModal.hide();
            }
        } catch (error) {
            editError.textContent = error instanceof Error
                ? error.message
                : 'No se pudieron procesar las imágenes seleccionadas.';
            editError.hidden = false;
        } finally {
            saving = false;
            editForm.querySelector('[type=submit]').disabled = false;
        }
    });

    let profileRefreshVersion = 0;
    async function refreshServerProfile() {
        const version = ++profileRefreshVersion;
        try {
            const updated = await Ludus.profile();
            if (version !== profileRefreshVersion) return;
            serverProfile = updated;
            profile.alias = serverProfile.nombre;
            profile.description = serverProfile.sobreMi || '';
            showProfile(profile);
            totalLikes.textContent = serverProfile.totalLikes ?? '—';
            averageRating.textContent = serverProfile.promedioCalificacion ?? '—';
            reviewedGames.textContent = serverProfile.juegosResenados ?? '—';
            reviewedGames.nextElementSibling.textContent = 'Juegos reseñados';
            reviewedGames.title = `${serverProfile.juegosResenados ?? '—'} juegos reseñados`;
            message.textContent = owner ? 'Avatar, portada, icono y colores se guardan sólo en este navegador; aún no se sincronizan.' : '';
        } catch (error) { if (version === profileRefreshVersion) message.textContent = Ludus.errorText(error); }
    }
    window.addEventListener('resenias:actualizadas', refreshServerProfile);
    window.addEventListener('likes:actualizados', (event) => {
        if (String(event.detail?.idUsuario) === String(serverProfile.idUsuario)) refreshServerProfile();
    });
    await refreshServerProfile();
})();
