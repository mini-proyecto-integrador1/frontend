import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CalendarClock, X } from 'lucide-react';
import { getGestionesHoy } from '../hoyService';
import { getEventos } from '../eventoService';
import ModalReprogramar from '../components/ModalReprogramar';
import Aviso from '../components/Aviso';
import { useLimite } from '../limiteContexto';
import AyudaInfo from '../components/AyudaInfo';
import { diasSobrecargados } from '../sobrecargaUtils';
import {
  agruparGestiones,
  compararGestiones,
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

const GRUPO_HECHAS = {
  clave: 'hechas',
  titulo: 'Hechas',
  vacio: 'No tienes gestiones hechas.',
  borde: 'border-l-green-600',
  titulo_clase: 'text-green-800',
  contador: 'bg-green-100 text-green-800',
  plazo: 'text-green-700',
};

const ESTADOS_FILTRO = [
  { valor: '', texto: 'Por hacer (pendientes y pospuestas)' },
  { valor: 'pendiente', texto: 'Solo pendientes' },
  { valor: 'pospuesto', texto: 'Solo pospuestas' },
  { valor: 'hecho', texto: 'Solo hechas' },
];

const selectClase =
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ' +
  'hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200';

function Hoy() {
  const navigate = useNavigate();
  // Los filtros viven en la URL (/hoy?evento=3&estado=pendiente): se conservan al recargar.
  const [params, setParams] = useSearchParams();
  const filtroEvento = params.get('evento') || '';
  const filtroEstado = params.get('estado') || '';
  const hayFiltros = Boolean(filtroEvento || filtroEstado);

  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'listo' | 'error'
  const [gestiones, setGestiones] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [intento, setIntento] = useState(0);
  const [reprogramando, setReprogramando] = useState(null); // gestión abierta en el modal
  const [aviso, setAviso] = useState('');
  const { limite } = useLimite();

  // Opciones del filtro de evento.
  useEffect(() => {
    let activo = true;
    getEventos()
      .then((data) => activo && setEventos(Array.isArray(data) ? data : []))
      .catch(() => {}); // Si falla, el filtro por evento simplemente no se muestra.
    return () => {
      activo = false;
    };
  }, []);

  // Gestiones: el backend filtra (?evento, ?estado) y ya las devuelve ordenadas.
  useEffect(() => {
    let activo = true;
    getGestionesHoy({ evento: filtroEvento || undefined, estado: filtroEstado || undefined })
      .then((data) => {
        if (!activo) return;
        setGestiones(Array.isArray(data) ? data : []);
        setEstado('listo');
      })
      .catch((err) => {
        if (!activo) return;
        if (err.status === 401 || err.status === 403) return navigate('/login', { replace: true });
        setEstado('error');
      });
    return () => {
      activo = false;
    };
  }, [filtroEvento, filtroEstado, intento, navigate]);

  function cambiarFiltro(clave, valor) {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    setEstado('cargando');
    setParams(nuevos, { replace: true });
  }

  function limpiarFiltros() {
    setEstado('cargando');
    setParams({}, { replace: true });
  }

  function reintentar() {
    setEstado('cargando');
    setIntento((n) => n + 1);
  }

  const hoy = fechaLocalHoy();
  const soloHechas = filtroEstado === 'hecho';
  // Si se filtran las hechas, no tiene sentido hablar de "vencidas": van en una sola lista, con el mismo orden.
  const grupos = useMemo(() => {
    if (soloHechas) return { hechas: [...gestiones].sort(compararGestiones) };
    return agruparGestiones(gestiones, hoy);
  }, [gestiones, hoy, soloHechas]);
  const gruposVisibles = soloHechas ? [GRUPO_HECHAS] : GRUPOS;
  const total = gruposVisibles.reduce((n, g) => n + grupos[g.clave].length, 0);
  const nombreEvento = eventos.find((e) => String(e.id) === filtroEvento)?.nombre;
  const fechaDeEvento = (id) => eventos.find((e) => e.id === id)?.fecha;

  // Carga de hoy frente al límite (solo con la lista completa; con filtro de evento sería parcial).
  const horasHoy = gestiones
    .filter((g) => g.fecha_limite === hoy && g.estado !== 'hecho')
    .reduce((n, g) => n + (Number(g.horas_estimadas) || 0), 0);
  const mostrarCarga = Boolean(limite) && !filtroEvento && !soloHechas;
  const sobrecargaHoy = mostrarCarga && horasHoy > limite;

  // Días (hoy o después) que pasan del límite. Pasa sobre todo cuando el organizador baja su límite:
  // las gestiones ya planificadas no se mueven solas, así que se le muestra qué días resolver.
  // Solo con la lista completa (sin filtros); con filtros la suma sería parcial.
  const diasPasados = useMemo(
    () => (limite && !hayFiltros ? diasSobrecargados(gestiones, limite, hoy) : []),
    [gestiones, limite, hoy, hayFiltros]
  );
  const excesoDe = (fecha) => diasPasados.find((d) => d.fecha === fecha);

  function alReprogramar(_actualizada, mensaje) {
    setReprogramando(null);
    setAviso(mensaje);
    setTimeout(() => setAviso(''), 3500);
    setIntento((n) => n + 1); // recarga /hoy: la gestión cambia de grupo según su nueva fecha
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Hoy</h1>
        <p className="text-sm text-gray-500 mt-1">Lo que necesita tu atención, de lo más urgente a lo que puede esperar.</p>

        {/* Filtros (US-05). Solo si la persona tiene eventos. */}
        {eventos.length > 0 && estado !== 'error' && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="filtro-evento" className="block text-sm font-medium text-gray-700">
                  Evento
                </label>
                <select
                  id="filtro-evento"
                  value={filtroEvento}
                  onChange={(e) => cambiarFiltro('evento', e.target.value)}
                  className={selectClase}
                >
                  <option value="">Todos mis eventos</option>
                  {eventos.map((ev) => (
                    <option key={ev.id} value={String(ev.id)}>
                      {ev.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700">
                  Estado de la gestión
                </label>
                <select
                  id="filtro-estado"
                  value={filtroEstado}
                  onChange={(e) => cambiarFiltro('estado', e.target.value)}
                  className={selectClase}
                >
                  {ESTADOS_FILTRO.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hayFiltros && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-600" aria-live="polite">
                  {estado === 'listo'
                    ? `${total} ${total === 1 ? 'gestión' : 'gestiones'} con estos filtros`
                    : 'Aplicando filtros…'}
                </p>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium
                             text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <X size={14} aria-hidden="true" /> Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

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
          <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">No pudimos cargar tus gestiones.</p>
            <p className="mt-1 text-sm text-red-700">Revisa tu conexión e inténtalo de nuevo.</p>
            <button type="button" onClick={reintentar} className={`mt-4 ${botonClase}`}>
              Reintentar
            </button>
          </div>
        )}

        {/* Vacío por filtros: no es lo mismo que "no tienes gestiones" */}
        {estado === 'listo' && total === 0 && hayFiltros && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">No hay gestiones con estos filtros.</p>
            <p className="mt-1 text-sm text-gray-600">
              {nombreEvento ? `Prueba con otro estado o revisa todos tus eventos, no solo "${nombreEvento}".` : 'Prueba con otro estado.'}
            </p>
            <button type="button" onClick={limpiarFiltros} className={`mt-4 ${botonClase}`}>
              Limpiar filtros
            </button>
          </div>
        )}

        {estado === 'listo' && total === 0 && !hayFiltros && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">No tienes gestiones pendientes.</p>
            <p className="mt-1 text-sm text-gray-600">Crea un evento y agrega sus gestiones para verlas aquí.</p>
            <button type="button" onClick={() => navigate('/crear')} className={`mt-4 ${botonClase}`}>
              Crear evento
            </button>
          </div>
        )}
        {estado === 'listo' && total > 0 && (
          <>
            {/* Regla de priorización: etiqueta visible + detalle en el globo de ayuda */}
            <div className="mt-6">
              <AyudaInfo etiqueta="Ordenado por urgencia" titulo="Así se ordenan tus gestiones" lineas={REGLA_PRIORIDAD} />
            </div>

            {diasPasados.length > 0 && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle size={16} aria-hidden="true" />
                  {diasPasados.length === 1 ? 'Un día pasa' : `${diasPasados.length} días pasan`} de tu límite diario de{' '}
                  {formatearHoras(limite)} h
                </p>
                <ul className="mt-2 space-y-2">
                  {diasPasados.map((d) => (
                    <li key={d.fecha}>
                      <span>
                        <strong>{formatearFecha(d.fecha)}</strong>: {formatearHoras(d.horas)} h de {formatearHoras(limite)} h,
                        te pasas por {formatearHoras(d.exceso)} h.
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {d.gestiones.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setReprogramando(g)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs
                                       font-medium text-gray-800 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                          >
                            <CalendarClock size={13} aria-hidden="true" /> Reprogramar {g.nombre} ({formatearHoras(g.horas_estimadas)} h)
                          </button>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-red-800">
                  Mueve alguna gestión a otro día, baja sus horas en el evento o sube tu límite diario.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-8">
              {gruposVisibles.map((grupo) => {
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
                      {grupo.clave === 'hoy' && mostrarCarga && (
                        <span
                          className={`ml-auto text-sm ${sobrecargaHoy ? 'font-semibold text-red-800' : 'text-gray-600'}`}
                        >
                          {formatearHoras(horasHoy)} h de {formatearHoras(limite)} h
                          {sobrecargaHoy && ` · te pasas por ${formatearHoras(horasHoy - limite)} h`}
                        </span>
                      )}
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
                                {g.estado === 'hecho' && (
                                  <span className="ml-2 rounded bg-green-50 px-1.5 py-0.5 text-xs font-normal text-green-800">
                                    Hecha
                                  </span>
                                )}
                                {g.estado === 'pospuesto' && (
                                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">
                                    Pospuesta
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{g.evento_nombre}</p>
                              {g.estado !== 'hecho' && excesoDe(g.fecha_limite) && grupo.clave !== 'hoy' && (
                                <p className="mt-1 inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-800">
                                  <AlertTriangle size={12} aria-hidden="true" />
                                  Ese día: {formatearHoras(excesoDe(g.fecha_limite).horas)} h de {formatearHoras(limite)} h
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right text-sm">
                              <p className={`font-medium ${grupo.plazo}`}>
                                {g.estado === 'hecho' ? 'Terminada' : describirPlazo(g.fecha_limite, hoy)}
                              </p>
                              <p className="text-gray-500">
                                {formatearFecha(g.fecha_limite)} · {formatearHoras(g.horas_estimadas)} h
                              </p>
                              {g.estado !== 'hecho' && (
                                <button
                                  type="button"
                                  onClick={() => setReprogramando(g)}
                                  aria-label={`Reprogramar ${g.nombre}`}
                                  className="mt-2 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs
                                             font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                                >
                                  <CalendarClock size={14} aria-hidden="true" /> Reprogramar
                                </button>
                              )}
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
      <ModalReprogramar
        abierto={Boolean(reprogramando)}
        gestion={reprogramando}
        fechaEvento={reprogramando ? fechaDeEvento(reprogramando.evento_id) : undefined}
        onCerrar={() => setReprogramando(null)}
        onListo={alReprogramar}
      />
      <Aviso texto={aviso} />
    </div>
  );
}

export default Hoy;
