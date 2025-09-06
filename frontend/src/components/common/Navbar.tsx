import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bus, Ticket, Package, Map, Users } from "lucide-react";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center px-10 py-6 shadow-md bg-white sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Bus className="w-7 h-7" /> Transporte
        </h1>
        <nav className="space-x-6 hidden md:flex">
          <a href="#servicios" className="hover:text-blue-600">Servicios</a>
          <a href="#rutas" className="hover:text-blue-600">Rutas</a>
          <a href="#choferes" className="hover:text-blue-600">Choferes</a>
          <a href="#contacto" className="hover:text-blue-600">Contacto</a>
        </nav>
        <div className="flex items-center space-x-4">
            <Link 
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link 
              to="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Cuenta
            </Link>
          </div>
      </header>
    
  );
};

export default Navbar;


