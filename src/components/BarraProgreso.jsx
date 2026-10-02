import { SEGMENTOS } from '../progresoUtils';

// Barra de avance por horas: verde = hecho, ámbar = pospuesto, gris = pendiente.
function BarraProgreso({ progreso, etiqueta, alto = 'h-3' }) {
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progreso.porcentaje}
      aria-valuetext={`${progreso.porcentaje}% hecho`}
      className={`flex ${alto} w-full overflow-hidden rounded-full bg-gray-100`}
    >
      {/* El ancho de cada tramo es por horas, igual que el porcentaje */}
      {progreso.horasTotales > 0 &&
        SEGMENTOS.map((s) => {
          const ancho = (progreso.horasPorEstado[s.clave] / progreso.horasTotales) * 100;
          return ancho > 0 ? <div key={s.clave} className={s.barra} style={{ width: `${ancho}%` }} /> : null;
        })}
    </div>
  );
}

export default BarraProgreso;
