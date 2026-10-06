import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AyudaInfo from './AyudaInfo';

// Campo de formulario con label visible, asterisco de obligatorio, ayuda y error inline (Guía de Diseño §4).
// El foco usa un borde oscuro neutro: el rojo queda reservado para errores reales,
// para que escribir en un campo no se confunda con "algo salió mal".
// info: texto de apoyo que no es un requisito (ejemplos, explicaciones); va en un globo ⓘ junto a la etiqueta.
// icono: componente de lucide que se dibuja dentro del campo, a la izquierda.
function Campo({ id, label, error, ayuda, info, icono: Icono, requerido = true, type = 'text', children, ...inputProps }) {
  const [mostrar, setMostrar] = useState(false);
  const esPassword = type === 'password';
  const idAyuda = ayuda || children ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  const bordes = error
    ? 'border-brand focus:ring-red-100'
    : 'border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-gray-200';

  return (
    <div>
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {requerido && (
            <span className="text-gray-400" aria-hidden="true">
              {' '}*
            </span>
          )}
        </label>
        {info && <AyudaInfo nombre={`Más información sobre ${label}`} texto={info} />}
      </div>

      <div className="relative mt-1">
        {Icono && (
          <Icono
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
        <input
          id={id}
          type={esPassword && mostrar ? 'text' : type}
          required={requerido}
          aria-invalid={Boolean(error)}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900
            placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4
            ${esPassword ? 'pr-11' : ''} ${Icono ? 'pl-10' : ''} ${bordes}`}
          {...inputProps}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setMostrar((m) => !m)}
            aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={mostrar}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg
                       text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {mostrar ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* La ayuda (requisitos del campo) se ve desde el inicio, antes de equivocarse */}
      {(ayuda || children) && (
        <div id={idAyuda} className="mt-1 text-xs text-gray-500">
          {ayuda}
          {children}
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

export default Campo;
