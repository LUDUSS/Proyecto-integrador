/**
 * perfilSocial.js — Funcionalidades sociales, privacidad y KPIs de perfil en LUDUS.
 * Conexión completa entre Frontend y Backend de Spring Boot.
 */
(() => {
    const API = "http://localhost:8080/ludus";

    // Elementos del DOM
    const btnSeguir = document.getElementById("btn-seguir");
    const btnSeguirTexto = document.getElementById("btn-seguir-texto");
    const editarPerfilBtn = document.getElementById("editar-perfil");
    const agregarReseniaBtn = document.getElementById("mostrar-formulario-resenia");
    const totalReseniasEl = document.getElementById("perfil-total-resenias");
    const totalSeguidoresEl = document.getElementById("perfil-total-seguidores");
    const totalSiguiendoEl = document.getElementById("perfil-total-siguiendo");
    const juegoActivoBadge = document.getElementById("perfil-juego-activo");
    const juegoActivoTexto = document.getElementById("perfil-juego-activo-texto");
    const perfilPrivadoAviso = document.getElementById("perfil-privado-aviso");
    const sobreMiSeccion = document.getElementById("sobre-mi");
    const reseniasSeccion = document.getElementById("mis-resenias");
    const navItemConfig = document.getElementById("nav-item-configuracion");
    const configSeccion = document.getElementById("config-privacidad");
    const sidebarConfigLink = document.getElementById("sidebar-config-link");
    const sidebarPerfilLink = document.getElementById("sidebar-perfil-link");
    const togglePublico = document.getElementById("toggle-perfil-publico");
    const juegoActivoInput = document.getElementById("juego-activo-input");
    const guardarConfigBtn = document.getElementById("guardar-config-btn");
    const configMensaje = document.getElementById("config-mensaje");
    const listaResenias = document.getElementById("lista-resenias");

    const nombreUsuarioEl = document.getElementById("nombre-usuario");
    const perfilAliasEl = document.getElementById("perfil-alias");
    const perfilDescripcionEl = document.getElementById("perfil-descripcion");

    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    // Detectar qué perfil se desea ver mediante el parámetro de consulta ?id=
    const urlParams = new URLSearchParams(window.location.search);
    const idEnUrl = urlParams.get("id") ? parseInt(urlParams.get("id"), 10) : null;

    let idUsuarioActual = null;
    let esPerfilPropio = true;
    let usuarioVisto = null;

    /**
     * Inicialización del flujo de perfil
     */
    async function inicializar() {
        // Resolver ID del usuario en sesión
        idUsuarioActual = await obtenerIdPropio();

        if (idEnUrl && idEnUrl !== idUsuarioActual) {
            // Viendo el perfil de otra persona
            esPerfilPropio = false;
            await cargarPerfilAjeno(idEnUrl);
        } else {
            // Viendo perfil propio
            esPerfilPropio = true;
            await cargarPerfilPropio();
        }

        configurarSidebar();
        configurarLikesResenias();
    }

    /**
     * Obtiene el ID numérico en MySQL del usuario actual logueado
     */
    async function obtenerIdPropio() {
        const guardado = sessionStorage.getItem("ludus_id_usuario");
        if (guardado) return parseInt(guardado, 10);

        if (!currentUser || !currentUser.email) return null;

        try {
            const resp = await fetch(`${API}/usuario/correo/${encodeURIComponent(currentUser.email)}`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.id_usuario) {
                    sessionStorage.setItem("ludus_id_usuario", String(data.id_usuario));
                    return data.id_usuario;
                }
            }
        } catch (e) {
            console.warn("No se pudo obtener el ID propio del usuario:", e);
        }
        return null;
    }

    /**
     * Carga y muestra los datos del perfil propio
     */
    async function cargarPerfilPropio() {
        if (editarPerfilBtn) editarPerfilBtn.hidden = false;
        if (btnSeguir) btnSeguir.hidden = true;
        if (agregarReseniaBtn) agregarReseniaBtn.hidden = false;
        if (perfilPrivadoAviso) perfilPrivadoAviso.hidden = true;
        if (sobreMiSeccion) sobreMiSeccion.hidden = false;
        if (reseniasSeccion) reseniasSeccion.hidden = false;
        if (navItemConfig) navItemConfig.classList.remove("d-none");

        if (idUsuarioActual) {
            try {
                const resp = await fetch(`${API}/usuario/${idUsuarioActual}`);
                if (resp.ok) {
                    const u = await resp.json();
                    usuarioVisto = u;

                    // Juego activo
                    actualizarBadgeJuegoActivo(u.juego_activo);

                    // Sincronizar formulario de configuración
                    if (togglePublico) togglePublico.checked = u.perfil_publico ?? true;
                    if (juegoActivoInput) juegoActivoInput.value = u.juego_activo || "";

                    // Cargar métricas de seguidores y siguiendo
                    await cargarMetricasSeguimiento(idUsuarioActual);
                }
            } catch (err) {
                console.warn("Aviso al consultar usuario propio en API:", err);
            }
        }
    }

    /**
     * Carga y muestra los datos del perfil de otra persona
     */
    async function cargarPerfilAjeno(idAjeno) {
        if (editarPerfilBtn) editarPerfilBtn.hidden = true;
        if (agregarReseniaBtn) agregarReseniaBtn.hidden = true;
        if (navItemConfig) navItemConfig.classList.add("d-none");

        try {
            const resp = await fetch(`${API}/usuario/${idAjeno}`);
            if (!resp.ok) {
                mostrarAlertaError("El usuario que buscas no fue encontrado.");
                return;
            }

            const u = await resp.json();
            usuarioVisto = u;

            // Renderizar nombre y alias del usuario consultado
            if (nombreUsuarioEl) nombreUsuarioEl.textContent = u.nombre || "Jugador";
            if (perfilAliasEl) perfilAliasEl.textContent = u.nombre || "Jugador";
            if (perfilDescripcionEl) {
                perfilDescripcionEl.textContent = u.sobre_mi && u.sobre_mi.trim()
                    ? u.sobre_mi
                    : "Este jugador aún no ha agregado una descripción a su perfil.";
            }

            // Validar regla de privacidad: perfil público o privado
            if (u.perfil_publico === false) {
                // Perfil Privado
                if (perfilPrivadoAviso) perfilPrivadoAviso.hidden = false;
                if (sobreMiSeccion) sobreMiSeccion.hidden = true;
                if (reseniasSeccion) reseniasSeccion.hidden = true;
                if (btnSeguir) btnSeguir.hidden = true;
                if (juegoActivoBadge) juegoActivoBadge.hidden = true;
            } else {
                // Perfil Público
                if (perfilPrivadoAviso) perfilPrivadoAviso.hidden = true;
                if (sobreMiSeccion) sobreMiSeccion.hidden = false;
                if (reseniasSeccion) reseniasSeccion.hidden = false;

                // Estado de actividad actual (Juego que está jugando)
                actualizarBadgeJuegoActivo(u.juego_activo);

                // Botón de seguir / dejar de seguir
                await inicializarBotonSeguir(idAjeno);
            }

            // Cargar métricas de seguimiento del usuario ajeno
            await cargarMetricasSeguimiento(idAjeno);

        } catch (error) {
            console.error("Error al cargar perfil ajeno:", error);
            mostrarAlertaError("Ocurrió un error al cargar la información del usuario.");
        }
    }

    /**
     * Actualiza el badge visual del estado de juego activo
     */
    function actualizarBadgeJuegoActivo(tituloJuego) {
        if (!juegoActivoBadge || !juegoActivoTexto) return;

        if (tituloJuego && tituloJuego.trim()) {
            juegoActivoTexto.textContent = `Jugando actualmente: ${tituloJuego.trim()}`;
            juegoActivoBadge.hidden = false;
        } else {
            juegoActivoBadge.hidden = true;
        }
    }

    /**
     * Carga KPIs de seguidores y siguiendo desde Spring Boot
     */
    async function cargarMetricasSeguimiento(idUsuario) {
        if (!idUsuario) return;
        try {
            const [respSeguidores, respSiguiendo] = await Promise.all([
                fetch(`${API}/seguidor/seguidores/${idUsuario}`),
                fetch(`${API}/seguidor/siguiendo/${idUsuario}`)
            ]);

            if (respSeguidores.ok && totalSeguidoresEl) {
                const seguidores = await respSeguidores.json();
                totalSeguidoresEl.textContent = String(seguidores.length);
            }

            if (respSiguiendo.ok && totalSiguiendoEl) {
                const siguiendo = await respSiguiendo.json();
                totalSiguiendoEl.textContent = String(siguiendo.length);
            }
        } catch (e) {
            console.warn("No se pudieron consultar seguidores:", e);
        }
    }

    /**
     * Control del botón Seguir / Dejar de seguir
     */
    async function inicializarBotonSeguir(idAjeno) {
        if (!btnSeguir || !btnSeguirTexto) return;

        if (!idUsuarioActual) {
            btnSeguir.hidden = true;
            return;
        }

        btnSeguir.hidden = false;

        // Comprobar si ya lo sigue
        try {
            const resp = await fetch(`${API}/seguidor/siguiendo/${idUsuarioActual}`);
            if (resp.ok) {
                const siguiendo = await resp.json();
                const yaSigue = siguiendo.some((s) => s.idSeguido === idAjeno);
                actualizarEstadoBotonSeguir(yaSigue);
            }
        } catch (e) {
            actualizarEstadoBotonSeguir(false);
        }

        btnSeguir.onclick = async () => {
            btnSeguir.disabled = true;
            const esSiguiendo = btnSeguir.dataset.siguiendo === "true";

            try {
                if (esSiguiendo) {
                    // Dejar de seguir
                    const delResp = await fetch(`${API}/seguidor/dejar?idSeguidor=${idUsuarioActual}&idSeguido=${idAjeno}`, {
                        method: "DELETE"
                    });
                    if (delResp.ok) {
                        actualizarEstadoBotonSeguir(false);
                        await cargarMetricasSeguimiento(idAjeno);
                    }
                } else {
                    // Seguir
                    const postResp = await fetch(`${API}/seguidor/seguir?idSeguidor=${idUsuarioActual}&idSeguido=${idAjeno}`, {
                        method: "POST"
                    });
                    if (postResp.ok) {
                        actualizarEstadoBotonSeguir(true);
                        await cargarMetricasSeguimiento(idAjeno);
                    }
                }
            } catch (err) {
                console.error("Error al procesar seguimiento:", err);
            } finally {
                btnSeguir.disabled = false;
            }
        };
    }

    function actualizarEstadoBotonSeguir(siguiendo) {
        btnSeguir.dataset.siguiendo = String(siguiendo);
        if (siguiendo) {
            btnSeguir.className = "btn btn-outline-secondary perfil-seguir__boton";
            btnSeguir.innerHTML = `<i class="bi bi-person-check-fill me-1" aria-hidden="true"></i> Siguiendo`;
        } else {
            btnSeguir.className = "btn btn-success perfil-seguir__boton";
            btnSeguir.innerHTML = `<i class="bi bi-person-plus-fill me-1" aria-hidden="true"></i> Seguir`;
        }
    }

    /**
     * Conexión del panel de configuración de privacidad y juego en la sidebar
     */
    function configurarSidebar() {
        if (sidebarConfigLink && configSeccion) {
            sidebarConfigLink.addEventListener("click", (e) => {
                e.preventDefault();
                if (!esPerfilPropio) return;

                // Ocultar otras secciones y mostrar panel de configuración
                document.querySelectorAll(".perfil-seccion").forEach((sec) => (sec.hidden = true));
                configSeccion.hidden = false;

                sidebarConfigLink.classList.add("active");
                sidebarPerfilLink?.classList.remove("active");
            });
        }

        if (sidebarPerfilLink) {
            sidebarPerfilLink.addEventListener("click", (e) => {
                if (esPerfilPropio) {
                    e.preventDefault();
                    document.querySelectorAll(".perfil-seccion").forEach((sec) => (sec.hidden = false));
                    if (configSeccion) configSeccion.hidden = true;
                    sidebarPerfilLink.classList.add("active");
                    sidebarConfigLink?.classList.remove("active");
                }
            });
        }

        // Guardar ajustes de privacidad y juego activo
        if (guardarConfigBtn) {
            guardarConfigBtn.addEventListener("click", async () => {
                if (!idUsuarioActual) {
                    mostrarAlertaError("No se encontró una sesión activa válida.");
                    return;
                }

                guardarConfigBtn.disabled = true;
                const nuevoPublico = togglePublico ? togglePublico.checked : true;
                const nuevoJuego = juegoActivoInput ? juegoActivoInput.value.trim() : "";

                try {
                    const [respPriv, respJuego] = await Promise.all([
                        fetch(`${API}/usuario/${idUsuarioActual}/privacidad?perfil_publico=${nuevoPublico}`, {
                            method: "PATCH"
                        }),
                        fetch(`${API}/usuario/${idUsuarioActual}/juego-activo?juego_activo=${encodeURIComponent(nuevoJuego)}`, {
                            method: "PATCH"
                        })
                    ]);

                    if (respPriv.ok && respJuego.ok) {
                        actualizarBadgeJuegoActivo(nuevoJuego);
                        mostrarMensajeConfig("¡Ajustes guardados correctamente!", true);
                    } else {
                        mostrarMensajeConfig("No se pudieron guardar los ajustes en el servidor.", false);
                    }
                } catch (err) {
                    console.error("Error al guardar ajustes:", err);
                    mostrarMensajeConfig("Error de conexión al guardar los ajustes.", false);
                } finally {
                    guardarConfigBtn.disabled = false;
                }
            });
        }
    }

    function mostrarMensajeConfig(texto, exito) {
        if (!configMensaje) return;
        configMensaje.textContent = texto;
        configMensaje.className = `small fw-semibold ms-2 ${exito ? "text-success" : "text-danger"}`;
        configMensaje.hidden = false;
        setTimeout(() => {
            configMensaje.hidden = true;
        }, 3500);
    }

    /**
     * Sistema de "Me gusta" (Likes) para reseñas y comentarios
     */
    function configurarLikesResenias() {
        if (!listaResenias) return;

        function inyectarBotonesLike() {
            const tarjetas = listaResenias.querySelectorAll(".tarjeta-juego");
            tarjetas.forEach((tarjeta, index) => {
                if (tarjeta.querySelector(".btn-like-resenia")) return;

                const accionesContenedor = tarjeta.querySelector(".tarjeta-acciones");
                if (!accionesContenedor) return;

                // ID virtual o real de la reseña
                const idResenia = index + 1;

                const btnLike = document.createElement("button");
                btnLike.type = "button";
                btnLike.className = "btn-accion btn-like-resenia d-inline-flex align-items-center gap-1";
                btnLike.setAttribute("title", "Me gusta");
                btnLike.setAttribute("aria-label", "Me gusta");
                btnLike.innerHTML = `<i class="bi bi-heart" aria-hidden="true"></i> <span class="like-contador small">0</span>`;

                accionesContenedor.prepend(btnLike);

                // Consultar contador inicial desde Spring Boot
                fetch(`${API}/interaccion/resenia/${idResenia}${idUsuarioActual ? `?idUsuario=${idUsuarioActual}` : ""}`)
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data) => {
                        if (data) {
                            btnLike.querySelector(".like-contador").textContent = data.total;
                            if (data.likeado) {
                                btnLike.querySelector("i").className = "bi bi-heart-fill text-danger";
                            }
                        }
                    })
                    .catch(() => {});

                // Evento de clic en Me gusta
                btnLike.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (!idUsuarioActual) {
                        mostrarAlertaError("Debes iniciar sesión para dar me gusta.");
                        return;
                    }

                    try {
                        const postResp = await fetch(`${API}/interaccion/toggle?idUsuario=${idUsuarioActual}&idResenia=${idResenia}`, {
                            method: "POST"
                        });
                        if (postResp.ok) {
                            const updateResp = await fetch(`${API}/interaccion/resenia/${idResenia}?idUsuario=${idUsuarioActual}`);
                            if (updateResp.ok) {
                                const info = await updateResp.json();
                                btnLike.querySelector(".like-contador").textContent = info.total;
                                btnLike.querySelector("i").className = info.likeado
                                    ? "bi bi-heart-fill text-danger"
                                    : "bi bi-heart";
                            }
                        }
                    } catch (err) {
                        console.error("Error al alternar me gusta:", err);
                    }
                });
            });
        }

        // Ejecutar inicialmente y al actualizar reseñas
        inyectarBotonesLike();
        window.addEventListener("resenias:actualizadas", () => {
            setTimeout(inyectarBotonesLike, 100);
        });
    }

    function mostrarAlertaError(mensaje) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "info",
                title: "Atención",
                text: mensaje,
                confirmButtonColor: "#0099ff"
            });
        } else {
            alert(mensaje);
        }
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
})();
