import { useState } from 'react';

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
    `w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors
     focus:outline-none focus:ring-4
     ${valor ? 'text-gray-900' : 'text-gray-400'}
     ${error
       ? 'border-brand focus:ring-red-100'
       : 'border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-gray-200'}`;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700">
        Fecha de nacimiento
        <span className="text-gray-400" aria-hidden="true"> *</span>
      </legend>

      <div className="mt-1 grid grid-cols-[1fr_1.7fr_1.1fr] gap-2">
        <select
          id={id}
          aria-label="Día"
          aria-invalid={Boolean(error)}
          className={claseSelect(dia)}
          value={dia}
          onChange={(e) => actualizar({ d: e.target.value })}
        >
          <option value="">Día</option>
          {dias.map((d) => (
            <option key={d} value={d} className="text-gray-900">{d}</option>
          ))}
        </select>

        <select
          aria-label="Mes"
          aria-invalid={Boolean(error)}
          className={claseSelect(mes)}
          value={mes}
          onChange={(e) => actualizar({ m: e.target.value })}
        >
          <option value="">Mes</option>
          {mesesValidos.map((m) => (
            <option key={m.numero} value={m.numero} className="text-gray-900">{m.nombre}</option>
          ))}
        </select>

        <select
          aria-label="Año"
          aria-invalid={Boolean(error)}
          className={claseSelect(anio)}
          value={anio}
          onChange={(e) => actualizar({ a: e.target.value })}
        >
          <option value="">Año</option>
          {anios.map((a) => (
            <option key={a} value={a} className="text-gray-900">{a}</option>
          ))}
        </select>
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