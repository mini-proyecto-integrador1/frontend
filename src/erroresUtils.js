// Texto para mostrar al usuario a partir de un error de la API.
// 400/401/404 traen { ..., status, message }; el 409 de sobrecarga NO trae message (se maneja con leerSobrecarga).
export function mensajeDe(err, porDefecto) {
  if (err?.red) return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  const body = err?.body;
  if (body && typeof body === 'object') {
    // Primero el error de un campo concreto (ej. "nota"), ignorando las claves que no son de campo
    const CLAVES_GENERALES = ['status', 'message', 'codigo'];
    const delCampo = Object.entries(body)
      .filter(([clave]) => !CLAVES_GENERALES.includes(clave))
      .flatMap(([, valor]) => valor)
      .find((valor) => typeof valor === 'string');
    if (delCampo) return delCampo;
    if (typeof body.message === 'string') return body.message;
  }
  return porDefecto;
}