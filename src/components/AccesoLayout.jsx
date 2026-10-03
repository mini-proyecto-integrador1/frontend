import { NavLink } from 'react-router-dom';

// Contenedor compartido por Login y Registro:
// título, subtítulo, selector entre las dos opciones y tarjeta del formulario.
function AccesoLayout({ titulo, subtitulo, children }) {
  const pestanaClase = ({ isActive }) =>
    `flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-medium
     transition-all duration-300
     focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
       isActive
         ? 'bg-white text-gray-900 shadow-md shadow-gray-900/5'
         : 'text-gray-500 hover:text-gray-900'
     }`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-12">

      {/* =========================================================
          FONDO DECORATIVO
          ========================================================= */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >

        {/* Blob principal superior izquierdo */}
        <div
          className="
            absolute -left-40 -top-40
            h-[450px] w-[450px]
            rounded-full
            bg-brand/42
            blur-3xl
          "
        />

        {/* Blob superior derecho */}
        <div
          className="
            absolute -right-40 top-10
            h-[420px] w-[420px]
            rounded-full
            bg-purple-400/45
            blur-3xl
          "
        />

        {/* Halo detrás del formulario */}
        <div
          className="
            absolute left-1/2 top-1/2
            h-[500px] w-[500px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-brand/5
            blur-3xl
          "
        />

        {/* =====================================================
            FIGURAS FLOTANTES
            ===================================================== */}

        {/* Círculo pequeño */}
        <div
          className="
            float-organic
            absolute left-[12%] top-[28%]
            h-3 w-3
            rounded-full
            bg-brand/40
          "
        />
        {/* Círculo grande inferior */}
        <div
          className="
            float-organic
            absolute left-[80%] top-[88%]
            h-7 w-7
            rounded-full
            bg-brand/40
          "
          style={{ animationDelay: '2s' }}
        />

        {/* Círculo gigante */}
        <div
          className="
            float-organic
            absolute left-[18%] top-[16%]
            h-10 w-10
            rounded-full
            bg-brand/60
          "
          style={{ animationDelay: '4s' }}
        />

        {/* Círculo pequeño derecho */}
        <div
          className="
            float-organic
            absolute right-[15%] top-[42%]
            h-4 w-4
            rounded-full
            bg-purple-400/60
          "
          style={{ animationDelay: '1.5s' }}
        />

        {/* Círculo inferior */}
        <div
          className="
            float-organic
            absolute bottom-[18%] left-[20%]
            h-2 w-2
            rounded-full
            bg-brand/40
          "
          style={{ animationDelay: '3s' }}
        />

        {/* Pequeño cuadrado rotado */}
        <div
          className="
            float-organic
            absolute right-[20%] top-[55%]
            h-5 w-5
            rounded-md
            border-2
            border-brand/20
          "
          style={{ animationDelay: '9s' }}
        />

        {/* circulo geométrico abajo del formulario */}
        <div
          className="
            float-organic
            absolute bottom-[18%] right-[40%]
            h-6 w-6
            rotate-12
            rounded-full
            border
            border-purple-400/48
          "
          
        />
      </div>


      {/* =========================================================
          CONTENIDO PRINCIPAL
          ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-md">

        {/* Marca */}
        <p className="text-center text-sm font-semibold tracking-wide text-brand">
          En Punto
        </p>

        {/* Título */}
        <h1
          className="
            mt-2
            text-center
            text-3xl
            font-bold
            tracking-tight
            text-gray-900
          "
        >
          {titulo}
        </h1>

        {/* Subtítulo */}
        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
          {subtitulo}
        </p>


        {/* =======================================================
            SELECTOR LOGIN / REGISTRO
            ======================================================= */}
        <nav
          aria-label="Elegir cómo entrar"
          className="
            mt-8
            flex
            gap-1
            rounded-xl
            border
            border-gray-200/80
            bg-gray-100/70
            p-1
            backdrop-blur-md
          "
        >
          <NavLink to="/login" className={pestanaClase}>
            Iniciar sesión
          </NavLink>

          <NavLink to="/registro" className={pestanaClase}>
            Crear cuenta
          </NavLink>
        </nav>


        {/* =======================================================
            TARJETA DEL FORMULARIO
            ======================================================= */}
        <div
          className="
            mt-5
            rounded-2xl
            border
            border-white/70
            bg-white/80
            p-7
            shadow-xl
            shadow-gray-900/5
            backdrop-blur-xl
          "
        >
          {children}
        </div>

      </div>
    </div>
  );
}

export default AccesoLayout;


