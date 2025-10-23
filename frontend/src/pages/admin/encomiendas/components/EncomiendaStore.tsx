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
import { Loader2, Package, User, MapPin, DollarSign, Truck, Calendar } from 'lucide-react';
import type { Encomienda, CreateEncomiendaRequest, UpdateEncomiendaRequest } from '@/types/encomienda';

// Tipo combinado para el formulario que incluye todos los campos posibles
interface EncomiendaFormData extends CreateEncomiendaRequest {
  // Campos adicionales para edición
  estado?: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  conductor_asignado?: number | undefined;
  fecha_entrega_real?: string | undefined;
}

interface EncomiendaStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
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

  const [formData, setFormData] = useState<EncomiendaFormData>({
    // Campos para creación
    remitente_nombre: '',
    remitente_telefono: '',
    remitente_direccion: '',
    destinatario_nombre: '',
    destinatario_telefono: '',
    destino_ciudad: '',
    destino_direccion: '',
    descripcion: '',
    peso: 0,
    notas: '',
    metodo_pago: 'efectivo',
    
    // Campos para edición (opcionales)
    estado: 'pendiente',
    fecha_entrega_real: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [precioCalculado, setPrecioCalculado] = useState(0);

  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosi", "Tarija", "Beni", "Pando"];
  const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_ruta', label: 'En Ruta' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'stripe', label: 'Tarjeta (Stripe)' }
  ];

  // Calcular precio cuando cambian ciudad o peso
  useEffect(() => {
    if (formData.destino_ciudad && (formData as CreateEncomiendaRequest).peso) {
      const precio = calcularPrecio(
        (formData as CreateEncomiendaRequest).peso, 
        formData.destino_ciudad
      );
      setPrecioCalculado(precio);
    }
  }, [(formData as CreateEncomiendaRequest).peso, formData.destino_ciudad]);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Modo edición
        setFormData({
          estado: initialData.estado,
          conductor_asignado: initialData.conductor_asignado,
          fecha_entrega_real: initialData.fecha_entrega_real || '',
          notas: initialData.notas || '',
          
          // Para mostrar en el formulario (solo lectura en edición)
          remitente_nombre: initialData.remitente_nombre,
          remitente_telefono: initialData.remitente_telefono,
          remitente_direccion: initialData.remitente_direccion || '',
          destinatario_nombre: initialData.destinatario_nombre,
          destinatario_telefono: initialData.destinatario_telefono,
          destino_ciudad: initialData.destino_ciudad,
          destino_direccion: initialData.destino_direccion,
          descripcion: initialData.descripcion,
          peso: initialData.peso,
          metodo_pago: (initialData.metodo_pago as 'efectivo' | 'transferencia' | 'stripe') || 'efectivo',
        });
        
        // Calcular precio inicial
        const precio = calcularPrecio(initialData.peso, initialData.destino_ciudad);
        setPrecioCalculado(precio);
      } else {
        // Modo creación - resetear formulario
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
          notas: '',
          metodo_pago: 'efectivo',
          estado: 'pendiente',
          conductor_asignado: undefined,
          fecha_entrega_real: '',
        });
        setPrecioCalculado(0);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const calcularPrecio = (peso: number, destino: string): number => {
    const preciosBase: Record<string, number> = {
      'La Paz': 20, 'Santa Cruz': 25, 'Cochabamba': 22, 'Oruro': 18,
      'Potosi': 20, 'Tarija': 23, 'Beni': 30, 'Pando': 35
    };
    
    const base = preciosBase[destino] || 25;
    const adicionalPeso = peso > 1 ? (peso - 1) * 5 : 0;
    
    return base + adicionalPeso;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!isEdit) {
      // Validaciones solo para creación
      if (!formData.remitente_nombre?.trim()) {
        newErrors.remitente_nombre = 'El nombre del remitente es requerido';
      }
      if (!formData.remitente_telefono?.trim()) {
        newErrors.remitente_telefono = 'El teléfono del remitente es requerido';
      }
      if (!formData.destinatario_nombre?.trim()) {
        newErrors.destinatario_nombre = 'El nombre del destinatario es requerido';
      }
      if (!formData.destinatario_telefono?.trim()) {
        newErrors.destinatario_telefono = 'El teléfono del destinatario es requerido';
      }
      if (!formData.destino_ciudad) {
        newErrors.destino_ciudad = 'La ciudad de destino es requerida';
      }
      if (!formData.destino_direccion?.trim()) {
        newErrors.destino_direccion = 'La dirección de destino es requerida';
      }
      if (!formData.descripcion?.trim()) {
        newErrors.descripcion = 'La descripción del contenido es requerida';
      }
      if ((formData as CreateEncomiendaRequest).peso <= 0) {
        newErrors.peso = 'El peso debe ser mayor a 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Preparar datos según el modo (creación o edición)
    let submitData: any;
    if (isEdit) {
      // En edición, solo enviar campos editables
      submitData = {
        estado: formData.estado,
        conductor_asignado: formData.conductor_asignado,
        fecha_entrega_real: formData.fecha_entrega_real,
        notas: formData.notas,
      };
    } else {
      // En creación, enviar todos los datos
      submitData = {
        ...formData,
        metodo_pago: formData.metodo_pago || 'efectivo'
      };
    }

    const success = await onSubmit(submitData);
    if (success) {
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
      notas: '',
      metodo_pago: 'efectivo',
      estado: 'pendiente',
      conductor_asignado: undefined,
      fecha_entrega_real: '',
    });
    setErrors({});
    setPrecioCalculado(0);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peso' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
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
              {/* Información del Remitente - Solo en creación */}
              {!isEdit && (
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
                        name="remitente_nombre"
                        placeholder="Nombre del remitente"
                        value={formData.remitente_nombre || ''}
                        onChange={handleInputChange}
                        className={errors.remitente_nombre ? "border-red-500" : ""}
                      />
                      {errors.remitente_nombre && <p className="text-red-500 text-sm mt-1">{errors.remitente_nombre}</p>}
                    </div>

                    <div>
                      <Label htmlFor="remitente_telefono" className="mb-2 block">Teléfono *</Label>
                      <Input
                        id="remitente_telefono"
                        name="remitente_telefono"
                        placeholder="Número de teléfono"
                        value={formData.remitente_telefono || ''}
                        onChange={handleInputChange}
                        className={errors.remitente_telefono ? "border-red-500" : ""}
                      />
                      {errors.remitente_telefono && <p className="text-red-500 text-sm mt-1">{errors.remitente_telefono}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="remitente_direccion" className="mb-2 block">Dirección (Opcional)</Label>
                      <Input
                        id="remitente_direccion"
                        name="remitente_direccion"
                        placeholder="Dirección completa del remitente"
                        value={formData.remitente_direccion || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Información del Destinatario - Solo en creación */}
              {!isEdit && (
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
                        name="destinatario_nombre"
                        placeholder="Nombre del destinatario"
                        value={formData.destinatario_nombre || ''}
                        onChange={handleInputChange}
                        className={errors.destinatario_nombre ? "border-red-500" : ""}
                      />
                      {errors.destinatario_nombre && <p className="text-red-500 text-sm mt-1">{errors.destinatario_nombre}</p>}
                    </div>

                    <div>
                      <Label htmlFor="destinatario_telefono" className="mb-2 block">Teléfono *</Label>
                      <Input
                        id="destinatario_telefono"
                        name="destinatario_telefono"
                        placeholder="Número de teléfono"
                        value={formData.destinatario_telefono || ''}
                        onChange={handleInputChange}
                        className={errors.destinatario_telefono ? "border-red-500" : ""}
                      />
                      {errors.destinatario_telefono && <p className="text-red-500 text-sm mt-1">{errors.destinatario_telefono}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Información de Destino - Solo en creación */}
              {!isEdit && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    Información de Destino
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destino_ciudad" className="mb-2 block">Ciudad de Destino *</Label>
                      <Select 
                        value={formData.destino_ciudad || ''} 
                        onValueChange={(value) => handleSelectChange('destino_ciudad', value)}
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
                        name="destino_direccion"
                        placeholder="Dirección completa de destino"
                        value={formData.destino_direccion || ''}
                        onChange={handleInputChange}
                        className={errors.destino_direccion ? "border-red-500" : ""}
                      />
                      {errors.destino_direccion && <p className="text-red-500 text-sm mt-1">{errors.destino_direccion}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Detalles de la Encomienda - Solo en creación */}
              {!isEdit && (
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
                        name="peso"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={(formData as CreateEncomiendaRequest).peso || 0}
                        onChange={handleInputChange}
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
                        name="descripcion"
                        placeholder="Describe el contenido del paquete..."
                        value={formData.descripcion || ''}
                        onChange={handleInputChange}
                        className={errors.descripcion ? "border-red-500" : ""}
                        rows={3}
                      />
                      {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="metodo_pago" className="mb-2 block">Método de Pago *</Label>
                      <Select 
                        value={formData.metodo_pago || 'efectivo'} 
                        onValueChange={(value) => handleSelectChange('metodo_pago', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          {metodosPago.map((metodo) => (
                            <SelectItem key={metodo.value} value={metodo.value}>
                              {metodo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="notas" className="mb-2 block">Notas Adicionales (Opcional)</Label>
                      <Textarea
                        id="notas"
                        name="notas"
                        placeholder="Instrucciones especiales, observaciones..."
                        value={formData.notas || ''}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos editables en modo edición */}
              {isEdit && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Gestión de Encomienda
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estado" className="mb-2 block">Estado *</Label>
                      <Select 
                        value={formData.estado || 'pendiente'} 
                        onValueChange={(value) => handleSelectChange('estado', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="conductor_asignado" className="mb-2 block">Conductor Asignado</Label>
                      <Select 
                        value={formData.conductor_asignado?.toString() || ''} 
                        onValueChange={(value) => handleSelectChange('conductor_asignado', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar conductor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {conductoresDisponibles.map((conductor) => (
                            <SelectItem key={conductor.id} value={conductor.id.toString()}>
                              {conductor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.estado === 'entregado' && (
                      <div className="md:col-span-2">
                        <Label htmlFor="fecha_entrega_real" className="mb-2 block">Fecha de Entrega Real</Label>
                        <Input
                          id="fecha_entrega_real"
                          name="fecha_entrega_real"
                          type="datetime-local"
                          value={formData.fecha_entrega_real || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <Label htmlFor="notas" className="mb-2 block">Notas Internas</Label>
                      <Textarea
                        id="notas"
                        name="notas"
                        placeholder="Observaciones internas..."
                        value={formData.notas || ''}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

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