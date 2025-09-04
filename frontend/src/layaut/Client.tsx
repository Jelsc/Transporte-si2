import { useState } from "react";
import { Menu, X, Bus, Package, MapPin, Home } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: JSX.Element;
}

export default function Client() {
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [
    { name: "Inicio", icon: <Home size={18} />, href: "/" },
    { name: "Pasajes", icon: <Bus size={18} />, href: "/pasajes" },
    { name: "Encomiendas", icon: <Package size={18} />, href: "/encomiendas" },
    { name: "Envío a Domicilio", icon: <MapPin size={18} />, href: "/envio-domicilio" },
    { name: "Seguimiento", icon: <MapPin size={18} />, href: "/seguimiento" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-extrabold tracking-wide">
          🚍 <span className="text-yellow-300">Transporte</span> Express
        </div>

        {/* Links en Desktop */}
        <div className="hidden md:flex space-x-6">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-800/60 hover:text-yellow-300 transition-all"
            >
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
        </div>

        {/* Botón Hamburger en Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded focus:outline-none hover:bg-blue-800/60 transition"
          aria-label="Menu"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menú Mobile */}
      <div
        className={`md:hidden bg-blue-600 transition-all duration-300 overflow-hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-2">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-blue-700/60 hover:text-yellow-300 transition-all"
            >
              {link.icon}
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
