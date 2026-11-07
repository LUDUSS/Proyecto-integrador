const API_BASE_URL = "https://backend-ludus.onrender.com";

function formatLocalDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function consumeApi(endpoint, { method = "GET", body, auth = true } = {}) {
  if (typeof endpoint !== "string" || !endpoint.startsWith("/")) {
    throw new Error("El endpoint debe ser una ruta que comience con '/'.");
  }

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = typeof getAuthToken === "function" ? getAuthToken() : null;
    if (!token) throw new Error("Inicia sesión para consumir este servicio.");
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: method.toUpperCase(),
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const responseText = response.status === 204 ? "" : await response.text();
  let responseBody = null;
  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch (error) {
      if (response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("El servidor devolvió una respuesta JSON no válida.");
      }
      responseBody = responseText;
    }
  }

  if (response.status === 401 && typeof clearAuthSession === "function") {
    clearAuthSession();
  }

  if (!response.ok) {
    const serverMessage = responseBody && typeof responseBody === "object"
      ? responseBody.message || responseBody.mensaje || responseBody.error
      : responseBody;
    throw new Error(serverMessage || `Error HTTP ${response.status} al consumir ${endpoint}.`);
  }

  return responseBody;
}
