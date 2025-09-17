"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { usersService, rolesService, type User } from "@/services/api";
import { personalService } from "@/services/personalService";
import { conductorService } from "@/services/conductorService";
import type { Personal, Conductor } from "@/types";
import { toast } from "sonner";

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
  permisos: string[];
}

interface UsuarioModalProps {
  usuario?: User | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UsuarioModal({ usuario, isOpen, onClose, onSuccess }: UsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Asegurar que roles siempre sea un array - CACHE FIX
  const safeRoles = Array.isArray(roles) ? roles : [];
  const [personalOptions, setPersonalOptions] = useState<Personal[]>([]);
  const [conductorOptions, setConductorOptions] = useState<Conductor[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const isEditing = !!usuario;

  const [formData, setFormData] = useState({
    username: usuario?.username || "",
    first_name: usuario?.first_name || "",
    last_name: usuario?.last_name || "",
    email: usuario?.email || "",
    phone: usuario?.telefono || "",
    password: "",
    password_confirm: "",
    rol_id: usuario?.rol?.id || 0,
    personal: usuario?.personal || 0,
    conductor: usuario?.conductor || 0,
    is_admin_portal: usuario?.is_admin_portal || false,
    es_activo: usuario?.es_activo ?? true,
  });

  useEffect(() => {
    if (!isOpen) return; // Solo cargar datos cuando el modal esté abierto
    
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        // Cargar roles
        const rolesResponse = await rolesService.getRoles();
        if (rolesResponse.success && rolesResponse.data) {
          setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
        } else {
          console.error("Error al cargar roles:", rolesResponse);
          // Roles por defecto si falla la carga
          setRoles([
            { id: 1, nombre: "Administrador", descripcion: "Administrador del sistema", es_administrativo: true, permisos: [] },
            { id: 2, nombre: "Cliente", descripcion: "Cliente del sistema", es_administrativo: false, permisos: [] },
            { id: 3, nombre: "Supervisor", descripcion: "Supervisor", es_administrativo: true, permisos: [] },
            { id: 4, nombre: "Conductor", descripcion: "Conductor", es_administrativo: false, permisos: [] },
            { id: 5, nombre: "Operador", descripcion: "Operador", es_administrativo: true, permisos: [] }
          ]);
        }

        // Cargar personal disponible
        const personalResponse = await personalService.getPersonalDisponible();
        if (personalResponse.success && personalResponse.data) {
          setPersonalOptions(personalResponse.data as unknown as Personal[]);
        }

        // Cargar conductores disponibles
        const conductorResponse = await conductorService.getConductoresDisponibles();
        if (conductorResponse.success && conductorResponse.data) {
          setConductorOptions(conductorResponse.data as unknown as Conductor[]);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos del formulario");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Autocompletar datos si se selecciona personal o conductor
    if (field === "personal" && value) {
      const selectedPersonal = personalOptions.find(p => p.id === value);
      if (selectedPersonal) {
        setFormData(prev => ({
          ...prev,
          first_name: selectedPersonal.nombre,
          last_name: selectedPersonal.apellido,
          email: selectedPersonal.email,
          phone: selectedPersonal.telefono,
        }));
      }
    }

    if (field === "conductor" && value) {
      const selectedConductor = conductorOptions.find(c => c.id === value);
      if (selectedConductor) {
        setFormData(prev => ({
          ...prev,
          first_name: selectedConductor.nombre,
          last_name: selectedConductor.apellido,
          email: selectedConductor.email,
          phone: selectedConductor.telefono,
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast.error("El nombre de usuario es requerido");
      return false;
    }
    if (!formData.first_name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error("El apellido es requerido");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return false;
    }
    if (!formData.rol_id) {
      toast.error("El rol es requerido");
      return false;
    }
    if (!isEditing && !formData.password.trim()) {
      toast.error("La contraseña es requerida");
      return false;
    }
    if (!isEditing && formData.password !== formData.password_confirm) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        rol_id: formData.rol_id,
        personal: formData.personal || null,
        conductor: formData.conductor || null,
        is_admin_portal: formData.is_admin_portal,
        es_activo: formData.es_activo,
        ...(formData.password && { password: formData.password }),
      };

      let response;
      if (isEditing && usuario) {
        response = await usersService.updateUser(usuario.id, {
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          rol_id: userData.rol_id,
          telefono: userData.phone,
          is_admin_portal: userData.is_admin_portal,
          ...(userData.personal && { personal_id: userData.personal }),
          ...(userData.conductor && { conductor_id: userData.conductor }),
          ...(userData.password && { password: userData.password }),
          password_confirm: userData.password || ""
        });
      } else {
        response = await usersService.createUser({
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          rol_id: userData.rol_id,
          telefono: userData.phone,
          is_admin_portal: userData.is_admin_portal,
          ...(userData.personal && { personal_id: userData.personal }),
          ...(userData.conductor && { conductor_id: userData.conductor }),
          password: userData.password || "",
          password_confirm: userData.password || ""
        });
      }

      if (response.success) {
        toast.success(isEditing ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Error al guardar el usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              Cargando datos del formulario...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando datos...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del usuario"
              : "Completa la información del nuevo usuario"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <Input
                id="username"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                placeholder="Nombre"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                placeholder="Apellido"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rol_id">Rol *</Label>
              <Select 
                value={formData.rol_id.toString()} 
                onValueChange={(value) => handleInputChange("rol_id", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {safeRoles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personal">Personal (Opcional)</Label>
              <Select 
                value={formData.personal.toString()} 
                onValueChange={(value) => handleInputChange("personal", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ninguno</SelectItem>
                  {personalOptions.map((personal) => (
                    <SelectItem key={personal.id} value={personal.id.toString()}>
                      {personal.nombre} {personal.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductor">Conductor (Opcional)</Label>
              <Select 
                value={formData.conductor.toString()} 
                onValueChange={(value) => handleInputChange("conductor", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ninguno</SelectItem>
                  {conductorOptions.map((conductor) => (
                    <SelectItem key={conductor.id} value={conductor.id.toString()}>
                      {conductor.nombre} {conductor.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirmar Contraseña *</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={formData.password_confirm}
                  onChange={(e) => handleInputChange("password_confirm", e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_admin_portal"
              checked={formData.is_admin_portal}
              onCheckedChange={(checked) => handleInputChange("is_admin_portal", checked)}
            />
            <Label htmlFor="is_admin_portal">Acceso al panel administrativo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="es_activo"
              checked={formData.es_activo}
              onCheckedChange={(checked) => handleInputChange("es_activo", checked)}
            />
            <Label htmlFor="es_activo">Usuario activo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
