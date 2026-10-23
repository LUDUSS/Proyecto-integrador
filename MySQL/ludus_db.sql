-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema ludus
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema ludus
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `ludus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
USE `ludus` ;

-- -----------------------------------------------------
-- Table `ludus`.`juegos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`juegos` (
  `id_juego` INT NOT NULL AUTO_INCREMENT,
  `nombre_juego` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(100) NULL DEFAULT NULL,
  `plataforma` VARCHAR(100) NULL DEFAULT NULL,
  `descripcion` TEXT NULL DEFAULT NULL,
  `imagen_url` VARCHAR(500) NULL DEFAULT NULL,
  `api_id` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_juego`),
  UNIQUE INDEX `api_id` (`api_id` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `ludus`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(254) NOT NULL,
  `contrasenia` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(15) NULL DEFAULT NULL,
  `sobre_mi` TEXT NULL DEFAULT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo` (`correo` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `ludus`.`resenias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`resenias` (
  `id_resenia` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_juego` INT NOT NULL,
  `calificacion` DECIMAL(3,1) NOT NULL,
  `texto_resenia` TEXT NOT NULL,
  `fecha_publicacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resenia`),
  UNIQUE INDEX `uq_resenia_usuario_juego` (`id_usuario` ASC, `id_juego` ASC) VISIBLE,
  INDEX `fk_resenia_juego` (`id_juego` ASC) VISIBLE,
  CONSTRAINT `fk_resenia_juego`
    FOREIGN KEY (`id_juego`)
    REFERENCES `ludus`.`juegos` (`id_juego`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_resenia_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `ludus`.`usuarios` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `ludus`.`comentarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`comentarios` (
  `id_comentario` INT NOT NULL AUTO_INCREMENT,
  `id_resenia` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `texto_comentario` TEXT NOT NULL,
  `fecha_comentario` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_comentario`),
  INDEX `fk_comentario_resenia` (`id_resenia` ASC) VISIBLE,
  INDEX `fk_comentario_usuario` (`id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_comentario_resenia`
    FOREIGN KEY (`id_resenia`)
    REFERENCES `ludus`.`resenias` (`id_resenia`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comentario_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `ludus`.`usuarios` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `ludus`.`interacciones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`interacciones` (
  `id_interaccion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_resenia` INT NOT NULL,
  `fecha_like` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_interaccion`),
  UNIQUE INDEX `uq_like_usuario_resenia` (`id_usuario` ASC, `id_resenia` ASC) VISIBLE,
  INDEX `fk_interaccion_resenia` (`id_resenia` ASC) VISIBLE,
  CONSTRAINT `fk_interaccion_resenia`
    FOREIGN KEY (`id_resenia`)
    REFERENCES `ludus`.`resenias` (`id_resenia`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_interaccion_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `ludus`.`usuarios` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `ludus`.`seguidores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ludus`.`seguidores` (
  `id_seguimiento` INT NOT NULL AUTO_INCREMENT,
  `id_seguidor` INT NOT NULL,
  `id_seguido` INT NOT NULL,
  `fecha_seguimiento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_seguimiento`),
  UNIQUE INDEX `uq_seguidor_seguido` (`id_seguidor` ASC, `id_seguido` ASC) VISIBLE,
  INDEX `fk_seguidores_seguido` (`id_seguido` ASC) VISIBLE,
  CONSTRAINT `fk_seguidores_seguido`
    FOREIGN KEY (`id_seguido`)
    REFERENCES `ludus`.`usuarios` (`id_usuario`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_seguidores_seguidor`
    FOREIGN KEY (`id_seguidor`)
    REFERENCES `ludus`.`usuarios` (`id_usuario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
