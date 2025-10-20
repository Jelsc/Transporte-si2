import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ConductorOption } from '@/types/conductor';
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
import { Loader2, Package, User, MapPin, DollarSign } from 'lucide-react';
import type { Encomienda, CreateEncomiendaRequest } from '@/types/encomienda';

interface EncomiendaStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEncomiendaRequest) => Promise<boolean>;
  initialData?: Encomienda | null;
  loading?: boolean;
  conductoresDisponibles: ConductorOption[];
}

export function EncomiendaStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  conductoresDisponibles 
}: EncomiendaStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Encomienda' : 'Registrar Encomienda';
  const description = isEdit 
    ? 'Modifica la información de la encomienda seleccionada' 
    : 'Registra una nueva encomienda en el sistema';

  const [formData, setFormData] = useState<CreateEncomiendaRequest>({
    remitente_nombre: '',
    remitente_telefono: '',
    remitente_direccion: '',
    destinatario_nombre: '',
    destinatario_telefono: '',
    destino_ciudad: '',
    destino_direccion: '',
    descripcion: '',
    peso: 0,
    notas: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosi", "Tarija", "Beni", "Pando"];

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        remitente_nombre: initialData.remitente_nombre,
        remitente_telefono: initialData.remitente_telefono,
        remitente_direccion: initialData.remitente_direccion || '',
        destinatario_nombre: initialData.destinatario_nombre,
        destinatario_telefono: initialData.destinatario_telefono,
        destino_ciudad: initialData.destino_ciudad,
        destino_direccion: initialData.destino_direccion,
        descripcion: initialData.descripcion,
        peso: initialData.peso,
        notas: initialData.notas || ''
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      setFormData({
        remitente_nombre: '',
        remitente_telefono: '',
        remitente_direccion: '',
        destinatario_nombre: '',
        destinatario_telefono: '',
        destino_ciudad: '',
        destino_direccion: '',
        descripcion: '',
        peso: 0,
        notas: ''
      });
    }
    setErrors({});
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.remitente_nombre.trim()) {
      newErrors.remitente_nombre = 'El nombre del remitente es requerido';
    }
    if (!formData.remitente_telefono.trim()) {
      newErrors.remitente_telefono = 'El teléfono del remitente es requerido';
    }
    if (!formData.destinatario_nombre.trim()) {
      newErrors.destinatario_nombre = 'El nombre del destinatario es requerido';
    }
    if (!formData.destinatario_telefono.trim()) {
      newErrors.destinatario_telefono = 'El teléfono del destinatario es requerido';
    }
    if (!formData.destino_ciudad) {
      newErrors.destino_ciudad = 'La ciudad de destino es requerida';
    }
    if (!formData.destino_direccion.trim()) {
      newErrors.destino_direccion = 'La dirección de destino es requerida';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción del contenido es requerida';
    }
    if (formData.peso <= 0) {
      newErrors.peso = 'El peso debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularPrecio = (peso: number, destino: string): number => {
    const preciosBase: Record<string, number> = {
      'La Paz': 20, 'Santa Cruz': 25, 'Cochabamba': 22, 'Oruro': 18,
      'Potosi': 20, 'Tarija': 23, 'Beni': 30, 'Pando': 35
    };
    
    const base = preciosBase[destino] || 25;
    const adicionalPeso = peso > 1 ? (peso - 1) * 5 : 0;
    
    return base + adicionalPeso;
  };

  const precioCalculado = calcularPrecio(formData.peso, formData.destino_ciudad);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        remitente_nombre: '',
        remitente_telefono: '',
        remitente_direccion: '',
        destinatario_nombre: '',
        destinatario_telefono: '',
        destino_ciudad: '',
        destino_direccion: '',
        descripcion: '',
        peso: 0,
        notas: ''
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      remitente_nombre: '',
      remitente_telefono: '',
      remitente_direccion: '',
      destinatario_nombre: '',
      destinatario_telefono: '',
      destino_ciudad: '',
      destino_direccion: '',
      descripcion: '',
      peso: 0,
      notas: ''
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
                <Package className="h-5 w-5" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información del Remitente */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información del Remitente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="remitente_nombre" className="mb-2 block">Nombre Completo *</Label>
                    <Input
                      id="remitente_nombre"
                      placeholder="Nombre del remitente"
                      value={formData.remitente_nombre}
                      onChange={(e) => setFormData({ ...formData, remitente_nombre: e.target.value })}
                      className={errors.remitente_nombre ? "border-red-500" : ""}
                    />
                    {errors.remitente_nombre && <p className="text-red-500 text-sm mt-1">{errors.remitente_nombre}</p>}
                  </div>

                  <div>
                    <Label htmlFor="remitente_telefono" className="mb-2 block">Teléfono *</Label>
                    <Input
                      id="remitente_telefono"
                      placeholder="Número de teléfono"
                      value={formData.remitente_telefono}
                      onChange={(e) => setFormData({ ...formData, remitente_telefono: e.target.value })}
                      className={errors.remitente_telefono ? "border-red-500" : ""}
                    />
                    {errors.remitente_telefono && <p className="text-red-500 text-sm mt-1">{errors.remitente_telefono}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="remitente_direccion" className="mb-2 block">Dirección (Opcional)</Label>
                    <Input
                      id="remitente_direccion"
                      placeholder="Dirección completa del remitente"
                      value={formData.remitente_direccion}
                      onChange={(e) => setFormData({ ...formData, remitente_direccion: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Información del Destinatario */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Información del Destinatario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="destinatario_nombre" className="mb-2 block">Nombre Completo *</Label>
                    <Input
                      id="destinatario_nombre"
                      placeholder="Nombre del destinatario"
                      value={formData.destinatario_nombre}
                      onChange={(e) => setFormData({ ...formData, destinatario_nombre: e.target.value })}
                      className={errors.destinatario_nombre ? "border-red-500" : ""}
                    />
                    {errors.destinatario_nombre && <p className="text-red-500 text-sm mt-1">{errors.destinatario_nombre}</p>}
                  </div>

                  <div>
                    <Label htmlFor="destinatario_telefono" className="mb-2 block">Teléfono *</Label>
                    <Input
                      id="destinatario_telefono"
                      placeholder="Número de teléfono"
                      value={formData.destinatario_telefono}
                      onChange={(e) => setFormData({ ...formData, destinatario_telefono: e.target.value })}
                      className={errors.destinatario_telefono ? "border-red-500" : ""}
                    />
                    {errors.destinatario_telefono && <p className="text-red-500 text-sm mt-1">{errors.destinatario_telefono}</p>}
                  </div>
                </div>
              </div>

              {/* Información de Destino */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Información de Destino
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="destino_ciudad" className="mb-2 block">Ciudad de Destino *</Label>
                    <Select 
                      value={formData.destino_ciudad} 
                      onValueChange={(value) => setFormData({ ...formData, destino_ciudad: value })}
                    >
                      <SelectTrigger className={errors.destino_ciudad ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {ciudades.map((ciudad) => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.destino_ciudad && <p className="text-red-500 text-sm mt-1">{errors.destino_ciudad}</p>}
                  </div>

                  <div>
                    <Label htmlFor="destino_direccion" className="mb-2 block">Dirección de Destino *</Label>
                    <Input
                      id="destino_direccion"
                      placeholder="Dirección completa de destino"
                      value={formData.destino_direccion}
                      onChange={(e) => setFormData({ ...formData, destino_direccion: e.target.value })}
                      className={errors.destino_direccion ? "border-red-500" : ""}
                    />
                    {errors.destino_direccion && <p className="text-red-500 text-sm mt-1">{errors.destino_direccion}</p>}
                  </div>
                </div>
              </div>

              {/* Detalles de la Encomienda */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Detalles de la Encomienda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="peso" className="mb-2 block">Peso (kg) *</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
                      className={errors.peso ? "border-red-500" : ""}
                    />
                    {errors.peso && <p className="text-red-500 text-sm mt-1">{errors.peso}</p>}
                  </div>

                  <div>
                    <Label htmlFor="precio_calculado" className="mb-2 block">Precio Calculado</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-green-700">
                        {precioCalculado.toFixed(2)} BOB
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcion" className="mb-2 block">Descripción del Contenido *</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe el contenido del paquete..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className={errors.descripcion ? "border-red-500" : ""}
                      rows={3}
                    />
                    {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notas" className="mb-2 block">Notas Adicionales (Opcional)</Label>
                    <Textarea
                      id="notas"
                      placeholder="Instrucciones especiales, observaciones..."
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
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
                  {isEdit ? 'Actualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}