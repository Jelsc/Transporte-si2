import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Loader2, Search, Users, Mail, X, 
  Briefcase, Building, Calendar, Phone, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/app/layout/admin-layout";

// Interfaces
interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  es_activo: boolean;
}

interface PersonalEmpresa {
  id: number;
  usuario?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    telefono?: string;
  };
  codigo_empleado: string;
  departamento: string; // Es un string, no un objeto
  cargo: string;
  fecha_ingreso: string;
  salario: number;
  es_activo: boolean;
  nombre_completo: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface PersonalForm {
  // Datos personales básicos
  first_name: string;
  last_name: string;
  email: string;
  telefono: string;
  // Datos específicos del personal
  codigo_empleado: string;
  departamento_id: number;
  cargo: string;
  fecha_ingreso: string;
  salario: number;
}

export default function PersonalCRUD() {
  // Estados del componente de personal
  const [personal, setPersonal] = useState<PersonalEmpresa[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<PersonalEmpresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<PersonalForm>({
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    codigo_empleado: "",
    departamento_id: 0,
    cargo: "",
    fecha_ingreso: "",
    salario: 0
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPersonal();
    loadDepartamentos();
  }, []);

  const loadPersonal = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/personal/personal/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonal(data.results || data);
      } else {
        console.error('Error cargando personal:', response.statusText);
      }
    } catch (error) {
      console.error('Error cargando personal:', error);
    }
  };

  const loadDepartamentos = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/personal/departamentos/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartamentos(data.results || data);
      } else {
        console.error('Error cargando departamentos:', response.statusText);
      }
    } catch (error) {
      console.error('Error cargando departamentos:', error);
    }
  };

  // Filtrar personal por búsqueda
  const filteredPersonal = personal.filter(empleado =>
    empleado.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.usuario?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.codigo_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (empleado?: PersonalEmpresa) => {
    if (empleado) {
      setEditingPersonal(empleado);
      setForm({
        first_name: empleado.usuario?.first_name || "",
        last_name: empleado.usuario?.last_name || "",
        email: empleado.usuario?.email || "",
        telefono: empleado.usuario?.telefono || "",
        codigo_empleado: empleado.codigo_empleado,
        departamento_id: departamentos.find(d => d.nombre === empleado.departamento)?.id || 0,
        cargo: empleado.cargo,
        fecha_ingreso: empleado.fecha_ingreso,
        salario: empleado.salario
      });
    } else {
      setEditingPersonal(null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        telefono: "",
        codigo_empleado: "",
        departamento_id: 0,
        cargo: "",
        fecha_ingreso: "",
        salario: 0
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.codigo_empleado || !form.cargo || !form.fecha_ingreso) {
      alert("Los campos marcados con * son obligatorios");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const url = editingPersonal 
        ? `http://localhost:8000/api/personal/personal/${editingPersonal.id}/`
        : 'http://localhost:8000/api/personal/personal/';
      
      const method = editingPersonal ? 'PUT' : 'POST';
      
      const payload: any = {
        // Datos personales básicos
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telefono: form.telefono,
        // Datos específicos del personal
        codigo_empleado: form.codigo_empleado,
        cargo: form.cargo,
        fecha_ingreso: form.fecha_ingreso,
        salario: form.salario
      };

      // Solo incluir departamento si está seleccionado
      if (form.departamento_id && form.departamento_id > 0) {
        const departamentoSeleccionado = departamentos.find(d => d.id === form.departamento_id);
        if (departamentoSeleccionado) {
          payload.departamento = departamentoSeleccionado.nombre;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadPersonal();
        setShowModal(false);
        alert(editingPersonal ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Error al guardar empleado'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/personal/personal/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await loadPersonal();
          alert('Empleado eliminado exitosamente');
        } else {
          alert('Error al eliminar empleado');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar empleado');
      }
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Formatear salario
  const formatSalario = (salario: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(salario);
  };

  // Formatear fecha
  const formatFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-BO');
  };

  // Obtener color del cargo
  const getCargoColor = (cargo: string): string => {
    const colors: Record<string, string> = {
      'Administrador': 'bg-red-100 text-red-800',
      'Supervisor': 'bg-blue-100 text-blue-800',
      'Operador': 'bg-green-100 text-green-800',
      'Gerente': 'bg-purple-100 text-purple-800',
      'Coordinador': 'bg-yellow-100 text-yellow-800',
    };
    return colors[cargo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <AdminLayout>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="text-blue-600" size={28} />
                  Perfiles de Personal de Empresa
                </h1>
                <p className="text-gray-600 mt-1">Gestionar perfiles personales del personal de empresa</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{personal.length}</div>
                <div className="text-sm text-gray-500">Total empleados</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Barra de búsqueda y botón */}
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar empleados..."
                    className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                    {filteredPersonal.length} de {personal.length}
                  </span>
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Nuevo Perfil de Empleado
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas de empleados */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {filteredPersonal.map((empleado) => (
                <Card key={empleado.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {getInitials(empleado.usuario?.first_name || '', empleado.usuario?.last_name || '')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {empleado.nombre_completo}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                          {empleado.usuario?.username && (
                            <span className="font-mono text-xs">@{empleado.usuario.username}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail size={14} />
                            <span>{empleado.usuario?.email || 'Sin email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Briefcase size={14} />
                            <span>{empleado.codigo_empleado}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cargo:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCargoColor(empleado.cargo)}`}>
                          {empleado.cargo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Departamento:</span>
                        <span className="text-sm font-medium">{empleado.departamento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Salario:</span>
                        <span className="text-sm font-medium">{formatSalario(empleado.salario)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ingreso:</span>
                        <span className="text-sm font-medium">{formatFecha(empleado.fecha_ingreso)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(empleado)}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(empleado.id)}
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
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Empleado</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Cargo</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Departamento</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Salario</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPersonal.map((empleado) => (
                        <tr key={empleado.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-medium text-xs">
                                  {getInitials(empleado.usuario?.first_name || '', empleado.usuario?.last_name || '')}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{empleado.nombre_completo}</div>
                                {empleado.usuario?.username && (
                                  <div className="text-sm text-gray-500">@{empleado.usuario.username}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCargoColor(empleado.cargo)}`}>
                              {empleado.cargo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{empleado.departamento}</td>
                          <td className="px-6 py-4 text-gray-700">{formatSalario(empleado.salario)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(empleado)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(empleado.id)}
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
            {filteredPersonal.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Comienza agregando tu primer empleado'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Plus size={16} className="mr-2" />
                    Agregar Primer Empleado
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
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPersonal ? 'Editar Perfil de Empleado' : 'Nuevo Perfil de Empleado'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="Ej: juan@empresa.com"
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
                    placeholder="Ej: Juan"
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
                    placeholder="Ej: Pérez"
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
                    placeholder="Ej: 70012345"
                  />
                </div>

              </div>

              {/* Información del Empleado */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información del Empleado</h3>
                
                <div>
                  <Label htmlFor="codigo_empleado" className="text-sm font-medium text-gray-700">
                    Código de Empleado *
                  </Label>
                  <Input
                    id="codigo_empleado"
                    type="text"
                    value={form.codigo_empleado}
                    onChange={(e) => setForm({ ...form, codigo_empleado: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: EMP001"
                  />
                </div>

                <div>
                  <Label htmlFor="departamento_id" className="text-sm font-medium text-gray-700">
                    Departamento
                  </Label>
                  <Select value={form.departamento_id.toString()} onValueChange={(value) => setForm({ ...form, departamento_id: parseInt(value) })}>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cargo" className="text-sm font-medium text-gray-700">
                    Cargo *
                  </Label>
                  <Input
                    id="cargo"
                    type="text"
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ej: Administrador, Supervisor, Operador"
                  />
                </div>

                <div>
                  <Label htmlFor="fecha_ingreso" className="text-sm font-medium text-gray-700">
                    Fecha de Ingreso *
                  </Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={form.fecha_ingreso}
                    onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="salario" className="text-sm font-medium text-gray-700">
                    Salario
                  </Label>
                  <Input
                    id="salario"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salario}
                    onChange={(e) => setForm({ ...form, salario: parseFloat(e.target.value) || 0 })}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
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
                    {editingPersonal ? 'Actualizar' : 'Crear'}
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