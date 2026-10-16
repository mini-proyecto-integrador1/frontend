import { API_URL, authHeaders, clearToken } from './auth';

// Hace la petición con el token y convierte las respuestas de error en errores con .status y .body.
async function pedir(ruta, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Sin internet o servidor caído: no hay respuesta HTTP.
    const error = new Error('Sin conexión');
    error.status = 0;
    error.red = true;
    throw error;
  }

  if (response.status === 401 || response.status === 403) {
    // Sesión ausente o vencida: se limpia el token y la vista redirige al login.
    clearToken();
    const error = new Error('Sesión no válida');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null);
    const error = new Error(cuerpo?.message || 'La petición falló');
    error.status = response.status;
    error.body = cuerpo;
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

// --- Límite diario del organizador (Sprint 3) ---
// GET /api/perfil/limite/  -> { limite_horas_diarias: 6 }
// PUT /api/perfil/limite/  body { limite_horas_diarias: n }  (entero de 1 a 16; 400 si no)
export const getLimite = () => pedir('/api/perfil/limite/');
export const guardarLimite = (horas) =>
  pedir('/api/perfil/limite/', { method: 'PUT', body: { limite_horas_diarias: horas } });

// --- Registrar avance (Sprint 4 · US-09) ---
// PATCH /api/subtareas/<id>/  body { estado: 'hecho' | 'pospuesto' | 'pendiente', nota?: 'texto' }
// La nota es opcional; si no se envía (o llega vacía), el backend conserva la que ya había.
export const cambiarEstadoGestion = (id, estado, nota) =>
  pedir(`/api/subtareas/${id}/`, {
    method: 'PATCH',
    body: nota ? { estado, nota } : { estado },
  });