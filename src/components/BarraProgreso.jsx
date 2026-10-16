import { SEGMENTOS, textoProgreso } from '../progresoUtils';

// Barra de avance por cantidad de gestiones: verde = hecho, ámbar = pospuesto, gris = pendiente.
function BarraProgreso({ progreso, etiqueta, alto = 'h-3' }) {
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progreso.porcentaje}
      aria-valuetext={textoProgreso(progreso)}
      className={`flex ${alto} w-full overflow-hidden rounded-full bg-gray-100`}
    >
      {progreso.total > 0 &&
        SEGMENTOS.map((s) => {
          const ancho = (progreso.conteo[s.clave] / progreso.total) * 100;
          return ancho > 0 ? (
            <div key={s.clave} className={`${s.barra} transition-all duration-300`} style={{ width: `${ancho}%` }} />
          ) : null;
        })}
    </div>
  );
}

export default BarraProgreso;