const API_BASE_URL = (window.LUDUS_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function consumeApi(endpoint, { method = "GET", body, auth = true } = {}) {
  if (typeof endpoint !== "string" || !endpoint.startsWith("/")) {
    throw new Error("El endpoint debe ser una ruta que comience con '/'.");
  }

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = typeof getAuthToken === "function" ? getAuthToken() : null;
    if (!token) {
      if (typeof requireAuth === "function") requireAuth();
      throw Object.assign(new Error("Inicia sesión para continuar."), { status: 401 });
    }
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
    if (auth && typeof requireAuth === "function") requireAuth();
  }

  if (!response.ok) {
    const serverMessage = responseBody && typeof responseBody === "object"
      ? responseBody.message || responseBody.mensaje || responseBody.error
      : responseBody;
    throw Object.assign(new Error(typeof serverMessage === "string" ? serverMessage : `Error HTTP ${response.status}.`), {status: response.status, retryAfter: response.headers.get("Retry-After")});
  }

  return responseBody;
}
