import { useEffect, useRef } from 'react';

// Diálogo de confirmación para acciones destructivas (variante Danger de la Guía §3).
// Escape o "Cancelar" lo cierran; el foco arranca en "Cancelar" para evitar borrar por accidente.
function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Eliminar', procesando, onConfirmar, onCancelar }) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    cancelarRef.current?.focus();
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !procesando) onCancelar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto, procesando, onCancelar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-mensaje"
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirmar-titulo" className="text-lg font-bold text-gray-900">
          {titulo}
        </h2>
        <p id="confirmar-mensaje" className="mt-2 text-sm text-gray-600">
          {mensaje}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700
                       hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark
                       disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          >
            {procesando ? 'Eliminando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirmar;
