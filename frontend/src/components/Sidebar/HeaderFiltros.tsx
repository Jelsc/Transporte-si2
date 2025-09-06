import { 
  BarChart3, 
  Users, 
  Truck, 
  MapPin, 
  Settings,
  HelpCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Copy,
  Move,
  X
} from 'lucide-react';
const HeaderFiltros= () => {
  return (
<div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Rutas y Tarifas</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar ruta, ciudad, código"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm w-64"
                  />
                </div>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm flex items-center hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-1" />
                  Estado
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Tipo</button>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm flex items-center hover:bg-gray-50">
                  <MoreHorizontal className="w-4 h-4 mr-1" />
                  Filtros
                </button>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Nueva ruta
            </button>
          </div>
          );
};

export default HeaderFiltros;