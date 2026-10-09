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

// Horas que todavía caben, redondeadas hacia abajo a medias horas (los campos usan pasos de 0,5).
// maximoQueCabe(2.7) -> 2.5 ; maximoQueCabe(0.3) -> 0
export function maximoQueCabe(horasLibres) {
  return Math.max(0, Math.floor(Number(horasLibres) * 2) / 2);
}

// "El 08/10 quedarías con 9 h planificadas y tu límite es 6 h."
export function describirSobrecarga(c) {
  return `El ${formatearFecha(c.fecha)} quedarías con ${formatearHoras(c.planificadas)} h planificadas y tu límite es ${formatearHoras(c.limite)} h.`;
}

// Días (de hoy en adelante) cuyas gestiones por hacer suman más que el límite.
// Sirve cuando el organizador BAJA su límite: el backend no rechaza ese cambio, así que la app
// tiene que mostrarle qué días quedaron sobrecargados para que los resuelva.
// gestiones: lista de /api/hoy/ (todas las del organizador). Devuelve [{ fecha, horas, exceso, gestiones }].
export function diasSobrecargados(gestiones, limite, desde) {
  if (limite == null) return [];
  const porDia = new Map();
  for (const g of gestiones || []) {
    if (g.estado === 'hecho' || g.fecha_limite < desde) continue;
    const dia = porDia.get(g.fecha_limite) || { fecha: g.fecha_limite, horas: 0, gestiones: [] };
    dia.horas += Number(g.horas_estimadas) || 0;
    dia.gestiones.push(g);
    porDia.set(g.fecha_limite, dia);
  }
  return [...porDia.values()]
    .filter((d) => d.horas > limite)
    .map((d) => ({ ...d, exceso: d.horas - limite }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}
