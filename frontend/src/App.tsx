import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Importar las páginas que ya tienes
import Inicio from "./inicio/Inicio";
import Client from "./layaut/Client";
import Admin from "./layaut/Admin";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import RegisterPage from "./page/RegisterPage";

export default function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Página principal/landing - HomePage */}
          <Route path="/" element={<HomePage />} />
          
          {/* Páginas de autenticación */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Tus páginas existentes */}
          <Route path="/client" element={<Client />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/inicio" element={<Inicio />} />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}