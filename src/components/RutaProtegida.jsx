import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../auth';

// Solo deja pasar si hay sesión. Si no, manda a /login y recuerda a dónde quería ir.
export function RutaProtegida() {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  return <Outlet />;
}

// Para /login y /registro: si ya hay sesión, no tiene sentido mostrarlas.
export function RutaPublica() {
  if (isAuthenticated()) {
    return <Navigate to="/hoy" replace />;
  }
  return <Outlet />;
}
