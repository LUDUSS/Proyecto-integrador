/*
 * Autenticación de demostración para LUDUS.
 */
const LUDUS_USERS_KEY = "ludus_users";
const LUDUS_SESSION_KEY = "ludus_session";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LUDUS_USERS_KEY)) || [];
  } catch (error) {
    console.error("No se pudieron leer las cuentas guardadas:", error);
    return [];
  }
}

function getCurrentUser() {
  const email = sessionStorage.getItem(LUDUS_SESSION_KEY);
  if (!email) return null;

  const user = getUsers().find((item) => item.email === email);
  if (!user) sessionStorage.removeItem(LUDUS_SESSION_KEY);
  if (!user) return null;

  return { name: user.name, email: user.email };
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function registerUser({ name, email, password, telefono }) {

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedTelefono = telefono.trim();

    const users = getUsers();

    const regexNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}$/;
    const regexTelefono = /^[0-9]{10}$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*?_-]).{8,}$/;

    // Validación del nombre
    if (!regexNombre.test(normalizedName)) {
        throw new Error("El nombre debe contener entre 3 y 60 caracteres, únicamente letras y espacios.");
    }

    // Validación del teléfono
    if (!regexTelefono.test(normalizedTelefono)) {
        throw new Error("El teléfono debe contener exactamente 10 dígitos.");
    }

    // Validación del correo
    if (!regexCorreo.test(normalizedEmail)) {
        throw new Error("Introduce un correo electrónico válido.");
    }

    // Validación de la contraseña
    if (!regexPassword.test(password)) {
        throw new Error("La contraseña no cumple con los requisitos.");
    }

    // Verificar si el correo ya está registrado
    if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("Ya existe una cuenta registrada con ese correo.");
    }

    // Guardar usuario
    users.push({
        name: normalizedName,
        telefono: normalizedTelefono,
        email: normalizedEmail,
        password
    });

    localStorage.setItem(LUDUS_USERS_KEY, JSON.stringify(users));
}

function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find(
    (item) => item.email === normalizedEmail && item.password === password
  );

  if (!user) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  sessionStorage.setItem(LUDUS_SESSION_KEY, user.email);
}

function logoutUser() {
  sessionStorage.removeItem(LUDUS_SESSION_KEY);
  window.location.href = "./index.html";
}

function requireAuth() {
  if (isLoggedIn()) return true;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  sessionStorage.setItem("ludus_redirect_after_login", currentPage);
  window.location.replace("./login.html?required=1");
  return false;
}

function getPostLoginDestination() {
  const destination = sessionStorage.getItem("ludus_redirect_after_login");
  sessionStorage.removeItem("ludus_redirect_after_login");

  // Solo permitir páginas locales conocidas para evitar redirecciones externas.
  const allowedPages = ["perfil.html"];
  return allowedPages.includes(destination) ? `./${destination}` : "./index.html";
}
