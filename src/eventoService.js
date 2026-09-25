const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ⚠️ MOCK TEMPORAL: mientras Martín termina el backend, esto simula que el evento
// se guardó bien, usando localStorage en vez del servidor real.
// Cuando Martín tenga /api/eventos/ funcionando, cambia esta línea a false
// y todo lo demás sigue igual, sin tocar nada más.
const USAR_MOCK = true;

// POST /api/eventos/  — payload: { nombre, tipo, fecha, subtareas: [...] }
export async function createEvento(eventoData) {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventos = JSON.parse(localStorage.getItem('eventos_mock') || '[]');
        const nuevoEvento = { id: Date.now(), ...eventoData };
        eventos.push(nuevoEvento);
        localStorage.setItem('eventos_mock', JSON.stringify(eventos));
        console.log('[MOCK] Evento guardado localmente:', nuevoEvento);
        resolve(nuevoEvento);
      }, 800);
    });
  }

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
  if (USAR_MOCK) {
    return JSON.parse(localStorage.getItem('eventos_mock') || '[]');
  }

  const response = await fetch(`${API_URL}/api/eventos/`);
  if (!response.ok) throw new Error('No se pudieron cargar los eventos');
  return response.json();
}