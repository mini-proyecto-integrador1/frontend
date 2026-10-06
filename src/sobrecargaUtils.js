import { formatearFecha, formatearHoras } from './hoyUtils';

// El backend responde 409 cuando un cambio deja un día por encima del límite diario.
// Cuerpo acordado con BE (ver PR):
// { codigo: 'sobrecarga', fecha, limite, planificadas, horas_gestion, exceso, horas_disponibles, dia_sugerido }
// Al crear un evento con varias gestiones: { codigo: 'sobrecarga', conflictos: [ ...mismo formato por día ] }
export function leerSobrecarga(err) {
  if (err?.status !== 409 || !err.body) return null;
  const b = err.body;
  const lista = Array.isArray(b.conflictos) ? b.conflictos : [b];
  const conflictos = lista
    .filter((c) => c && c.fecha)
    .map((c) => ({
      fecha: c.fecha,
      limite: Number(c.limite) || 0,
      planificadas: Number(c.planificadas) || 0,
      horasGestion: Number(c.horas_gestion) || 0,
      exceso: Number(c.exceso) || Math.max(0, Number(c.planificadas) - Number(c.limite)),
      disponibles: Math.max(0, Number(c.horas_disponibles) || 0),
      diaSugerido: c.dia_sugerido || null,
    }));
  return conflictos.length ? conflictos : null;
}

// "El 08/10 quedarías con 9 h planificadas y tu límite es 6 h."
export function describirSobrecarga(c) {
  return `El ${formatearFecha(c.fecha)} quedarías con ${formatearHoras(c.planificadas)} h planificadas y tu límite es ${formatearHoras(c.limite)} h.`;
}
