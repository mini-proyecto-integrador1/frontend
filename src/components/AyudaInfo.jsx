import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

// Información que aparece en un globo al pasar el cursor, al llegar con Tab o al tocar (móvil).
// Uso: <AyudaInfo etiqueta="Ordenado por urgencia" titulo="…" lineas={[…]} />
//      <AyudaInfo nombre="Qué es un tipo de evento" texto="Por ejemplo: social…" />  (solo el ícono ⓘ)
function AyudaInfo({ etiqueta, nombre, titulo, lineas, texto, alinear = 'izquierda' }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => e.key === 'Escape' && setAbierto(false);
    const fuera = (e) => !cajaRef.current?.contains(e.target) && setAbierto(false);
    document.addEventListener('keydown', tecla);
    document.addEventListener('pointerdown', fuera);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('pointerdown', fuera);
    };
  }, [abierto]);

  const lado = alinear === 'derecha' ? 'right-0' : 'left-0';
  const flecha = alinear === 'derecha' ? 'right-4' : 'left-4';

  return (
    <span
      ref={cajaRef}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-label={etiqueta ? undefined : nombre || 'Más información'}
        aria-describedby={id}
        aria-expanded={abierto}
        // Tocar abre (en móvil no hay hover); se cierra tocando fuera o con Escape.
        onClick={() => setAbierto(true)}
        // Solo el foco por teclado abre el globo; el foco que deja un clic o un toque no.
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && setAbierto(true)}
        onBlur={() => setAbierto(false)}
        className={`inline-flex items-center gap-1.5 rounded-md text-sm font-normal text-gray-500
                    hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
                    ${etiqueta ? 'px-1.5 py-1 hover:bg-gray-100' : 'p-0.5'}`}
      >
        {etiqueta}
        <Info size={etiqueta ? 16 : 15} aria-hidden="true" />
      </button>

      {/* Siempre en el DOM para que el lector de pantalla lo lea por aria-describedby; se oculta visualmente */}
      <span
        id={id}
        role="tooltip"
        className={`absolute ${lado} top-full z-40 mt-2 block w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-gray-900
                    px-4 py-3 text-left text-sm font-normal leading-snug text-white shadow-lg transition-opacity
                    duration-150 ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <span className={`absolute -top-1.5 ${flecha} h-3 w-3 rotate-45 bg-gray-900`} aria-hidden="true" />
        {titulo && <span className="mb-1 block font-semibold">{titulo}</span>}
        {texto && <span className="block text-gray-100">{texto}</span>}
        {lineas && (
          <span className="block space-y-1 text-gray-100">
            {lineas.map((l, i) => (
              <span key={l} className="flex gap-2">
                <span aria-hidden="true">{i + 1}.</span>
                <span>{l}</span>
              </span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}

export default AyudaInfo;
