import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bus, Ticket, Package, Map, Users } from "lucide-react";
import React from "react";

const Inicio: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-6 shadow-md bg-white sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <Bus className="w-7 h-7" /> Transporte
        </h1>
        <nav className="space-x-6 hidden md:flex">
          <a href="#servicios" className="hover:text-blue-600">Servicios</a>
          <a href="#rutas" className="hover:text-blue-600">Rutas</a>
          <a href="#choferes" className="hover:text-blue-600">Choferes</a>
          <a href="#contacto" className="hover:text-blue-600">Contacto</a>
        </nav>
        <Button className="rounded-2xl bg-blue-600 text-white px-4 py-2">Iniciar Sesión</Button>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <motion.h2 
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
        >
          Tu Viaje y Envío, Más Fácil con <span className="text-blue-700">TransMovil</span>
        </motion.h2>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Compra pasajes, reserva tus viajes, envía encomiendas y gestiona rutas de manera rápida y segura.
        </p>
        <Button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-lg">
          Comenzar Ahora
        </Button>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 bg-white px-6">
        <h3 className="text-3xl font-bold text-center mb-12">Nuestros Servicios</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Ticket className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Compra de Pasajes</h4>
              <p className="text-gray-600">Reserva y compra tus boletos fácilmente desde cualquier lugar.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Envío de Encomiendas</h4>
              <p className="text-gray-600">Envía paquetes de forma rápida, confiable y segura.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Map className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Gestión de Rutas</h4>
              <p className="text-gray-600">Consulta y organiza las rutas de la flota en tiempo real.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Choferes */}
      <section id="choferes" className="py-20 px-6 bg-gradient-to-r from-blue-50 to-white">
        <h3 className="text-3xl font-bold text-center mb-12">Nuestros Choferes</h3>
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <Card className="shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <h4 className="text-lg font-semibold">Conductores Capacitados</h4>
                <p className="text-gray-600">Profesionales con experiencia y responsabilidad garantizada.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <Bus className="w-10 h-10 text-blue-600" />
              <div>
                <h4 className="text-lg font-semibold">Viajes Seguros</h4>
                <p className="text-gray-600">Comprometidos con tu seguridad y comodidad en cada viaje.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-blue-700 text-white text-center py-8 px-6 mt-12">
        <h4 className="text-xl font-semibold mb-2">Contáctanos</h4>
        <p>Email: contacto@transmovil.com | Tel: +591 70000000</p>
        <p className="mt-4 text-sm">© 2025 TransMovil - Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default Inicio;
