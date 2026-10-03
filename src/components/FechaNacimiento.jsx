import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ANIO_MIN = 1920;
const EDAD_MIN = 10;

// Fecha más reciente permitida: hoy hace EDAD_MIN años.
const hoy = new Date();
const LIMITE = {
  anio: hoy.getFullYear() - EDAD_MIN,
  mes: hoy.getMonth() + 1,
  dia: hoy.getDate(),
};

// Días que tiene un mes (mes de 1 a 12). Sin mes, 31; sin año, febrero admite 29.
function diasDelMes(mes, anio) {
  if (!mes) return 31;
  return new Date(anio || 2000, mes, 0).getDate();
}

// Máximo día elegible según mes, año y el límite de edad.
function maxDiaPermitido(mes, anio) {
  let max = diasDelMes(mes, anio);
  if (anio === LIMITE.anio && mes === LIMITE.mes) max = Math.min(max, LIMITE.dia);
  return max;
}

// Lista desplegable propia: el menú muestra máximo 9 filas y el resto se recorre con scroll.
const ALTO_FILA = 36; // equivale a h-9
const FILAS_VISIBLES = 9;
const ALTO_MENU = ALTO_FILA * FILAS_VISIBLES + 10; // + padding y borde del menú

function ListaDesplegable({ id, ariaLabel, placeholder, value, opciones, onSelect, clase, error }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState(null);
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  const seleccionada = opciones.find((o) => String(o.valor) === String(value));

  function abrir() {
    const r = botonRef.current.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - r.bottom - 12;
    const haciaArriba = espacioAbajo < ALTO_MENU && r.top > espacioAbajo;
    const espacio = haciaArriba ? r.top - 12 : espacioAbajo;
    setPosicion({
      left: r.left,
      width: r.width,
      top: haciaArriba ? undefined : r.bottom + 4,
      bottom: haciaArriba ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(120, Math.min(ALTO_MENU, espacio)),
    });
    setAbierto(true);
  }

  function cerrar(devolverFoco = false) {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  }

  useEffect(() => {
    if (!abierto) return undefined;
    const menu = menuRef.current;
    const elegida = menu.querySelector('[aria-selected="true"]');
    if (elegida) menu.scrollTop = elegida.offsetTop - menu.clientHeight / 2 + elegida.clientHeight / 2;
    (elegida || menu.querySelector('[role="option"]'))?.focus({ preventScroll: true });

    function alHacerClicFuera(e) {
      if (!menu.contains(e.target) && !botonRef.current.contains(e.target)) setAbierto(false);
    }
    function alHacerScroll(e) {
      if (!menu.contains(e.target)) setAbierto(false);
    }
    function alCambiarTamano() {
      setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClicFuera);
    window.addEventListener('scroll', alHacerScroll, true);
    window.addEventListener('resize', alCambiarTamano);
    return () => {
      document.removeEventListener('mousedown', alHacerClicFuera);
      window.removeEventListener('scroll', alHacerScroll, true);
      window.removeEventListener('resize', alCambiarTamano);
    };
  }, [abierto]);

  function alPresionarEnMenu(e) {
    const filas = Array.from(menuRef.current.querySelectorAll('[role="option"]'));
    const i = filas.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      filas[Math.min(i + 1, filas.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      filas[Math.max(i - 1, 0)]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cerrar(true);
    } else if (e.key === 'Tab') {
      setAbierto(false);
    }
  }

  return (
    <>
      <button
        ref={botonRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-invalid={Boolean(error)}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(e) => {
          if (!abierto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            abrir();
          }
        }}
        className={`${clase} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{seleccionada ? seleccionada.texto : placeholder}</span>
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {abierto &&
        posicion &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            onKeyDown={alPresionarEnMenu}
            style={{
              position: 'fixed',
              left: posicion.left,
              width: posicion.width,
              top: posicion.top,
              bottom: posicion.bottom,
              maxHeight: posicion.maxHeight,
              zIndex: 50,
            }}
            className="overflow-y-auto rounded-xl border border-[#99D5C9] bg-white p-1 shadow-xl shadow-gray-900/10"
          >
            {opciones.map((o) => {
              const activa = String(o.valor) === String(value);
              return (
                <button
                  key={o.valor}
                  type="button"
                  role="option"
                  aria-selected={activa}
                  onClick={() => {
                    onSelect(String(o.valor));
                    cerrar(true);
                  }}
                  className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-sm focus:outline-none ${
                    activa
                      ? 'bg-[#99D5C9]/30 font-medium text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                  }`}
                >
                  {o.texto}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

function FechaNacimiento({ id, name, value, onChange, error }) {
  const [a0 = '', m0 = '', d0 = ''] = value ? value.split('-') : [];
  const [dia, setDia] = useState(d0 ? String(Number(d0)) : '');
  const [mes, setMes] = useState(m0 ? String(Number(m0)) : '');
  const [anio, setAnio] = useState(a0);

  const anios = [];
  for (let a = LIMITE.anio; a >= ANIO_MIN; a--) anios.push(a);

  const mesesValidos = MESES.map((nombre, i) => ({ nombre, numero: i + 1 }))
    .filter((m) => Number(anio) !== LIMITE.anio || m.numero <= LIMITE.mes);

  const maxDia = maxDiaPermitido(Number(mes), Number(anio));
  const dias = Array.from({ length: maxDia }, (_, i) => i + 1);

  function actualizar(cambio) {
    let { d, m, a } = { d: dia, m: mes, a: anio, ...cambio };

    // Si lo ya elegido deja de ser válido, esa lista se vacía.
    if (a && m && Number(a) === LIMITE.anio && Number(m) > LIMITE.mes) m = '';
    if (d && Number(d) > maxDiaPermitido(Number(m), Number(a))) d = '';

    setDia(d);
    setMes(m);
    setAnio(a);

    const completa = d && m && a;
    const fecha = completa
      ? `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      : '';
    onChange({ target: { name, value: fecha } });
  }

  const claseSelect = (valor) =>
    `w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors
     focus:outline-none focus:ring-4
     ${valor ? 'text-gray-900' : 'text-gray-400'}
     ${error
       ? 'border-brand focus:ring-red-100'
       : 'border-[#99D5C9] hover:border-[#7cc4b5] focus:border-[#99D5C9] focus:ring-[#99D5C9]/30'}`;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700">
        Fecha de nacimiento
        <span className="text-gray-400" aria-hidden="true"> *</span>
      </legend>

      <div className="mt-1 grid grid-cols-[1fr_1.7fr_1.1fr] gap-2">
        <ListaDesplegable
          id={id}
          ariaLabel="Día"
          placeholder="Día"
          value={dia}
          opciones={dias.map((d) => ({ valor: d, texto: String(d) }))}
          onSelect={(v) => actualizar({ d: v })}
          clase={claseSelect(dia)}
          error={error}
        />

        <ListaDesplegable
          ariaLabel="Mes"
          placeholder="Mes"
          value={mes}
          opciones={mesesValidos.map((m) => ({ valor: m.numero, texto: m.nombre }))}
          onSelect={(v) => actualizar({ m: v })}
          clase={claseSelect(mes)}
          error={error}
        />

        <ListaDesplegable
          ariaLabel="Año"
          placeholder="Año"
          value={anio}
          opciones={anios.map((a) => ({ valor: a, texto: String(a) }))}
          onSelect={(v) => actualizar({ a: v })}
          clase={claseSelect(anio)}
          error={error}
        />

      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-brand">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default FechaNacimiento;