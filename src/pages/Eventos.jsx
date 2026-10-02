import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { getEventos } from '../eventoService';
import { formatearFecha } from '../hoyUtils';
import { calcularProgreso, describirCuentaRegresiva } from '../progresoUtils';
import BarraProgreso from '../components/BarraProgreso';

const botonPrimario =
  'inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand';

function Eventos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [estado, setEstado] = useState('cargando');
  const [eventos, setEventos] = useState([]);
  const [intento, setIntento] = useState(0);
  // Mensaje que deja el detalle al eliminar un evento ("Evento eliminado").
  const aviso = location.state?.aviso;

  useEffect(() => {
    let activo = true;
    getEventos()
      .then((data) => {
        if (!activo) return;
        setEventos(Array.isArray(data) ? data : []);
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
  }, [intento, navigate]);

  // Próximos primero; los que ya pasaron, al final.
  const ordenados = useMemo(
    () =>
      eventos
        .map((ev) => ({ ev, p: calcularProgreso(ev) }))
        .sort((a, b) => {
          const da = a.p.diasParaEvento;
          const db = b.p.diasParaEvento;
          if (da < 0 !== db < 0) return da < 0 ? 1 : -1;
          return da < 0 ? db - da : da - db;
        }),
    [eventos]
  );

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis eventos</h1>
            <p className="mt-1 text-sm text-gray-500">Abre un evento para editarlo o actualizar sus gestiones.</p>
          </div>
          {/* Solo cuando ya hay eventos; si no hay, el botón aparece en el centro del estado vacío */}
          {estado === 'listo' && eventos.length > 0 && (
            <button type="button" onClick={() => navigate('/crear')} className={botonPrimario}>
              <Plus size={16} aria-hidden="true" /> Crear evento
            </button>
          )}
        </header>

        {aviso && (
          <p role="status" className="mt-6 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {aviso}
          </p>
        )}

        {estado === 'cargando' && (
          <div role="status" aria-live="polite" className="mt-8">
            <p className="text-sm text-gray-600">Cargando tus eventos…</p>
            <div className="mt-4 space-y-3 animate-pulse" aria-hidden="true">
              <div className="h-24 rounded-xl bg-gray-200" />
              <div className="h-24 rounded-xl bg-gray-200" />
            </div>
          </div>
        )}

        {estado === 'error' && (
          <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">No pudimos cargar tus eventos.</p>
            <p className="mt-1 text-sm text-red-700">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => {
                setEstado('cargando');
                setIntento((n) => n + 1);
              }}
              className={`mt-4 ${botonPrimario}`}
            >
              Reintentar
            </button>
          </div>
        )}

        {estado === 'listo' && eventos.length === 0 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">Aún no tienes eventos.</p>
            <p className="mt-1 text-sm text-gray-600">Crea el primero y agrégale su plan logístico.</p>
            <button type="button" onClick={() => navigate('/crear')} className={`mt-4 ${botonPrimario}`}>
              <Plus size={16} aria-hidden="true" /> Crear evento
            </button>
          </div>
        )}

        {estado === 'listo' && eventos.length > 0 && (
          <ul className="mt-6 space-y-3">
            {ordenados.map(({ ev, p }) => (
              <li key={ev.id}>
                <Link
                  to={`/evento/${ev.id}`}
                  className={`group block rounded-xl border border-gray-200 bg-white p-5 transition-colors
                    hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
                    ${p.diasParaEvento < 0 ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-gray-900">{ev.nombre}</h2>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-500">
                        <CalendarDays size={15} aria-hidden="true" />
                        {formatearFecha(ev.fecha)} — {ev.tipo} — {describirCuentaRegresiva(p.diasParaEvento)}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-gray-400 group-hover:text-gray-700"
                    />
                  </div>

                  {p.total > 0 ? (
                    <div className="mt-4 flex items-center gap-3">
                      <BarraProgreso progreso={p} etiqueta={`Avance de ${ev.nombre}`} alto="h-2" />
                      <span className="shrink-0 text-xs text-gray-600">
                        {p.conteo.hecho}/{p.total} gestiones ({p.porcentaje}%)
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500">Sin gestiones logísticas.</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Eventos;
