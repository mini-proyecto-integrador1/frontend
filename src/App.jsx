import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Hoy from './pages/Hoy';
import Crear from './pages/Crear';
import Evento from './pages/Evento';
import Progreso from './pages/Progreso';
import Login from './pages/Login';

function App() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const linkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  const links = (
    <>
      <NavLink to="/hoy" className={linkClass} onClick={() => setMenuAbierto(false)}>Hoy</NavLink>
      <NavLink to="/crear" className={linkClass} onClick={() => setMenuAbierto(false)}>Crear</NavLink>
      <NavLink to="/progreso" className={linkClass} onClick={() => setMenuAbierto(false)}>Progreso</NavLink>
      <NavLink to="/login" className={linkClass} onClick={() => setMenuAbierto(false)}>Login</NavLink>
      {/* ⚠️ Temporal, solo para verificar que los eventos se guardan bien. */}
      <NavLink to="/evento" className={linkClass} onClick={() => setMenuAbierto(false)}>Ver eventos (temp)</NavLink>
    </>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <span className="text-brand font-extrabold text-xl tracking-tight">
              EventoYa
            </span>

            {/* Menú normal en pantallas medianas/grandes */}
            <div className="hidden md:flex gap-2">{links}</div>

            {/* Botón hamburguesa solo en móvil */}
            <button
              className="md:hidden text-gray-700 p-2"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Abrir menú"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* Menú desplegable en móvil */}
          {menuAbierto && (
            <div className="md:hidden flex flex-col gap-1 px-4 pb-3">{links}</div>
          )}
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