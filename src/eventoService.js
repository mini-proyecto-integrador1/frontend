const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// POST /api/eventos/  — payload: { nombre, tipo, fecha, subtareas: [...] }
export async function createEvento(eventoData) {
  const response = await fetch(`${API_URL}/api/eventos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventoData),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const error = new Error('No se pudo crear el evento');
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  return response.json();
}

// GET /api/eventos/
export async function getEventos() {
  const response = await fetch(`${API_URL}/api/eventos/`);
  if (!response.ok) throw new Error('No se pudieron cargar los eventos');
  return response.json();
}