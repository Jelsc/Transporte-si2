import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Loader2, Search, Lock, X, Tag, CheckCircle, XCircle,
  Settings, Users, ChevronLeft, ChevronRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/app/layout/admin-layout";

// Interfaces
interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  es_activo: boolean;
  fecha_creacion: string;
}

interface PermisoForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  es_activo: boolean;
}

const categorias = [
  'Gestión de Usuarios',
  'Operaciones',
  'Reportes',
  'Administración',
  'Monitoreo',
  'Configuración'
] as const;

export default function PermisosCRUD() {
  // Estados del componente de permisos
  const [permisos, setPermisos] = useState<Permiso[]>([
    { id: 1, codigo: 'crear', nombre: 'Crear', descripcion: 'Permite crear registros', categoria: 'Operaciones', es_activo: true, fecha_creacion: '2024-01-15' },
    { id: 2, codigo: 'editar', nombre: 'Editar', descripcion: 'Permite editar registros', categoria: 'Operaciones', es_activo: true, fecha_creacion: '2024-01-15' },
    { id: 3, codigo: 'eliminar', nombre: 'Eliminar', descripcion: 'Permite eliminar registros', categoria: 'Operaciones', es_activo: true, fecha_creacion: '2024-01-15' },
    { id: 4, codigo: 'gestionar_usuarios', nombre: 'Gestionar Usuarios', descripcion: 'Crear, editar y eliminar usuarios del sistema', categoria: 'Gestión de Usuarios', es_activo: true, fecha_creacion: '2024-01-15' },
    { id: 5, codigo: 'ver_reportes', nombre: 'Ver Reportes', descripcion: 'Acceso a reportes y estadísticas del sistema', categoria: 'Reportes', es_activo: true, fecha_creacion: '2024-01-15' },
    { id: 6, codigo: 'monitorear_vehiculos', nombre: 'Monitorear Vehículos', descripcion: 'Seguimiento en tiempo real de vehículos', categoria: 'Monitoreo', es_activo: false, fecha_creacion: '2024-01-15' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [form, setForm] = useState<PermisoForm>({ codigo: "", nombre: "", descripcion: "", categoria: "Gestión de Usuarios", es_activo: true });

  // Filtrar permisos por búsqueda y categoría
  const filteredPermisos = permisos.filter(permiso => {
    const matchesSearch = permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permiso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permiso.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || permiso.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (permiso?: Permiso) => {
    if (permiso) {
      setEditingPermiso(permiso);
      setForm({ codigo: permiso.codigo, nombre: permiso.nombre, descripcion: permiso.descripcion, categoria: permiso.categoria, es_activo: permiso.es_activo });
    } else {
      setEditingPermiso(null);
      setForm({ codigo: "", nombre: "", descripcion: "", categoria: "Gestión de Usuarios", es_activo: true });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre || !form.descripcion || !form.codigo) {
      alert("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const getCurrentDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (editingPermiso) {
        setPermisos(
          permisos.map((p) =>
            p.id === editingPermiso.id ? { ...form, id: p.id, fecha_creacion: p.fecha_creacion } : p
          )
        );
      } else {
        setPermisos([...permisos, { ...form, id: Date.now(), fecha_creacion: getCurrentDateString() }]);
      }
      setLoading(false);
      setShowModal(false);
    }, 800);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este permiso?")) {
      setPermisos(permisos.filter((p) => p.id !== id));
    }
  };

  // Generar código automático basado en el nombre
  const generateCodigo = (nombre: string): string => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
      .trim()
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  };

  // Actualizar código cuando cambia el nombre (solo en modo crear)
  React.useEffect(() => {
    if (!editingPermiso && form.nombre) {
      const codigoGenerado = generateCodigo(form.nombre);
      if (codigoGenerado !== form.codigo) {
        setForm(prev => ({
          ...prev,
          codigo: codigoGenerado
        }));
      }
    }
  }, [form.nombre, editingPermiso, form.codigo]);

  // Obtener iniciales del nombre
  const getInitials = (nombre: string): string => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Obtener color para la categoría
  const getCategoryColor = (categoria: string): string => {
    const colors: Record<string, string> = {
      'Gestión de Usuarios': 'bg-blue-100 text-blue-800',
      'Operaciones': 'bg-green-100 text-green-800',
      'Reportes': 'bg-purple-100 text-purple-800',
      'Administración': 'bg-red-100 text-red-800',
      'Monitoreo': 'bg-yellow-100 text-yellow-800',
      'Configuración': 'bg-gray-100 text-gray-800'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <AdminLayout>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Lock className="text-blue-600" size={28} />
                  Gestión de Permisos
                </h1>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{permisos.length}</div>
                <div className="text-sm text-gray-500">Total permisos</div>
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
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      type="text"
                      placeholder="Buscar permisos..."
                      className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <select
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredPermisos.length} de {permisos.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Permiso
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas de permisos */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {filteredPermisos.map((permiso) => (
                <Card key={permiso.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {getInitials(permiso.nombre)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{permiso.nombre}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                            permiso.es_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {permiso.es_activo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {permiso.es_activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{permiso.descripcion}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{permiso.codigo}</code>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Tag size={14} />
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(permiso.categoria)}`}>
                              {permiso.categoria}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(permiso)}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(permiso.id)}
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
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Código</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Categoría</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPermisos.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-xs">
                                  {getInitials(p.nombre)}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{p.nombre}</span>
                                <p className="text-xs text-gray-500 max-w-xs truncate">{p.descripcion}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                              {p.codigo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(p.categoria)}`}>
                              {p.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${
                              p.es_activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {p.es_activo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                              {p.es_activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(p)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(p.id)}
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
            {filteredPermisos.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Lock size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm || selectedCategory ? 'No se encontraron permisos' : 'No hay permisos registrados'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory
                    ? 'Intenta con otros términos de búsqueda o filtros' 
                    : 'Comienza creando tu primer permiso'
                  }
                </p>
                {!searchTerm && !selectedCategory && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Crear Primer Permiso
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
                {editingPermiso ? "Editar Permiso" : "Nuevo Permiso"}
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
                  Nombre del Permiso *
                </Label>
                <Input
                  id="nombre"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: Gestionar Inventario"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                  Código del Permiso *
                </Label>
                <Input
                  id="codigo"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  placeholder="gestionar_inventario"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  maxLength={100}
                  readOnly={!editingPermiso}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {!editingPermiso 
                    ? 'Se genera automáticamente basado en el nombre'
                    : 'El código no se puede modificar después de la creación'
                  }
                </div>
              </div>
              
              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                  Descripción *
                </Label>
                <textarea
                  id="descripcion"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Describe detalladamente qué permite hacer este permiso..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {form.descripcion.length}/500 caracteres
                </div>
              </div>
              
              <div>
                <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                  Categoría *
                </Label>
                <select
                  id="categoria"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="es_activo"
                  checked={form.es_activo}
                  onChange={(e) => setForm({ ...form, es_activo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <Label htmlFor="es_activo" className="text-sm font-medium text-gray-700">
                    Permiso Activo
                  </Label>
                  <p className="text-xs text-gray-500">
                    Solo los permisos activos pueden ser asignados a roles
                  </p>
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