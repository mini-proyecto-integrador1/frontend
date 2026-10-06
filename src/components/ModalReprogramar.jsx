import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clock, Info } from 'lucide-react';
import Modal from './Modal';
import Campo from './Campo';
import { actualizarGestion } from '../eventoService';
import { fechaLocalHoy, formatearFecha, formatearHoras } from '../hoyUtils';
import { describirSobrecarga, leerSobrecarga } from '../sobrecargaUtils';

const btnPrimario =
  'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand';
const btnNeutral =
  'rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 ' +
  'disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';

const TITULOS = {
  fecha: 'Reprogramar gestión',
  conflicto: 'Ese día quedaría sobrecargado',
  reducir: 'Reducir horas estimadas',
};

// Flujo completo de reprogramación (US-06) con detección (US-07) y resolución (US-08) de sobrecarga:
//   fecha  --409-->  conflicto  --"Mover"-->  fecha (con el día sugerido)
//                               --"Reducir"-> reducir --409--> conflicto
function ContenidoReprogramar({ gestion, fechaEvento, onCerrar, onListo }) {
  const hoy = fechaLocalHoy();
  const [paso, setPaso] = useState('fecha');
  const [fecha, setFecha] = useState('');
  const [horas, setHoras] = useState('');
  const [conflicto, setConflicto] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const horasActuales = Number(gestion.horas_estimadas);
  const tope = fechaEvento || undefined;

  async function enviar(cambios, resumen) {
    setGuardando(true);
    setError('');
    try {
      const actualizada = await actualizarGestion(gestion.id, cambios);
      onListo({ ...gestion, ...cambios, ...actualizada }, resumen);
    } catch (err) {
      const sobrecarga = leerSobrecarga(err);
      if (sobrecarga) {
        const c = sobrecarga[0];
        // Sugerir el día en el que ya está no ayuda: se descarta.
        if (c.diaSugerido === gestion.fecha_limite) c.diaSugerido = null;
        setConflicto(c);
        setPaso('conflicto');
      } else if (err?.status === 400 && err.body) {
        setError(Object.values(err.body).flat()[0] || 'Revisa los datos e inténtalo de nuevo.');
      } else {
        setError('No pudimos guardar el cambio. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  function reprogramar(e) {
    e.preventDefault();
    if (!fecha) return setError('Elige la nueva fecha.');
    if (fecha === gestion.fecha_limite) return setError('Elige una fecha distinta a la actual.');
    if (fecha < hoy) return setError('La nueva fecha no puede ser en el pasado.');
    if (tope && fecha > tope)
      return setError(`Debe ser antes o el mismo día del evento (${formatearFecha(tope)}).`);
    enviar({ fecha_limite: fecha }, `Se reprogramó "${gestion.nombre}" para el ${formatearFecha(fecha)}.`);
  }

  function reducir(e) {
    e.preventDefault();
    const h = parseFloat(String(horas).replace(',', '.'));
    if (isNaN(h) || h < 0.5) return setError('Escribe al menos 0,5 horas.');
    if (h >= horasActuales) return setError(`Debe ser menos de las ${formatearHoras(horasActuales)} h actuales.`);
    if (conflicto && h > conflicto.disponibles)
      return setError(`Para que quepa ese día, máximo ${formatearHoras(conflicto.disponibles)} h.`);
    enviar(
      { fecha_limite: conflicto.fecha, horas_estimadas: h },
      `"${gestion.nombre}" quedó para el ${formatearFecha(conflicto.fecha)} con ${formatearHoras(h)} h.`
    );
  }

  function irAMover() {
    setFecha(conflicto?.diaSugerido || '');
    setError('');
    setPaso('fecha');
  }

  function irAReducir() {
    setHoras(conflicto ? String(conflicto.disponibles) : '');
    setError('');
    setPaso('reducir');
  }

  const errorCaja = error && (
    <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {error}
    </p>
  );

  const resumenGestion = (
    <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{gestion.nombre}</p>
      <p className="text-gray-600">
        Fecha actual: {formatearFecha(gestion.fecha_limite)} · {formatearHoras(horasActuales)} h
      </p>
    </div>
  );

  return (
    <Modal
      abierto
      titulo={TITULOS[paso]}
      onCerrar={onCerrar}
      bloqueado={guardando}
      rol={paso === 'conflicto' ? 'alertdialog' : 'dialog'}
    >
      {paso === 'fecha' && (
        <form onSubmit={reprogramar} noValidate>
          {resumenGestion}
          {errorCaja}
          {conflicto?.diaSugerido && fecha === conflicto.diaSugerido && (
            <p className="mb-3 text-sm text-green-800">
              Te sugerimos el {formatearFecha(conflicto.diaSugerido)}: ese día sí cabe.
            </p>
          )}
          {tope && (
            <div className="mb-4 flex gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                Tu evento es el <strong>{formatearFecha(tope)}</strong>, así que puedes moverla hasta ese día.
                {gestion.evento_id ? (
                  <>
                    {' '}
                    ¿Necesitas más tiempo?{' '}
                    <Link to={`/evento/${gestion.evento_id}`} onClick={onCerrar} className="font-semibold underline">
                      Cambia la fecha del evento
                    </Link>
                    .
                  </>
                ) : (
                  ' Si necesitas más tiempo, primero cambia la fecha del evento con "Editar".'
                )}
              </p>
            </div>
          )}
          <Campo
            id="reprogramar-fecha"
            label="Nueva fecha"
            type="date"
            min={hoy}
            max={tope}
            ayuda={tope ? `Entre hoy y el ${formatearFecha(tope)}.` : 'Desde hoy en adelante.'}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setError('');
            }}
          />
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCerrar} disabled={guardando} className={btnNeutral}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className={btnPrimario}>
              {guardando ? 'Guardando…' : 'Reprogramar'}
            </button>
          </div>
        </form>
      )}

      {paso === 'conflicto' && conflicto && (
        <div>
          <p id="modal-conflicto-texto" className="text-sm text-gray-700" aria-live="assertive">
            {describirSobrecarga(conflicto)}
          </p>

          {/* Las cifras, una por fila, para que se entienda de dónde sale la sobrecarga */}
          <dl className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
            <div className="flex justify-between px-3 py-2">
              <dt className="text-gray-600">Ya tienes ese día</dt>
              <dd className="font-medium text-gray-900">
                {formatearHoras(conflicto.planificadas - conflicto.horasGestion)} h
              </dd>
            </div>
            <div className="flex justify-between px-3 py-2">
              <dt className="text-gray-600">Esta gestión</dt>
              <dd className="font-medium text-gray-900">+ {formatearHoras(conflicto.horasGestion)} h</dd>
            </div>
            <div className="flex justify-between bg-gray-50 px-3 py-2">
              <dt className="font-medium text-gray-900">Total</dt>
              <dd className="font-bold text-gray-900">
                {formatearHoras(conflicto.planificadas)} h de {formatearHoras(conflicto.limite)} h
              </dd>
            </div>
            <div className="flex justify-between px-3 py-2">
              <dt className="text-red-800">Te pasas por</dt>
              <dd className="font-bold text-red-800">{formatearHoras(conflicto.exceso)} h</dd>
            </div>
          </dl>

          <p className="mt-5 text-sm font-medium text-gray-900">¿Cómo quieres resolverlo?</p>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              onClick={irAMover}
              className="flex w-full items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left
                         hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <CalendarClock size={20} className="mt-0.5 shrink-0 text-gray-700" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">Mover a otro día</span>
                <span className="block text-sm text-gray-600">
                  {conflicto.diaSugerido
                    ? `El ${formatearFecha(conflicto.diaSugerido)} sí cabe.`
                    : 'Elige un día con menos carga.'}
                </span>
              </span>
              <ArrowRight size={16} className="mt-1 text-gray-400" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={irAReducir}
              disabled={conflicto.disponibles < 0.5}
              className="flex w-full items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left
                         hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <Clock size={20} className="mt-0.5 shrink-0 text-gray-700" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">Reducir horas estimadas</span>
                <span className="block text-sm text-gray-600">
                  {conflicto.disponibles >= 0.5
                    ? `Dejarla en máximo ${formatearHoras(conflicto.disponibles)} h para ese día.`
                    : 'Ese día ya está lleno; no alcanza ni con 0,5 h.'}
                </span>
              </span>
              <ArrowRight size={16} className="mt-1 text-gray-400" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onCerrar} className={btnNeutral}>
              Cancelar y dejarla como estaba
            </button>
          </div>
        </div>
      )}

      {paso === 'reducir' && conflicto && (
        <form onSubmit={reducir} noValidate>
          {resumenGestion}
          {errorCaja}
          <Campo
            id="reducir-horas"
            label={`Horas para el ${formatearFecha(conflicto.fecha)}`}
            type="number"
            min="0.5"
            max={conflicto.disponibles}
            step="0.5"
            ayuda={`Ese día te quedan ${formatearHoras(conflicto.disponibles)} h libres de tu límite de ${formatearHoras(conflicto.limite)} h.`}
            value={horas}
            onChange={(e) => {
              setHoras(e.target.value);
              setError('');
            }}
          />
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setPaso('conflicto')} disabled={guardando} className={btnNeutral}>
              Volver a las opciones
            </button>
            <button type="submit" disabled={guardando} className={btnPrimario}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// Se monta de nuevo cada vez que se abre, así el flujo siempre arranca limpio en el paso "fecha".
function ModalReprogramar({ abierto, gestion, ...resto }) {
  if (!abierto || !gestion) return null;
  return <ContenidoReprogramar key={gestion.id} gestion={gestion} {...resto} />;
}

export default ModalReprogramar;
