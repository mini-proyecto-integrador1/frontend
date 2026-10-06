import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import Campo from '../components/Campo';
import { iniciarSesion } from '../authService';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await iniciarSesion(email, password);
      // Si llegó aquí porque intentó entrar a una ruta protegida, lo devolvemos a esa ruta.
      navigate(location.state?.desde || '/hoy', { replace: true });
    } catch (err) {
      if (err.tipo === 'credenciales') {
        setError('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.');
      } else if (err.tipo === 'servidor') {
        setError('No pudimos iniciar sesión por un problema del servidor. Inténtalo en unos minutos.');
      } else {
        setError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
      <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <Campo
          id="login-email"
          label="Correo electrónico"
          icono={Mail}
          type="email"
          autoComplete="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Campo
          id="login-password"
          label="Contraseña"
          icono={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="Ingresa aquí tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/20
                     hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
        >
          <LogIn size={18} aria-hidden="true" />
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </>
  );
}

export default Login;
