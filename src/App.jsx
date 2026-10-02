import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Hoy from './pages/Hoy';
import Crear from './pages/Crear';
import Eventos from './pages/Eventos';
import EventoDetalle from './pages/EventoDetalle';
import Progreso from './pages/Progreso';
import Login from './pages/Login';
import Registro from './pages/Registro';
import { RutaProtegida, RutaPublica } from './components/RutaProtegida';
import Encabezado from './components/Encabezado';

// Encabezado + contenido. Solo se muestra cuando hay sesión.
function LayoutPrivado() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Encabezado />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas: si ya hay sesión, mandan a /hoy */}
        <Route element={<RutaPublica />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        {/* Protegidas: sin sesión, mandan a /login */}
        <Route element={<RutaProtegida />}>
          <Route element={<LayoutPrivado />}>
            <Route path="/hoy" element={<Hoy />} />
            <Route path="/crear" element={<Crear />} />
            <Route path="/evento" element={<Eventos />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />
            <Route path="/progreso" element={<Progreso />} />
          </Route>
        </Route>

        {/* La raíz y cualquier ruta desconocida van a /hoy (que a su vez pide login si hace falta) */}
        <Route path="*" element={<Navigate to="/hoy" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
