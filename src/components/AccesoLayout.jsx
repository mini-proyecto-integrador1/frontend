import { Link, Outlet, useLocation } from 'react-router-dom';
import { CalendarCheck, User, UserPlus } from 'lucide-react';
import AlturaAnimada from './AlturaAnimada';
import fondo from '../assets/inicio-bienvenida.webp';

// Inicio de sesión y registro.
// Pantallas anchas (≥1280 px y apaisadas): la imagen de bienvenida ocupa todo el fondo (marca, saludo e ilustración están en
// la imagen) y la tarjeta del formulario va en la zona libre de la derecha.
// Celular, tableta y pantallas angostas o muy altas: la imagen se recortaría y su texto no se leería, así que se muestra una
// cabecera compacta hecha en código y el formulario debajo.
function AccesoLayout() {
  const { pathname } = useLocation();
  const esRegistro = pathname === '/registro';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf3f2]">
      {/* Fondo: imagen en pantallas grandes, degradado suave en pantallas pequeñas */}
      <img
        src={fondo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-left ancho:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-red-200/60 to-transparent ancho:hidden"
      />

      <div className="relative z-10 mx-auto min-h-screen max-w-md px-4 py-10 sm:px-0 ancho:max-w-none ancho:p-0">
        {/* El texto de la imagen, disponible para lectores de pantalla */}
        <h1 className="sr-only">
          En Punto. {esRegistro ? 'Crea tu cuenta.' : 'Bienvenido de nuevo.'} Organiza tus eventos y su plan logístico.
        </h1>

        {/* Cabecera compacta solo en pantallas pequeñas */}
        <div className="mb-8 ancho:hidden" aria-hidden="true">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-red-600/30">
              <CalendarCheck size={26} />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-bold text-gray-900">En Punto</span>
              <span className="block text-sm text-gray-500">Tus eventos, a tiempo</span>
            </span>
          </div>
          <p className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            {esRegistro ? (
              <>
                Crea tu <span className="text-brand">cuenta</span>
              </>
            ) : (
              <>
                Bienvenido <span className="text-brand">de nuevo</span>
              </>
            )}
          </p>
        </div>

        {/* Tarjeta del formulario (columna derecha en pantallas grandes) */}
        <section className="tarjeta-acceso w-full">
          <div className="relative mx-auto rounded-3xl bg-white p-8 shadow-2xl shadow-red-900/10 sm:p-10 ancho:px-12 ancho:py-11">
            <span className="absolute inset-y-6 -left-1.5 w-1.5 rounded-l-full bg-red-300" aria-hidden="true" />
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-brand">
                {esRegistro ? <UserPlus size={28} aria-hidden="true" /> : <User size={28} aria-hidden="true" />}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">{esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {esRegistro ? 'Solo te tomará un minuto.' : 'Ingresa con tu correo y contraseña para continuar.'}
              </p>
            </div>

            <div className="mt-7">
              <AlturaAnimada>
                <Outlet />
              </AlturaAnimada>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
              <span>
                {esRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
                <Link
                  to={esRegistro ? '/login' : '/registro'}
                  className="rounded font-semibold text-brand hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  {esRegistro ? 'Inicia sesión' : 'Crea una'}
                </Link>
              </span>
              <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AccesoLayout;
