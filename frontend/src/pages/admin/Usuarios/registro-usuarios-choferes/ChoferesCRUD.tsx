import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Loader2, Search, Car, Phone, X, Award, 
  MapPin, Calendar, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/app/layout/admin-layout";

// Interfaces
interface Conductor {
  id: number;
  usuario?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    telefono?: string;
  };
  numero_licencia: string;
  tipo_licencia: string;
  fecha_vencimiento_licencia: string;
  estado: string;
  experiencia_anos: number;
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  es_activo: boolean;
  nombre_completo: string;
  licencia_vencida: boolean;
  dias_para_vencer_licencia: number;
  puede_conducir: boolean;
  ultima_ubicacion_lat?: number;
  ultima_ubicacion_lng?: number;
  ultima_actualizacion_ubicacion?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface ConductorForm {
  // Datos personales básicos
  first_name: string;
  last_name: string;
  email: string;
  telefono: string;
  // Datos específicos del conductor
  numero_licencia: string;
  tipo_licencia: string;
  fecha_vencimiento_licencia: string;
  experiencia_anos: number;
  telefono_emergencia: string;
  contacto_emergencia: string;
}

export default function ChoferesCRUD() {
  // Estados del componente de conductores
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<ConductorForm>({
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    numero_licencia: "",
    tipo_licencia: "B",
    fecha_vencimiento_licencia: "",
    experiencia_anos: 0,
    telefono_emergencia: "",
    contacto_emergencia: ""
  });

  // Cargar conductores al montar el componente
  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/conductores/conductores/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConductores(data.results || data);
      } else {
        console.error('Error cargando conductores:', response.statusText);
      }
    } catch (error) {
      console.error('Error cargando conductores:', error);
    }
  };

  // Filtrar conductores por búsqueda
  const filteredConductores = conductores.filter(conductor =>
    conductor.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conductor.numero_licencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conductor.usuario?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conductor.usuario?.telefono?.includes(searchTerm)
  );

  const handleOpenModal = (conductor?: Conductor) => {
    if (conductor) {
      setEditingConductor(conductor);
      setForm({
        first_name: conductor.usuario?.first_name || "",
        last_name: conductor.usuario?.last_name || "",
        email: conductor.usuario?.email || "",
        telefono: conductor.usuario?.telefono || "",
        numero_licencia: conductor.numero_licencia,
        tipo_licencia: conductor.tipo_licencia,
        fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia,
        experiencia_anos: conductor.experiencia_anos,
        telefono_emergencia: conductor.telefono_emergencia || "",
        contacto_emergencia: conductor.contacto_emergencia || ""
      });
    } else {
      setEditingConductor(null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        telefono: "",
        numero_licencia: "",
        tipo_licencia: "B",
        fecha_vencimiento_licencia: "",
        experiencia_anos: 0,
        telefono_emergencia: "",
        contacto_emergencia: ""
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.numero_licencia || !form.tipo_licencia || !form.fecha_vencimiento_licencia) {
      alert("Los campos marcados con * son obligatorios");
      return;
    }


    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const url = editingConductor 
        ? `http://localhost:8000/api/conductores/conductores/${editingConductor.id}/`
        : 'http://localhost:8000/api/conductores/conductores/';
      
      const method = editingConductor ? 'PUT' : 'POST';
      
      const payload: any = {
        // Datos personales básicos
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telefono: form.telefono,
        // Datos específicos del conductor
        numero_licencia: form.numero_licencia,
        tipo_licencia: form.tipo_licencia,
        fecha_vencimiento_licencia: form.fecha_vencimiento_licencia,
        experiencia_anos: form.experiencia_anos,
        telefono_emergencia: form.telefono_emergencia,
        contacto_emergencia: form.contacto_emergencia
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadConductores();
        setShowModal(false);
        alert(editingConductor ? 'Conductor actualizado exitosamente' : 'Conductor creado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Error al guardar conductor'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar conductor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este conductor?")) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/conductores/conductores/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await loadConductores();
          alert('Conductor eliminado exitosamente');
        } else {
          alert('Error al eliminar conductor');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar conductor');
      }
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    const colors: Record<string, string> = {
      'disponible': 'bg-green-100 text-green-800',
      'ocupado': 'bg-red-100 text-red-800',
      'descanso': 'bg-yellow-100 text-yellow-800',
      'inactivo': 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  // Obtener color del tipo de licencia
  const getTipoLicenciaColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      'A': 'bg-purple-100 text-purple-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-green-100 text-green-800',
      'D': 'bg-orange-100 text-orange-800',
      'E': 'bg-red-100 text-red-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <AdminLayout>
        {/* Header de la página */}
        <header className="bg-white border-b border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Car className="text-blue-600" size={28} />
                  Perfiles de Conductores
                </h1>
                <p className="text-gray-600 mt-1">Gestionar perfiles personales de conductores</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{conductores.length}</div>
                <div className="text-sm text-gray-500">Total conductores</div>
              </div>
            </div>
          </div>
        </header>

        {/* Barra de búsqueda y botón */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar conductores..."
                className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                {filteredConductores.length} de {conductores.length}
              </span>
              <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Nuevo Perfil de Conductor
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de tarjetas de conductores */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {filteredConductores.map((conductor) => (
            <Card key={conductor.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">
                      {getInitials(conductor.usuario?.first_name || '', conductor.usuario?.last_name || '')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {conductor.nombre_completo}
                    </h3>
                    {conductor.usuario?.username && (
                      <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                        <span className="font-mono text-xs">@{conductor.usuario.username}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone size={14} />
                        <span>{conductor.usuario?.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Award size={14} />
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {conductor.numero_licencia}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(conductor.estado)}`}>
                      {conductor.estado}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Licencia:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoLicenciaColor(conductor.tipo_licencia)}`}>
                      Tipo {conductor.tipo_licencia}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Experiencia:</span>
                    <span className="text-sm font-medium">{conductor.experiencia_anos} años</span>
                  </div>
                  {conductor.licencia_vencida && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle size={14} />
                      <span>Licencia vencida</span>
                    </div>
                  )}
                  {!conductor.licencia_vencida && conductor.dias_para_vencer_licencia <= 30 && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <Calendar size={14} />
                      <span>Vence en {conductor.dias_para_vencer_licencia} días</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(conductor)}
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(conductor.id)}
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Conductor</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Licencia</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Experiencia</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConductores.map((conductor) => (
                    <tr key={conductor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-medium text-xs">
                              {getInitials(conductor.usuario?.first_name || '', conductor.usuario?.last_name || '')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{conductor.nombre_completo}</div>
                            {conductor.usuario?.username && (
                              <div className="text-sm text-gray-500">@{conductor.usuario.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                            {conductor.numero_licencia}
                          </span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoLicenciaColor(conductor.tipo_licencia)}`}>
                            Tipo {conductor.tipo_licencia}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(conductor.estado)}`}>
                          {conductor.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{conductor.experiencia_anos} años</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(conductor)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(conductor.id)}
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
        {filteredConductores.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
            <Car size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'No se encontraron conductores' : 'No hay conductores registrados'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza agregando tu primer conductor'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Agregar Primer Conductor
              </Button>
            )}
          </div>
        )}
      </AdminLayout>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingConductor ? 'Editar Perfil de Conductor' : 'Nuevo Perfil de Conductor'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información del Usuario */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h3>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: carlos@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                    Nombre *
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: Carlos"
                  />
                </div>

                <div>
                  <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                    Apellido *
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: Gutiérrez"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: 70011122"
                  />
                </div>

              </div>

              {/* Información del Conductor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Conductor</h3>
                
                <div>
                  <Label htmlFor="numero_licencia" className="text-sm font-medium text-gray-700">
                    Número de Licencia *
                  </Label>
                  <Input
                    id="numero_licencia"
                    type="text"
                    value={form.numero_licencia}
                    onChange={(e) => setForm({ ...form, numero_licencia: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: ABC123456"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo_licencia" className="text-sm font-medium text-gray-700">
                    Tipo de Licencia *
                  </Label>
                  <Select value={form.tipo_licencia} onValueChange={(value) => setForm({ ...form, tipo_licencia: value })}>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Motocicletas</SelectItem>
                      <SelectItem value="B">B - Automóviles</SelectItem>
                      <SelectItem value="C">C - Camiones</SelectItem>
                      <SelectItem value="D">D - Buses</SelectItem>
                      <SelectItem value="E">E - Maquinaria pesada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fecha_vencimiento_licencia" className="text-sm font-medium text-gray-700">
                    Fecha de Vencimiento *
                  </Label>
                  <Input
                    id="fecha_vencimiento_licencia"
                    type="date"
                    value={form.fecha_vencimiento_licencia}
                    onChange={(e) => setForm({ ...form, fecha_vencimiento_licencia: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="experiencia_anos" className="text-sm font-medium text-gray-700">
                    Años de Experiencia
                  </Label>
                  <Input
                    id="experiencia_anos"
                    type="number"
                    min="0"
                    value={form.experiencia_anos}
                    onChange={(e) => setForm({ ...form, experiencia_anos: parseInt(e.target.value) || 0 })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono_emergencia" className="text-sm font-medium text-gray-700">
                    Teléfono de Emergencia
                  </Label>
                  <Input
                    id="telefono_emergencia"
                    type="tel"
                    value={form.telefono_emergencia}
                    onChange={(e) => setForm({ ...form, telefono_emergencia: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: 70099988"
                  />
                </div>

                <div>
                  <Label htmlFor="contacto_emergencia" className="text-sm font-medium text-gray-700">
                    Contacto de Emergencia
                  </Label>
                  <Input
                    id="contacto_emergencia"
                    type="text"
                    value={form.contacto_emergencia}
                    onChange={(e) => setForm({ ...form, contacto_emergencia: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: María Gutiérrez (Esposa)"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    {editingConductor ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}