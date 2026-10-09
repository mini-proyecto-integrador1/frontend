import { createPortal } from 'react-dom';

// Aviso flotante de confirmación; se anuncia a lectores de pantalla.
// Se dibuja directo en <body> para que siempre quede abajo y centrado, sin importar dónde se use.
function Aviso({ texto }) {
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      {texto && <p className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{texto}</p>}
    </div>,
    document.body
  );
}
export default Aviso;
