USE ludus;

SELECT id_usuario, nombre FROM usuarios;
SELECT id_juego, nombre_juego FROM juegos;
SELECT id_resenia, id_usuario, id_juego FROM resenias;

-- ==================================
-- USUARIOS
-- ==================================

INSERT INTO usuarios
(nombre, correo, contrasenia, telefono, sobre_mi)
VALUES
('Neto', 'neto@ludus.com', 'pass123', '5512345678', 'Gamer de corazón'),
('Kula', 'kula@ludus.com', 'pass123', '5512345679', 'Fan de Zelda'),
('Jinx', 'jinx@ludus.com', 'pass123', '5512345670', 'Main de LoL'),
('Abraham', 'abraham@ludus.com', 'pass123', '5512345671', 'Soulslike lover'),
('Mara', 'mara@ludus.com', 'pass123', '5512345672', 'Desarrolladora');


-- ==================================
-- JUEGOS
-- ==================================

INSERT INTO juegos
(nombre_juego, categoria, plataforma, descripcion)
VALUES
('Elden Ring', 'RPG', 'PC/PS5', 'Obra maestra de FromSoftware'),
('Baldurs Gate 3', 'RPG', 'PC', 'Juego del año 2023'),
('Zelda: TotK', 'Aventura', 'Switch', 'Mundo abierto de Nintendo'),
('God of War Ragnarok', 'Acción', 'PS5', 'Mitología nórdica'),
('Gran Turismo 7', 'Carreras', 'PS5', 'Simulador realista');


-- ==================================
-- RESEÑAS
-- ==================================

INSERT INTO resenias
(id_usuario, id_juego, texto_resenia, calificacion)
VALUES
(1, 1, 'Increíble juego, los jefes son épicos', 5.0),
(2, 3, 'La construcción y las mecánicas son geniales', 4.5),
(3, 2, 'Cada área es un descubrimiento nuevo', 5.0),
(4, 4, 'La historia de Kratos y Atreus es muy buena', 4.8),
(5, 5, 'La simulación es muy fuerte, me encanta', 4.0);


-- ==================================
-- COMENTARIOS
-- ==================================

INSERT INTO comentarios
(id_resenia, id_usuario, texto_comentario)
VALUES
(1, 2, 'Totalmente de acuerdo, Elden Ring es una joya'),
(2, 1, 'A mí me gustó más el primero, pero este está genial'),
(3, 4, 'Baldurs Gate se merece todo el hype'),
(4, 5, 'Qué buen análisis, me dieron ganas de jugarlo'),
(5, 3, 'Gran Turismo es demasiado realista jaja');


-- ==================================
-- INTERACCIONES
-- ==================================

INSERT INTO interacciones
(id_usuario, id_resenia)
VALUES
(1, 2),
(2, 3),
(3, 1),
(4, 5),
(5, 4);


-- ==================================
-- SEGUIDORES
-- ==================================

INSERT INTO seguidores
(id_seguidor, id_seguido)
VALUES
(1, 2),
(2, 1),
(3, 1),
(4, 3),
(5, 4);

-- ==================================
-- CONSULTAS PARA VER TABLAS :D
-- ==================================

SELECT *
FROM comentarios;

SELECT *
FROM interacciones;

SELECT *
FROM juegos;

SELECT *
FROM resenias;

SELECT *
FROM seguidores;

SELECT *
FROM usuarios;