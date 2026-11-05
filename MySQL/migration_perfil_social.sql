-- ==============================================
-- MIGRACIÓN: Funcionalidades sociales de perfil
-- ==============================================

USE ludus;

-- 1. Privacidad: perfil público/privado
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS perfil_publico TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS juego_activo VARCHAR(150) DEFAULT NULL;

-- 2. Índices útiles para búsqueda de usuarios
ALTER TABLE interacciones
    ADD COLUMN IF NOT EXISTS id_usuario INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS id_resenia INT NOT NULL DEFAULT 0;

-- shortcut: id_usuario e id_resenia se agregaron como temporales (DEFAULT 0);
--           cuando el backend active las FK en el modelo, actualizar con valores reales.
