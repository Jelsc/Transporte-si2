import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TransporteIcon from "./app-logo";
import { 
  BarChart3, 
  Users, 
  Truck, 
  MapPin, 
  Settings
} from 'lucide-react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  
  const sidebarModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { id: 'flotas', name: 'Flotas', icon: Truck, path: '/admin/flotas' },
    // { id: 'conductores', name: 'Conductores', icon: Users, path: '/admin/conductores' },
    { id: 'mantenimiento', name: 'Mantenimiento', icon: Settings, path: '/admin/mantenimiento' },
    { id: 'rutas', name: 'Rutas y Tarifas', icon: MapPin, path: '/admin/rutas' },
    { id: 'ventas', name: 'Ventas y Boletos', icon: BarChart3, path: '/admin/ventas' },
    { id: 'usuarios', name: 'Gestión de Permisos', icon: Users, path: '/admin/roles-permisos/permisos' }, // Ruta absoluta
    { id: 'usuarios', name: 'Gestión de Roles', icon: Users, path: '/admin/roles-permisos/rol' }, // Ruta absoluta
    { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, path: '/admin/registro-usuarios-choferes/UsuariosCRUD' }, // Ruta absoluta
    { id: 'usuarios', name: 'Gestión de Choferes', icon: Users, path: '/admin/registro-usuarios-choferes/ChoferesCRUD' }, // Ruta absoluta
  ];

  return (
    <aside className={`h-full bg-sky-100 relative border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-[320px]'}`}>
      <div className={`p-6 flex flex-col h-full ${collapsed ? 'items-center px-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-6 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && <TransporteIcon className="w-8 h-8" />}
          {!collapsed && (
            <Link to="/admin/dashboard" className="text-lg font-bold text-blue-700 hover:text-blue-800">
              MoviFleet
            </Link>
          )}
          {collapsed && (
            <button
              className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow transition-all duration-300"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir sidebar"
            >
              <ChevronRight className="w-5 h-5 text-blue-700" />
            </button>
          )}
        </div>
        <nav className={`space-y-2 flex-1 ${collapsed ? 'w-full' : ''}`}>
          {sidebarModules.map((module) => (
            <Link
              key={module.id}
              to={module.path}
              className={`w-full flex items-center px-2 py-2 text-sm rounded-lg transition-colors ${
                location.pathname === module.path
                  ? 'bg-blue-400 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <module.icon className={collapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'} />
              {!collapsed && module.name}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <button
            className="absolute top-4 right-2 w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center shadow transition-all duration-300"
            onClick={() => setCollapsed(true)}
            aria-label="Contraer sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-blue-700" />
          </button>
        )}
      </div>
    </aside>
  );
}