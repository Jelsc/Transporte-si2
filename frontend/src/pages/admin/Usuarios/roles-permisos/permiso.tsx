import React, { useState, useEffect } from "react";

import { Link } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Loader2, Search, Lock, X, Tag, CheckCircle, XCircle,
  Settings, Users, ChevronLeft, ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/app/layout/admin-layout";
import { permissionsService, ApiError } from "@/services/api";

// Interfaces
interface Permiso {
  codigo: string;
  descripcion: string;
  categoria?: string;
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

// Helper function para verificar respuesta exitosa
function isSuccessfulResponse<T>(response: { success: boolean; data?: T }): response is { success: true; data: T } {
  return response.success && response.data !== undefined;
}

export default function PermisosCRUD() {
  // Estados del componente de permisos
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PermisoForm>({ codigo: "", nombre: "", descripcion: "", categoria: "Gestión de Usuarios", es_activo: true });

  // Cargar datos del backend
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await loadPermisos();
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const loadPermisos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsService.getAvailablePermissions();
      if (isSuccessfulResponse(response) && response.data?.permisos) {
        const permisosData = Array.isArray(response.data.permisos) 
          ? response.data.permisos.map(([codigo, descripcion]) => ({
              codigo,
              descripcion,
              categoria: getCategoriaFromCodigo(codigo)
            }))
          : [];
        setPermisos(permisosData);
      } else {
        setPermisos([]);
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermisos([]); // Establecer array vacío en caso de error
      if (error instanceof ApiError) {
        setError(`Error ${error.status}: ${error.message}`);
      } else {
        setError('Error al cargar los permisos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar la categoría basada en el código del permiso
  const getCategoriaFromCodigo = (codigo: string): string => {
    if (codigo.includes('usuario') || codigo.includes('rol')) return 'Gestión de Usuarios';
    if (codigo.includes('vehiculo') || codigo.includes('conductor') || codigo.includes('ruta')) return 'Operaciones';
    if (codigo.includes('reporte') || codigo.includes('estadistica')) return 'Reportes';
    if (codigo.includes('monitorear') || codigo.includes('seguimiento')) return 'Monitoreo';
    if (codigo.includes('configuracion') || codigo.includes('gestionar')) return 'Administración';
    return 'Configuración';
  };

  // Filtrar permisos por búsqueda y categoría
  const filteredPermisos = Array.isArray(permisos) ? permisos.filter(permiso => {
    const matchesSearch = permiso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permiso.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || permiso.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  const handleOpenModal = (permiso?: Permiso) => {
    if (permiso) {
      setEditingPermiso(permiso);
      setForm({ 
        codigo: permiso.codigo, 
        nombre: permiso.descripcion, 
        descripcion: permiso.descripcion, 
        categoria: permiso.categoria || "Gestión de Usuarios", 
        es_activo: true 
      });
    } else {
      setEditingPermiso(null);
      setForm({ codigo: "", nombre: "", descripcion: "", categoria: "Gestión de Usuarios", es_activo: true });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    // Los permisos son de solo lectura desde el backend
    alert("Los permisos son de solo lectura. Se obtienen automáticamente del sistema.");
    setShowModal(false);
  };

  const handleDelete = (codigo: string) => {
    // Los permisos no se pueden eliminar desde el frontend
    alert("Los permisos no se pueden eliminar. Son parte del sistema.");
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
  const getInitials = (descripcion: string): string => {
    return descripcion.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
                <Button 
                  onClick={() => setError(null)} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Cerrar
                </Button>
              </div>
            )}

            {/* Loading State */}
            {(loading || initialLoading) && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="text-blue-600 animate-spin" size={20} />
                  <span className="text-blue-800 font-medium">
                    {initialLoading ? 'Cargando permisos del sistema...' : 'Cargando...'}
                  </span>
                </div>
              </div>
            )}

            {/* Mostrar contenido solo cuando no esté cargando inicialmente */}
            {!initialLoading && (
              <>
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
                    {Array.isArray(filteredPermisos) ? filteredPermisos.length : 0} de {Array.isArray(permisos) ? permisos.length : 0}
                  </span>
                  <Button onClick={() => loadPermisos()} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw size={16} className="mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas de permisos */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {Array.isArray(filteredPermisos) && filteredPermisos.map((permiso) => (
                <Card key={permiso.codigo} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {getInitials(permiso.descripcion)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{permiso.descripcion}</h3>
                          <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 bg-green-100 text-green-700">
                            <CheckCircle size={10} />
                            Activo
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{permiso.codigo}</code>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Tag size={14} />
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(permiso.categoria || 'Configuración')}`}>
                              {permiso.categoria || 'Configuración'}
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
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(permiso.codigo)}
                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                        disabled
                      >
                        <Lock size={14} className="mr-1" />
                        Solo Lectura
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
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Descripción</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Código</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Categoría</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Array.isArray(filteredPermisos) && filteredPermisos.map((p) => (
                        <tr key={p.codigo} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-xs">
                                  {getInitials(p.descripcion)}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{p.descripcion}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                              {p.codigo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(p.categoria || 'Configuración')}`}>
                              {p.categoria || 'Configuración'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 bg-green-100 text-green-800">
                              <CheckCircle size={10} />
                              Activo
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
                                onClick={() => handleDelete(p.codigo)}
                                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                                disabled
                              >
                                <Lock size={14} />
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
            {Array.isArray(filteredPermisos) && filteredPermisos.length === 0 && (
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
                  <Button onClick={() => loadPermisos()} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw size={16} className="mr-2" />
                    Actualizar Permisos
                  </Button>
                )}
              </div>
            )}
              </>
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
                {editingPermiso ? "Ver Detalles del Permiso" : "Información de Permisos"}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="text-blue-600" size={20} />
                  <span className="text-blue-800 font-medium">Información del Sistema</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Los permisos son definidos automáticamente por el sistema y no pueden ser modificados desde esta interfaz.
                </p>
              </div>

              <div>
                <Label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                  Código del Permiso
                </Label>
                <Input
                  id="codigo"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                  value={form.codigo}
                  readOnly
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                  Descripción
                </Label>
                <textarea
                  id="descripcion"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-none bg-gray-50"
                  rows={3}
                  value={form.descripcion}
                  readOnly
                />
              </div>
              
              <div>
                <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                  Categoría
                </Label>
                <Input
                  id="categoria"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  value={form.categoria}
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}