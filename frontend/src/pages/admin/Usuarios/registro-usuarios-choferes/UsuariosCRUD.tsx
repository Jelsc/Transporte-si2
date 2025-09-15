import React, { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Loader2, Search, Users, Mail, X, Shield, 
  UserPlus, Link, Car, Briefcase, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/app/layout/admin-layout";

// Interfaces
interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  rol?: {
    id: number;
    nombre: string;
    es_administrativo: boolean;
  };
  es_activo: boolean;
  fecha_creacion: string;
  // Perfiles vinculados (opcionales)
  conductor_profile?: {
    id: number;
    numero_licencia: string;
    tipo_licencia: string;
    estado: string;
    nombre_completo: string;
  };
  personal_profile?: {
    id: number;
    codigo_empleado: string;
    nombre_completo: string;
    departamento: string;
    cargo: string;
  };
}

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
}

interface Conductor {
  id: number;
  numero_licencia: string;
  nombre_completo: string;
  estado: string;
  tipo_licencia: string;
  fecha_vencimiento: string;
  // Sin usuario vinculado
  usuario?: null;
}

interface PersonalEmpresa {
  id: number;
  codigo_empleado: string;
  nombre_completo: string;
  departamento: string; // Es un string, no un objeto
  cargo: string;
  // Sin usuario vinculado
  usuario?: null;
}

interface UsuarioForm {
  // Datos básicos del usuario
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  telefono: string;
  direccion: string;
  rol_id: string;
  // Vinculación con perfiles existentes (opcional)
  conductor_id: string; // ID del conductor a vincular
  personal_id: string;  // ID del personal a vincular
}

export default function UsuariosCRUD() {
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [personal, setPersonal] = useState<PersonalEmpresa[]>([]);
  
  // Estados del modal
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<UsuarioForm>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    telefono: "",
    direccion: "",
    rol_id: "",
    conductor_id: "none",
    personal_id: "none"
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadUsuarios();
    loadRoles();
    loadConductores();
    loadPersonal();
  }, []);

  const loadUsuarios = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.results || data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/roles/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.results || data);
      }
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Error cargando conductores:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Error cargando personal:', error);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${usuario.first_name} ${usuario.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.rol?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setForm({
        username: usuario.username,
        email: usuario.email,
        first_name: usuario.first_name,
        last_name: usuario.last_name,
        password: "", // No mostrar contraseña existente
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        rol_id: usuario.rol?.id.toString() || "",
        conductor_id: usuario.conductor_profile?.id.toString() || "none",
        personal_id: usuario.personal_profile?.id.toString() || "none"
      });
    } else {
      setEditingUsuario(null);
      setForm({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        telefono: "",
        direccion: "",
        rol_id: "",
        conductor_id: "none",
        personal_id: "none"
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email || !form.rol_id) {
      alert("Username, email y rol son obligatorios");
      return;
    }

    if (!editingUsuario && !form.password) {
      alert("La contraseña es obligatoria para nuevos usuarios");
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const url = editingUsuario 
        ? `http://localhost:8000/api/admin/users/${editingUsuario.id}/`
        : 'http://localhost:8000/api/admin/users/';
      
      const method = editingUsuario ? 'PUT' : 'POST';
      
      const payload: any = {
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        telefono: form.telefono,
        direccion: form.direccion,
        rol: parseInt(form.rol_id)
      };

      // Solo incluir contraseña si es nuevo usuario o se está cambiando
      if (!editingUsuario || form.password) {
        payload.password = form.password;
      }

      // Incluir vinculación con perfiles si se seleccionaron
      if (form.conductor_id && form.conductor_id !== "none") {
        payload.conductor_id = parseInt(form.conductor_id);
      }
      if (form.personal_id && form.personal_id !== "none") {
        payload.personal_id = parseInt(form.personal_id);
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
        await loadUsuarios();
        setShowModal(false);
        alert(editingUsuario ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Error al guardar usuario'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/api/admin/users/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await loadUsuarios();
          alert('Usuario eliminado exitosamente');
        } else {
          alert('Error al eliminar usuario');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar usuario');
      }
    }
  };

  const handleLinkConductor = async (usuarioId: number, conductorId: string) => {
    if (!conductorId) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/conductores/conductores/${conductorId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario: usuarioId })
      });

      if (response.ok) {
        await loadUsuarios();
        alert('Conductor vinculado exitosamente');
      } else {
        alert('Error al vincular conductor');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al vincular conductor');
    }
  };

  const handleLinkPersonal = async (usuarioId: number, personalId: string) => {
    if (!personalId) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/personal/personal/${personalId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario: usuarioId })
      });

      if (response.ok) {
        await loadUsuarios();
        alert('Personal vinculado exitosamente');
      } else {
        alert('Error al vincular personal');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al vincular personal');
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Obtener color del rol
  const getRolColor = (rol: string): string => {
    const colors: Record<string, string> = {
      'administrador': 'bg-red-100 text-red-800',
      'supervisor': 'bg-blue-100 text-blue-800',
      'operador': 'bg-green-100 text-green-800',
      'conductor': 'bg-yellow-100 text-yellow-800',
      'cliente': 'bg-gray-100 text-gray-800',
    };
    return colors[rol.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Filtrar conductores disponibles (sin usuario vinculado)
  const conductoresDisponibles = conductores.filter(conductor => 
    !usuarios.some(usuario => usuario.conductor_profile?.id === conductor.id)
  );

  // Filtrar personal disponible (sin usuario vinculado)
  const personalDisponible = personal.filter(emp => 
    !usuarios.some(usuario => usuario.personal_profile?.id === emp.id)
  );

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
                  Creación y Vinculación de Usuarios
                </h1>
                <p className="text-gray-600 mt-1">Crear usuarios y vincular con perfiles de conductores o personal</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{usuarios.length}</div>
                <div className="text-sm text-gray-500">Total usuarios</div>
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
                placeholder="Buscar usuarios..."
                className="pl-10 pr-4 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
                {filteredUsuarios.length} de {usuarios.length}
              </span>
              <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus size={16} className="mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de tarjetas de usuarios */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {filteredUsuarios.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">
                      {getInitials(usuario.first_name, usuario.last_name)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {usuario.first_name} {usuario.last_name}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                      <Mail size={14} />
                      <span>{usuario.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                      <span className="font-mono text-xs">@{usuario.username}</span>
                    </div>
                    {usuario.rol && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol.nombre)}`}>
                        {usuario.rol.nombre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Información de perfil vinculado */}
                {usuario.conductor_profile && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <Car size={14} />
                      <span>Conductor: {usuario.conductor_profile.numero_licencia}</span>
                    </div>
                  </div>
                )}

                {usuario.personal_profile && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <Briefcase size={14} />
                      <span>Personal: {usuario.personal_profile.codigo_empleado}</span>
                    </div>
                  </div>
                )}

                {/* Vinculaciones disponibles */}
                {usuario.rol?.es_administrativo && !usuario.conductor_profile && !usuario.personal_profile && (
                  <div className="mb-3 space-y-2">
                    {conductoresDisponibles.length > 0 && (
                      <Select onValueChange={(value) => handleLinkConductor(usuario.id, value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Vincular conductor" />
                        </SelectTrigger>
                        <SelectContent>
                          {conductoresDisponibles.map((conductor) => (
                            <SelectItem key={conductor.id} value={conductor.id.toString()}>
                              {conductor.nombre_completo} - {conductor.numero_licencia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {personalDisponible.length > 0 && (
                      <Select onValueChange={(value) => handleLinkPersonal(usuario.id, value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Vincular personal" />
                        </SelectTrigger>
                        <SelectContent>
                          {personalDisponible.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.nombre_completo} - {emp.codigo_empleado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(usuario)}
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit2 size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(usuario.id)}
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Usuario</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Rol</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Perfil</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-medium text-xs">
                              {getInitials(usuario.first_name, usuario.last_name)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {usuario.first_name} {usuario.last_name}
                            </div>
                            <div className="text-sm text-gray-500">@{usuario.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{usuario.email}</td>
                      <td className="px-6 py-4">
                        {usuario.rol && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol.nombre)}`}>
                            {usuario.rol.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {usuario.conductor_profile && (
                          <div className="flex items-center gap-1 text-yellow-700 text-sm">
                            <Car size={14} />
                            <span>{usuario.conductor_profile.numero_licencia}</span>
                          </div>
                        )}
                        {usuario.personal_profile && (
                          <div className="flex items-center gap-1 text-green-700 text-sm">
                            <Briefcase size={14} />
                            <span>{usuario.personal_profile.codigo_empleado}</span>
                          </div>
                        )}
                        {!usuario.conductor_profile && !usuario.personal_profile && (
                          <span className="text-gray-400 text-sm">Sin perfil</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(usuario)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(usuario.id)}
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
        {filteredUsuarios.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza creando tu primer usuario'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus size={16} className="mr-2" />
                Crear Primer Usuario
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
              <h3 className="text-lg font-bold text-gray-900">
                {editingUsuario ? "Editar Usuario" : "Crear Usuario"}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username *
                </Label>
                <Input
                  id="username"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="usuario123"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="first_name"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Juan"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Pérez"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {editingUsuario ? "Nueva Contraseña (opcional)" : "Contraseña *"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="70123456"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Calle 123, Ciudad"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="rol_id" className="text-sm font-medium text-gray-700">
                  Rol *
                </Label>
                <Select value={form.rol_id} onValueChange={(value) => setForm({ ...form, rol_id: value })}>
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <span>{rol.nombre}</span>
                          <span className="text-xs text-gray-500">({rol.es_administrativo ? 'Admin' : 'Cliente'})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sección de vinculación con perfiles existentes */}
              <div className="md:col-span-2">
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Link size={16} className="text-blue-600" />
                    Vincular con Perfil Existente (Opcional)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona un conductor o personal existente para vincular con este usuario
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vinculación con Conductor */}
                    <div>
                      <Label htmlFor="conductor_id" className="text-sm font-medium text-gray-700">
                        Conductor
                      </Label>
                      <Select 
                        value={form.conductor_id} 
                        onValueChange={(value) => setForm({ ...form, conductor_id: value, personal_id: "none" })}
                      >
                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar conductor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin conductor</SelectItem>
                          {conductores.filter(c => !c.usuario).map((conductor) => (
                            <SelectItem key={conductor.id} value={conductor.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Car size={14} />
                                <span>{conductor.nombre_completo}</span>
                                <span className="text-xs text-gray-500">({conductor.numero_licencia})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vinculación con Personal */}
                    <div>
                      <Label htmlFor="personal_id" className="text-sm font-medium text-gray-700">
                        Personal de Empresa
                      </Label>
                      <Select 
                        value={form.personal_id} 
                        onValueChange={(value) => setForm({ ...form, personal_id: value, conductor_id: "none" })}
                      >
                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar personal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin personal</SelectItem>
                          {personal.filter(p => !p.usuario).map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Briefcase size={14} />
                                <span>{emp.nombre_completo}</span>
                                <span className="text-xs text-gray-500">({emp.codigo_empleado})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                  editingUsuario ? "Actualizar" : "Crear Usuario"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
