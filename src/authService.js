import { API_URL, authHeaders, setToken } from './auth';

// Traduce los mensajes que Django devuelve en inglés a un español claro para el organizador.
const TRADUCCIONES = [
  [/too short/i, 'La contraseña debe tener al menos 8 caracteres.'],
  [/too common/i, 'Esa contraseña es muy común. Usa una más difícil de adivinar.'],
  [/entirely numeric/i, 'La contraseña no puede tener solo números.'],
  [/too similar/i, 'La contraseña se parece demasiado a tu nombre o correo.'],
  [/valid email/i, 'Escribe un correo válido, por ejemplo nombre@correo.com.'],
  [/valid date/i, 'Escribe una fecha válida.'],
  [/may not be blank|required/i, 'Este campo es obligatorio.'],
];

function traducir(mensaje) {
  const encontrada = TRADUCCIONES.find(([patron]) => patron.test(mensaje));
  return encontrada ? encontrada[1] : mensaje;
}

// POST /api/login/  -> { token }
// El backend usa el correo como "username".
export async function iniciarSesion(email, password) {
  const response = await fetch(`${API_URL}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email.trim(), password }),
  });

  if (response.status === 400 || response.status === 401) {
    const error = new Error('Credenciales incorrectas');
    error.tipo = 'credenciales';
    throw error;
  }
  if (!response.ok) {
    const error = new Error('Error del servidor');
    error.tipo = 'servidor';
    throw error;
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

// POST /api/registro/  -> crea el organizador (no devuelve token).
// Si el backend responde 400, se lanza un error con los mensajes por campo ya traducidos.
export async function registrarse(datos) {
  const response = await fetch(`${API_URL}/api/registro/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, email: datos.email.trim() }),
  });

  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    const campos = {};
    for (const [campo, mensajes] of Object.entries(body)) {
      const lista = Array.isArray(mensajes) ? mensajes : [String(mensajes)];
      campos[campo] = lista.map(traducir).join(' ');
    }
    const error = new Error('Datos inválidos');
    error.tipo = 'validacion';
    error.campos = campos;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('Error del servidor');
    error.tipo = 'servidor';
    throw error;
  }

  return response.json();
}

// GET /api/perfil/  -> { id, email, first_name, last_name, fecha_nacimiento }
export async function obtenerPerfil() {
  const response = await fetch(`${API_URL}/api/perfil/`, { headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el perfil');
  return response.json();
}
