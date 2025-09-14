import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
        
  // Función para verificar si una ruta está activa
  const isRouteActive = (route: string) => {
    // Caso especial para dashboard
    if (route === "/admin/dashboard") {
      return currentPath === "/admin/dashboard" || currentPath === "/admin";
    }
    // Para otras rutas, verificar si la ruta actual comienza con la ruta del módulo
    return currentPath.startsWith(route);
  };
  
  const sidebarModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, route: '/admin/dashboard' },
    { id: 'flotas', name: 'Flotas', icon: Truck, route: '/admin/flotas' },
    { id: 'mantenimiento', name: 'Mantenimiento', icon: Settings, route: '/admin/mantenimiento' },
    { id: 'rutas', name: 'Rutas y Tarifas', icon: MapPin, route: '/admin/rutas' },
    { id: 'ventas', name: 'Ventas y Boletos', icon: BarChart3, route: '/admin/ventas' },
    { id: 'permisos', name: 'Gestión de Permisos', icon: Users, route: '/admin/roles-permisos/permisos' },
    { id: 'roles', name: 'Gestión de Roles', icon: Users, route: '/admin/roles-permisos/rol' },
    { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users, route: '/admin/registro-usuarios-choferes/UsuariosCRUD' },
    { id: 'choferes', name: 'Gestión de Choferes', icon: Users, route: '/admin/registro-usuarios-choferes/ChoferesCRUD' },
    { id: 'bitacora', name: 'Bitacora', icon: BarChart3, route: "/admin/bitacora" },
  ];

  return (
    <aside className={`h-full bg-sky-100 relative border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-[320px]'}`}>
      <div className={`p-6 flex flex-col h-full ${collapsed ? 'items-center px-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-6 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <Link to="/admin/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <TransporteIcon className="w-8 h-8" />
              <span className="text-lg font-bold text-blue-700">MoviFleet</span>
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
            <button
              key={module.id}
              onClick={() => navigate(module.route)}
              className={`w-full flex items-center px-2 py-2 text-sm rounded-lg text-left transition-colors ${ 
                isRouteActive(module.route) 
                  ? 'bg-blue-400 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <module.icon className={collapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'} />
              {!collapsed && module.name}
            </button>
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