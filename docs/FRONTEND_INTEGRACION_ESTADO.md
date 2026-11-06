# Estado de integración frontend LUDUS

Fecha: 2026-11-05.

## Implementado

- Inicio: hasta seis juegos destacados de IGDB y seis reseñas recientes reales; carrusel, tarjetas, enlaces a ficha y autor, estados de carga, vacío y error independientes. Sin sesión muestra invitación a iniciar sesión porque el contrato protege estas lecturas.
- Catálogo: exploración y búsqueda remotas, debounce de 350 ms, descarte de respuestas obsoletas, filtros de género/plataforma por ID, orden válido según modo y paginación con `hasNext`. Lookups completos paginados; solicitudes IGDB serializadas con separación mínima de 280 ms.
- Fichas: entrada directa por `igdbId`, portada HTTPS con fallback, descripción, géneros, plataformas, screenshots, fecha Unix UTC y escalas IGDB/LUDUS separadas. Lecturas sin crear juegos. Reseñas de todos los usuarios y rating social desde MySQL vía API.
- Reseñas: publicar desde el modal de la ficha; editar y eliminar en ficha y perfil. Texto 1..10000, puntuación 1..5 con decimales, autor por JWT, controles sólo para autor, protección de doble envío y gestión de 403/409. Tras escritura se recargan reseñas y rating/estadísticas correspondientes. El perfil permite ver y gestionar reseñas existentes, sin acceso a creación ni búsqueda IGDB.
- Perfil propio/ajeno: identidad, biografía y estadísticas desde API; nombre/biografía con PUT. Perfiles de autor en `perfil.html?idUsuario=...`. Se conserva personalización local de avatar, portada, recortes, iconos y colores, con aviso de que no se sincronizan.
- Likes: corazón con contador y estado personal desde `LikeState` en Inicio, ficha y perfil; lecturas por lotes, POST/DELETE autenticados por reseña y actualización del perfil del autor desde API. No se usan contadores locales ni se importan likes antiguos.
- API común: base configurable con `window.LUDUS_API_BASE_URL` antes de cargar `api.js`, JWT, objetos serializados una vez, 204, `status`, `Retry-After`, redirección de sesión vencida y errores específicos. Texto externo mediante DOM seguro.

No se modificaron backend, Java, SQL ni contratos API; no se hicieron commits. El ajuste visual añade CSS limitado a reseñas, sus modales y botones del perfil. Se conservaron los registros originales `ludus_catalogo_resenias`, `resenias-videojuegos` y `perfil-usuario`, sin importar ni borrar reseñas. Las preferencias visuales se leen y guardan en `ludus_visual_profile:<idUsuario>` sólo al visitar el perfil del propietario autenticado. La clave histórica `perfil-usuario`, sin autor verificable, se conserva intacta y no se asigna automáticamente a ninguna cuenta.

## Archivos

| Archivos modificados o añadidos | Finalidad |
| --- | --- |
| `JS/api.js` | Configuración y errores HTTP compatibles con llamadas existentes |
| `JS/ludus.js` (nuevo) | Servicios compartidos, componentes DOM seguros, editor y cola IGDB |
| `JS/catalogoJuegos.js` | Catálogo y ficha remotos |
| `JS/juegosDestacados.js`, `index.html` | Inicio dinámico y retirada de tarjetas de ejemplo |
| `JS/perfilUsuario.js` | Perfil API conservando editor visual existente |
| `JS/resenias.js` | Reseñas del perfil y selección IGDB |
| `juegos.html`, `perfil.html` | Carga ordenada del código compartido, scripts clásicos |
| `tests/api.test.cjs` | Pruebas automatizadas HTTP/JWT |
| `tests/frontend-fixture-server.cjs`, `tests/frontend-browser.html` | Pruebas de integración con navegador y API simulada aislada |
| `tests/.gitignore` | Exclusión de salidas generadas de navegador |
| `docs/FRONTEND_INTEGRACION_ESTADO.md` | Este informe |

## Endpoints usados

Todos los siguientes llevan JWT de LUDUS:

- `GET /ludus/igdb/juegos`, `/ludus/igdb/buscar`: page, size, sort y filtros genreId/platformId; búsqueda añade nombre y sort=relevancia.
- `GET /ludus/igdb/juegos/{igdbId}`, `/ludus/igdb/generos`, `/ludus/igdb/plataformas`.
- `GET /ludus/publicacion/`, `/ludus/publicacion/juego/igdb/{igdbId}`, `/ludus/publicacion/juego/igdb/{igdbId}/rating`.
- `GET /ludus/publicacion/me`, `/ludus/publicacion/usuario/{idUsuario}`.
- `POST /ludus/publicacion/igdb/{igdbId}`; `PUT` y `DELETE /ludus/publicacion/{idResenia}`.
- `GET /ludus/perfil/me`, `/ludus/perfil/{idUsuario}`; `PUT /ludus/perfil/me`.
- Compatibilidad antigua: `GET /ludus/juego/{idLocal}` devuelve la entidad local con `id_api`. Ese campo identifica el juego externo; `id_juego` conserva su identidad local. Ante ID externo ausente/inválido o fallo 404/502/503/504 se conserva la ficha local, sin resolver ni habilitar publicaciones nuevas. Si hay ID externo válido, las reseñas/rating locales siguen consultándose por ese ID; las reseñas propias existentes conservan edición/borrado.

## Pruebas ejecutadas

- `node --test tests/api.test.cjs`: 13 pruebas aprobadas (JWT, configuración, body, 201, 204, 400/401/403/404/409/502/503/504, Retry-After, sesión ausente y login público).
- Chrome headless con páginas reales y API simulada: 54 comprobaciones aprobadas tras la auditoría. Incluyen las 28 iniciales y regresiones detalladas abajo. Sin desbordamiento horizontal del catálogo a 390 y 1280 px.
- `node --check` de scripts y `git diff --check`.
- Lectura real sin autenticación: backend accesible en localhost:8080, `/ludus/igdb/juegos` devuelve 401. Frontend existente accesible en localhost:5502. No se hicieron escrituras reales.

El servidor de pruebas filtra scripts ajenos a la integración, simula Bootstrap Modal y las respuestas HTTP, y omite el video del inicio para que el reloj virtual sea estable. Conserva HTML y CSS reales. Estas comprobaciones no sustituyen una revisión visual de Bootstrap/CDN ni prueban conectividad IGDB real. Los únicos datos ficticios están en `tests/`, nunca en el código de producción.

## Reproducción

1. Iniciar el backend desde su repositorio con su configuración habitual de Spring Boot/MySQL/IGDB, en `http://localhost:8080`. Este repositorio no contiene Java ni un comando de arranque de backend.
2. Abrir el frontend con Live Server, puerto **5502** (ya configurado en `.vscode/settings.json`), o `python -m http.server 5502 --bind 127.0.0.1` desde esta carpeta. Acceder a `http://localhost:5502` o `http://127.0.0.1:5502`; otros puertos requieren CORS del backend.
3. Iniciar sesión con una cuenta de LUDUS. Abrir catálogo, ficha y perfil. No proporcionar credenciales de Twitch al navegador.
4. Pruebas HTTP: `node --test tests/api.test.cjs` (Node 24 usado).
5. Pruebas navegador: ejecutar `node tests/frontend-fixture-server.cjs`, abrir **en un perfil de navegador de pruebas separado** `http://127.0.0.1:5510/` y esperar `ALL PASSED`. El mock usa origen propio 5510, reemplaza fetch y guarda exclusivamente sesión/datos de prueba en ese origen. No envía peticiones al backend. También se ejecutó en Chrome con `--headless --virtual-time-budget=45000 --dump-dom` y un `--user-data-dir` temporal dedicado.

## Pendientes y limitaciones

- Auditoría contrastada con `docs/IGDB_API_CONTRATO.md` y `docs/IGDB_FRONTEND_GUIA.md`, ahora disponibles. La integración inicial había usado el contrato esencial del encargo.
- Pendiente validar con JWT y servicios reales: filtros/orden contra IGDB, paginación de lookups y reseñas con varias páginas, screenshots reales, usuarios distintos, creación/duplicado/edición/borrado en MySQL y expiración en navegador. No se inventaron resultados de estas pruebas.
- Pendiente revisión visual manual móvil/escritorio del carrusel, modales, recortes y recursos CDN, así como contraste con el diseño original. CSS y puntos de quiebre existentes se conservaron.
- No hay endpoints de subida de avatar/portada ni adjuntos de reseñas. Las reseñas usan portada oficial IGDB. Los likes ahora se integran con las rutas por reseña y el lote `LikeState` documentados en el contrato actualizado; `totalLikes` del perfil se sigue leyendo del backend. Los likes locales anteriores no se borraron ni importaron.
- Un juego local sin `id_api` válido conserva sus datos visibles, pero no puede consultar reseñas por el endpoint externo documentado. No se inventa una correspondencia ni un endpoint alternativo.
- No hay importación automática de borradores antiguos. Cualquier respaldo o importación requiere un trabajo separado consentido.

## Auditoría contra contrato real (2026-11-05)

Correcciones puntuales; sin cambios nuevos en HTML, CSS ni Bootstrap:

- `JS/catalogoJuegos.js`: resolución legada por `id_api` y ficha local de respaldo; deduplicación por `igdbId`; bloqueo de paginación durante debounce; generaciones para que un refresco de reseñas prevalezca sobre una página anterior pendiente; lookups sin IDs repetidos al reintentar tras fallo parcial.
- `JS/ludus.js`: paso explícito del evento al callback. La asignación previa `onclick = action` ya recibía eventos nativos: no se confirmó la supuesta pérdida del evento. El borrado captura `currentTarget` antes del await y lo mantiene deshabilitado durante la operación; se añadió regresión con clic sobre un hijo del botón. Conflictos 409 de PUT/DELETE muestran el error real sin tratarlos como un POST duplicado. Calificaciones con `step=any` para no bloquear valores válidos como 4.25.
- `JS/resenias.js`: refrescos del perfil invalidan páginas pendientes y deduplican por `idResenia`; decimales sin restricción artificial a décimas; los conflictos de edición no ofrecen resolver un duplicado de publicación.
- `JS/perfilUsuario.js`: preferencias sólo de la clave del propietario; sin heredar datos históricos sin autor. Estadística `juegosResenados` con etiqueta coherente, independiente de `cantidadResenias`.
- `tests/frontend-fixture-server.cjs` y `tests/frontend-browser.html`: fixtures con entidad local real `{id_juego,id_api,...}`, errores `{status,error}`, JWT obligatorio y respuestas retenidas/liberadas explícitamente para reproducir carreras.

Regresiones verificadas: páginas IGDB solapadas, respuesta de búsqueda obsoleta durante debounce, bloqueo de cargar más, callback con evento nativo, DELETE sobre hijo del botón y doble clic, conflictos de integridad PUT/DELETE, precisión decimal, estadísticas independientes, propietario/ajeno/cambio de cuenta, preservación literal de la clave histórica, enlaces `id_api` y respaldo 404/ID ausente, borrado durante paginación en ficha y perfil, reintento de lookups parcialmente cargados y JWT en solicitudes protegidas.

Resultado final: **13 pruebas Node y 54 comprobaciones de navegador aprobadas**; scripts válidos con `node --check` y `git diff --check` sin errores. Inicio, catálogo, fichas, reseñas y perfiles usan los endpoints/métodos/DTO protegidos documentados. No se usaron credenciales reales ni se escribieron datos en MySQL. Permanece pendiente el recorrido manual con JWT real y servicios IGDB/MySQL activos, incluyendo CORS y revisión visual completa.

## Ajuste visual de reseñas y botones (2026-11-05)

- `JS/ludus.js`: tarjetas compartidas para ficha/perfil con encabezado (juego, autor y badge con estrella), cuerpo y pie (fecha/acciones). Sin bloques verdes ni botones estirados. Textos largos expandibles y contenido seguro; el inicio conserva sus tarjetas.
- `css/resenias.css` (nuevo), `juegos.html`, `perfil.html`: estilos acotados, tarjetas compactas, bordes sutiles, degradado naranja-rosa para acciones principales, secundarios y eliminación coherentes, foco visible y distribución adaptable. Se preservan tema claro/oscuro, navbar, estadísticas y estructura general.
- `JS/catalogoJuegos.js`: reseñas a ancho completo y acción de creación/edición en encabezado. El editor compartido se abre en modal Bootstrap; publicación y edición esperan al cierre antes de refrescar para evitar backdrops residuales.
- `JS/resenias.js`, `perfil.html`: retirado el acceso de creación desde perfil y su búsqueda de juegos. El modal existente permite únicamente editar una reseña propia, con título de juego de sólo lectura y botones Guardar cambios/Cancelar; borrado y controles de propiedad conservados. La publicación continúa disponible en ficha, con el mismo endpoint.
- `JS/perfilUsuario.js` fue revisado: no requirió nuevos cambios de lógica; estadísticas y personalización del propietario se conservan. Sus botones de modal reciben el estilo compartido.
- Pruebas actualizadas: `tests/frontend-browser.html`, `tests/frontend-fixture-server.cjs`; vistas aisladas `tests/review-visual.html` y `tests/review-visual-frame.html` con Bootstrap real. Capturas generadas locales, excluidas de Git en `tests/.gitignore`.

Validación: **13 pruebas API y 64 comprobaciones de navegador aprobadas**, con sintaxis JS y diff sin errores. Incluye abrir/cancelar modal en ficha, publicar, editar, eliminar, ausencia de creación en perfil, PUT sin POST desde perfil, tarjetas cortas compactas, acciones sin estirar, expansión/colapso de textos largos y ausencia de desbordamiento móvil. Se revisaron capturas de componentes a 1200 px y en marco móvil real de 390 px, incluyendo modal con Bootstrap 5.3.3 real y tema oscuro. Los flujos de datos usan API simulada; no se escribieron datos reales.

Pendientes: recorrido final con JWT real contra MySQL/IGDB y revisión en dispositivos físicos/otros navegadores, especialmente imágenes reales y preferencias de tema/paleta. Para previsualizar los componentes, iniciar el servidor de pruebas y abrir `/tests/review-visual.html` o `/tests/review-visual-frame.html?modal=1`.

## Botones dinámicos por paleta y modo (2026-11-05)

Auditoría: `JS/paletas.js` guarda `ludus-palette` y aplica `data-palette=neon|sunset|forest|cyber`; `JS/theme.js` guarda `theme` y aplica `data-bs-theme=light|dark`. Ambos siguen intactos: no se creó otro gestor ni se alteraron los cuatro colores/degradados originales.

Se identificaron colores naranja/rosa fijos en `css/resenias.css` que anulaban la personalización, y enlaces Ver juego que conservaban el aspecto outline estándar. Cambios de esta etapa:

- `css/paletas.css`: sistema central de acciones, reutilizando `.btn-primary` y clases compartidas `.ludus-btn`, `--primary`, `--secondary`, `--danger`. Las clases existentes `.ludus-review-btn*` funcionan como alias compatibles. Bordes redondeados, tipografía, hover, foco visible, disabled y movimiento reducido coherentes, sin nuevos `!important` ni reglas genéricas sobre todos los botones.
- Nuevas variables semánticas: `--ludus-action-gradient` (degradado original con velo negro del 35% para contraste de texto blanco); `--ludus-action-text`; `--ludus-action-accent` (derivado del primario, más oscuro en claro y más luminoso en oscuro); `--ludus-action-tint` y `--ludus-action-hover` (fondos secundarios sobre `--bs-body-bg`); `--ludus-action-focus`; `--ludus-action-danger` y `--ludus-action-danger-tint` (peligro desde variables semánticas Bootstrap, manteniendo rojo reconocible). Se conservan las paletas originales; sólo se derivan colores para las acciones. Los tonos neutros de contraste no representan nuevas paletas.
- `css/resenias.css`: retirados los estilos de botones duplicados y los acentos fijos; botones, badge, bordes de modal, portada de respaldo y Ver más usan las variables centrales. Se conservan tamaño, disposición y estilo compacto de las tarjetas.
- `JS/ludus.js`: Ver juego en destacados y catálogo usa la clase principal compartida. Reintentar/Cargar más usan el secundario compartido; enlaces y callbacks intactos.
- `index.html`, `perfil.html`, `JS/navbar.js`: clases compartidas en Crear cuenta y Cancelar; Iniciar/Cerrar sesión usa el principal existente, sustituyendo visualmente el azul fijo heredado. Selectores de paleta, interruptor claro/oscuro, cerrar, estrellas, carrusel y navegación desplegable conservan sus clases y comportamientos.
- `tests/button-themes.html`, `tests/button-theme-states.cjs`, `tests/.gitignore`: regresiones y exclusión de resultados generados.

Validación final:

- **90 comprobaciones de paletas** aprobadas con Bootstrap real y el JS original: ocho combinaciones, cambios mediante los controles existentes sin recargar, mismo degradado en Ver juego/Explorar/Iniciar sesión/perfil/modales, enlaces IGDB intactos, acentos de Editar/Cancelar, disabled y geometría de controles de tema. Contraste mínimo 4.5:1 en texto de acciones habilitadas y 3:1 en bordes secundarios; extremos de todos los degradados verificados. Se desactivan transiciones sólo dentro de la prueba para medir colores finales con el reloj virtual.
- **57 comprobaciones de estados y viewport** aprobadas mediante Chrome DevTools: `:hover` y `:focus-visible` para principal, secundario y destructivo en las ocho combinaciones; ausencia de desbordamiento a 320/390/1280 px; botones de modal dentro de pantalla y cierre Bootstrap real sin backdrop residual. Se espera a los eventos `shown.bs.modal`/`hidden.bs.modal`, sin depender de tiempos estimados.
- **64 comprobaciones funcionales** de inicio, catálogo, fichas, publicación, edición, eliminación, perfiles y modales aprobadas con API simulada. **13 pruebas API Node** aprobadas; sintaxis JS y diff sin errores.

Reproducción: iniciar `node tests/frontend-fixture-server.cjs`; abrir `http://127.0.0.1:5510/tests/button-themes.html` y esperar ALL PASSED. Para estados CSS ejecutar Chrome headless con perfil temporal separado y `--remote-debugging-port=9226 about:blank`, seguido de `node tests/button-theme-states.cjs`; el runner cierra esa instancia de prueba. No usar el perfil habitual del navegador para fixtures.

Backend, MySQL, endpoints, JWT y lógica de temas no se modificaron. No se borraron datos locales. Pendientes: revisión en dispositivos físicos/otros motores de navegador y recorrido con JWT real; las escrituras de la validación usaron exclusivamente datos simulados. Los controles no convencionales de navegación/personalización y enlaces sociales conservan su diseño anterior deliberadamente.

## Likes persistentes de reseñas (2026-11-05)

Se leyeron `IGDB_API_CONTRATO.md` y `IGDB_FRONTEND_GUIA.md`. El contrato actualizado sí expone `likedByMe`: no existe bloqueo de DTO. Review no cambió; el estado se une por `idResenia` desde:

- `GET /ludus/interaccion/resenias?ids=...` → array de `LikeState`, hasta 50 IDs por lote.
- `POST /ludus/interaccion/resenia/{idResenia}` sin body → 201 `LikeState`.
- `DELETE /ludus/interaccion/resenia/{idResenia}` sin body → 204; luego GET del lote para obtener el contador real, sin restarlo en cliente.
- `LikeState`: `{idResenia,totalLikes,likedByMe,idInteraccion}`. JWT mediante `consumeApi` existente; no se envían autor, fecha, correo ni ID de interacción como identidad de usuario.

Cambios:

- `JS/ludus.js`: corazón SVG compartido dentro de `reviewCard()` para Inicio, perfil y ficha. Contador, aria-pressed y corazón lleno/vacío reflejan exclusivamente respuestas válidas del backend. Antes de cargar se muestra «—», sin fingir cero ni estado personal. Se agrupan las tarjetas de cada render en lotes, se dividen en grupos de máximo 50 y se sincronizan todas las copias visibles de una reseña.
- Cada reseña bloquea peticiones de escritura simultáneas y conserva el último estado confirmado mientras espera. Errores discretos en la tarjeta; 409 o respuesta perdida se reconcilian con GET sin repetir POST/DELETE. Si se guardó la escritura pero falló su lectura, el siguiente intento sólo vuelve a leer. 401 reutiliza la limpieza/redirección existente.
- El estado en memoria pertenece únicamente a controles visibles y a la sesión actual; no hay localStorage ni caché persistente de likes. Cada tarjeta nueva, página y retorno por foco/pageshow/visibilidad consulta MySQL mediante API. Al cambiar JWT se invalida el estado personal y se descartan respuestas de la sesión anterior. No se modificó autenticación.
- `JS/perfilUsuario.js`: evento `likes:actualizados` invalida y vuelve a leer el perfil del autor afectado, propio o ajeno. Las generaciones de consulta impiden que una respuesta de estadísticas atrasada sobrescriba otra más reciente. El borrado de reseñas conserva su refresco de estadísticas.
- `css/paletas.css`: corazón compacto con variables semánticas compartidas, estado activo y mensajes/reintento accesibles; compatible con los cuatro temas y ambos modos. `css/resenias.css`: pequeño ajuste del encabezado de perfil móvil para conservar altura compacta al añadir el corazón. Se mantienen edición, eliminación, modales y enlaces.

Pruebas finales aprobadas:

- **36 regresiones específicas de likes** en `tests/likes-browser.html`: dar/quitar, estado inicial y lectura por lote, copias sincronizadas, POST sin body y JWT, doble clic, 400/401/403/404/409/503, respuesta perdida, DELETE confirmado con GET fallido, reintento sólo de lectura, cuenta nueva con petición anterior pendiente, recarga/navegación, likes propios, estadísticas recibidas y respuestas de perfil concurrentes, borrado de reseña con likes, 53 tarjetas en lotes de 50+3, lectura inicial fallida sin estado inventado y recuperación. Sin errores JS ni desbordamiento móvil.
- Backend simulado de `tests/frontend-fixture-server.cjs`: almacenamiento sólo en memoria del proceso Node, compartido entre documentos de prueba y con actor derivado del JWT ficticio. Permite comprobar persistencia y cuentas distintas sin escribir MySQL ni localStorage. Los fixtures y resultados no son una fuente de datos de producción.
- **64 regresiones funcionales** previas, **13 pruebas API Node**, **106 comprobaciones de temas/contraste** (incluyen corazón normal/activo en ocho combinaciones) y **73 de hover/foco/viewport con Bootstrap real**, a 320/390/1280 px. Sintaxis JS y `git diff --check` sin errores.
- Pruebas ajustadas: `tests/frontend-fixture-server.cjs`, `tests/button-themes.html`, `tests/button-theme-states.cjs`; nuevo `tests/likes-browser.html` y exclusiones de resultados en `tests/.gitignore`.

Reproducción: iniciar `node tests/frontend-fixture-server.cjs`, abrir `http://127.0.0.1:5510/tests/likes-browser.html` en un perfil de navegador aislado y esperar ALL PASSED. El fixture se reinicia con los datos sintéticos de la suite; no contacta al backend real. Las pruebas de paletas/estados conservan los comandos documentados en la etapa anterior.

Pendientes operativos: validar manualmente con JWT real contra el backend/MySQL y verificar en su repositorio el despliegue de `docs/sql/V002_interacciones_like_unico.sql` con su backup/preflight. No se ejecutaron migraciones, SQL ni escrituras reales desde estas pruebas. La persistencia real depende del backend y su restricción única, no de almacenamiento del navegador. Si una reseña desaparece, el 404 afecta al lote completo según contrato: se muestra error de likes y se requiere refrescar las reseñas; no se sustituyen sus contadores por ceros ni se hacen consultas individuales N+1. Los datos locales históricos permanecen intactos, sin importación automática.
