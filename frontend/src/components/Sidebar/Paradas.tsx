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
const paradas = [
    { nombre: "Terminal La Paz", hora: "06:30" },
    { nombre: "Parada Oruro", hora: "10:15" },
    { nombre: "Terminal Cochabamba", hora: "14:00" }
  ];

const Paradas= () => {
  return (

<div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm text-gray-600 mb-4">Paradas</h3>
                <div className="space-y-3">
                  {paradas.map((parada, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{parada.nombre}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{parada.hora}</span>
                        <button className="text-xs text-gray-600 hover:text-gray-800">Mover</button>
                        <button className="text-xs text-gray-600 hover:text-gray-800">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Agregar parada
                </button>
              </div>
);
};

export default Paradas;