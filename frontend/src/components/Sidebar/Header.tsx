const Header= () => {
  return (

<header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-800">🚌 Transporte-SI2 • Operador</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="text-sm text-gray-600 hover:text-gray-800">
                Centro de ayuda
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                Nueva operación
              </button>
            </div>
          </div>
        </header>
          );
};

export default Header;