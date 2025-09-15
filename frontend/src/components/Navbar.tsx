import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TransporteIcon from "./app-logo";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NavUserHeader } from "./nav-user-header";

const navbarOptions = [
  { id: "servicios", name: "Servicios", href: "#servicios" },
  { id: "rutas", name: "Rutas", href: "#rutas" },
  { id: "choferes", name: "Choferes", href: "#choferes" },
  { id: "contacto", name: "Contacto", href: "#contacto" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <header className="flex justify-between items-center px-4 md:px-10 py-2 md:py-3 shadow-md bg-white sticky top-0 z-50">
      <h1 className="text-base md:text-lg font-bold text-blue-700 flex items-center gap-1 md:gap-2">
        <TransporteIcon className="w-15 h-13" />
        <span className="leading-none">MoviFleet</span>
      </h1>
      {/* Desktop nav */}
      <nav className="space-x-0 hidden md:flex flex-row md:space-x-6 gap-2 md:gap-0">
        {navbarOptions.map((opt) => (
          <a
            key={opt.id}
            href={opt.href}
            className="hover:text-blue-600 px-2 py-1 md:px-0 md:py-0"
          >
            {opt.name}
          </a>
        ))}
      </nav>
      {/* Desktop buttons */}
      <div className="hidden md:flex items-center space-x-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        ) : isAuthenticated ? (
          <NavUserHeader />
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-900 hover:border-gray-400 transition-colors w-full md:w-auto"
            >
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button
              asChild
              variant="default"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
            >
              <Link to="/register">Registrarse</Link>
            </Button>
          </>
        )}
      </div>
      {/* Mobile hamburger */}
      <div className="md:hidden flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-transparent backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-64 h-full bg-white shadow-lg flex flex-col p-6 gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              {navbarOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveModule(opt.id);
                    setMenuOpen(false);
                    window.location.href = opt.href;
                  }}
                  className={`w-full flex items-center px-2 py-2 text-sm rounded-lg text-left transition-colors ${
                    activeModule === opt.id
                      ? "bg-blue-400 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </nav>
            <div className="flex flex-col gap-3 mt-auto">
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : isAuthenticated ? (
                <div className="w-full">
                  <NavUserHeader />
                </div>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full py-3 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-900 hover:border-gray-400 transition-colors"
                  >
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      Iniciar sesión
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      Crear Cuenta
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
