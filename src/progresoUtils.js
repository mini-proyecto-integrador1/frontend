import { compararGestiones, diasEntre, fechaLocalHoy } from './hoyUtils';

// Calcula el avance de un evento a partir de sus gestiones.
// El porcentaje se mide por HORAS hechas sobre horas totales: terminar una gestión de 8 h
// pesa más que una de 30 min, que es como lo vive el organizador.
export function calcularProgreso(evento, hoy = fechaLocalHoy()) {
  const gestiones = evento.subtareas || [];
  const horas = (g) => Number(g.horas_estimadas) || 0;

  const conteo = { hecho: 0, pospuesto: 0, pendiente: 0 };
  const horasPorEstado = { hecho: 0, pospuesto: 0, pendiente: 0 };
  let horasTotales = 0;
  let horasHechas = 0;

  for (const g of gestiones) {
    conteo[g.estado] = (conteo[g.estado] || 0) + 1;
    horasPorEstado[g.estado] = (horasPorEstado[g.estado] || 0) + horas(g);
    horasTotales += horas(g);
    if (g.estado === 'hecho') horasHechas += horas(g);
  }

  const abiertas = gestiones.filter((g) => g.estado !== 'hecho').sort(compararGestiones);
  const vencidas = abiertas.filter((g) => g.fecha_limite < hoy).length;
  const siguiente = abiertas.find((g) => g.fecha_limite >= hoy) || null;

  return {
    total: gestiones.length,
    conteo,
    horasPorEstado,
    horasTotales,
    horasHechas,
    porcentaje: horasTotales > 0 ? Math.round((horasHechas / horasTotales) * 100) : 0,
    vencidas,
    siguiente,
    diasParaEvento: diasEntre(hoy, evento.fecha),
  };
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
