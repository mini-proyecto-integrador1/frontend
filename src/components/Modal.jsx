import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Diálogo genérico: fondo oscuro, Escape para cerrar, foco al abrir y devolución del foco al cerrar.
function Modal({ abierto, titulo, descripcion, onCerrar, bloqueado = false, rol = 'dialog', children }) {
  const panelRef = useRef(null);
  const previoRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    previoRef.current = document.activeElement;
    const primero = panelRef.current?.querySelector('input, select, button:not([data-cerrar])');
    (primero || panelRef.current)?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape' && !bloqueado) onCerrar();
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      previoRef.current?.focus?.();
    };
  }, [abierto, bloqueado, onCerrar]);

  if (!abierto) return null;

  // Se dibuja directo en <body>: así ningún contenedor (p. ej. el encabezado fijo con desenfoque)
  // puede recortar el fondo oscuro ni mover el diálogo.
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 p-4">
      <div
        ref={panelRef}
        tabIndex={-1}
        role={rol}
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby={descripcion ? 'modal-descripcion' : undefined}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-titulo" className="text-lg font-bold text-gray-900">
            {titulo}
          </h2>
          <button
            type="button"
            data-cerrar
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {descripcion && (
          <p id="modal-descripcion" className="mt-1 text-sm text-gray-600">
            {descripcion}
          </p>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
