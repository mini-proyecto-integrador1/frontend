import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { getEventos } from '../eventoService';
import { describirPlazo, formatearFecha, formatearHoras } from '../hoyUtils';
import { calcularProgreso, describirCuentaRegresiva, SEGMENTOS } from '../progresoUtils';
import BarraProgreso from '../components/BarraProgreso';

const botonPrimario =
  'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand';

function TarjetaEvento({ evento }) {
  const p = useMemo(() => calcularProgreso(evento), [evento]);
  const yaPaso = p.diasParaEvento < 0;
  const completo = p.total > 0 && p.conteo.hecho === p.total;

  return (
    <article className={`rounded-xl border bg-white p-5 ${yaPaso ? 'border-gray-200 opacity-75' : 'border-gray-200'}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{evento.nombre}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays size={15} aria-hidden="true" />
            {formatearFecha(evento.fecha)} — {evento.tipo}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            p.diasParaEvento >= 0 && p.diasParaEvento <= 3 ? 'bg-red-50 text-red-800' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {describirCuentaRegresiva(p.diasParaEvento)}
        </span>
      </header>

      {p.total === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Este evento todavía no tiene gestiones logísticas.</p>
      ) : (
        <>
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-gray-900">
              {p.porcentaje}%<span className="ml-1.5 text-sm font-medium text-gray-500">hecho</span>
            </p>
            <p className="text-sm text-gray-500">
              {formatearHoras(p.horasHechas)} de {formatearHoras(p.horasTotales)} h
            </p>
          </div>

          <div className="mt-2">
            <BarraProgreso progreso={p} etiqueta={`Avance de ${evento.nombre}`} />
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {SEGMENTOS.map((s) => (
              <li key={s.clave} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.punto}`} aria-hidden="true" />
                {s.nombre}: <strong className="font-semibold text-gray-900">{p.conteo[s.clave]}</strong>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            {completo && (
              <p className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={16} aria-hidden="true" /> Todas las gestiones están hechas.
              </p>
            )}
            {p.vencidas > 0 && (
              <p className="flex items-center gap-2 text-red-800">
                <AlertTriangle size={16} aria-hidden="true" />
                {p.vencidas === 1 ? '1 gestión vencida' : `${p.vencidas} gestiones vencidas`} sin terminar
              </p>
            )}
            {p.siguiente && (
              <p className="flex items-center gap-2 text-gray-700">
                <Clock size={16} aria-hidden="true" />
                <span>
                  Sigue: <strong className="font-semibold text-gray-900">{p.siguiente.nombre}</strong>
                  <span className="text-gray-500"> ({describirPlazo(p.siguiente.fecha_limite).toLowerCase()})</span>
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function Progreso() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'listo' | 'error'
  const [eventos, setEventos] = useState([]);
  const [intento, setIntento] = useState(0);

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
        if (err.status === 401 || err.status === 403) {
          navigate('/login', { replace: true });
          return;
        }
        setEstado('error');
      });
    return () => {
      activo = false;
    };
  }, [intento, navigate]);

  // Próximos primero (el más cercano arriba); los que ya pasaron, al final.
  const ordenados = useMemo(() => {
    const copia = [...eventos];
    return copia.sort((a, b) => {
      const pa = calcularProgreso(a).diasParaEvento;
      const pb = calcularProgreso(b).diasParaEvento;
      if (pa < 0 !== pb < 0) return pa < 0 ? 1 : -1;
      return pa < 0 ? pb - pa : pa - pb;
    });
  }, [eventos]);

  const resumen = useMemo(() => {
    let hechas = 0;
    let total = 0;
    for (const ev of eventos) {
      const p = calcularProgreso(ev);
      hechas += p.conteo.hecho;
      total += p.total;
    }
    return { hechas, total };
  }, [eventos]);

  function reintentar() {
    setEstado('cargando');
    setIntento((n) => n + 1);
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progreso</h1>
            <p className="mt-1 text-sm text-gray-500">Cómo vas con la logística de cada evento.</p>
          </div>
          {estado === 'listo' && resumen.total > 0 && (
            <p className="text-sm text-gray-600">
              <strong className="font-semibold text-gray-900">{resumen.hechas}</strong> de {resumen.total} gestiones
              hechas en total
            </p>
          )}
        </header>

        {estado === 'cargando' && (
          <div role="status" aria-live="polite" className="mt-8">
            <p className="text-sm text-gray-600">Cargando tu progreso…</p>
            <div className="mt-4 space-y-4 animate-pulse" aria-hidden="true">
              <div className="h-40 rounded-xl bg-gray-200" />
              <div className="h-40 rounded-xl bg-gray-200" />
            </div>
          </div>
        )}

        {estado === 'error' && (
          <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-800">No pudimos cargar tu progreso.</p>
            <p className="mt-1 text-sm text-red-700">Revisa tu conexión e inténtalo de nuevo.</p>
            <button type="button" onClick={reintentar} className={`mt-4 ${botonPrimario}`}>
              Reintentar
            </button>
          </div>
        )}

        {estado === 'listo' && eventos.length === 0 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-medium text-gray-900">Aún no tienes eventos.</p>
            <p className="mt-1 text-sm text-gray-600">Crea tu primer evento para seguir aquí su avance.</p>
            <button type="button" onClick={() => navigate('/crear')} className={`mt-4 ${botonPrimario}`}>
              Crear evento
            </button>
          </div>
        )}

        {estado === 'listo' && eventos.length > 0 && (
          <div className="mt-6 space-y-4">
            {ordenados.map((ev) => (
              <TarjetaEvento key={ev.id} evento={ev} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Progreso;
