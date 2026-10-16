import { compararGestiones, diasEntre, fechaLocalHoy } from './hoyUtils';

// Calcula el avance de un evento a partir de sus gestiones (subtareas).
// Regla del backend: porcentaje = hechas / total, con un decimal; con 0 subtareas es 0.
export function calcularProgreso(evento, hoy = fechaLocalHoy()) {
  const gestiones = evento.subtareas || [];
  const conteo = { hecho: 0, pospuesto: 0, pendiente: 0 };
  for (const g of gestiones) conteo[g.estado] = (conteo[g.estado] || 0) + 1;

  const total = gestiones.length;
  const porcentaje = total > 0 ? Math.round((conteo.hecho / total) * 1000) / 10 : 0;

  const abiertas = gestiones.filter((g) => g.estado !== 'hecho').sort(compararGestiones);
  const vencidas = abiertas.filter((g) => g.fecha_limite < hoy).length;
  const siguiente = abiertas.find((g) => g.fecha_limite >= hoy) || null;

  return {
    total,
    hechas: conteo.hecho,
    conteo,
    porcentaje,
    vencidas,
    siguiente,
    diasParaEvento: diasEntre(hoy, evento.fecha),
  };
}

// 50 -> "50 %"   14.3 -> "14,3 %"
export function formatearPorcentaje(p) {
  return `${Number.isInteger(p) ? p : p.toFixed(1).replace('.', ',')} %`;
}

// "2 de 4 · 50 %"
export function textoProgreso(p) {
  return `${p.hechas} de ${p.total} · ${formatearPorcentaje(p.porcentaje)}`;
}

// "Faltan 12 días", "Es hoy", "Fue hace 3 días"
export function describirCuentaRegresiva(dias) {
  if (dias > 1) return `Faltan ${dias} días`;
  if (dias === 1) return 'Es mañana';
  if (dias === 0) return 'Es hoy';
  return `Fue hace ${-dias} ${dias === -1 ? 'día' : 'días'}`;
}

// Colores de cada estado. Siempre van acompañados de nombre y número (Guía §9).
export const SEGMENTOS = [
  { clave: 'hecho', nombre: 'Hechas', barra: 'bg-green-600', punto: 'bg-green-600' },
  { clave: 'pospuesto', nombre: 'Pospuestas', barra: 'bg-amber-400', punto: 'bg-amber-400' },
  { clave: 'pendiente', nombre: 'Pendientes', barra: 'bg-gray-200', punto: 'bg-gray-300' },
];
