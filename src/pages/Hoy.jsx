import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGestionesHoy } from '../hoyService';
import {
  agruparGestiones,
  describirPlazo,
  fechaLocalHoy,
  formatearFecha,
  formatearHoras,
} from '../hoyUtils';

// Regla de priorización visible para la persona usuaria (2-4 líneas). Debe coincidir con agruparGestiones().
const REGLA_PRIORIDAD = [
  'Primero ves lo vencido, luego lo que vence hoy y al final lo próximo.',
  'Dentro de cada grupo va primero lo que vence antes.',
  'Si vencen el mismo día, va primero lo que toma menos horas.',
];

// La urgencia no depende solo del color: cada grupo tiene título, contador y texto de plazo.
const GRUPOS = [
  {
    clave: 'vencidas',
    titulo: 'Vencidas',
    vacio: 'No tienes gestiones vencidas.',
    borde: 'border-l-red-600',
    titulo_clase: 'text-red-800',
    contador: 'bg-red-100 text-red-800',
    plazo: 'text-red-700',
  },
  {
    clave: 'hoy',
    titulo: 'Para hoy',
    vacio: 'No tienes gestiones para hoy.',
    borde: 'border-l-amber-500',
    titulo_clase: 'text-amber-800',
    contador: 'bg-amber-100 text-amber-900',
    plazo: 'text-amber-800',
  },
  {
    clave: 'proximas',
    titulo: 'Próximas',
    vacio: 'No tienes gestiones próximas.',
    borde: 'border-l-slate-400',
    titulo_clase: 'text-slate-700',
    contador: 'bg-slate-100 text-slate-700',
    plazo: 'text-gray-600',
  },
];

const botonClase =
  'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand';

function Hoy() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'listo' | 'error'
  const [gestiones, setGestiones] = useState([]);

  const cargar = useCallback(async () => {
    try {
      const data = await getGestionesHoy();
      setGestiones(Array.isArray(data) ? data : []);
      setEstado('listo');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/login');
        return;
      }
      setEstado('error');
    }
  }, [navigate]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function reintentar() {
    setEstado('cargando');
    cargar();
  }

  const hoy = fechaLocalHoy();
  const grupos = useMemo(() => agruparGestiones(gestiones), [gestiones]);
  const total = grupos.vencidas.length + grupos.hoy.length + grupos.proximas.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-brand">Hoy</h1>
        <p className="text-gray-500 mt-1">Gestiones urgentes del día</p>

        {estado === 'cargando' && (
          <div role="status" aria-live="polite" className="mt-8">
            <p className="text-sm text-gray-600">Cargando tus gestiones…</p>
            <div className="mt-4 space-y-3 animate-pulse" aria-hidden="true">
              <div className="h-16 rounded-lg bg-gray-200" />
              <div className="h-16 rounded-lg bg-gray-200" />
              <div className="h-16 rounded-lg bg-gray-200" />
            </div>
          </div>
        )}

        {estado === 'error' && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
          >
            <p className="font-medium text-red-800">No pudimos cargar tus gestiones.</p>
            <p className="mt-1 text-sm text-red-700">
              Revisa tu conexión e inténtalo de nuevo.
            </p>
            <button type="button" onClick={reintentar} className={`mt-4 ${botonClase}`}>
              Reintentar
            </button>
          </div>
        )}

        {estado === 'listo' && total === 0 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">No tienes gestiones pendientes.</p>
            <p className="mt-1 text-sm text-gray-600">
              Crea un evento y agrega sus gestiones para verlas aquí.
            </p>
            <button type="button" onClick={() => navigate('/crear')} className={`mt-4 ${botonClase}`}>
              Crear evento
            </button>
          </div>
        )}

        {estado === 'listo' && total > 0 && (
          <>
            <div
              role="note"
              aria-label="Cómo se ordenan las gestiones"
              className="mt-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 space-y-1"
            >
              {REGLA_PRIORIDAD.map((linea) => (
                <p key={linea}>{linea}</p>
              ))}
            </div>

            <div className="mt-6 space-y-8">
              {GRUPOS.map((grupo) => {
                const lista = grupos[grupo.clave];
                return (
                  <section key={grupo.clave} aria-labelledby={`grupo-${grupo.clave}`}>
                    <div className="flex items-center gap-2">
                      <h2
                        id={`grupo-${grupo.clave}`}
                        className={`text-lg font-semibold ${grupo.titulo_clase}`}
                      >
                        {grupo.titulo}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${grupo.contador}`}
                      >
                        {lista.length}
                      </span>
                    </div>

                    {lista.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">{grupo.vacio}</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {lista.map((g) => (
                          <li
                            key={g.id}
                            className={`flex items-start justify-between gap-4 rounded-lg border border-gray-200 border-l-4 ${grupo.borde} bg-white px-4 py-3`}
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {g.nombre}
                                {g.estado === 'pospuesto' && (
                                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">
                                    Pospuesta
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{g.evento_nombre}</p>
                            </div>
                            <div className="shrink-0 text-right text-sm">
                              <p className={`font-medium ${grupo.plazo}`}>
                                {describirPlazo(g.fecha_limite, hoy)}
                              </p>
                              <p className="text-gray-500">
                                {formatearFecha(g.fecha_limite)} · {formatearHoras(g.horas_estimadas)} h
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Hoy;
