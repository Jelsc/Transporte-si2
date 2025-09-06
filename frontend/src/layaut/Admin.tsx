import React, { useState } from 'react';
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

const Admin = () => {
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

  const paradas = [
    { nombre: "Terminal La Paz", hora: "06:30" },
    { nombre: "Parada Oruro", hora: "10:15" },
    { nombre: "Terminal Cochabamba", hora: "14:00" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-60 bg-gray-200 shadow-sm">
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

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
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

        {/* Main Content */}
        <main className="p-6">
          {/* Header con filtros */}
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

          {/* Layout de dos columnas */}
          <div className="grid grid-cols-12 gap-6">
            {/* Columna izquierda - Tabla de rutas */}
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

            {/* Columna derecha - Mapa y paradas */}
            <div className="col-span-7 space-y-4">
              {/* Mapa */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-sm text-gray-600 mb-3">Mapa de ruta seleccionada</h3>
                <div className="bg-green-100 rounded h-64 relative overflow-hidden">
                  {/* Simulación del mapa */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
                    <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-green-600 rounded-full"></div>
                    {/* Líneas de ruta simuladas */}
                    <svg className="absolute inset-0 w-full h-full">
                      <path d="M 20 20 Q 200 100 380 240" stroke="#1f2937" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                    </svg>
                  </div>
                </div>
                <div className="flex space-x-4 mt-3">
                  <button className="px-3 py-1 text-sm bg-gray-100 rounded">Ruta</button>
                  <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded">Paradas</button>
                  <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded">Tráfico</button>
                </div>
              </div>

              {/* Paradas */}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;