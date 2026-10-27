import Modal from './Modal';

// Diálogo de confirmación para acciones destructivas (variante Danger de la Guía §3).
// Se apoya en Modal: Escape o "Cancelar" lo cierran, el foco arranca en "Cancelar" y queda
// atrapado dentro, y al cerrar vuelve al botón que lo abrió.
function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Eliminar', procesando, onConfirmar, onCancelar }) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      descripcion={mensaje}
      onCerrar={onCancelar}
      bloqueado={procesando}
      rol="alertdialog"
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelar}
          disabled={procesando}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700
                     hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
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
    </Modal>
  );
}

export default Confirmar;