import React from "react";
import AdminLayout from "@/app/layout/admin-layout";
import { BarChart3, Truck, Users, Settings, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";


interface SidebarModule {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  route: string;
}


const sidebarModules: SidebarModule[] = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3, route: "/admin/dashboard" },
  { id: "flotas", name: "Flotas", icon: Truck, route: "/admin/flotas" },
  { id: "conductores", name: "Conductores", icon: Users, route: "/admin/conductores" },
  { id: "mantenimiento", name: "Mantenimiento", icon: Settings, route: "/admin/mantenimiento" },
  { id: "rutas", name: "Rutas y Tarifas", icon: MapPin, route: "/admin/rutas" },
  { id: "ventas", name: "Ventas y Boletos", icon: BarChart3, route: "/admin/ventas" },
  { id: "usuarios", name: "Usuarios y Roles", icon: Users, route: "/admin/usuarios" },
  { id: "bitacora", name: "Bitácora", icon: BarChart3, route: "/admin/bitacora" },
];

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sidebarModules.map((module) => (
          <button
            key={module.id}
            className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:bg-blue-50 transition-colors"
            onClick={() => navigate(module.route)}
          >
            <module.icon className="w-10 h-10 text-blue-600 mb-3" />
            <span className="text-lg font-semibold text-gray-700">{module.name}</span>
          </button>
        ))}
      </div>
    </AdminLayout>
  );
}