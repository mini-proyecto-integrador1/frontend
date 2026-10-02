import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import AccesoLayout from '../components/AccesoLayout';
import Campo from '../components/Campo';
import { iniciarSesion, registrarse } from '../authService';

const VACIO = {
  first_name: '',
  last_name: '',
  email: '',
  fecha_nacimiento: '',
  password: '',
  confirmar: '',
};

// Requisito que se marca en verde cuando se cumple (texto + ícono, no solo color).
function Requisito({ cumple, children }) {
  return (
    <li className={`flex items-center gap-1.5 ${cumple ? 'text-green-700' : 'text-gray-500'}`}>
      {cumple ? <Check size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
      <span>{children}</span>
      <span className="sr-only">{cumple ? '(cumplido)' : '(pendiente)'}</span>
    </li>
  );
}

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

// Validación en el cliente: misma regla que el backend, para avisar antes de enviar.
function validar(v) {
  const errores = {};
  if (!v.first_name.trim()) errores.first_name = 'Escribe tu nombre.';
  else if (!SOLO_LETRAS.test(v.first_name)) errores.first_name = 'El nombre solo puede tener letras.';

  if (!v.last_name.trim()) errores.last_name = 'Escribe tu apellido.';
  else if (!SOLO_LETRAS.test(v.last_name)) errores.last_name = 'El apellido solo puede tener letras.';

  if (!v.email.trim()) errores.email = 'Escribe tu correo.';
  else if (!/^\S+@\S+\.\S+$/.test(v.email.trim()))
    errores.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';

  if (!v.fecha_nacimiento) errores.fecha_nacimiento = 'Escribe tu fecha de nacimiento.';

  if (!v.password) errores.password = 'Escribe una contraseña.';
  else if (v.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (/^\d+$/.test(v.password)) errores.password = 'La contraseña no puede tener solo números.';

  if (v.confirmar !== v.password) errores.confirmar = 'Las contraseñas no coinciden.';
  return errores;
}

function Registro() {
  const navigate = useNavigate();
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [loading, setLoading] = useState(false);

  function cambiar(e) {
    const { name, value } = e.target;
    setValores((prev) => ({ ...prev, [name]: value }));
    // El error del campo desaparece en cuanto la persona lo corrige.
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGeneral('');

    const encontrados = validar(valores);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setLoading(true);
    // eslint-disable-next-line no-unused-vars
    const { confirmar, ...datos } = valores;

    try {
      await registrarse(datos);
      // El registro no devuelve token, así que iniciamos sesión con los mismos datos.
      await iniciarSesion(datos.email, datos.password);
      navigate('/hoy', { replace: true });
    } catch (err) {
      if (err.tipo === 'validacion') {
        setErrores(err.campos);
        if (err.campos.non_field_errors) setErrorGeneral(err.campos.non_field_errors);
      } else if (err.tipo === 'servidor') {
        setErrorGeneral('No pudimos crear tu cuenta por un problema del servidor. Inténtalo en unos minutos.');
      } else {
        setErrorGeneral('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AccesoLayout titulo="Crea tu cuenta" subtitulo="Organiza tus eventos y su plan logístico en un solo lugar.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errorGeneral && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {errorGeneral}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            id="registro-nombre"
            name="first_name"
            label="Nombre"
            autoComplete="given-name"
            placeholder="Camila"
            ayuda="Solo letras."
            value={valores.first_name}
            onChange={cambiar}
            error={errores.first_name}
          />
          <Campo
            id="registro-apellido"
            name="last_name"
            label="Apellido"
            autoComplete="family-name"
            placeholder="Rojas"
            ayuda="Solo letras."
            value={valores.last_name}
            onChange={cambiar}
            error={errores.last_name}
          />
        </div>

        <Campo
          id="registro-email"
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="camila@correo.com"
          ayuda="Lo usarás para iniciar sesión."
          value={valores.email}
          onChange={cambiar}
          error={errores.email}
        />

        <Campo
          id="registro-nacimiento"
          name="fecha_nacimiento"
          label="Fecha de nacimiento"
          type="date"
          autoComplete="bday"
          value={valores.fecha_nacimiento}
          onChange={cambiar}
          error={errores.fecha_nacimiento}
        />

        <Campo
          id="registro-password"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={valores.password}
          onChange={cambiar}
          error={errores.password}
        >
          <ul className="space-y-0.5" aria-label="Requisitos de la contraseña">
            <Requisito cumple={valores.password.length >= 8}>Al menos 8 caracteres</Requisito>
            <Requisito cumple={valores.password !== '' && !/^\d+$/.test(valores.password)}>
              No solo números
            </Requisito>
          </ul>
        </Campo>

        <Campo
          id="registro-confirmar"
          name="confirmar"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={valores.confirmar}
          onChange={cambiar}
          error={errores.confirmar}
        >
          {valores.confirmar && !errores.confirmar && (
            <ul>
              <Requisito cumple={valores.confirmar === valores.password}>
                {valores.confirmar === valores.password ? 'Las contraseñas coinciden' : 'Aún no coinciden'}
              </Requisito>
            </ul>
          )}
        </Campo>

        <p className="text-xs text-gray-500">
          Los campos con * son obligatorios.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white
                     hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
        >
          {loading ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AccesoLayout>
  );
}

export default Registro;
