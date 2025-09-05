import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Tu logo/marca existente */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              🚌 Transporte-SI2
            </h1>
          </div>
          
          {/* Tu menú existente */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Tus enlaces existentes */}
          </div>

          {/* AGREGAR ESTOS BOTONES */}
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
              Registrar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;