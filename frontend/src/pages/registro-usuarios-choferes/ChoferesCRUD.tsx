import React, { useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Loader2, Search, Car, Phone, X, Award,
  BarChart3, Users, Truck, MapPin, Settings, ChevronLeft, ChevronRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Componente del logo (simplificado)
const TransporteIcon = ({ className }: { className?: string }) => (
  <div className={`${className} bg-blue-600 rounded flex items-center justify-center`}>
    <Truck className="text-white" size={20} />
  </div>
);

// Interfaces
interface Chofer {
  id: number;
  nombre: string;
  licencia: string;
  telefono: string;
}

interface ChoferForm {
  nombre: string;
  licencia: string;
  telefono: string;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

// Componente Sidebar
function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  
  const sidebarModules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { id: 'flotas', name: 'Flotas', icon: Truck, path: '/admin/flotas' },
    { id: 'conductores', name: 'Conductores', icon: Car, path: '/admin/conductores' },
    { id: 'mantenimiento', name: 'Mantenimiento', icon: Settings, path: '/admin/mantenimiento' },
    { id: 'rutas', name: 'Rutas y Tarifas', icon: MapPin, path: '/admin/rutas' },
    { id: 'ventas', name: 'Ventas y Boletos', icon: BarChart3, path: '/admin/ventas' },
    { id: 'permisos', name: 'Gestión de Permisos', icon: Users, path: '/admin/roles-permisos/permisos' },
    { id: 'roles', name: 'Gestión de Roles', icon: Shield, path: '/admin/roles-permisos/roles' },
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

export default function ChoferesCRUD() {
  // Estados del sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados del componente de choferes
  const [choferes, setChoferes] = useState<Chofer[]>([
    { id: 1, nombre: "Carlos Gutiérrez", licencia: "ABC123", telefono: "70011122" },
    { id: 2, nombre: "Luis Morales", licencia: "XYZ987", telefono: "70033344" },
    { id: 3, nombre: "Miguel Rodríguez", licencia: "DEF456", telefono: "70055566" },
    { id: 4, nombre: "Roberto Silva", licencia: "GHI789", telefono: "70077788" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingChofer, setEditingChofer] = useState<Chofer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<ChoferForm>({ nombre: "", licencia: "", telefono: "" });

  // Filtrar choferes por búsqueda
  const filteredChoferes = choferes.filter(chofer =>
    chofer.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chofer.licencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chofer.telefono.includes(searchTerm)
  );

  const handleOpenModal = (chofer?: Chofer) => {
    if (chofer) {
      setEditingChofer(chofer);
      setForm({ nombre: chofer.nombre, licencia: chofer.licencia, telefono: chofer.telefono });
    } else {
      setEditingChofer(null);
      setForm({ nombre: "", licencia: "", telefono: "" });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre || !form.licencia || !form.telefono) {
      alert("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (editingChofer) {
        setChoferes(
          choferes.map((c) =>
            c.id === editingChofer.id ? { ...form, id: c.id } : c
          )
        );
      } else {
        setChoferes([...choferes, { ...form, id: Date.now() }]);
      }
      setLoading(false);
      setShowModal(false);
    }, 800);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este chofer?")) {
      setChoferes(choferes.filter((c) => c.id !== id));
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (nombre: string): string => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Car className="text-blue-600" size={28} />
                  Gestión de Choferes
                </h1>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{choferes.length}</div>
                <div className="text-sm text-gray-500">Total choferes</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Barra de búsqueda y botón */}
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar choferes..."
                    className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredChoferes.length} de {choferes.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Chofer
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas de choferes */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {filteredChoferes.map((chofer) => (
                <Card key={chofer.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {getInitials(chofer.nombre)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{chofer.nombre}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Phone size={14} />
                            <span>{chofer.telefono}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Award size={14} />
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {chofer.licencia}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(chofer)}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(chofer.id)}
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabla tradicional */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Nombre</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Licencia</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Teléfono</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredChoferes.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-xs">
                                  {getInitials(c.nombre)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{c.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                              {c.licencia}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{c.telefono}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(c)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(c.id)}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Estado vacío */}
            {filteredChoferes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Car size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? 'No se encontraron choferes' : 'No hay choferes registrados'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Comienza agregando tu primer chofer'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Agregar Primer Chofer
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingChofer ? "Editar Chofer" : "Nuevo Chofer"}
              </h3>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="licencia" className="text-sm font-medium text-gray-700">
                  Licencia *
                </Label>
                <Input
                  id="licencia"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                  placeholder="ABC123"
                  value={form.licencia}
                  onChange={(e) => setForm({ ...form, licencia: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                  Teléfono *
                </Label>
                <Input
                  id="telefono"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="70123456"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}