import { useState } from 'react';
import Modal from './Modal';
import Campo from './Campo';
import { guardarLimite } from '../eventoService';
import { LIMITE_POR_DEFECTO, useLimite } from '../limiteContexto';

const MIN = 1;
const MAX = 16;

// Configurar el límite diario (US-12 / C2). Rango 1–16 h, 6 h por defecto.
function ContenidoLimite({ onCerrar, onGuardado }) {
  const { limite, actualizar } = useLimite();
  const [valor, setValor] = useState(String(limite ?? LIMITE_POR_DEFECTO));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);


  async function guardar(e) {
    e.preventDefault();
    const h = Number(String(valor).replace(',', '.'));
    if (!valor || !Number.isInteger(h) || h < MIN || h > MAX) {
      return setError(`Escribe un número entero entre ${MIN} y ${MAX} horas.`);
    }
    setGuardando(true);
    setError('');
    try {
      const r = await guardarLimite(h);
      const nuevo = Number(r?.limite_horas_diarias) || h;
      actualizar(nuevo);
      onGuardado(`Tu límite diario ahora es de ${nuevo} h.`);
    } catch (err) {
      setError(
        err?.status === 400
          ? Object.values(err.body || {}).flat()[0] || `El límite debe estar entre ${MIN} y ${MAX} horas.`
          : 'No pudimos guardar el límite. Revisa tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto
      titulo="Límite diario"
      descripcion="Cuántas horas al día puedes dedicarle a la logística de tus eventos. Te avisaremos cuando un día se pase de este límite."
      onCerrar={onCerrar}
      bloqueado={guardando}
    >
      <form onSubmit={guardar} noValidate>
        <Campo
          id="limite-horas"
          label="Horas por día"
          type="number"
          inputMode="numeric"
          min={MIN}
          max={MAX}
          step="1"
          ayuda={`Entre ${MIN} y ${MAX} horas. Si no lo cambias, es de ${LIMITE_POR_DEFECTO} h.`}
          error={error}
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setError('');
          }}
        />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700
                       hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalLimite({ abierto, ...resto }) {
  return abierto ? <ContenidoLimite {...resto} /> : null;
}

export default ModalLimite;
