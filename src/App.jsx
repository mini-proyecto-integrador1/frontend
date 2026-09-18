import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Hoy from './pages/Hoy';
import Crear from './pages/Crear';
import Evento from './pages/Evento';
import Progreso from './pages/Progreso';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/hoy">Hoy</Link> | <Link to="/crear">Crear</Link> |{' '}
        <Link to="/progreso">Progreso</Link> | <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/hoy" element={<Hoy />} />
        <Route path="/crear" element={<Crear />} />
        <Route path="/evento/:id" element={<Evento />} />
        <Route path="/progreso" element={<Progreso />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;