import { API_URL, authHeaders, clearToken } from './auth';

// GET /api/hoy/  (requiere Authorization: Token <token>)
// Devuelve una lista plana de gestiones ya ordenada por fecha_limite y, en empate, por horas_estimadas.
// Filtros opcionales del backend: { estado: 'pendiente' | 'hecho' | 'pospuesto', evento: <id> }
export async function getGestionesHoy({ estado, evento } = {}) {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (evento) params.set('evento', evento);
  const query = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(`${API_URL}/api/hoy/${query}`, {
    headers: authHeaders({ Accept: 'application/json' }),
  });

  if (response.status === 401 || response.status === 403) {
    // Sesión ausente o vencida: se limpia el token y la vista decide redirigir al login.
    clearToken();
    const error = new Error('Sesión no válida');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error('No se pudieron cargar las gestiones');
    error.status = response.status;
    throw error;
  }

  return response.json();
}
