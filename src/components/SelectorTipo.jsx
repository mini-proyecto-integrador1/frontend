import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PartyPopper,
  Plus,
} from 'lucide-react';

// Aqui definimos los tipos de evento predefinidos, con su valor y el icono correspondiente. Se usan en el selector de tipo de evento.
const TIPOS_EVENTO = [
  { valor: 'Social', Icono: PartyPopper },
  { valor: 'Corporativo', Icono: Briefcase },
  { valor: 'Académico', Icono: GraduationCap },
];

const OTRO = '__otro__';
const esPredefinido = (v) => TIPOS_EVENTO.some((t) => t.valor.toLowerCase() === String(v).trim().toLowerCase());

// Selector del tipo de evento: opciones en una fila deslizable y "Otro" para escribir uno propio.
// Se maneja con mouse, toque (deslizar) o teclado (flechas dentro del grupo, como un grupo de radios).
function SelectorTipo({ id, value, onChange, error }) {
  const filaRef = useRef(null);
  const [otroActivo, setOtroActivo] = useState(Boolean(value) && !esPredefinido(value));
  const [scroll, setScroll] = useState({ izq: false, der: false });

  const seleccionado = otroActivo ? OTRO : TIPOS_EVENTO.find((t) => t.valor.toLowerCase() === String(value).toLowerCase())?.valor || '';
  const opciones = [...TIPOS_EVENTO.map((t) => t.valor), OTRO];

  // Flechas del slider: solo aparecen si hay más opciones hacia ese lado.
  const medir = () => {
    const f = filaRef.current;
    if (!f) return;
    setScroll({ izq: f.scrollLeft > 4, der: f.scrollLeft + f.clientWidth < f.scrollWidth - 4 });
  };
  useEffect(() => {
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const deslizar = (dir) => filaRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });

  function elegir(opcion) {
    if (opcion === OTRO) {
      setOtroActivo(true);
      onChange(esPredefinido(value) ? '' : value);
    } else {
      setOtroActivo(false);
      onChange(opcion);
    }
  }

  // Flechas izquierda/derecha mueven la selección dentro del grupo (patrón radiogroup).
  function alTeclado(e) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const actual = Math.max(0, opciones.indexOf(seleccionado));
    let sig = actual;
    if (e.key === 'ArrowRight') sig = (actual + 1) % opciones.length;
    if (e.key === 'ArrowLeft') sig = (actual - 1 + opciones.length) % opciones.length;
    if (e.key === 'Home') sig = 0;
    if (e.key === 'End') sig = opciones.length - 1;
    elegir(opciones[sig]);
    filaRef.current?.querySelectorAll('[role="radio"]')[sig]?.focus();
  }

  const idError = error ? `${id}-error` : undefined;
  const flecha =
    'absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white ' +
    'text-gray-600 shadow-sm hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 sm:grid';

  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-medium text-gray-700">
        Tipo
        <span className="text-gray-400" aria-hidden="true">
          {' '}*
        </span>
      </p>

      <div className="relative mt-1.5">
        {scroll.izq && (
          <>
            <span className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-white" aria-hidden="true" />
            <button type="button" onClick={() => deslizar(-1)} aria-label="Ver tipos anteriores" className={`${flecha} -left-3`}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          </>
        )}

        <div
          ref={filaRef}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={idError}
          aria-invalid={Boolean(error)}
          onScroll={medir}
          onKeyDown={alTeclado}
          className="flex snap-x gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TIPOS_EVENTO.map(({ valor, Icono }) => {
            const activo = seleccionado === valor;
            return (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={activo}
                tabIndex={activo || (!seleccionado && valor === TIPOS_EVENTO[0].valor) ? 0 : -1}
                onClick={() => elegir(valor)}
                className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                    activo
                      ? 'border-brand bg-red-50 text-brand'
                      : error
                        ? 'border-red-300 bg-white text-gray-700 hover:border-gray-400'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
              >
                {activo ? <Check size={16} aria-hidden="true" /> : <Icono size={16} aria-hidden="true" />}
                {valor}
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={seleccionado === OTRO}
            tabIndex={seleccionado === OTRO ? 0 : -1}
            onClick={() => elegir(OTRO)}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-dashed px-3.5 py-2 text-sm font-medium
              transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                seleccionado === OTRO
                  ? 'border-brand bg-red-50 text-brand'
                  : 'border-gray-400 bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            {seleccionado === OTRO ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            Otro
          </button>
        </div>

        {scroll.der && (
          <>
            <span className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-white" aria-hidden="true" />
            <button type="button" onClick={() => deslizar(1)} aria-label="Ver más tipos" className={`${flecha} -right-3`}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {otroActivo && (
        <div className="mt-3">
          <label htmlFor={`${id}-otro`} className="block text-sm font-medium text-gray-700">
            ¿Qué tipo de evento es?
          </label>
          <input
            id={`${id}-otro`}
            autoFocus
            maxLength={50}
            placeholder="Ej: Lanzamiento, feria, retiro…"
            aria-invalid={Boolean(error)}
            aria-describedby={idError}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400
              transition-colors focus:outline-none focus:ring-4 ${
                error ? 'border-brand focus:ring-red-100' : 'border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-gray-200'
              }`}
          />
        </div>
      )}

      {error && (
        <p id={idError} className="mt-1 text-xs text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectorTipo;
