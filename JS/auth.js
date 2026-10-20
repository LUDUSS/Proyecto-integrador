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

function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("Ya existe una cuenta registrada con ese correo.");
  }

  users.push({
    name: name.trim(),
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
