// Aviso flotante de confirmación; se anuncia a lectores de pantalla.
function Aviso({ texto }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      {texto && <p className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{texto}</p>}
    </div>
  );
}
export default Aviso;
