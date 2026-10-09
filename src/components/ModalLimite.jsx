import { useEffect, useState } from 'react';
import Modal from './Modal';
import Campo from './Campo';
import { guardarLimite } from '../eventoService';
import { LIMITE_POR_DEFECTO, useLimite } from '../limiteContexto';
import { getGestionesHoy } from '../hoyService';
import { fechaLocalHoy, formatearFecha, formatearHoras } from '../hoyUtils';
import { diasSobrecargados } from '../sobrecargaUtils';

const MIN = 1;
const MAX = 16;

// Configurar el límite diario (US-12 / C2). Rango 1–16 h, 6 h por defecto.
// No se puede bajar por debajo de lo que ya está planificado en algún día (de hoy en adelante):
// primero hay que mover o reducir esas gestiones. El backend también lo valida.
function ContenidoLimite({ onCerrar, onGuardado }) {
  const { limite, actualizar } = useLimite();
  const [valor, setValor] = useState(String(limite ?? LIMITE_POR_DEFECTO));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [gestiones, setGestiones] = useState(null); // para calcular el mínimo permitido
  const [bloqueados, setBloqueados] = useState([]); // días que impiden el valor elegido

  useEffect(() => {
    let activo = true;
    getGestionesHoy()
      .then((data) => activo && setGestiones(Array.isArray(data) ? data : []))
      .catch(() => activo && setGestiones([])); // si falla, valida el backend
    return () => {
      activo = false;
    };
  }, []);

  // Día más cargado de hoy en adelante -> límite mínimo permitido.
  const hoy = fechaLocalHoy();
  const masCargado = gestiones ? diasSobrecargados(gestiones, 0, hoy).sort((a, b) => b.horas - a.horas)[0] : null;
  const minimo = masCargado ? Math.max(MIN, Math.ceil(masCargado.horas)) : MIN;

  function mensajeMinimo(h, dia) {
    return `No puedes bajarlo a ${h} h: el ${formatearFecha(dia.fecha)} tienes ${formatearHoras(dia.horas)} h planificadas. Con lo que tienes hoy, el mínimo es ${minimo} h.`;
  }

  async function guardar(e) {
    e.preventDefault();
    const h = Number(String(valor).replace(',', '.'));
    if (!valor || !Number.isInteger(h) || h < MIN || h > MAX) {
      return setError(`Escribe un número entero entre ${MIN} y ${MAX} horas.`);
    }
    if (h < minimo && masCargado) {
      setBloqueados(diasSobrecargados(gestiones, h, hoy));
      return setError(mensajeMinimo(h, masCargado));
    }
    setGuardando(true);
    setError('');
    setBloqueados([]);
    try {
      const r = await guardarLimite(h);
      const nuevo = Number(r?.limite_horas_diarias) || h;
      actualizar(nuevo);
      onGuardado(`Tu límite diario ahora es de ${nuevo} h.`);
    } catch (err) {
      const body = err?.body || {};
      if (err?.status === 400 && body.codigo === 'limite_menor_que_lo_planificado' && gestiones) {
        setBloqueados(diasSobrecargados(gestiones, h, hoy));
      }
      setError(
        err?.status === 400
          ? [body.limite_horas_diarias].flat()[0] || `El límite debe estar entre ${MIN} y ${MAX} horas.`
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
          min={minimo}
          max={MAX}
          step="1"
          ayuda={
            minimo > MIN
              ? `Entre ${minimo} y ${MAX} horas: el ${formatearFecha(masCargado.fecha)} ya tienes ${formatearHoras(masCargado.horas)} h planificadas.`
              : `Entre ${MIN} y ${MAX} horas. Si no lo cambias, es de ${LIMITE_POR_DEFECTO} h.`
          }
          error={error}
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setError('');
            setBloqueados([]);
          }}
        />
        {bloqueados.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-semibold">Estos días ya pasan de ese valor:</p>
            <ul className="mt-1.5 space-y-1">
              {bloqueados.slice(0, 5).map((d) => (
                <li key={d.fecha}>
                  <strong>{formatearFecha(d.fecha)}</strong>: {formatearHoras(d.horas)} h ({d.gestiones.map((g) => g.nombre).join(', ')})
                </li>
              ))}
              {bloqueados.length > 5 && <li>y {bloqueados.length - 5} días más.</li>}
            </ul>
            <p className="mt-2">Para bajarlo, primero reprograma o reduce las horas de esas gestiones.</p>
          </div>
        )}
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
