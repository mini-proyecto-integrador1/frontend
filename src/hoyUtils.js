// Las fechas del backend llegan como texto "AAAA-MM-DD". Se comparan como texto (no con new Date)
// para evitar desfases de zona horaria: new Date("2026-10-02") se interpreta en UTC y en Colombia
// caería en el día anterior.

// Fecha de hoy en hora local, con el mismo formato "AAAA-MM-DD".
export function fechaLocalHoy() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Orden estricto: fecha límite ascendente y, si empatan, menos horas estimadas primero.
export function compararGestiones(a, b) {
  if (a.fecha_limite !== b.fecha_limite) return a.fecha_limite < b.fecha_limite ? -1 : 1;
  return Number(a.horas_estimadas) - Number(b.horas_estimadas);
}

// Reparte las gestiones en Vencidas / Para hoy / Próximas. Las ya hechas no requieren atención y se omiten.
export function agruparGestiones(gestiones, hoy = fechaLocalHoy()) {
  const grupos = { vencidas: [], hoy: [], proximas: [] };

  for (const g of gestiones) {
    if (g.estado === 'hecho') continue;
    if (g.fecha_limite < hoy) grupos.vencidas.push(g);
    else if (g.fecha_limite === hoy) grupos.hoy.push(g);
    else grupos.proximas.push(g);
  }

  Object.values(grupos).forEach((lista) => lista.sort(compararGestiones));
  return grupos;
}

// Días de calendario entre dos fechas "AAAA-MM-DD" (positivo si hasta es posterior a desde).
export function diasEntre(desde, hasta) {
  const [y1, m1, d1] = desde.split('-').map(Number);
  const [y2, m2, d2] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// "2026-10-02" -> "02/10"
export function formatearFecha(iso) {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

// Texto corto del plazo, pensado para leerse de un vistazo.
export function describirPlazo(fechaLimite, hoy = fechaLocalHoy()) {
  const dias = diasEntre(hoy, fechaLimite);
  if (dias < 0) return `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// "1.00" -> "1", "1.50" -> "1,5"
export function formatearHoras(horas) {
  return String(Number(horas)).replace('.', ',');
}
