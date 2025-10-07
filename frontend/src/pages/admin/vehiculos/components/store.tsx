import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Car } from 'lucide-react';
import type { Vehiculo, VehiculoFormData, ConductorOption } from '@/types';

interface VehiculoStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehiculoFormData) => Promise<boolean>;
  initialData?: Vehiculo | null;
  loading?: boolean;
  conductoresDisponibles: ConductorOption[];
}

export function VehiculoStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  conductoresDisponibles
}: VehiculoStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Vehículo' : 'Crear Vehículo';
  const description = isEdit 
    ? 'Modifica la información del vehículo seleccionado' 
    : 'Agrega un nuevo vehículo al sistema';

  const [formData, setFormData] = useState<VehiculoFormData>({
    nombre: '',
    tipo_vehiculo: '',
    placa: '',
    marca: '',
    modelo: '',
    año_fabricacion: null,
    capacidad_pasajeros: 0,
    capacidad_carga: 0,
    estado: 'activo',
    conductor: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const tiposVehiculo = ["Bus", "Bus Cama", "Minibús", "Camión", "Van"];
  const estados = ["activo", "mantenimiento", "baja"];

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        nombre: initialData.nombre,
        tipo_vehiculo: initialData.tipo_vehiculo,
        placa: initialData.placa,
        marca: initialData.marca,
        modelo: initialData.modelo || '',
        año_fabricacion: initialData.año_fabricacion,
        capacidad_pasajeros: initialData.capacidad_pasajeros,
        capacidad_carga: initialData.capacidad_carga,
        estado: initialData.estado,
        conductor: typeof initialData.conductor === 'object' && initialData.conductor !== null 
          ? initialData.conductor.id 
          : initialData.conductor || null,
        kilometraje: initialData.kilometraje || undefined,
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      setFormData({
        nombre: '',
        tipo_vehiculo: '',
        placa: '',
        marca: '',
        modelo: '',
        año_fabricacion: null,
        capacidad_pasajeros: 0,
        capacidad_carga: 0,
        estado: 'activo',
        conductor: null,
      });
    }
    setErrors({});
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.tipo_vehiculo) {
      newErrors.tipo_vehiculo = 'Debe seleccionar un tipo de vehículo';
    }
    if (!formData.placa.trim()) {
      newErrors.placa = 'La placa es requerida';
    }
    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        nombre: '',
        tipo_vehiculo: '',
        placa: '',
        marca: '',
        modelo: '',
        año_fabricacion: null,
        capacidad_pasajeros: 0,
        capacidad_carga: 0,
        estado: 'activo',
        conductor: null,
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      tipo_vehiculo: '',
      placa: '',
      marca: '',
      modelo: '',
      año_fabricacion: null,
      capacidad_pasajeros: 0,
      capacidad_carga: 0,
      estado: 'activo',
      conductor: null,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div>
                              <Label htmlFor="nombre" className="mb-2 block">Nombre *</Label>
                              <Input
                      id="nombre"
                      placeholder="Nombre del vehículo" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={errors.nombre ? "border-red-500" : ""}
                    />
                    {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                  </div>

                  {/* Tipo de Vehículo */}
                  <div>
                    <Label htmlFor="tipo_vehiculo" className="mb-2 block">Tipo de Vehículo *</Label>
                    <Select 
                      value={formData.tipo_vehiculo} 
                      onValueChange={(value) => setFormData({ ...formData, tipo_vehiculo: value })}
                    >
                      <SelectTrigger className={errors.tipo_vehiculo ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposVehiculo.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tipo_vehiculo && <p className="text-red-500 text-sm mt-1">{errors.tipo_vehiculo}</p>}
                  </div>

                  {/* Placa */}
                  <div>
                    <Label htmlFor="placa" className="mb-2 block">Placa *</Label>
                    <Input 
                      id="placa"
                      placeholder="Placa del vehículo" 
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                      className={errors.placa ? "border-red-500" : ""}
                    />
                    {errors.placa && <p className="text-red-500 text-sm mt-1">{errors.placa}</p>}
                  </div>

                  {/* Marca */}
                  <div>
                    <Label htmlFor="marca" className="mb-2 block">Marca *</Label>
                    <Input 
                      id="marca"
                      placeholder="Marca del vehículo" 
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className={errors.marca ? "border-red-500" : ""}
                    />
                    {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
                  </div>

                  {/* Modelo */}
                  <div>
                    <Label htmlFor="modelo" className="mb-2 block">Modelo</Label>
                    <Input 
                      id="modelo"
                      placeholder="Modelo del vehículo" 
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    />
                  </div>

                  {/* Año de Fabricación */}
                  <div>
                    <Label htmlFor="año_fabricacion" className="mb-2 block">Año de Fabricación</Label>
                    <Input 
                      id="año_fabricacion"
                      type="number" 
                      placeholder="Año de fabricación"
                      value={formData.año_fabricacion || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        año_fabricacion: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Capacidades */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Capacidades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capacidad de Pasajeros */}
                  <div>
                    <Label htmlFor="capacidad_pasajeros" className="mb-2 block">Capacidad de Pasajeros</Label>
                    <Input 
                      id="capacidad_pasajeros"
                      type="number" 
                      min="0"
                      placeholder="Número de pasajeros"
                      value={formData.capacidad_pasajeros}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        capacidad_pasajeros: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>

                  {/* Capacidad de Carga */}
                  <div>
                    <Label htmlFor="capacidad_carga" className="mb-2 block">Capacidad de Carga (kg)</Label>
                    <Input 
                      id="capacidad_carga"
                      type="number" 
                      min="0"
                      placeholder="Capacidad en kilogramos"
                      value={formData.capacidad_carga}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        capacidad_carga: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Estado y Conductor */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estado y Asignación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado */}
                  <div>
                    <Label htmlFor="estado" className="mb-2 block">Estado *</Label>
                    <Select 
                      value={formData.estado} 
                      onValueChange={(value: 'activo' | 'mantenimiento' | 'baja') => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conductor */}
                  <div>
                    <Label htmlFor="conductor" className="mb-2 block">Conductor</Label>
                    <Select 
                      value={formData.conductor ? formData.conductor.toString() : '0'} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        conductor: value === "0" ? null : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sin conductor asignado</SelectItem>
                        {conductoresDisponibles.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id.toString()}>
                            {conductor.nombre} {conductor.apellido} - {conductor.nro_licencia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Kilometraje (Opcional) */}
              <div>
                <Label htmlFor="kilometraje" className="mb-2 block">Kilometraje</Label>
                <Input 
                  id="kilometraje"
                  type="number" 
                  min="0"
                  placeholder="Kilometraje actual"
                  value={formData.kilometraje || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    kilometraje: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}