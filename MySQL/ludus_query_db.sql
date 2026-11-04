-- ==============================================
-- BASE DE DATOS LUDUS
-- ==============================================

CREATE DATABASE IF NOT EXISTS ludus
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ludus;


-- ==============================================
-- 1. USUARIOS
-- ==============================================

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(254) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    sobre_mi TEXT,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;


-- ==============================================
-- 2. JUEGOS
-- ==============================================

CREATE TABLE juegos (
    id_juego INT AUTO_INCREMENT PRIMARY KEY,
    nombre_juego VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    plataforma VARCHAR(100),
    descripcion TEXT,
    imagen_url VARCHAR(500),
    api_id INT UNIQUE
) ENGINE = InnoDB;


-- ==============================================
-- 3. RESEÑAS
-- ==============================================

CREATE TABLE resenias (
    id_resenia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_juego INT NOT NULL,
    calificacion DECIMAL(3,1) NOT NULL,
    texto_resenia TEXT NOT NULL,
    fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_resenia_calificacion
        CHECK (calificacion BETWEEN 0 AND 10),

    CONSTRAINT fk_resenia_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_resenia_juego
        FOREIGN KEY (id_juego)
        REFERENCES juegos(id_juego)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_resenia_usuario_juego
        UNIQUE (id_usuario, id_juego)

) ENGINE = InnoDB;


-- ==============================================
-- 4. COMENTARIOS
-- ==============================================

CREATE TABLE comentarios (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_resenia INT NOT NULL,
    id_usuario INT NOT NULL,
    texto_comentario TEXT NOT NULL,
    fecha_comentario DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comentario_resenia
        FOREIGN KEY (id_resenia)
        REFERENCES resenias(id_resenia)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE = InnoDB;


-- ==============================================
-- 5. INTERACCIONES (LIKES)
-- ==============================================

CREATE TABLE interacciones (
    id_interaccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_resenia INT NOT NULL,
    fecha_like DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_interaccion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_interaccion_resenia
        FOREIGN KEY (id_resenia)
        REFERENCES resenias(id_resenia)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_like_usuario_resenia
        UNIQUE (id_usuario, id_resenia)

) ENGINE = InnoDB;


-- ==============================================
-- 6. SEGUIDORES
-- ==============================================

CREATE TABLE seguidores (
    id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_seguidor INT NOT NULL,
    id_seguido INT NOT NULL,
    fecha_seguimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_seguidores_seguidor
        FOREIGN KEY (id_seguidor)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_seguidores_seguido
        FOREIGN KEY (id_seguido)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT uq_seguidor_seguido
        UNIQUE (id_seguidor, id_seguido),

    CONSTRAINT chk_no_autoseguimiento
        CHECK (id_seguidor <> id_seguido)

) ENGINE = InnoDB;
