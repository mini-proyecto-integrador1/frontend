import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarCheck, Gauge, LogOut } from 'lucide-react';
import { clearToken } from '../auth';
import { obtenerPerfil } from '../authService';
import { useLimite } from '../limiteContexto';
import ModalLimite from './ModalLimite';
import Aviso from './Aviso';

const enlaces = [
  { to: '/hoy', texto: 'Hoy' },
  { to: '/crear', texto: 'Crear evento' },
  { to: '/evento', texto: 'Mis eventos' },
  { to: '/progreso', texto: 'Progreso' },
];

function Encabezado() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const { limite } = useLimite();
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((perfil) => activo && setNombre(perfil.first_name || ''))
      .catch(() => {}); // Si falla, simplemente no se muestra el saludo.
    return () => {
      activo = false;
    };
  }, []);

  function cerrarSesion() {
    clearToken();
    navigate('/login', { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none
     focus-visible:ring-2 focus-visible:ring-gray-400 ${
       isActive ? 'bg-red-50 text-brand' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
     }`;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <NavLink to="/hoy" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
            <CalendarCheck size={20} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-gray-900">En Punto</span>
            <span className="block text-xs text-gray-500">Tus eventos, a tiempo</span>
          </span>
        </NavLink>

        <nav aria-label="Principal" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to} className={linkClass}>
              {e.texto}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Espacio reservado para el saludo: así no empuja los botones cuando termina de cargar */}
          <span className="hidden min-w-[7rem] text-right text-sm text-gray-600 lg:inline">
            {nombre ? `Hola, ${nombre}` : '\u00a0'}
          </span>
          {/* Límite diario siempre a la vista; clic para cambiarlo (Sprint 3 · C2) */}
          <button
            type="button"
            onClick={() => setEditandoLimite(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium
                       text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            <Gauge size={16} aria-hidden="true" />
            <span>
              Límite diario:{' '}
              <strong className="inline-block min-w-[2.25rem] text-left font-semibold text-gray-900">
                {limite ? `${limite} h` : '–'}
              </strong>
            </span>
          </button>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium
                       text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </div>
      <ModalLimite
        abierto={editandoLimite}
        onCerrar={() => setEditandoLimite(false)}
        onGuardado={(msg) => {
          setEditandoLimite(false);
          setAviso(msg);
          setTimeout(() => setAviso(''), 3500);
        }}
      />
      <Aviso texto={aviso} />
    </header>
  );
}

export default Encabezado;
