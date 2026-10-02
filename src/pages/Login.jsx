import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, setToken } from '../auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El backend usa el correo como "username".
        body: JSON.stringify({ username: email.trim(), password }),
      });

      if (response.status === 400 || response.status === 401) {
        setError('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.');
        return;
      }
      if (!response.ok) {
        setError('No pudimos iniciar sesión por un problema del servidor. Inténtalo en unos minutos.');
        return;
      }

      const data = await response.json();
      setToken(data.token);
      navigate('/hoy');
    } catch {
      setError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-brand">Iniciar sesión</h1>
        <p className="text-gray-500 mt-1">Entra para ver tus gestiones del día.</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white border border-gray-200 rounded-xl p-6 space-y-4"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white
                       hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
