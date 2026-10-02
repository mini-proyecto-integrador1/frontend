// Manejo mínimo de la sesión: el token que devuelve POST /api/login/ se guarda en localStorage.
const TOKEN_KEY = 'token';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Cabeceras para las rutas protegidas del backend: Authorization: Token <token>
export function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Token ${token}` } : extra;
}
