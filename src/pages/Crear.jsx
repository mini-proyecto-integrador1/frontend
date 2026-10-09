import { useImperativeHandle, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock, Pencil, Plus, X } from 'lucide-react';
import { createEvento } from '../eventoService';
import { leerSobrecarga, maximoQueCabe } from '../sobrecargaUtils';
import { fechaLocalHoy, formatearFecha, formatearHoras } from '../hoyUtils';
import { useLimite } from '../limiteContexto';
import Campo from '../components/Campo';
import ModalLimite from '../components/ModalLimite';
import SelectorTipo from '../components/SelectorTipo';
import AyudaInfo from '../components/AyudaInfo';


// AAAA-MM-DD -> DD/MM/AAAA, para mostrar fechas como las lee el organizador.
const formatoFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

// --- Estado del evento manejado con reducer, en vez de useState por campo ---
const initialState = {
  values: { nombre: '', tipo: '', fecha: '' },
  errors: {},
  subtareas: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'ADD_SUBTAREA':
      return { ...state, subtareas: [...state.subtareas, action.subtarea] };
    case 'UPDATE_SUBTAREA':
      return {
        ...state,
        subtareas: state.subtareas.map((s) => (s.id === action.id ? { ...s, ...action.cambios } : s)),
      };
    case 'REMOVE_SUBTAREA':
      return { ...state, subtareas: state.subtareas.filter((s) => s.id !== action.id) };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function validar(values, subtareas) {
  const errors = {};
  if (!values.nombre.trim()) errors.nombre = 'Escribe el nombre del evento.';
  if (!values.tipo.trim()) errors.tipo = 'Elige el tipo de evento, o escríbelo en "Otro".';
  if (!values.fecha) errors.fecha = 'Selecciona la fecha del evento.';
  else if (values.fecha < fechaLocalHoy()) errors.fecha = 'La fecha no puede ser en el pasado.';
  else if (subtareas.some((s) => s.fecha_limite > values.fecha)) {
    errors.fecha = 'Hay una gestión con fecha límite posterior a esta fecha.';
  }
  return errors;
}

// --- Formulario para agregar o editar una gestión (campos uno debajo del otro) ---
// revisarRef: el formulario padre la usa al guardar el evento, para incluir la gestión que
// quedó escrita aunque no se haya presionado "Añadir".
// inicial: si llega, el formulario edita esa gestión en vez de crear una nueva.
function NuevaGestion({ fechaTope, onAgregar, onCancelar, revisarRef, inicial, idBase = 'gestion' }) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [fecha, setFecha] = useState(inicial?.fecha_limite ?? '');
  const [horas, setHoras] = useState(inicial ? String(inicial.horas_estimadas) : '');
  const [errores, setErrores] = useState({});

  const validarGestion = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = 'Escribe el nombre de la gestión.';
    if (!fecha) errs.fecha = 'Selecciona la fecha límite.';
    else if (fecha < fechaLocalHoy()) errs.fecha = 'La fecha límite no puede ser en el pasado.';
    else if (fechaTope && fecha > fechaTope) {
      errs.fecha = `Debe ser antes o el mismo día del evento (${formatoFecha(fechaTope)}).`;
    }
    if (!horas) errs.horas = 'Escribe las horas estimadas.';
    else {
      const h = parseFloat(horas);
      if (isNaN(h) || h <= 0 || h > 16) errs.horas = 'Escribe un valor entre 0,5 y 16 horas.';
    }
    return errs;
  };

  const armar = () => ({
    id: inicial?.id ?? crypto.randomUUID(),
    nombre: nombre.trim(),
    fecha_limite: fecha,
    horas_estimadas: parseFloat(horas),
  });

  const agregar = () => {
    const errs = validarGestion();
    if (Object.keys(errs).length) {
      setErrores(errs);
      return;
    }
    onAgregar(armar());
  };

  // Al guardar el evento: vacía → se ignora; completa y válida → se incluye; a medias → muestra sus errores.
  useImperativeHandle(revisarRef, () => ({
    revisar() {
      if (!nombre.trim() && !fecha && !horas) return { estado: 'vacia' };
      const errs = validarGestion();
      if (Object.keys(errs).length) {
        setErrores(errs);
        return { estado: 'incompleta' };
      }
      return { estado: 'lista', gestion: armar() };
    },
  }));


  // Enter dentro de una gestión la agrega, en vez de enviar todo el evento.
  const alPresionarTecla = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregar();
    }
  };

  const limpiarError = (campo) => setErrores((p) => ({ ...p, [campo]: undefined }));

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4" onKeyDown={alPresionarTecla}>
      <p className="text-sm font-medium text-gray-900">{inicial ? 'Editar gestión' : 'Nueva gestión'}</p>

      <Campo
        id={`${idBase}-nombre`}
        label="Nombre de la gestión"
        placeholder="Confirmar el catering"
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); limpiarError('nombre'); }}
        error={errores.nombre}
        autoFocus
      />

      <Campo
        id={`${idBase}-fecha`}
        label="Fecha límite"
        type="date"
        min={fechaLocalHoy()}
        max={fechaTope || undefined}
        ayuda={fechaTope ? `Hasta el día del evento (${formatoFecha(fechaTope)}).` : 'Desde hoy en adelante.'}
        value={fecha}
        onChange={(e) => { setFecha(e.target.value); limpiarError('fecha'); }}
        error={errores.fecha}
      />

      <Campo
        id={`${idBase}-horas`}
        label="Horas estimadas"
        type="number"
        min="0.5"
        max="16"
        step="0.5"
        placeholder="2"
        ayuda="Entre 0,5 y 16 horas."
        value={horas}
        onChange={(e) => { setHoras(e.target.value); limpiarError('horas'); }}
        error={errores.horas}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={agregar}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
        >
          {inicial ? 'Guardar' : 'Añadir'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700
                     hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const btnAccion =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium ' +
  'text-gray-800 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400';

// --- Resolución de sobrecarga al crear el evento (Sprint 3 · C3 y C4) ---
// Muestra cada día que se pasa del límite con sus cifras y, por cada gestión de ese día,
// botones que lo arreglan con un clic: dejarla en las horas que caben, moverla al día sugerido o editarla.
// Las cifras se recalculan en vivo con la lista actual, así el organizador ve cuándo ya cabe.
function PanelConflictos({ conflictos, subtareas, fechaEvento, limite, onCambiar, onEditar, onCambiarLimite }) {
  const dias = conflictos.map((c) => {
    const delDia = subtareas.filter((s) => s.fecha_limite === c.fecha);
    const nuevas = delDia.reduce((t, s) => t + Number(s.horas_estimadas), 0);
    const existentes = Math.max(0, c.planificadas - c.horasGestion); // lo que ya tenía ese día en otros eventos
    const total = existentes + nuevas;
    const sugerido =
      c.diaSugerido && c.diaSugerido !== c.fecha && (!fechaEvento || c.diaSugerido <= fechaEvento) ? c.diaSugerido : null;
    return { ...c, delDia, nuevas, existentes, total, libres: Math.max(0, limite - existentes), sugerido, resuelto: total <= limite };
  });
  const pendientes = dias.filter((d) => !d.resuelto);

  if (pendientes.length === 0) {
    return (
      <div role="status" className="flex gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Listo, ya ningún día pasa de tu límite de {formatearHoras(limite)} h. Dale <strong>Guardar evento</strong>.
        </p>
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">
        {pendientes.length === 1 ? 'Un día queda' : `${pendientes.length} días quedan`} por encima de tu límite diario de{' '}
        {formatearHoras(limite)} h
      </p>
      <p className="mt-0.5 text-red-800">Elige cómo resolverlo; el cambio se aplica a la lista de arriba.</p>

      <ul className="mt-3 space-y-3">
        {dias.map((d) =>
          d.resuelto ? (
            <li key={d.fecha} className="flex items-center gap-1.5 text-green-800">
              <CheckCircle2 size={16} aria-hidden="true" /> El {formatearFecha(d.fecha)} ya cabe ({formatearHoras(d.total)} h de{' '}
              {formatearHoras(limite)} h).
            </li>
          ) : (
            <li key={d.fecha} className="rounded-lg border border-red-100 bg-white p-3 text-gray-800">
              <p>
                <strong>El {formatearFecha(d.fecha)}</strong> quedarías con{' '}
                <strong>
                  {formatearHoras(d.total)} h de {formatearHoras(limite)} h
                </strong>
                {d.existentes > 0
                  ? ` (${formatearHoras(d.existentes)} h que ya tienes de otros eventos + ${formatearHoras(d.nuevas)} h de este).`
                  : '.'}{' '}
                <span className="font-semibold text-red-800">Te pasas por {formatearHoras(d.total - limite)} h.</span>
              </p>
              <ul className="mt-2 divide-y divide-gray-100">
                {d.delDia.map((g) => {
                  const cabe = maximoQueCabe(d.libres - (d.nuevas - Number(g.horas_estimadas)));
                  return (
                    <li key={g.id} className="py-2">
                      <p className="font-medium text-gray-900">
                        {g.nombre} <span className="font-normal text-gray-500">· {formatearHoras(g.horas_estimadas)} h</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {cabe >= 0.5 && cabe < Number(g.horas_estimadas) && (
                          <button
                            type="button"
                            className={btnAccion}
                            onClick={() => onCambiar(g.id, { horas_estimadas: cabe })}
                          >
                            <Clock size={14} aria-hidden="true" /> Dejar en {formatearHoras(cabe)} h
                          </button>
                        )}
                        {d.sugerido && (
                          <button
                            type="button"
                            className={btnAccion}
                            onClick={() => onCambiar(g.id, { fecha_limite: d.sugerido })}
                          >
                            <CalendarClock size={14} aria-hidden="true" /> Mover al {formatearFecha(d.sugerido)}
                          </button>
                        )}
                        <button type="button" className={btnAccion} onClick={() => onEditar(g.id)}>
                          <Pencil size={14} aria-hidden="true" /> Editar
                        </button>
                      </div>
                      {cabe < 0.5 && !d.sugerido && (
                        <p className="mt-1.5 text-xs text-gray-600">
                          Ese día ya está lleno y ningún otro día antes del evento tiene {formatearHoras(g.horas_estimadas)} h
                          libres. Edítala (por ejemplo, divídela en dos con menos horas) o cambia tu límite diario.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          )
        )}
      </ul>

      <p className="mt-3 text-red-800">
        ¿Puedes dedicarle más horas al día?{' '}
        <button
          type="button"
          onClick={onCambiarLimite}
          className="font-semibold underline hover:text-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          Cambiar mi límite diario
        </button>
      </p>
    </div>
  );
}

function Crear() {
  const navigate = useNavigate();
  const { limite: limiteActual } = useLimite();
  const [conflictos, setConflictos] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cambiandoLimite, setCambiandoLimite] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mostrarFormGestion, setMostrarFormGestion] = useState(false);
  const revisarBorrador = useRef(null);

  const campo = (name) => ({
    name,
    value: state.values[name],
    error: state.errors[name],
    onChange: (e) => dispatch({ type: 'SET_FIELD', field: name, value: e.target.value }),
  });

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    if (editandoId) {
      setErrorGeneral('Termina de editar la gestión (dale "Guardar" o "Cancelar") antes de guardar el evento.');
      return;
    }
    // La gestión escrita pero sin "Añadir" también se guarda.
    let pendientes = state.subtareas;
    if (mostrarFormGestion && revisarBorrador.current) {
      const borrador = revisarBorrador.current.revisar();
      if (borrador.estado === 'incompleta') {
        setErrorGeneral('Completa la gestión que estabas agregando, o dale "Cancelar" si no la necesitas.');
        return;
      }
      if (borrador.estado === 'lista') {
        pendientes = [...pendientes, borrador.gestion];
        // Queda en la lista: si hay conflicto, el organizador la ve y puede arreglarla desde el aviso.
        dispatch({ type: 'ADD_SUBTAREA', subtarea: borrador.gestion });
        setMostrarFormGestion(false);
      }
    }
    const errors = validar(state.values, pendientes);
    if (Object.keys(errors).length) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }
    setEnviando(true);
    setConflictos(null);
    try {
      // El id temporal solo sirve en pantalla; no se envía al backend.
      // eslint-disable-next-line no-unused-vars
      const subtareas = pendientes.map(({ id: _id, ...resto }) => resto);
      const nuevo = await createEvento({ ...state.values, subtareas });
      setCreado({ id: nuevo?.id, gestiones: subtareas.length });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login', { replace: true });
        return;
      }
      const sobrecarga = leerSobrecarga(err);
      if (sobrecarga) {
        // Cada día que se pasa del límite, con sus cifras (C3) y botones para resolverlo (C4).
        setConflictos(sobrecarga);
        return;
      }
      setErrorGeneral('No se pudo guardar el evento. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setEnviando(false);
    }
  };

  if (creado) {
    return (
      <section className="grid place-items-center px-4 py-16">
        <div className="max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-700">
            <CheckCircle2 size={28} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Evento guardado</h1>
          <p className="mt-1 text-gray-600">
            {creado.gestiones === 0
              ? 'Ya quedó registrado. Todavía no tiene gestiones logísticas: puedes agregarlas ahora.'
              : `Ya quedó registrado con ${creado.gestiones} ${creado.gestiones === 1 ? 'gestión logística' : 'gestiones logísticas'}. Puedes agregar más cuando quieras.`}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {creado.id && (
              <button
                type="button"
                onClick={() => navigate(`/evento/${creado.id}`, { state: { agregarGestion: true } })}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-5 py-2.5
                           text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                <Plus size={16} aria-hidden="true" /> Agregar más gestiones
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/hoy')}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
            >
              Ver en Hoy
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-8">
      <form onSubmit={enviar} noValidate className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Crear nuevo evento</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los datos de tu evento y su plan logístico inicial.
          </p>
        </header>

        {/* 1. Datos del evento */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Datos del evento</h2>

          <Campo id="evento-nombre" label="Nombre" placeholder="Boda Camila y Andrés" {...campo('nombre')} />

          <SelectorTipo
            id="evento-tipo"
            value={state.values.tipo}
            error={state.errors.tipo}
            onChange={(valor) => dispatch({ type: 'SET_FIELD', field: 'tipo', value: valor })}
          />

          <Campo
            id="evento-fecha"
            label="Fecha"
            type="date"
            min={fechaLocalHoy()}
            ayuda="Desde hoy en adelante."
            {...campo('fecha')}
          />
        </div>

        {/* 2. Gestiones logísticas */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
            Gestiones logísticas
            <AyudaInfo
              nombre="Qué es una gestión logística"
              titulo="Gestiones logísticas"
              texto="Son las tareas que necesitas hacer antes del evento, como confirmar el catering o enviar invitaciones. Cada una lleva una fecha límite y las horas que te va a tomar."
            />
          </h2>

          {state.subtareas.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aún no has agregado ninguna gestión.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
              {state.subtareas.map((s) =>
                editandoId === s.id ? (
                  <li key={s.id} className="pb-3">
                    <NuevaGestion
                      inicial={s}
                      idBase={`editar-${s.id}`}
                      fechaTope={state.values.fecha}
                      onAgregar={(g) => {
                        dispatch({ type: 'UPDATE_SUBTAREA', id: s.id, cambios: g });
                        setEditandoId(null);
                      }}
                      onCancelar={() => setEditandoId(null)}
                    />
                  </li>
                ) : (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.nombre}</p>
                    <p className="text-xs text-gray-500">
                      Vence el {formatoFecha(s.fecha_limite)} · <span className="whitespace-nowrap">{formatearHoras(s.horas_estimadas)} h</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditandoId(s.id)}
                    aria-label={`Editar la gestión ${s.nombre}`}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500
                               hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    <Pencil size={14} aria-hidden="true" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_SUBTAREA', id: s.id })}
                    aria-label={`Quitar la gestión ${s.nombre}`}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500
                               hover:bg-red-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    <X size={14} aria-hidden="true" /> Quitar
                  </button>
                  </div>
                </li>
                )
              )}
            </ul>
          )}

          {mostrarFormGestion ? (
            <NuevaGestion
              revisarRef={revisarBorrador}
              fechaTope={state.values.fecha}
              onAgregar={(s) => {
                dispatch({ type: 'ADD_SUBTAREA', subtarea: s });
                setMostrarFormGestion(false);
              }}
              onCancelar={() => setMostrarFormGestion(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setMostrarFormGestion(true)}
              className="mt-4 flex items-center gap-1.5 rounded-md text-sm font-semibold text-brand hover:text-brand-dark
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <Plus size={16} aria-hidden="true" /> Agregar gestión logística
            </button>
          )}
        </div>

        {conflictos && (
          <PanelConflictos
            conflictos={conflictos}
            subtareas={state.subtareas}
            fechaEvento={state.values.fecha}
            limite={limiteActual ?? conflictos[0].limite}
            onCambiar={(id, cambios) => dispatch({ type: 'UPDATE_SUBTAREA', id, cambios })}
            onEditar={(id) => {
              setEditandoId(id);
              setMostrarFormGestion(false);
            }}
            onCambiarLimite={() => setCambiandoLimite(true)}
          />
        )}

        {errorGeneral && (
          <div role="alert" className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorGeneral}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/hoy')}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700
                       hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          >
            {enviando ? 'Guardando…' : 'Guardar evento'}
          </button>
        </div>

        <p className="text-xs text-gray-500">Los campos con * son obligatorios.</p>
      </form>
      <ModalLimite
        abierto={cambiandoLimite}
        onCerrar={() => setCambiandoLimite(false)}
        onGuardado={() => setCambiandoLimite(false)}
      />
    </section>
  );
}

export default Crear;
