# API backend IGDB, videojuegos, reseñas y perfiles

Base local: `http://localhost:8080`. JSON UTF-8. IDs numéricos positivos; IDs locales de tipo Integer, externos de tipo Long.
**JWT LUDUS en todas las lecturas y escrituras de catálogo, perfiles y reseñas**:
`Authorization: Bearer <JWT_LUDUS>`. Solo login, registro y OPTIONS son anónimos.
El token Twitch nunca llega al navegador.

## Endpoints de catálogo

| Método | Ruta exacta | Parámetros / entrada | Respuesta y estados |
|---|---|---|---|
| GET | /ludus/igdb/buscar | nombre: String obligatorio (1..100, sin controles); page=0; size=10; sort=relevancia; genreId?: Long; platformId?: Long | 200 página Game; 400 validación, 401, 502/503/504 proveedor |
| GET | /ludus/igdb/juegos | page=0; size=10; sort=rating (rating/lanzamiento/nombre); genreId?, platformId? | 200 página Game; 400,401,502,503,504 |
| GET | /ludus/igdb/juegos/{igdbId} | igdbId: Long positivo | 200 Game; 400,401,404,502,503,504 |
| GET | /ludus/igdb/generos | page=0; size=20 | 200 página Lookup; 400,401,502,503,504 |
| GET | /ludus/igdb/plataformas | page=0; size=20 | 200 página Lookup; 400,401,502,503,504 |
| POST | /ludus/igdb/juegos/{igdbId}/resolver | sin body; usuario del JWT debe existir | 200 Juego local (nuevo o existente); 400,401,404,409,502,503,504 |
| GET | /ludus/juego/ | legado, sin parámetros | 200 array de Juego local, sin paginación; 401 |
| GET | /ludus/juego/{localGameId} | id local Integer | 200 Juego local; 400,401,404 |
| POST | /ludus/juego/ | compatibilidad: {"id_api":119133}; ignora demás datos de juego | 200 Juego obtenido/verificado desde IGDB, idempotente; mismos errores de resolver |
| PUT | /ludus/juego/{localGameId} | ruta heredada, body JSON | 403: catálogo verificado no editable manualmente; 400 body inválido; 401 |
| DELETE | /ludus/juego/{localGameId} | ruta heredada | 403: borrado manual deshabilitado; 401 |

**Cambio explícito de contrato**: buscar conserva ruta y `nombre`, pero ahora devuelve una página tipada, no array externo sin transformar.
El GET local heredado conserva sus nombres y array. No usarlo para explorar todo IGDB.
POST local ya no admite nombres/datos arbitrarios; PUT/DELETE local se conservan como rutas denegadas.
Las dos variantes de PUT heredado con barra se normalizan por la composición del mapping; usar las rutas de esta tabla.

Página común para catálogo, lookups y reseñas:

```json
{"items":[],"page":0,"size":10,"hasNext":false}
```

`page` comienza en 0 y admite 0..1000; `size` admite 1..50.
Se solicita una fila extra para `hasNext`; no existe `totalElements` ni conteo global ficticio.
El catálogo externo usa offset: cambios en IGDB y empates pueden mover elementos entre páginas.
Búsqueda: relevancia de IGDB; cualquier otro sort produce 400.
Exploración: rating descendente (excluye rating nulo), lanzamiento descendente
(excluye fecha nula, **incluye próximos lanzamientos**), nombre ascendente.
No hay filtro de popularidad ni filtro por etiquetas libres.
Un género y una plataforma se combinan con AND; IDs inexistentes devuelven lista vacía.
Los símbolos y Unicode del nombre se preservan y las comillas/barras se escapan en APICalypse.

Ejemplos de combinaciones reales:

```text
/ludus/igdb/buscar?nombre=Elden%20Ring&genreId=12&platformId=6&page=0&size=10
/ludus/igdb/juegos?genreId=12&platformId=6&sort=rating&page=1&size=10
/ludus/igdb/juegos?sort=lanzamiento&page=0&size=20
/ludus/igdb/plataformas?page=1&size=50
```

Game (mismo DTO en ficha y elementos de catálogo):

```json
{
  "igdbId":119133,"localGameId":4,"nombre":"Elden Ring",
  "descripcion":"Descripción completa o null",
  "portadaUrl":"https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
  "generos":[{"id":12,"nombre":"Role-playing (RPG)"}],
  "plataformas":[{"id":6,"nombre":"PC (Microsoft Windows)"}],
  "lanzamiento":1645747200,"ratingIgdb":92.1,"slug":"elden-ring",
  "screenshots":["https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc_example.jpg"],
  "ratingLudus":{"promedio":4.5,"cantidad":2}
}
```

`localGameId` es null mientras no exista fila local; una búsqueda no la crea.
`descripcion`, `portadaUrl`, `lanzamiento`, `ratingIgdb`, `slug` pueden ser null.
Géneros, plataformas y screenshots siempre son listas (posiblemente vacías).
`lanzamiento` es Unix **segundos** UTC; JS: `new Date(valor * 1000)`.
`ratingIgdb` es el rating de usuarios de IGDB en escala 0..100, no la media social de LUDUS.
Portadas: HTTPS `cover_big`; screenshots: `screenshot_big`. No se publican URL suministradas libremente por clientes.
No se incluyen developer/publisher/web: no hay contrato para esos campos en esta versión.

Lookup es `{"id":12,"nombre":"Role-playing (RPG)"}`.
Géneros y plataformas se paginan realmente; cargar páginas hasta hasNext=false.
No filtrar por el texto mostrado en un select: enviar su id.

Juego local (lectura/resolución/POST legado):

```json
{
  "id_juego":4,"id_api":119133,"nombre_juego":"Elden Ring",
  "categoria":"Role-playing (RPG)","plataforma":"PC (Microsoft Windows)",
  "descripcion":"Descripción completa o null","imagen_url":null
}
```

`categoria` y `plataforma` locales son representaciones temporales de nombres separados por coma.
No usarlas para recuperar IDs ni separar nombres ambiguos: los lookups y DTO externos proporcionan listas con IDs estables.

## Reseñas y perfiles

| Método | Ruta exacta | Parámetros / entrada | Respuesta y estados |
|---|---|---|---|
| POST | /ludus/publicacion/igdb/{igdbId} | InputReview; autor exclusivamente del JWT | 201 Review; 400,401,404,409,502,503,504 |
| POST | /ludus/publicacion/ (también sin barra final) | legado: {"juego":{"id_juego":4},"texto_resenia":"Excelente","calificacion":5}; usuario/id_resenia/fecha del body no se usan | 201 Review; 400,401,404,409 |
| GET | /ludus/publicacion/ (también sin barra final) | page=0,size=20 | 200 página Review de todos los autores; 400,401 |
| GET | /ludus/publicacion/{idResenia} | id local Integer | 200 Review; 400,401,404 |
| GET | /ludus/publicacion/juego/igdb/{igdbId} | page=0,size=20 | 200 página Review de todos los autores; 400,401 |
| GET | /ludus/publicacion/juego/igdb/{igdbId}/rating | igdbId positivo | 200 Social; 400,401 |
| GET | /ludus/publicacion/me | page=0,size=20; usuario resuelto desde JWT | 200 página Review propia; 400,401 |
| GET | /ludus/publicacion/usuario/{idUsuario} | page=0,size=20; id local de perfil | 200 página Review del perfil; 400,401,404 perfil inexistente |
| PUT | /ludus/publicacion/{idResenia} | InputReview; compatibilidad sin body con calificacion y texto_resenia en query | 200 Review; 400,401,403 otro autor,404,409 |
| DELETE | /ludus/publicacion/{idResenia} | solo autor | 204 sin body; 400,401,403,404,409 |
| GET | /ludus/perfil/me | identidad del JWT | 200 Profile; 401 |
| GET | /ludus/perfil/{idUsuario} | id local | 200 Profile; 400,401,404 |
| PUT | /ludus/perfil/me | {"nombre":"Ana","sobreMi":"Mi biografía"}; nombre 1..100, sobreMi 0..240 | 200 Profile; 400,401,409 |

InputReview para POST externo y PUT:

```json
{"texto":"Excelente mundo abierto","calificacion":4.5}
```

Texto obligatorio 1..10000 caracteres, se almacena con trim. Calificación finita **1..5** (se conserva escala existente; admite decimales).
PUT requiere ambos campos; no es un PATCH parcial. No enviar IDs de usuario ni fecha.
El backend ignora propiedades de autor del payload y conserva el autor original al editar.
Cada usuario puede tener **como máximo una reseña por juego local**: UNIQUE(id_usuario,id_juego).
Ambas rutas POST devuelven **409** si ese autor ya reseñó el juego, incluso ante solicitudes concurrentes.
El POST duplicado no modifica la reseña existente ni devuelve otro 201. La comprobación usa el usuario
del JWT y el ID local resuelto; no se puede eludir cambiando entre ruta IGDB y ruta local heredada.
Para cambiarla usar PUT /ludus/publicacion/{idResenia}; para retirarla usar DELETE propio.
Después de eliminarla puede publicarse nuevamente. Otros usuarios sí pueden reseñar el mismo juego.
POST reseña no es un upsert: evitar doble clic y, ante resultado incierto/409, consultar la reseña
existente y ofrecer editarla, sin reintentar automáticamente ni sobrescribirla.
Error habitual: `{"status":409,"error":"Ya publicaste una resena para este videojuego; puedes editarla o eliminarla"}`.
Una carrera resuelta por el índice único también devuelve 409 con el mensaje genérico de integridad.

Review (sin entidades Hibernate, email, teléfono ni contraseña):

```json
{
  "idResenia":21,"texto":"Excelente mundo abierto","calificacion":4.5,
  "fechaPublicacion":"2026-11-05T12:30:00",
  "autor":{"idUsuario":2,"nombre":"Ana"},
  "juego":{"localGameId":4,"igdbId":119133,"nombre":"Elden Ring","portadaUrl":null}
}
```

La fecha es LocalDateTime del servidor, sin offset, por compatibilidad con la entidad existente.
Orden estable en todas las páginas de reseñas: fecha descendente y, en empate, id descendente.
No invertir el array recibido ni calcular promedio usando solo la página.
Para IGDB ID positivo sin fila local (o sin reseñas) se responde página vacía, sin consultar ni guardar en IGDB.
No se verifica existencia externa al pedir reseñas/rating: un ID externo desconocido positivo también produce vacío.
Para un perfil inexistente se responde 404.
Perfil y ficha leen **las mismas filas de resenias**, nunca copias.

Social: `{"promedio":4.5,"cantidad":2}`; sin reseñas: `{"promedio":null,"cantidad":0}`.
Eliminar una reseña propia elimina explícitamente sus comentarios/interacciones en la misma transacción;
no elimina el juego, usuario ni reseñas ajenas. No se añadieron cascadas de FK.
Una carrera con otras escrituras dependientes puede dar 409 y se revierte la transacción.

Profile: `{"idUsuario":2,"nombre":"Ana","sobreMi":"Mi biografía","cantidadResenias":2,"juegosResenados":1,"promedioCalificacion":4.5,"totalLikes":3}`.
Los contadores se calculan desde MySQL para todo el perfil, no desde su página actual.
totalLikes cuenta interacciones recibidas en sus reseñas, juegosResenados cuenta juegos distintos,
promedioCalificacion es la media de las calificaciones emitidas por ese usuario (null sin reseñas).
No hay endpoints de upload/avatar/portada/colores: el backend actual no tiene esos campos.

## Likes persistentes de reseñas

Se reutilizan Interaccion, InteraccionRepository, InteraccionesService e InteraccionController.
Todas estas rutas exigen JWT LUDUS y un usuario existente. No reciben id_usuario ni fecha del cliente.
La pareja (id_usuario,id_resenia) es única; un segundo intento de dar like devuelve **409** en
ambas rutas POST, sin cambiar id/fecha ni añadir filas. Dar like no es un toggle ni un upsert.
Se permiten likes a reseñas propias: el código anterior no los prohibía y se conserva esa política.

| Método | Ruta exacta | Respuesta / estados |
|---|---|---|
| POST | /ludus/interaccion/resenia/{idResenia} | Sin body. 201 LikeState; 400 ID inválido, 401, 404 reseña inexistente, 409 ya existe/conflicto concurrente |
| DELETE | /ludus/interaccion/resenia/{idResenia} | 204 sin body. Solo elimina la pareja del usuario JWT. Idempotente si la reseña existe aunque no tenga like propio; 400,401,404 reseña inexistente |
| GET | /ludus/interaccion/resenia/{idResenia} | 200 LikeState; 400,401,404 |
| GET | /ludus/interaccion/resenias?ids=21,22,23 | 200 array LikeState; de 1 a 50 IDs Integer positivos. 400 lista ausente/vacía/excesiva o ID inválido;401;404 si falta alguna reseña |
| POST | /ludus/interaccion/ | Compatibilidad: {"publicacion":{"id_resenia":21}}. 201 entidad Interaccion; 400,401,404,409. Ignora usuario, id_interaccion y fecha_like entrantes |
| DELETE | /ludus/interaccion/{id_interaccion} | Compatibilidad:204 solo dueño;400,401,403 ajeno,404 inexistente |

LikeState (el mismo DTO tras POST y GET):

```json
{"idResenia":21,"totalLikes":7,"likedByMe":true,"idInteraccion":45}
```

Sin like propio, idInteraccion es null y likedByMe=false; totalLikes incluye a todos los usuarios,
también al autor cuando da like a su propia reseña. Los IDs son de reseña/interacción locales,
no IGDB IDs ni id_juego. No se exponen usuarios, contraseñas ni tokens en LikeState.

La consulta por lote conserva el orden de los IDs solicitados y colapsa duplicados. La cota de
50 se aplica a la lista recibida antes de colapsarlos. Una reseña sin likes devuelve 0/false/null;
una reseña inexistente causa 404 para todo el lote, no se omite silenciosamente.
Se usa **una consulta SQL agregada para el lote**, más la consulta de identidad del JWT:
las pruebas miden dos SQL tanto para una como para veinte reseñas. No consultar una tarjeta a la vez.
Los DTO Review conservan su formato; para totalLikes/likedByMe consumir este lote y unir por idResenia.
No se cachea el estado personal ni el contador; refrescar tras mutaciones o cambio de sesión.

POST duplicado habitual: {"status":409,"error":"Ya diste like a esta resena"}.
Si el índice único detecta una carrera, ApiErrors también devuelve 409 con mensaje genérico de integridad.
Un DELETE por reseña realizado por otro usuario no elimina likes ajenos: únicamente intenta retirar
el propio. El DELETE legado por idInteraccion sí responde 403 si pertenece a otra persona.

El perfil sigue calculando totalLikes como SUMA de interacciones recibidas en todas las reseñas
del autor, no likes emitidos ni usuarios distintos globales. Quitar likes y borrar una reseña propia
actualiza esa cifra. La eliminación de reseñas ya borra sus interacciones en la misma transacción;
se mantiene ese código y las FK activas. Una carrera con otras escrituras puede causar 409/rollback,
sin dejar huérfanos; refrescar la reseña antes de reintentar.

Persistencia: tabla interacciones existente, fecha asignada por servidor y restricción
uk_interacciones_usuario_resenia UNIQUE(id_usuario,id_resenia). Aplicar manualmente
docs/sql/V002_interacciones_like_unico.sql tras backup y preflight; V001 no se modifica.
Si hay duplicados históricos, detenerse y acordar su conservación, sin borrarlos automáticamente.
La comprobación del servicio no sustituye la restricción MySQL para proteger solicitudes concurrentes.

Ejemplos sin credenciales reales:

```bash
curl -X POST -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/interaccion/resenia/21'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/interaccion/resenias?ids=21,22'
curl -X DELETE -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/interaccion/resenia/21'
```

## IDs, persistencia y transacciones

IGDB 119133 y localGameId 4 son espacios distintos. No enviar 119133 como `juego.id_juego`.
Ruta mínima de dos pasos: POST resolver -> tomar `id_juego` -> POST legado con `juego.id_juego`.
Ruta recomendada de un paso para UI: POST `/ludus/publicacion/igdb/119133`;
el servicio resuelve/verifica y usa automáticamente el id local al crear la reseña.

Resolver primero consulta UNIQUE(id_api), obtiene detalle confiable desde IGDB si falta y hace
insert en transacción independiente. Ante inserción concurrente, termina el rollback antes de leer
la fila ganadora. No se actualiza un juego existente con datos proporcionados por clientes.
La reseña se valida y se verifica el usuario **antes** de resolver el juego.
La escritura de reseña es transaccional; si después de resolver falla una FK o el guardado,
puede conservarse un juego verificado sin reseñas. No quedan reseñas con FK inconsistente.
No se promete atomicidad de juego+reseña en una sola transacción distribuida con IGDB.

## Caché, OAuth, cuota y errores

La caché en memoria guarda respuestas externas exitosas de consulta/detalle/lookups por 60 segundos,
máximo 200 consultas por instancia. No guarda búsquedas en MySQL.
La resolución explícita guarda el juego; publicar guarda la reseña y sus FK.
Los datos locales y rating social se vuelven a consultar al formar el DTO y no se cachean.
La caché no es compartida entre instancias ni un snapshot estable entre páginas.

Se permiten hasta 4 requests IGDB por ventana de un segundo y 8 en vuelo por instancia.
Al superar la cuota se devuelve 503 inmediatamente; no se duermen hilos.
Un 429 del proveedor activa un cooldown de Retry-After numérico (1..60 s, 1 s si no es válido).
No se hacen reintentos automáticos de 429/5xx. 503 lleva Retry-After: 1; puede ser necesario esperar más por el cooldown interno.
Si se despliegan varias instancias con el mismo Client ID, se requiere coordinador de cuota compartida.

Con IGDB_CLIENT_SECRET configurado, OAuth client credentials tiene prioridad sobre IGDB_ACCESS_TOKEN.
El token se cachea hasta 60 segundos antes de caducar, con renovación serializada y cooldown de fallos.
Un 401 IGDB invalida ese token y permite una sola renovación/repetición (también sujeta a cuota);
un segundo 401 produce 502. Sin secret, se usa token estático y su renovación es manual.
Nunca reutilizar el secret expuesto históricamente.

Errores nuevos: `{"status":400,"error":"Entrada invalida"}`.
401 filtro: `{"status":401,"error":"Se requiere un JWT LUDUS valido"}` + WWW-Authenticate: Bearer.

| HTTP | Significado |
|---|---|
| 400 | Entrada, rango, ID o sort inválido |
| 401 | Falta JWT LUDUS válido; en escrituras, usuario del JWT eliminado/inexistente |
| 403 | Usuario autenticado sin propiedad/permisos |
| 404 | Juego externo/local, perfil o reseña inexistente donde se verifica existencia |
| 409 | Reseña ya existente del usuario para ese juego, o conflicto de integridad/FK/esquema; sin detalles SQL |
| 429 | IGDB puede responderlo; LUDUS lo traduce a 503, no lo reenvía |
| 502 | IGDB 400/401/403/5xx, cuerpo inválido o autenticación OAuth fallida; sin cuerpo externo |
| 503 | Cuota local/upstream, cooldown OAuth o integración sin configurar |
| 504 | Timeout/fallo de acceso HTTP a IGDB o Twitch |

Conexión externa: 3 s; lectura: 5 s. No se imprimen tokens, encabezados ni cuerpos externos.

## Login, usuarios y auxiliares heredados: inventario completo

Estos endpoints siguen en sus controladores originales. Los nuevos perfiles/reseñas usan DTO seguros.
Los GET heredados de entidades siguen su formato anterior y no están paginados; no son el contrato nuevo de perfil.
Se agregó verificación de propiedad para editar/borrar usuarios, interacciones y seguimientos,
y se deriva el autor de comentarios/interacciones del JWT.

| Método | Ruta | Entrada / respuesta principal |
|---|---|---|
| POST | /ludus/login | anónimo; {"correo":"<CORREO>","contrasenia":"<PASSWORD>"} -> 200 {"token":"<JWT_LUDUS>"}; 401 credenciales incorrectas |
| POST | /ludus/usuario/ | anónimo; nombre,correo,contrasenia,telefono,sobre_mi -> 200 Usuario; id_usuario entrante descartado; 400/409 |
| GET | /ludus/usuario/ | JWT; 200 array Usuario |
| GET | /ludus/usuario/{id_usuario} | JWT; 200 Usuario |
| PUT | /ludus/usuario/{id_usuario} | JWT propio; JSON Usuario (campos editables nombre,correo,contrasenia,telefono,sobre_mi) -> 200 Usuario; 403 ajeno |
| DELETE | /ludus/usuario/{id_usuario} | JWT propio; 200 Usuario; 403 ajeno,409 FK |
| GET | /ludus/comentario/ | JWT; 200 array Comentario |
| GET | /ludus/comentario/resenia/{id_resenia} | JWT; 200 array Comentario |
| POST | /ludus/comentario/ | JWT; {"publicacion":{"id_resenia":21},"texto_comentario":"Comentario"} -> 200 Comentario; usuario e id entrantes descartados |
| GET | /ludus/interaccion/ | JWT; 200 array Interaccion |
| GET | /ludus/interaccion/{id_interaccion} | JWT; 200 Interaccion |
| POST | /ludus/interaccion/ | JWT; {"publicacion":{"id_resenia":21}} -> 201 Interaccion; usuario/id/fecha entrantes descartados;409 duplicado,404 reseña inexistente |
| DELETE | /ludus/interaccion/{id_interaccion} | JWT propio;204;403 ajeno,404 inexistente |
| GET | /ludus/seguidor/ | JWT; 200 array Seguidor |
| GET | /ludus/seguidor/siguiendo/{id_usuario} | JWT; 200 array Seguidor |
| GET | /ludus/seguidor/seguidores/{id_usuario} | JWT; 200 array Seguidor |
| POST | /ludus/seguidor/seguir | JWT; query idSeguidor=<MI_ID>&idSeguido=<OTRO_ID>; 201 Seguidor; 400 duplicado/autoseguimiento,403 suplantación |
| DELETE | /ludus/seguidor/{id_seguimiento} | JWT del seguidor; 204;403 ajeno,404 inexistente |
| OPTIONS | /** | preflight CORS permitido para http://localhost:5502 y http://127.0.0.1:5502 |

Todos los auxiliares protegidos pueden devolver 401,400 (entrada inválida),409 (FK/duplicación);
las validaciones heredadas no se anuncian como un rediseño completo.
Usuario usa id_usuario,nombre,correo,telefono,sobre_mi,fecha_registro; **contrasenia es solo escritura**.
Comentario usa id_comentario,publicacion,usuario,texto_comentario,fecha_comentario.
Interaccion usa id_interaccion,fecha_like,usuario,publicacion.
Seguidor usa idSeguimiento,seguidor,seguido,fechaSeguimiento.
Son entidades anidadas heredadas; para datos públicos de autor/juego usar Review/Profile.
No existe `/ludus/resenia/`: la entidad real es Publicacion y su ruta es `/ludus/publicacion/`.

Ejemplo de comentario devuelto (fragmento de entidades anidadas; no usarlo como DTO de perfil):
```json
{"id_comentario":7,"texto_comentario":"Comentario","fecha_comentario":"2026-11-05T12:30:00","usuario":{"id_usuario":2,"nombre":"Ana","correo":"ana@example.test","telefono":"<TELEFONO>","sobre_mi":"","fecha_registro":"2026-11-01T10:00:00"},"publicacion":{"id_resenia":21,"calificacion":4.5,"texto_resenia":"Excelente mundo abierto","fecha_publicacion":"2026-11-05T12:30:00","usuario":{},"juego":{"id_juego":4,"id_api":119133,"nombre_juego":"Elden Ring"}}}
```

## curl / Postman

En Postman usar Authorization -> Bearer Token -> JWT LUDUS obtenido del login.
No pegar token Twitch ni Client Secret en la pestaña Authorization de LUDUS.
Ejemplos para shell POSIX; en PowerShell usar `curl.exe` y ajustar comillas o usar Postman.
Los valores entre <> son placeholders; no versionar exportaciones con credenciales.

```bash
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/igdb/buscar?nombre=Elden%20Ring&page=0&size=10'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/igdb/juegos?genreId=12&platformId=6&sort=rating'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/igdb/juegos/119133'
curl -X POST -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/igdb/juegos/119133/resolver'
curl -X POST -H 'Authorization: Bearer <JWT_LUDUS>' -H 'Content-Type: application/json' -d '{"texto":"Excelente","calificacion":5}' 'http://localhost:8080/ludus/publicacion/igdb/119133'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/juego/igdb/119133'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/me'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/usuario/2'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/21'
curl -X PUT -H 'Authorization: Bearer <JWT_LUDUS>' -H 'Content-Type: application/json' -d '{"texto":"Actualizada","calificacion":4}' 'http://localhost:8080/ludus/publicacion/21'
curl -X DELETE -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/21'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/publicacion/juego/igdb/119133/rating'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/perfil/me'
curl -H 'Authorization: Bearer <JWT_LUDUS>' 'http://localhost:8080/ludus/perfil/2'
curl -X PUT -H 'Authorization: Bearer <JWT_LUDUS>' -H 'Content-Type: application/json' -d '{"nombre":"Ana","sobreMi":"Juego RPG"}' 'http://localhost:8080/ludus/perfil/me'
```

Fuentes oficiales consultadas: [IGDB](https://api-docs.igdb.com/) y
[OAuth Twitch](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow).
