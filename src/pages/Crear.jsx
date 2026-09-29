import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvento } from '../eventoService';

const todayStr = new Date().toISOString().split('T')[0];

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
    errors.fecha = 'Hay una gestión con fecha posterior a esta.';
  }
  return errors;
}

// --- Fila de captura rápida de una gestión (inline, no en modal ni tarjeta aparte) ---
function FilaNuevaGestion({ fechaTope, onAgregar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [horas, setHoras] = useState('');
  const [errores, setErrores] = useState({});

  const validarFila = () => {
    const errs = {};
    if (!nombre.trim()) errs.nombre = 'Requerido';
    if (!fecha) {
      errs.fecha = 'Requerido';
    } else if (fechaTope && fecha > fechaTope) {
      errs.fecha = `No puede ser después del ${fechaTope}`;
    }
    if (!horas) {
      errs.horas = 'Requerido';
    } else {
      const h = parseFloat(horas);
      if (isNaN(h) || h <= 0 || h > 16) errs.horas = 'Entre 0 y 16';
    }
    return errs;
  };

  const agregar = () => {
    const errs = validarFila();
    if (Object.keys(errs).length) {
      setErrores(errs);
      return;
    }
    onAgregar({ id: crypto.randomUUID(), nombre: nombre.trim(), fecha_limite: fecha, horas_estimadas: parseFloat(horas) });
    setNombre(''); setFecha(''); setHoras(''); setErrores({});
  };

  const campoClase = (campo) =>
    `border rounded-md px-2 py-1.5 text-sm outline-none ${errores[campo] ? 'border-brand' : 'border-gray-200 focus:border-brand'}`;

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="grid grid-cols-[1fr_140px_90px_auto] gap-2 items-start">
        <div>
          <input
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
            placeholder="Nombre de la gestión"
            className={`w-full ${campoClase('nombre')}`}
          />
          {errores.nombre && <p className="text-brand text-[11px] mt-0.5">{errores.nombre}</p>}
        </div>
        <div>
          <input
            type="date"
            value={fecha}
            onChange={(e) => { setFecha(e.target.value); setErrores((p) => ({ ...p, fecha: undefined })); }}
            className={`w-full ${campoClase('fecha')}`}
          />
          {errores.fecha && <p className="text-brand text-[11px] mt-0.5">{errores.fecha}</p>}
        </div>
        <div>
          <input
            type="number"
            value={horas}
            onChange={(e) => { setHoras(e.target.value); setErrores((p) => ({ ...p, horas: undefined })); }}
            placeholder="Horas"
            min="0"
            step="0.5"
            className={`w-full ${campoClase('horas')}`}
          />
          {errores.horas && <p className="text-brand text-[11px] mt-0.5">{errores.horas}</p>}
        </div>
        <button
          type="button"
          onClick={agregar}
          className="bg-gray-900 text-white text-sm font-medium rounded-md px-3 py-1.5 hover:bg-black h-fit"
        >
          Añadir
        </button>
      </div>
      <button
        type="button"
        onClick={onCancelar}
        className="text-gray-400 hover:text-gray-600 text-xs mt-2"
      >
        Cancelar
      </button>
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
      await createEvento({ ...state.values, subtareas: state.subtareas });
      setCreado(true);
    } catch {
      setErrorGeneral('No se pudo guardar el evento. Revisa tu conexión e intenta otra vez.');
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
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-md px-5 py-2.5"
          >
            Ver en Hoy
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto grid md:grid-cols-5 gap-6">

        {/* Columna izquierda: datos del evento */}
        <form onSubmit={enviar} className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4 h-fit">
          <h1 className="text-lg font-bold text-gray-900">Datos del evento</h1>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 font-medium">Nombre</span>
            <input {...campo('nombre')} placeholder="Boda Camila y Andrés"
              className={`rounded-md px-3 py-2 text-sm outline-none border ${state.errors.nombre ? 'border-brand' : 'border-gray-200 focus:border-brand'}`} />
            {state.errors.nombre && <span className="text-brand text-xs">{state.errors.nombre}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 font-medium">Tipo</span>
            <input {...campo('tipo')} placeholder="Social, corporativo..."
              className={`rounded-md px-3 py-2 text-sm outline-none border ${state.errors.tipo ? 'border-brand' : 'border-gray-200 focus:border-brand'}`} />
            {state.errors.tipo && <span className="text-brand text-xs">{state.errors.tipo}</span>}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 font-medium">Fecha</span>
            <input type="date" {...campo('fecha')}
              className={`rounded-md px-3 py-2 text-sm outline-none border ${state.errors.fecha ? 'border-brand' : 'border-gray-200 focus:border-brand'}`} />
            {state.errors.fecha && <span className="text-brand text-xs">{state.errors.fecha}</span>}
          </label>

          {errorGeneral && <p className="text-brand text-sm">{errorGeneral}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold rounded-md py-2.5 mt-2"
          >
            {enviando ? 'Guardando…' : 'Guardar evento'}
          </button>
        </form>

        {/* Columna derecha: tabla de gestiones logísticas */}
        <div className="md:col-span-3 bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Gestiones logísticas</h2>
          <p className="text-gray-500 text-xs mb-4">Agrega cada gestión con su fecha límite y horas estimadas.</p>

          {state.subtareas.length === 0 ? (
            <p className="text-gray-400 text-sm italic mb-3">Aún no has agregado ninguna gestión.</p>
          ) : (
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                  <th className="pb-2 font-medium">Gestión</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Horas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.subtareas.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">{s.nombre}</td>
                    <td className="py-2 text-gray-600">{s.fecha_limite}</td>
                    <td className="py-2 text-gray-600">{s.horas_estimadas}h</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'REMOVE_SUBTAREA', id: s.id })}
                        className="text-gray-300 hover:text-brand text-xs"
                      >
                        quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {mostrarFormGestion ? (
            <FilaNuevaGestion
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
              className="flex items-center gap-1.5 text-brand hover:text-brand-dark text-sm font-semibold"
            >
              <span className="text-lg leading-none">+</span> Agregar gestión logística
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default Crear;