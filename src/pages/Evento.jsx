import { useEffect, useState } from 'react';
import { getEventos } from '../eventoService';

// ⚠️ Versión temporal solo para VERIFICAR que los eventos se están guardando.
// La lógica real de /evento/:id (detalle de un solo evento por su id, editar,
// reprogramar subtareas) llega en sprints posteriores.
function Evento() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getEventos().then((data) => {
      setEventos(data);
      setCargando(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Eventos guardados</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6 italic">
          Vista temporal de verificación — el detalle real de un evento por su id llega más adelante.
        </p>

        {cargando && <p className="text-gray-400 text-sm">Cargando eventos...</p>}

        {!cargando && eventos.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm">Aún no has creado ningún evento.</p>
          </div>
        )}

        {!cargando && eventos.length > 0 && (
          <div className="flex flex-col gap-4">
            {eventos.map((ev) => (
              <div key={ev.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{ev.nombre}</h2>
                  <span className="text-xs text-gray-400">id: {ev.id}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tipo: {ev.tipo} · Fecha: {ev.fecha}</p>

                <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                  Gestiones logísticas ({ev.subtareas?.length || 0})
                </h3>
                {ev.subtareas?.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {ev.subtareas.map((s, i) => (
                      <li key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm flex justify-between">
                        <span className="font-medium text-gray-800">{s.nombre}</span>
                        <span className="text-gray-500">{s.fecha_limite} · {s.horas_estimadas}h</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm italic">Sin gestiones agregadas.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Evento;