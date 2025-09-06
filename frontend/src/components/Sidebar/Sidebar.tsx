import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Truck, 
  MapPin, 
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const [activeModule, setActiveModule] = useState('rutas');

  const sidebarModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'flotas', name: 'Flotas', icon: Truck },
    { id: 'conductores', name: 'Conductores', icon: Users },
    { id: 'mantenimiento', name: 'Mantenimiento', icon: Settings },
    { id: 'rutas', name: 'Rutas y Tarifas', icon: MapPin },
    { id: 'ventas', name: 'Ventas y Boletos', icon: BarChart3 },
    { id: 'usuarios', name: 'Usuarios y Roles', icon: Users },
    { id: 'configuracion', name: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-60 bg-gray-200 shadow-sm relative">
      <div className="p-4">
        <h1 className="text-sm font-medium text-gray-600 mb-4">Panel</h1>
        <nav className="space-y-1">
          {sidebarModules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md text-left transition-colors ${
                activeModule === module.id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              <module.icon className="w-4 h-4 mr-3" />
              {module.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Bloque inferior */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-gray-600">
          <div className="mb-2 font-medium">Monitoreo</div>
          <button className="w-full text-left p-2 text-xs hover:bg-gray-300 rounded flex items-center">
            <MapPin className="w-3 h-3 mr-2" />
            Flota en mapa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
