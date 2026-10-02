import { NavLink } from 'react-router-dom';

// Contenedor compartido por Login y Registro: título, subtítulo y selector entre las dos opciones.
function AccesoLayout({ titulo, subtitulo, children }) {
  const pestanaClase = ({ isActive }) =>
    `flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors
     focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
       isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
     }`;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <p className="text-center text-sm font-semibold text-brand">En Punto</p>
        <h1 className="mt-2 text-center text-3xl font-bold text-gray-900">{titulo}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">{subtitulo}</p>

        <nav aria-label="Elegir cómo entrar" className="mt-8 flex gap-1 rounded-lg bg-gray-100 p-1">
          <NavLink to="/login" className={pestanaClase}>
            Iniciar sesión
          </NavLink>
          <NavLink to="/registro" className={pestanaClase}>
            Crear cuenta
          </NavLink>
        </nav>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">{children}</div>
      </div>
    </div>
  );
}

export default AccesoLayout;
