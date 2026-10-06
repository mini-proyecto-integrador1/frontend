import { API_URL, authHeaders, clearToken } from './auth';

// Hace la petición con el token y convierte las respuestas de error en errores con .status y .body.
async function pedir(ruta, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    // Sesión ausente o vencida: se limpia el token y la vista redirige al login.
    clearToken();
    const error = new Error('Sesión no válida');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error('La petición falló');
    error.status = response.status;
    error.body = await response.json().catch(() => null);
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

// --- Eventos ---
// POST   /api/eventos/        payload: { nombre, tipo, fecha, subtareas: [...] }
// GET    /api/eventos/        lista de eventos del organizador (con sus gestiones)
// GET    /api/eventos/<id>/   detalle
// PATCH  /api/eventos/<id>/   edición parcial (las gestiones se editan aparte)
// DELETE /api/eventos/<id>/   elimina el evento y sus gestiones
export const createEvento = (datos) => pedir('/api/eventos/', { method: 'POST', body: datos });
export const getEventos = () => pedir('/api/eventos/');
export const getEvento = (id) => pedir(`/api/eventos/${id}/`);
export const actualizarEvento = (id, cambios) => pedir(`/api/eventos/${id}/`, { method: 'PATCH', body: cambios });
export const eliminarEvento = (id) => pedir(`/api/eventos/${id}/`, { method: 'DELETE' });

// --- Gestiones logísticas (subtareas) ---
// PATCH  /api/subtareas/<id>/  edición parcial, incluido el estado (pendiente | hecho | pospuesto)
// DELETE /api/subtareas/<id>/
export const actualizarGestion = (id, cambios) =>
  pedir(`/api/subtareas/${id}/`, { method: 'PATCH', body: cambios });
export const eliminarGestion = (id) => pedir(`/api/subtareas/${id}/`, { method: 'DELETE' });

// Agregar una gestión a un evento que ya existe (recomendación del docente, requiere endpoint nuevo en BE).
// POST /api/eventos/<id>/subtareas/  body { nombre, fecha_limite, horas_estimadas }  -> 201 con la gestión
export const crearGestion = (eventoId, datos) =>
  pedir(`/api/eventos/${eventoId}/subtareas/`, { method: 'POST', body: datos });
