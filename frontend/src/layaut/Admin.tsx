import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Bus,
  Package,
  MapPin,
  Settings,
  LogOut,
} from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: JSX.Element;
}

export default function Admin() {
  const [open, setOpen] = useState(true);

  const links: NavLink[] = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin" },
    { name: "Usuarios", icon: <Users size={20} />, href: "/admin/usuarios" },
    { name: "Flotas", icon: <Bus size={20} />, href: "/admin/flotas" },
    { name: "Pasajes", icon: <Bus size={20} />, href: "/admin/pasajes" },
    { name: "Encomiendas", icon: <Package size={20} />, href: "/admin/encomiendas" },
    { name: "Rutas / Seguimiento", icon: <MapPin size={20} />, href: "/admin/rutas" },
    { name: "Configuración", icon: <Settings size={20} />, href: "/admin/config" },
  ];

  return (
    <aside
      className={`${
        open ? "w-64" : "w-20"
      } bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className={`text-xl font-bold transition ${!open && "hidden"}`}>
          🛠️ Admin
        </h1>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 hover:text-white"
        >
          {open ? "<" : ">"}
        </button>
      </div>

      {/* Links */}
      <nav className="mt-4 space-y-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 rounded-md transition"
          >
            {link.icon}
            <span className={`${!open && "hidden"} transition`}>{link.name}</span>
          </a>
        ))}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-4 w-full px-4">
        <a
          href="/logout"
          className="flex items-center gap-3 px-4 py-3 hover:bg-red-600 rounded-md transition"
        >
          <LogOut size={20} />
          <span className={`${!open && "hidden"} transition`}>Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  );
}
