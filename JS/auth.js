/*
 * Autenticación de LUDUS y datos locales del perfil.
 */
const LUDUS_USERS_KEY = "ludus_users";
const LUDUS_SESSION_KEY = "ludus_session";
const LUDUS_TOKEN_KEY = "ludus_access_token";
const LUDUS_TOKEN_EXPIRY_KEY = "ludus_access_token_expiry";
const LUDUS_TOKEN_TTL_MS = 3 * 60 * 60 * 1000;

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LUDUS_USERS_KEY)) || [];
  } catch (error) {
    console.error("No se pudieron leer las cuentas guardadas:", error);
    return [];
  }
}

function getCurrentUser() {
  if (!isLoggedIn()) return null;

  const email = sessionStorage.getItem(LUDUS_SESSION_KEY);
  if (!email) return null;

  const user = getUsers().find((item) => item.email === email);
  return user
    ? { name: user.name, email: user.email }
    : { name: email, email };
}

function isLoggedIn() {
  return getAuthToken() !== null;
}

function getAuthToken() {
  const token = sessionStorage.getItem(LUDUS_TOKEN_KEY);
  const expiresAt = Number(sessionStorage.getItem(LUDUS_TOKEN_EXPIRY_KEY));

  if (!token || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    if (token || sessionStorage.getItem(LUDUS_SESSION_KEY)) clearAuthSession();
    return null;
  }

  return token;
}

function getTokenExpiry(token) {
  const payload = token.split(".")[1];
  if (payload) {
    try {
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const claims = JSON.parse(atob(paddedBase64));
      if (Number.isFinite(claims.exp)) return claims.exp * 1000;
    } catch (error) {
      console.warn("No se pudo leer la expiración del JWT; se aplicará el límite de 3 horas.", error);
    }
  }

  return Date.now() + LUDUS_TOKEN_TTL_MS;
}

function saveAuthToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("El servicio de login no devolvió un token válido.");
  }

  const expiresAt = Math.min(getTokenExpiry(token), Date.now() + LUDUS_TOKEN_TTL_MS);
  if (Date.now() >= expiresAt) {
    throw new Error("El servicio de login devolvió un token vencido.");
  }

  sessionStorage.setItem(LUDUS_TOKEN_KEY, token);
  sessionStorage.setItem(LUDUS_TOKEN_EXPIRY_KEY, String(expiresAt));
}

function clearAuthSession() {
  sessionStorage.removeItem(LUDUS_SESSION_KEY);
  sessionStorage.removeItem(LUDUS_TOKEN_KEY);
  sessionStorage.removeItem(LUDUS_TOKEN_EXPIRY_KEY);
}

async function registerUser({ name, email, password, telefono }) {

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedTelefono = telefono.trim();

    const regexNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}$/;
    const regexTelefono = /^(?!([0-9])\1{9}$)(?!911)[2-9][1-9][0-9]{8}$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*?_-]).{8,}$/;

    // Validación del nombre
    if (!regexNombre.test(normalizedName)) {
        throw new Error("El nombre debe contener entre 3 y 60 caracteres, únicamente letras y espacios.");
    }

    // Validación del teléfono
    if (!regexTelefono.test(normalizedTelefono)) {
        throw new Error("El teléfono que ingresaste no es válido.");
    }

    // Validación del correo
    if (!regexCorreo.test(normalizedEmail)) {
        throw new Error("Introduce un correo electrónico válido.");
    }

    // Validación de la contraseña
    if (!regexPassword.test(password)) {
        throw new Error("La contraseña no cumple con los requisitos.");
    }

    return consumeApi("/ludus/usuario/", {
        method: "POST",
        auth: false,
        body: {
            nombre: normalizedName,
            correo: normalizedEmail,
            contrasenia: password,
            telefono: normalizedTelefono,
            sobre_mi: "",
            fecha_registro: new Date().toISOString()
        }
    });
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await consumeApi("/ludus/login", {
    method: "POST",
    body: { correo: normalizedEmail, contrasenia: password },
    auth: false
  });
  const token = typeof response === "string" ? response : response && response.token;

  saveAuthToken(token);
  sessionStorage.setItem(LUDUS_SESSION_KEY, normalizedEmail);
}

function logoutUser() {
  clearAuthSession();
  window.location.href = "./index.html";
}

function requireAuth() {
  if (isLoggedIn()) return true;

  const currentPage = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
  sessionStorage.setItem("ludus_redirect_after_login", currentPage);
  window.location.replace("./login.html?required=1");
  return false;
}

function getPostLoginDestination() {
  const destination = sessionStorage.getItem("ludus_redirect_after_login");
  sessionStorage.removeItem("ludus_redirect_after_login");

  const allowedPages = ["perfil.html", "juegos.html"];
  try {
    const target = new URL(destination || "", window.location.origin);
    const page = target.pathname.split("/").pop();
    return target.origin === window.location.origin && allowedPages.includes(page)
      ? `.${target.pathname}${target.search}`
      : "./index.html";
  } catch (error) {
    return "./index.html";
  }
}
