import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Loader2, Search, Shield, X, CheckCircle, 
  Users, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/app/layout/admin-layout";

// Interfaces
interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  usuarios_asignados: number;
  permisos: string[];
}

interface RolForm {
  nombre: string;
  descripcion: string;
  activo: boolean;
  permisos: string[];
}

const permisosDisponibles = [
  'gestionar_usuarios',
  'gestionar_vehiculos', 
  'ver_reportes',
  'gestionar_rutas',
  'gestionar_conductores',
  'ver_viajes_asignados',
  'actualizar_estado',
  'ver_perfil'
];

export default function RolesCRUD() {
  // Estados del componente de roles
  const [roles, setRoles] = useState<Rol[]>([
    { id: 1, nombre: "Cliente", descripcion: "Rol para clientes del sistema", activo: true, usuarios_asignados: 25, permisos: [] },
    { id: 2, nombre: "Administrador", descripcion: "Administrador general del sistema", activo: true, usuarios_asignados: 3, permisos: ['gestionar_usuarios', 'gestionar_vehiculos', 'ver_reportes'] },
    { id: 3, nombre: "Supervisor", descripcion: "Supervisor de operaciones", activo: true, usuarios_asignados: 8, permisos: ['ver_reportes', 'gestionar_conductores'] },
    { id: 4, nombre: "Conductor", descripcion: "Conductor de vehículos", activo: true, usuarios_asignados: 42, permisos: ['ver_viajes_asignados', 'actualizar_estado'] },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<RolForm>({ nombre: "", descripcion: "", activo: true, permisos: [] });

  // Filtrar roles por búsqueda
  const filteredRoles = roles.filter(rol =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (rol?: Rol) => {
    if (rol) {
      setEditingRol(rol);
      setForm({ nombre: rol.nombre, descripcion: rol.descripcion, activo: rol.activo, permisos: [...rol.permisos] });
    } else {
      setEditingRol(null);
      setForm({ nombre: "", descripcion: "", activo: true, permisos: [] });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre || !form.descripcion) {
      alert("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (editingRol) {
        setRoles(
          roles.map((r) =>
            r.id === editingRol.id ? { ...form, id: r.id, usuarios_asignados: r.usuarios_asignados } : r
          )
        );
      } else {
        setRoles([...roles, { ...form, id: Date.now(), usuarios_asignados: 0 }]);
      }
      setLoading(false);
      setShowModal(false);
    }, 800);
  };

  const handleDelete = (id: number) => {
    const rol = roles.find(r => r.id === id);
    if (rol && rol.usuarios_asignados > 0) {
      alert(`No se puede eliminar el rol "${rol.nombre}" porque tiene ${rol.usuarios_asignados} usuarios asignados`);
      return;
    }
    if (window.confirm("¿Seguro que deseas eliminar este rol?")) {
      setRoles(roles.filter((r) => r.id !== id));
    }
  };

  const handlePermissionChange = (permiso: string) => {
    setForm(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permiso)
        ? prev.permisos.filter(p => p !== permiso)
        : [...prev.permisos, permiso]
    }));
  };

  // Obtener iniciales del nombre
  const getInitials = (nombre: string): string => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Obtener nombre legible del permiso
  const getPermisoNombre = (codigo: string): string => {
    return codigo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      <AdminLayout>
        {/* Header de la página */}
      <header className="bg-white border-b border-gray-200 rounded-lg shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="text-blue-600" size={28} />
                Gestión de Roles
              </h1>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-600">{roles.length}</div>
              <div className="text-sm text-gray-500">Total roles</div>
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
                    placeholder="Buscar roles..."
                    className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredRoles.length} de {roles.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Rol
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas de roles */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {filteredRoles.map((rol) => (
                <Card key={rol.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {getInitials(rol.nombre)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rol.nombre}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            rol.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {rol.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{rol.descripcion}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Users size={14} />
                            <span>{rol.usuarios_asignados} usuarios</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Settings size={14} />
                            <span>{rol.permisos.length} permisos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Permisos preview */}
                    {rol.permisos.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Permisos asignados:</div>
                        <div className="flex flex-wrap gap-1">
                          {rol.permisos.slice(0, 2).map((permiso, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getPermisoNombre(permiso)}
                            </span>
                          ))}
                          {rol.permisos.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{rol.permisos.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(rol)}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rol.id)}
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        disabled={rol.usuarios_asignados > 0}
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
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Descripción</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Usuarios</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRoles.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-xs">
                                  {getInitials(r.nombre)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{r.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{r.descripcion}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              r.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {r.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{r.usuarios_asignados}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(r)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(r.id)}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                disabled={r.usuarios_asignados > 0}
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
            {filteredRoles.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Shield size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? 'No se encontraron roles' : 'No hay roles registrados'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Comienza creando tu primer rol'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Crear Primer Rol
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingRol ? "Editar Rol" : "Nuevo Rol"}
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
                  placeholder="Nombre del rol"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                  Descripción *
                </Label>
                <textarea
                  id="descripcion"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del rol"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <Label htmlFor="activo" className="text-sm font-medium text-gray-700">
                    Rol Activo
                  </Label>
                  <p className="text-xs text-gray-500">
                    Solo los roles activos pueden ser asignados a usuarios
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Permisos del Sistema
                </Label>
                <div className="mt-2 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    {permisosDisponibles.map((permiso) => (
                      <div key={permiso} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          id={permiso}
                          checked={form.permisos.includes(permiso)}
                          onChange={() => handlePermissionChange(permiso)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={permiso} className="text-sm text-gray-700 cursor-pointer">
                          {getPermisoNombre(permiso)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {form.permisos.length} permisos seleccionados
                </div>
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
    </>
  );
}