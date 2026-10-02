import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { createEvento } from '../eventoService';
import Campo from '../components/Campo';

const todayStr = new Date().toISOString().split('T')[0];

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
  if (!values.tipo.trim()) errors.tipo = 'Indica el tipo de evento.';
  if (!values.fecha) errors.fecha = 'Selecciona la fecha del evento.';
  else if (values.fecha < todayStr) errors.fecha = 'La fecha no puede ser en el pasado.';
  else if (subtareas.some((s) => s.fecha_limite > values.fecha)) {
    errors.fecha = 'Hay una gestión con fecha límite posterior a esta fecha.';
  }
  return errors;
}

// --- Formulario para agregar una gestión (campos uno debajo del otro) ---
function NuevaGestion({ fechaTope, onAgregar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [horas, setHoras] = useState('');
  const [errores, setErrores] = useState({});

  const validarGestion = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = 'Escribe el nombre de la gestión.';
    if (!fecha) errs.fecha = 'Selecciona la fecha límite.';
    else if (fecha < todayStr) errs.fecha = 'La fecha límite no puede ser en el pasado.';
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

  const agregar = () => {
    const errs = validarGestion();
    if (Object.keys(errs).length) {
      setErrores(errs);
      return;
    }
    onAgregar({
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      fecha_limite: fecha,
      horas_estimadas: parseFloat(horas),
    });
  };

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
      <p className="text-sm font-medium text-gray-900">Nueva gestión</p>

      <Campo
        id="gestion-nombre"
        label="Nombre de la gestión"
        placeholder="Confirmar el catering"
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); limpiarError('nombre'); }}
        error={errores.nombre}
        autoFocus
      />

      <Campo
        id="gestion-fecha"
        label="Fecha límite"
        type="date"
        min={todayStr}
        max={fechaTope || undefined}
        ayuda={fechaTope ? `Hasta el día del evento (${formatoFecha(fechaTope)}).` : 'Desde hoy en adelante.'}
        value={fecha}
        onChange={(e) => { setFecha(e.target.value); limpiarError('fecha'); }}
        error={errores.fecha}
      />

      <Campo
        id="gestion-horas"
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
          Añadir
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

function Crear() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mostrarFormGestion, setMostrarFormGestion] = useState(false);

  const campo = (name) => ({
    name,
    value: state.values[name],
    error: state.errors[name],
    onChange: (e) => dispatch({ type: 'SET_FIELD', field: name, value: e.target.value }),
  });

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    const errors = validar(state.values, state.subtareas);
    if (Object.keys(errors).length) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }
    setEnviando(true);
    try {
      // El id temporal solo sirve en pantalla; no se envía al backend.
      // eslint-disable-next-line no-unused-vars
      const subtareas = state.subtareas.map(({ id: _id, ...resto }) => resto);
      await createEvento({ ...state.values, subtareas });
      setCreado(true);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login', { replace: true });
        return;
      }
      setErrorGeneral('No se pudo guardar el evento. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setEnviando(false);
    }
  };

  if (creado) {
    return (
      <section className="min-h-screen bg-gray-50 grid place-items-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Evento guardado</h1>
          <p className="text-gray-500 mt-1 mb-6">Ya quedó registrado junto con sus gestiones logísticas.</p>
          <button
            onClick={() => navigate('/hoy')}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg px-5 py-2.5"
          >
            Ver en Hoy
          </button>
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

          <Campo
            id="evento-tipo"
            label="Tipo"
            placeholder="Social"
            ayuda="Por ejemplo: social, corporativo, cultural o deportivo."
            {...campo('tipo')}
          />

          <Campo
            id="evento-fecha"
            label="Fecha"
            type="date"
            min={todayStr}
            ayuda="Desde hoy en adelante."
            {...campo('fecha')}
          />
        </div>

        {/* 2. Gestiones logísticas */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Gestiones logísticas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Agrega cada gestión con su fecha límite y las horas que te va a tomar.
          </p>

          {state.subtareas.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aún no has agregado ninguna gestión.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
              {state.subtareas.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.nombre}</p>
                    <p className="text-xs text-gray-500">
                      Vence el {formatoFecha(s.fecha_limite)} · {s.horas_estimadas} h
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_SUBTAREA', id: s.id })}
                    aria-label={`Quitar la gestión ${s.nombre}`}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500
                               hover:bg-red-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    <X size={14} aria-hidden="true" /> Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mostrarFormGestion ? (
            <NuevaGestion
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

        {errorGeneral && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
    </section>
  );
}

export default Crear;
