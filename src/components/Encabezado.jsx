import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, CalendarDays, FolderOpen, Gauge, LogOut, PlusCircle } from 'lucide-react';
import { clearToken } from '../auth';
import { obtenerPerfil } from '../authService';
import { useLimite } from '../limiteContexto';
import ModalLimite from './ModalLimite';
import Aviso from './Aviso';

const enlaces = [
  { to: '/hoy', texto: 'Hoy', Icono: CalendarDays },
  { to: '/crear', texto: 'Crear evento', Icono: PlusCircle },
  { to: '/evento', texto: 'Mis eventos', Icono: FolderOpen },
  { to: '/progreso', texto: 'Progreso', Icono: BarChart3 },
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
    `flex items-center gap-2 rounded-lg px-3.5 py-2 text-[0.9375rem] font-semibold transition-all focus:outline-none
     focus-visible:ring-2 focus-visible:ring-gray-700 ${
       isActive
         ? 'bg-white text-red-800 shadow-sm ring-1 ring-gray-200'
         : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
     }`;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-x-6 xl:px-6">
        <NavLink to="/hoy" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
            <CalendarCheck size={20} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-gray-900">En Punto</span>
            <span className="block text-xs text-gray-500">Tus eventos, a tiempo</span>
          </span>
        </NavLink>

        <nav aria-label="Principal" className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 sm:order-none sm:mx-auto sm:w-auto sm:overflow-visible xl:mx-0">
          {enlaces.map(({ to, texto, Icono }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icono size={18} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:ml-0 xl:justify-self-end">
          {/* Límite diario siempre a la vista; clic para cambiarlo (Sprint 3 · C2) */}
          <button
            type="button"
            onClick={() => setEditandoLimite(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium
                       text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
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
                       text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
          >
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
          {/* Saludo con avatar (inicial del nombre). Se reserva el espacio para que no empuje los botones al cargar */}
          <div className="hidden items-center gap-2.5 border-l border-gray-200 pl-4 min-[1480px]:flex">
            {nombre && (
              <>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold uppercase text-red-800 ring-2 ring-white"
                >
                  {nombre.charAt(0)}
                </span>
                <span className="leading-tight">
                  <span className="block text-xs text-gray-600">Hola,</span>
                  <span className="block max-w-[6rem] truncate text-sm font-semibold capitalize text-gray-900">{nombre}</span>
                </span>
              </>
            )}
          </div>
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