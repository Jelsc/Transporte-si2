"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { personalService } from "@/services/personalService";
import { toast } from "sonner";
import type { Personal } from "@/types";

interface PersonalModalProps {
  personal?: Personal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PersonalModal({ personal, isOpen, onClose, onSuccess }: PersonalModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!personal;

  // Form state
  const [formData, setFormData] = useState({
    nombre: personal?.nombre || "",
    apellido: personal?.apellido || "",
    fecha_nacimiento: personal?.fecha_nacimiento || "",
    telefono: personal?.telefono || "",
    email: personal?.email || "",
    ci: personal?.ci || "",
    codigo_empleado: personal?.codigo_empleado || "",
    departamento: personal?.departamento || "",
    fecha_ingreso: personal?.fecha_ingreso || "",
    telefono_emergencia: personal?.telefono_emergencia || "",
    contacto_emergencia: personal?.contacto_emergencia || "",
    es_activo: personal?.es_activo ?? true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }
    if (!formData.apellido.trim()) {
      toast.error("El apellido es requerido");
      return false;
    }
    if (!formData.fecha_nacimiento) {
      toast.error("La fecha de nacimiento es requerida");
      return false;
    }
    if (!formData.telefono.trim()) {
      toast.error("El teléfono es requerido");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return false;
    }
    if (!formData.ci.trim()) {
      toast.error("La CI es requerida");
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      if (isEditing && personal) {
        response = await personalService.updatePersonal(personal.id, formData);
      } else {
        response = await personalService.createPersonal(formData);
      }

      if (response.success) {
        toast.success(
          isEditing 
            ? "Personal actualizado exitosamente" 
            : "Personal creado exitosamente"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(response.error || "Error al guardar el personal");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Personal" : "Nuevo Personal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica la información del personal" 
              : "Completa la información del nuevo personal"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                placeholder="Apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange("apellido", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="ci">CI *</Label>
              <Input
                id="ci"
                placeholder="Cédula de Identidad"
                value={formData.ci}
                onChange={(e) => handleInputChange("ci", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_empleado">Código de Empleado</Label>
              <Input
                id="codigo_empleado"
                placeholder="Código de empleado"
                value={formData.codigo_empleado}
                onChange={(e) => handleInputChange("codigo_empleado", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                placeholder="Departamento"
                value={formData.departamento}
                onChange={(e) => handleInputChange("departamento", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
              <Input
                id="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => handleInputChange("fecha_ingreso", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
              <Input
                id="telefono_emergencia"
                placeholder="Teléfono de emergencia"
                value={formData.telefono_emergencia}
                onChange={(e) => handleInputChange("telefono_emergencia", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label>
              <Input
                id="contacto_emergencia"
                placeholder="Nombre del contacto"
                value={formData.contacto_emergencia}
                onChange={(e) => handleInputChange("contacto_emergencia", e.target.value)}
              />
            </div>
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
