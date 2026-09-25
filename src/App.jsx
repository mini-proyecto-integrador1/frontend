import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Hoy from './pages/Hoy';
import Crear from './pages/Crear';
import Evento from './pages/Evento';
import Progreso from './pages/Progreso';
import Login from './pages/Login';

function App() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="flex gap-2 px-6 py-4 border-b border-gray-200 bg-white">
          <NavLink to="/hoy" className={linkClass}>Hoy</NavLink>
          <NavLink to="/crear" className={linkClass}>Crear</NavLink>
          <NavLink to="/progreso" className={linkClass}>Progreso</NavLink>
          <NavLink to="/login" className={linkClass}>Login</NavLink>

          {/* ⚠️ Temporal, solo para verificar que los eventos se guardan bien.
              Quitar este link cuando "Hoy" ya muestre los eventos reales (Sprint 2). */}
          <NavLink to="/evento" className={linkClass}>Ver eventos</NavLink>
        </nav>

        <Routes>
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/evento" element={<Evento />} />
          <Route path="/evento/:id" element={<Evento />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;