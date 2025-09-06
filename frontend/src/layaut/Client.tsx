// Navbar.tsx
import React, { useState } from "react";
import { Menu, X, Bus, Ticket, Package, Map, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  name: string;
  href: string;
  icon: JSX.Element;
}

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [
    { name: "Inicio", icon: <Home size={18} />, href: "/" },
    { name: "Servicios", icon: <Ticket size={18} />, href: "/servicios" },
    { name: "Rutas", icon: <Map size={18} />, href: "/rutas" },
    { name: "Choferes", icon: <Users size={18} />, href: "/choferes" },
    { name: "Contacto", icon: <Package size={18} />, href: "/contacto" },
  ];

  return (
    <nav className="bg-background text-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Bus className="w-6 h-6 text-blue-600" />
          <span className="hidden md:inline text-2xl font-bold text-blue-600">Transporte</span>
        </div>

        {/* Links en Desktop */}
        <div className="hidden md:flex space-x-6">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-600/20 transition"
            >
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
        </div>

        {/* Botón Login */}
        <Button className="hidden md:inline-block">Iniciar Sesión</Button>

        {/* Botón Hamburguesa Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded text-white focus:outline-none"
          aria-label="Menu"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menú Mobile */}
      {open && (
        <div className="md:hidden bg-background transition-all duration-300">
          <div className="px-4 pb-4 space-y-2 flex flex-col">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 py-3 px-3 rounded-md hover:bg-blue-600/20 transition"
              >
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}
            <Button className="w-full mt-2">Iniciar Sesión</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
