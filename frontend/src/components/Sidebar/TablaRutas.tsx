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
const routes = [
    { 
      codigo: "RT-210", 
      ruta: "La Paz → Cochabamba", 
      duracion: "7h 30m", 
      estado: "Activa", 
      estadoColor: "bg-green-500",
      acciones: ["Ver", "Editar"]
    },
    { 
      codigo: "RT-145", 
      ruta: "Cochabamba → Santa Cruz", 
      duracion: "8h 10m", 
      estado: "Borrador", 
      estadoColor: "bg-gray-500",
      acciones: ["Ver", "Duplicar"]
    },
    { 
      codigo: "RT-098", 
      ruta: "Santa Cruz → Sucre", 
      duracion: "6h 40m", 
      estado: "Revisión", 
      estadoColor: "bg-orange-500",
      acciones: ["Ver", "Duplicar"]
    }
  ];
const TablaRuta= () => {
  return (
<div className="col-span-5">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruta</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {routes.map((route, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{route.codigo}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{route.ruta}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{route.duracion}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs text-white rounded-full ${route.estadoColor}`}>
                              {route.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              {route.acciones.map((accion, i) => (
                                <button 
                                  key={i}
                                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  {accion}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

      );
    
};

export default TablaRuta;
