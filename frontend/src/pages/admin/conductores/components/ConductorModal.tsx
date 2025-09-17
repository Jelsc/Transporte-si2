"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { conductorService } from "@/services/conductorService";
import { toast } from "sonner";
import type { Conductor } from "@/types";

interface ConductorModalProps {
  conductor?: Conductor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConductorModal({ conductor, isOpen, onClose, onSuccess }: ConductorModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!conductor;

  // Form state
  const [formData, setFormData] = useState({
    nombre: conductor?.nombre || "",
    apellido: conductor?.apellido || "",
    fecha_nacimiento: conductor?.fecha_nacimiento || "",
    telefono: conductor?.telefono || "",
    email: conductor?.email || "",
    ci: conductor?.ci || "",
    nro_licencia: conductor?.nro_licencia || "",
    tipo_licencia: conductor?.tipo_licencia || "",
    fecha_venc_licencia: conductor?.fecha_venc_licencia || "",
    experiencia_anios: conductor?.experiencia_anios || 0,
    telefono_emergencia: conductor?.telefono_emergencia || "",
    contacto_emergencia: conductor?.contacto_emergencia || "",
    es_activo: conductor?.es_activo ?? true,
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
    if (!formData.nro_licencia.trim()) {
      toast.error("El número de licencia es requerido");
      return false;
    }
    if (!formData.tipo_licencia) {
      toast.error("El tipo de licencia es requerido");
      return false;
    }
    if (!formData.fecha_venc_licencia) {
      toast.error("La fecha de vencimiento es requerida");
      return false;
    }
    if (formData.experiencia_anios < 0) {
      toast.error("La experiencia debe ser mayor o igual a 0");
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
      
      if (isEditing && conductor) {
        response = await conductorService.updateConductor(conductor.id, formData);
      } else {
        response = await conductorService.createConductor(formData);
      }

      if (response.success) {
        toast.success(
          isEditing 
            ? "Conductor actualizado exitosamente" 
            : "Conductor creado exitosamente"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(response.error || "Error al guardar el conductor");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Conductor" : "Nuevo Conductor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica la información del conductor" 
              : "Completa la información del nuevo conductor"
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
              <Label htmlFor="nro_licencia">Número de Licencia *</Label>
              <Input
                id="nro_licencia"
                placeholder="Número de licencia"
                value={formData.nro_licencia}
                onChange={(e) => handleInputChange("nro_licencia", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_licencia">Tipo de Licencia *</Label>
              <Select 
                value={formData.tipo_licencia} 
                onValueChange={(value) => handleInputChange("tipo_licencia", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
                  <SelectItem value="B">Tipo B - Vehículos particulares</SelectItem>
                  <SelectItem value="C">Tipo C - Vehículos de carga liviana</SelectItem>
                  <SelectItem value="D">Tipo D - Vehículos de carga pesada</SelectItem>
                  <SelectItem value="E">Tipo E - Vehículos de transporte público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_venc_licencia">Fecha de Vencimiento *</Label>
              <Input
                id="fecha_venc_licencia"
                type="date"
                value={formData.fecha_venc_licencia}
                onChange={(e) => handleInputChange("fecha_venc_licencia", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiencia_anios">Años de Experiencia *</Label>
              <Input
                id="experiencia_anios"
                type="number"
                min="0"
                value={formData.experiencia_anios}
                onChange={(e) => handleInputChange("experiencia_anios", Number(e.target.value))}
                required
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
