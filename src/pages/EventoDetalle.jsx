import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, CalendarDays, ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  actualizarEvento,
  actualizarGestion,
  crearGestion,
  eliminarEvento,
  eliminarGestion,
  getEvento,
} from '../eventoService';
import { compararGestiones, describirPlazo, fechaLocalHoy, formatearFecha, formatearHoras } from '../hoyUtils';
import { calcularProgreso, describirCuentaRegresiva, SEGMENTOS } from '../progresoUtils';
import BarraProgreso from '../components/BarraProgreso';
import Campo from '../components/Campo';
import SelectorTipo from '../components/SelectorTipo';
import Confirmar from '../components/Confirmar';
import AyudaInfo from '../components/AyudaInfo';
import ModalReprogramar from '../components/ModalReprogramar';
import { describirSobrecarga, leerSobrecarga } from '../sobrecargaUtils';

const btnPrimario =
  'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand';
const btnNeutral =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium ' +
  'text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';
const btnPeligro =
  'inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium ' +
  'text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';

const ESTADOS = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'hecho', texto: 'Hecha' },
  { valor: 'pospuesto', texto: 'Pospuesta' },
];

const ESTILO_ACTIVO = {
  pendiente: 'bg-white text-gray-900 shadow-sm',
  hecho: 'bg-green-600 text-white',
  pospuesto: 'bg-amber-400 text-gray-900',
};

// Primer mensaje de error que devuelve DRF, o un texto claro por defecto.
function mensajeDe(err, porDefecto) {
  const body = err?.body;
  if (body && typeof body === 'object') {
    const primero = Object.values(body).flat()[0];
    if (typeof primero === 'string') return primero;
  }
  return porDefecto;
}

// ---------- Edición de los datos del evento ----------
function FormEvento({ evento, onGuardado, onCancelar }) {
  const hoy = fechaLocalHoy();
  const [v, setV] = useState({ nombre: evento.nombre, tipo: evento.tipo, fecha: evento.fecha });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const ultimaGestion = (evento.subtareas || []).reduce((m, g) => (g.fecha_limite > m ? g.fecha_limite : m), '');

  const cambiar = (e) => {
    setV((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrores((p) => ({ ...p, [e.target.name]: undefined }));
  };

  async function guardar(e) {
    e.preventDefault();
    const errs = {};
    if (!v.nombre.trim()) errs.nombre = 'Escribe el nombre del evento.';
    if (!v.tipo.trim()) errs.tipo = 'Elige el tipo de evento, o escríbelo en "Otro".';
    if (!v.fecha) errs.fecha = 'Selecciona la fecha del evento.';
    else if (v.fecha !== evento.fecha && v.fecha < hoy) errs.fecha = 'La fecha no puede ser en el pasado.';
    else if (ultimaGestion && v.fecha < ultimaGestion)
      errs.fecha = `Tienes gestiones hasta el ${formatearFecha(ultimaGestion)}; el evento no puede ser antes.`;
    if (Object.keys(errs).length) return setErrores(errs);

    setGuardando(true);
    setErrorGeneral('');
    try {
      const actualizado = await actualizarEvento(evento.id, {
        nombre: v.nombre.trim(),
        tipo: v.tipo.trim(),
        fecha: v.fecha,
      });
      onGuardado(actualizado);
    } catch (err) {
      setErrorGeneral(mensajeDe(err, 'No se pudieron guardar los cambios. Inténtalo otra vez.'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="mt-4 space-y-4">
      {errorGeneral && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorGeneral}
        </p>
      )}
      <Campo id="editar-nombre" name="nombre" label="Nombre" value={v.nombre} onChange={cambiar} error={errores.nombre} />
      <SelectorTipo
        id="editar-tipo"
        value={v.tipo}
        error={errores.tipo}
        onChange={(valor) => cambiar({ target: { name: 'tipo', value: valor } })}
      />
      <Campo
        id="editar-fecha"
        name="fecha"
        label="Fecha"
        type="date"
        min={ultimaGestion || hoy}
        ayuda={ultimaGestion ? `No puede ser antes de tu última gestión (${formatearFecha(ultimaGestion)}).` : undefined}
        value={v.fecha}
        onChange={cambiar}
        error={errores.fecha}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className={btnPrimario}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando} className={btnNeutral}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------- Una gestión: estado, edición y eliminación ----------
function FilaGestion({ gestion, fechaEvento, onCambio, onEliminar, onReprogramar }) {
  const [editando, setEditando] = useState(false);
  const [v, setV] = useState({ nombre: '', fecha_limite: '', horas_estimadas: '' });
  const [errores, setErrores] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  async function cambiarEstado(estado) {
    if (estado === gestion.estado || ocupado) return;
    const anterior = gestion.estado;
    setError('');
    setOcupado(true);
    onCambio({ ...gestion, estado }); // se ve al instante; si falla, se revierte
    try {
      await actualizarGestion(gestion.id, { estado });
    } catch {
      onCambio({ ...gestion, estado: anterior });
      setError('No se pudo cambiar el estado. Inténtalo otra vez.');
    } finally {
      setOcupado(false);
    }
  }

  function abrirEdicion() {
    setV({
      nombre: gestion.nombre,
      fecha_limite: gestion.fecha_limite,
      horas_estimadas: String(Number(gestion.horas_estimadas)),
    });
    setErrores({});
    setError('');
    setEditando(true);
  }

  const cambiar = (e) => {
    setV((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrores((p) => ({ ...p, [e.target.name]: undefined }));
  };

  async function guardar(e) {
    e.preventDefault();
    const errs = {};
    const h = parseFloat(v.horas_estimadas);
    if (!v.nombre.trim()) errs.nombre = 'Escribe el nombre de la gestión.';
    if (!v.fecha_limite) errs.fecha_limite = 'Selecciona la fecha límite.';
    else if (v.fecha_limite > fechaEvento)
      errs.fecha_limite = `Debe ser antes o el mismo día del evento (${formatearFecha(fechaEvento)}).`;
    if (isNaN(h) || h <= 0 || h > 16) errs.horas_estimadas = 'Escribe un valor entre 0,5 y 16 horas.';
    if (Object.keys(errs).length) return setErrores(errs);

    setOcupado(true);
    try {
      const actualizada = await actualizarGestion(gestion.id, {
        nombre: v.nombre.trim(),
        fecha_limite: v.fecha_limite,
        horas_estimadas: h,
      });
      onCambio({ ...gestion, ...actualizada });
      setEditando(false);
    } catch (err) {
      const sobrecarga = leerSobrecarga(err);
      setError(
        sobrecarga
          ? `${describirSobrecarga(sobrecarga[0])} Usa "Reprogramar" para moverla o reducir sus horas.`
          : mensajeDe(err, 'No se pudieron guardar los cambios. Inténtalo otra vez.')
      );
    } finally {
      setOcupado(false);
    }
  }

  const vencida = gestion.estado !== 'hecho' && gestion.fecha_limite < fechaLocalHoy();

  if (editando) {
    return (
      <li className="py-4">
        <form onSubmit={guardar} noValidate className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          <Campo id={`g-nombre-${gestion.id}`} name="nombre" label="Nombre de la gestión" value={v.nombre} onChange={cambiar} error={errores.nombre} />
          <Campo
            id={`g-fecha-${gestion.id}`}
            name="fecha_limite"
            label="Fecha límite"
            type="date"
            max={fechaEvento}
            ayuda={`Hasta el día del evento (${formatearFecha(fechaEvento)}).`}
            value={v.fecha_limite}
            onChange={cambiar}
            error={errores.fecha_limite}
          />
          <Campo
            id={`g-horas-${gestion.id}`}
            name="horas_estimadas"
            label="Horas estimadas"
            type="number"
            min="0.5"
            max="16"
            step="0.5"
            ayuda="Entre 0,5 y 16 horas."
            value={v.horas_estimadas}
            onChange={cambiar}
            error={errores.horas_estimadas}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={ocupado} className={btnPrimario}>
              {ocupado ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setEditando(false)} disabled={ocupado} className={btnNeutral}>
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium ${gestion.estado === 'hecho' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {gestion.nombre}
          </p>
          <p className={`mt-0.5 text-sm ${vencida ? 'text-red-700' : 'text-gray-500'}`}>
            {formatearFecha(gestion.fecha_limite)} —{' '}
            {gestion.estado === 'hecho' ? 'terminada' : describirPlazo(gestion.fecha_limite).toLowerCase()} —{' '}
            {formatearHoras(gestion.horas_estimadas)} h
          </p>
        </div>
        <div className="flex gap-1">
          {gestion.estado !== 'hecho' && (
            <button
              type="button"
              onClick={() => onReprogramar(gestion)}
              className={btnNeutral}
              aria-label={`Reprogramar ${gestion.nombre}`}
            >
              <CalendarClock size={14} aria-hidden="true" /> <span className="hidden sm:inline">Reprogramar</span>
            </button>
          )}
          <button type="button" onClick={abrirEdicion} className={btnNeutral} aria-label={`Editar ${gestion.nombre}`}>
            <Pencil size={14} aria-hidden="true" /> <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => onEliminar(gestion)}
            className={btnPeligro}
            aria-label={`Eliminar ${gestion.nombre}`}
          >
            <Trash2 size={14} aria-hidden="true" /> <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={`Estado de ${gestion.nombre}`}
        className="mt-3 inline-flex rounded-lg bg-gray-100 p-1"
      >
        {ESTADOS.map((e) => {
          const activo = gestion.estado === e.valor;
          return (
            <button
              key={e.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              disabled={ocupado}
              onClick={() => cambiarEstado(e.valor)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none
                focus-visible:ring-2 focus-visible:ring-gray-400 ${
                  activo ? ESTILO_ACTIVO[e.valor] : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {e.texto}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </li>
  );
}

// ---------- Agregar una gestión a un evento ya guardado ----------
function FormNuevaGestion({ evento, onCreada, onCancelar }) {
  const hoy = fechaLocalHoy();
  const [v, setV] = useState({ nombre: '', fecha_limite: '', horas_estimadas: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (e) => {
    setV((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrores((p) => ({ ...p, [e.target.name]: undefined }));
    setError('');
  };

  async function guardar(e) {
    e.preventDefault();
    const errs = {};
    const h = parseFloat(String(v.horas_estimadas).replace(',', '.'));
    if (!v.nombre.trim()) errs.nombre = 'Escribe el nombre de la gestión.';
    if (!v.fecha_limite) errs.fecha_limite = 'Selecciona la fecha límite.';
    else if (v.fecha_limite < hoy) errs.fecha_limite = 'La fecha límite no puede ser en el pasado.';
    else if (v.fecha_limite > evento.fecha)
      errs.fecha_limite = `Debe ser antes o el mismo día del evento (${formatearFecha(evento.fecha)}).`;
    if (isNaN(h) || h <= 0 || h > 16) errs.horas_estimadas = 'Escribe un valor entre 0,5 y 16 horas.';
    if (Object.keys(errs).length) return setErrores(errs);

    setGuardando(true);
    try {
      const datos = { nombre: v.nombre.trim(), fecha_limite: v.fecha_limite, horas_estimadas: h };
      const creada = await crearGestion(evento.id, datos);
      onCreada({ estado: 'pendiente', nota: null, ...datos, ...creada });
    } catch (err) {
      const sobrecarga = leerSobrecarga(err);
      if (sobrecarga) {
        const c = sobrecarga[0];
        setError(
          `${describirSobrecarga(c)} ` +
            (c.diaSugerido ? `El ${formatearFecha(c.diaSugerido)} sí cabe. ` : '') +
            (c.disponibles >= 0.5 ? `También puedes dejarla en ${formatearHoras(c.disponibles)} h.` : '')
        );
      } else if (err?.status === 404) {
        setError('No encontramos este evento. Puede que se haya eliminado.');
      } else {
        setError(mensajeDe(err, 'No se pudo agregar la gestión. Revisa tu conexión e inténtalo otra vez.'));
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-900">Nueva gestión</p>
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <Campo
        id="nueva-nombre"
        name="nombre"
        label="Nombre de la gestión"
        placeholder="Confirmar el catering"
        autoFocus
        value={v.nombre}
        onChange={cambiar}
        error={errores.nombre}
      />
      <Campo
        id="nueva-fecha"
        name="fecha_limite"
        label="Fecha límite"
        type="date"
        min={hoy}
        max={evento.fecha}
        ayuda={`Desde hoy y hasta el día del evento (${formatearFecha(evento.fecha)}).`}
        value={v.fecha_limite}
        onChange={cambiar}
        error={errores.fecha_limite}
      />
      <Campo
        id="nueva-horas"
        name="horas_estimadas"
        label="Horas estimadas"
        type="number"
        min="0.5"
        max="16"
        step="0.5"
        placeholder="2"
        ayuda="Entre 0,5 y 16 horas."
        value={v.horas_estimadas}
        onChange={cambiar}
        error={errores.horas_estimadas}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className={btnPrimario}>
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando} className={btnNeutral}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------- Página ----------
function EventoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | noexiste | error
  const [evento, setEvento] = useState(null);
  const [intento, setIntento] = useState(0);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [porEliminar, setPorEliminar] = useState(null); // { tipo: 'evento' } | { tipo: 'gestion', gestion }
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [reprogramando, setReprogramando] = useState(null);
  const location = useLocation();
  // Si viene de "Agregar más gestiones" (pantalla de éxito de Crear), el formulario ya aparece abierto.
  const [agregando, setAgregando] = useState(Boolean(location.state?.agregarGestion));

  useEffect(() => {
    let activo = true;
    getEvento(id)
      .then((data) => {
        if (!activo) return;
        setEvento(data);
        setEstado('listo');
      })
      .catch((err) => {
        if (!activo) return;
        if (err.status === 401 || err.status === 403) return navigate('/login', { replace: true });
        // 404 también cuando el evento es de otro organizador (aislamiento).
        setEstado(err.status === 404 ? 'noexiste' : 'error');
      });
    return () => {
      activo = false;
    };
  }, [id, intento, navigate]);

  const mostrarAviso = useCallback((texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3000);
  }, []);

  const gestiones = useMemo(() => [...(evento?.subtareas || [])].sort(compararGestiones), [evento]);
  const progreso = useMemo(() => (evento ? calcularProgreso(evento) : null), [evento]);

  function reemplazarGestion(nueva) {
    setEvento((ev) => ({ ...ev, subtareas: ev.subtareas.map((g) => (g.id === nueva.id ? nueva : g)) }));
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    setErrorEliminar('');
    try {
      if (porEliminar.tipo === 'evento') {
        await eliminarEvento(evento.id);
        navigate('/evento', { replace: true, state: { aviso: `Se eliminó "${evento.nombre}".` } });
        return;
      }
      const g = porEliminar.gestion;
      await eliminarGestion(g.id);
      setEvento((ev) => ({ ...ev, subtareas: ev.subtareas.filter((x) => x.id !== g.id) }));
      setPorEliminar(null);
      mostrarAviso(`Se eliminó la gestión "${g.nombre}".`);
    } catch {
      setErrorEliminar('No se pudo eliminar. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setEliminando(false);
    }
  }

  const volver = (
    <Link
      to="/evento"
      className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      <ChevronLeft size={16} aria-hidden="true" /> Mis eventos
    </Link>
  );

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {volver}

        {estado === 'cargando' && (
          <div role="status" aria-live="polite" className="mt-6">
            <p className="text-sm text-gray-600">Cargando el evento…</p>
            <div className="mt-4 h-48 animate-pulse rounded-xl bg-gray-200" aria-hidden="true" />
          </div>
        )}

        {estado === 'noexiste' && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">No encontramos este evento.</p>
            <p className="mt-1 text-sm text-gray-600">Puede que se haya eliminado o que no sea tuyo.</p>
          </div>
        )}

        {estado === 'error' && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">No pudimos cargar el evento.</p>
            <p className="mt-1 text-sm text-red-700">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => {
                setEstado('cargando');
                setIntento((n) => n + 1);
              }}
              className={`mt-4 ${btnPrimario}`}
            >
              Reintentar
            </button>
          </div>
        )}

        {estado === 'listo' && evento && (
          <>
            {/* Datos del evento */}
            <article className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
              {editando ? (
                <>
                  <h1 className="text-xl font-bold text-gray-900">Editar evento</h1>
                  <FormEvento
                    evento={evento}
                    onCancelar={() => setEditando(false)}
                    onGuardado={(act) => {
                      setEvento((ev) => ({ ...ev, ...act, subtareas: ev.subtareas }));
                      setEditando(false);
                      mostrarAviso('Cambios guardados.');
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-3xl font-bold text-gray-900">{evento.nombre}</h1>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-500">
                        <CalendarDays size={15} aria-hidden="true" />
                        {formatearFecha(evento.fecha)} — {evento.tipo} —{' '}
                        {describirCuentaRegresiva(progreso.diasParaEvento)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditando(true)} className={btnNeutral}>
                        <Pencil size={14} aria-hidden="true" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorEliminar('');
                          setPorEliminar({ tipo: 'evento' });
                        }}
                        className={btnPeligro}
                      >
                        <Trash2 size={14} aria-hidden="true" /> Eliminar
                      </button>
                    </div>
                  </div>

                  {progreso.total > 0 && (
                    <div className="mt-6">
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-gray-900">
                          {progreso.porcentaje}%<span className="ml-1.5 text-sm font-medium text-gray-500">hecho</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatearHoras(progreso.horasHechas)} de {formatearHoras(progreso.horasTotales)} h
                        </p>
                      </div>
                      <div className="mt-2">
                        <BarraProgreso progreso={progreso} etiqueta={`Avance de ${evento.nombre}`} />
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        {SEGMENTOS.map((s) => (
                          <li key={s.clave} className="flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.punto}`} aria-hidden="true" />
                            {s.nombre}: <strong className="font-semibold text-gray-900">{progreso.conteo[s.clave]}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </article>

            {/* Gestiones */}
            <article className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
                Gestiones logísticas
                <AyudaInfo
                  nombre="Cómo actualizar tus gestiones"
                  titulo="Cómo actualizar tus gestiones"
                  lineas={[
                    'Marca cada gestión como Hecha o Pospuesta a medida que avanzas.',
                    'Usa Reprogramar para cambiarla de día; te avisamos si ese día se pasa de tu límite.',
                    'Con Editar cambias su nombre u horas.',
                    'Puedes agregar gestiones nuevas cuando quieras.',
                  ]}
                />
              </h2>
              {gestiones.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">Este evento no tiene gestiones logísticas.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100">
                  {gestiones.map((g) => (
                    <FilaGestion
                      key={g.id}
                      gestion={g}
                      fechaEvento={evento.fecha}
                      onCambio={reemplazarGestion}
                      onReprogramar={setReprogramando}
                      onEliminar={(gestion) => {
                        setErrorEliminar('');
                        setPorEliminar({ tipo: 'gestion', gestion });
                      }}
                    />
                  ))}
                </ul>
              )}

              {agregando ? (
                <FormNuevaGestion
                  evento={evento}
                  onCancelar={() => setAgregando(false)}
                  onCreada={(g) => {
                    setEvento((ev) => ({ ...ev, subtareas: [...ev.subtareas, g] }));
                    setAgregando(false);
                    mostrarAviso(`Se agregó la gestión "${g.nombre}".`);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAgregando(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-md text-sm font-semibold text-brand hover:text-brand-dark
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <Plus size={16} aria-hidden="true" /> Agregar gestión logística
                </button>
              )}
            </article>
          </>
        )}
      </div>

      {/* Aviso de éxito, anunciado a lectores de pantalla */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {aviso && (
          <p className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>
        )}
      </div>

      <ModalReprogramar
        abierto={Boolean(reprogramando)}
        gestion={reprogramando}
        fechaEvento={evento?.fecha}
        onCerrar={() => setReprogramando(null)}
        onListo={(actualizada, mensaje) => {
          reemplazarGestion(actualizada);
          setReprogramando(null);
          mostrarAviso(mensaje);
        }}
      />

      <Confirmar
        abierto={Boolean(porEliminar)}
        procesando={eliminando}
        titulo={porEliminar?.tipo === 'evento' ? '¿Eliminar este evento?' : '¿Eliminar esta gestión?'}
        mensaje={
          (porEliminar?.tipo === 'evento'
            ? `Se borrará "${evento?.nombre}" junto con sus ${evento?.subtareas?.length || 0} gestiones. No se puede deshacer.`
            : `Se borrará "${porEliminar?.gestion?.nombre}". No se puede deshacer.`) +
          (errorEliminar ? ` ${errorEliminar}` : '')
        }
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      />
    </section>
  );
}

export default EventoDetalle;
