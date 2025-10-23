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
import { Loader2, Bus, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import type { Viaje, ViajeFormData, VehiculoOption } from '@/types';
import type { Ubicacion } from '@/types/ubicaciones';
import { api } from '@/lib/api';

interface ViajeStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ViajeFormData) => Promise<boolean>;
  initialData?: Viaje | null;
  loading?: boolean;
  vehiculosDisponibles: VehiculoOption[];
}

export function ViajeStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  vehiculosDisponibles
}: ViajeStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Viaje' : 'Crear Viaje';
  const description = isEdit 
    ? 'Modifica la información del viaje seleccionado' 
    : 'Programa un nuevo viaje en el sistema';

  const [formData, setFormData] = useState<ViajeFormData>({
    fecha: '',
    hora: '',
    vehiculo_id: 0,
    precio: 0,
    estado: 'programado',
    asientos_disponibles: 0,
    asientos_ocupados: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  const estados = ["programado", "en_curso", "completado", "cancelado"];

  // Cargar ubicaciones cuando se abre el modal
  useEffect(() => {
    if (isOpen && ubicaciones.length === 0) {
      cargarUbicaciones();
    }
  }, [isOpen]);

  const cargarUbicaciones = async () => {
    setLoadingUbicaciones(true);
    try {
      const response = await api.get('/api/ubicaciones/', {
        params: {
          tipo: 'TERMINAL', // Solo terminales para viajes
          activo: true,
          ordering: 'nombre'
        }
      });
      console.log('Ubicaciones cargadas:', response.data);
      setUbicaciones(response.data.results || response.data);
    } catch (error: any) {
      console.error('Error al cargar ubicaciones:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data
      });
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  // Cargar datos iniciales cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && initialData) {
      // Extraer el ID del vehículo correctamente
      let vehiculoId = 0;
      if (initialData.vehiculo_id) {
        vehiculoId = initialData.vehiculo_id;
      } else if (typeof initialData.vehiculo === 'object' && initialData.vehiculo?.id) {
        vehiculoId = initialData.vehiculo.id;
      }
      
      // Extraer IDs de origen y destino
      const origenId = initialData.origen_detalle?.id;
      const destinoId = initialData.destino_detalle?.id;
      
      setFormData({
        ...(origenId && { origen_id: origenId }),
        ...(destinoId && { destino_id: destinoId }),
        fecha: initialData.fecha || '',
        hora: initialData.hora || '',
        vehiculo_id: vehiculoId,
        precio: initialData.precio || 0,
        estado: initialData.estado || 'programado',
        asientos_disponibles: initialData.asientos_disponibles || 0,
        asientos_ocupados: initialData.asientos_ocupados || 0,
      });
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      setFormData({
        fecha: '',
        hora: '',
        vehiculo_id: 0,
        precio: 0,
        estado: 'programado',
        asientos_disponibles: 0,
        asientos_ocupados: 0,
      });
    }
    setErrors({});
  }, [isOpen, initialData]);

  // Actualizar formData cuando cambien los vehiculosDisponibles (para asegurar que el select funcione)
  useEffect(() => {
    if (isOpen && initialData && vehiculosDisponibles.length > 0) {
      // Extraer el ID del vehículo correctamente
      let vehiculoId = 0;
      if (initialData.vehiculo_id) {
        vehiculoId = initialData.vehiculo_id;
      } else if (typeof initialData.vehiculo === 'object' && initialData.vehiculo?.id) {
        vehiculoId = initialData.vehiculo.id;
      }
      
      // Verificar si el vehículo del viaje existe en la lista de disponibles
      const vehiculoExiste = vehiculosDisponibles.find(v => v.id === vehiculoId);
      
      if (vehiculoExiste && formData.vehiculo_id !== vehiculoId) {
        setFormData(prev => ({
          ...prev,
          vehiculo_id: vehiculoId,
        }));
      }
    }
  }, [vehiculosDisponibles, isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.origen_id) {
      newErrors.origen_id = 'El origen es requerido';
    }
    if (!formData.destino_id) {
      newErrors.destino_id = 'El destino es requerido';
    }
    if (formData.origen_id === formData.destino_id) {
      newErrors.destino_id = 'El destino debe ser diferente al origen';
    }
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida';
    }
    if (!formData.vehiculo_id || formData.vehiculo_id === 0) {
      newErrors.vehiculo_id = 'Debe seleccionar un vehículo';
    }
    if (!formData.precio || formData.precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
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
        fecha: '',
        hora: '',
        vehiculo_id: 0,
        precio: 0,
        estado: 'programado',
        asientos_disponibles: 0,
        asientos_ocupados: 0,
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      fecha: '',
      hora: '',
      vehiculo_id: 0,
      precio: 0,
      estado: 'programado',
      asientos_disponibles: 0,
      asientos_ocupados: 0,
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
                <Bus className="h-5 w-5 text-blue-600" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información de Ruta */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información de Ruta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origen */}
                  <div>
                    <Label htmlFor="origen_id" className="mb-2 block">Terminal Origen *</Label>
                    <Select 
                      value={formData.origen_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, origen_id: parseInt(value) })}
                      disabled={loading || loadingUbicaciones}
                    >
                      <SelectTrigger className={errors.origen_id ? "border-red-500" : ""}>
                        <SelectValue placeholder={loadingUbicaciones ? "Cargando terminales..." : "Seleccionar terminal de origen"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones.length > 0 ? (
                          ubicaciones.map((ubicacion) => (
                            <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                              {ubicacion.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay terminales disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.origen_id && <p className="text-red-500 text-sm mt-1">{errors.origen_id}</p>}
                  </div>

                  {/* Destino */}
                  <div>
                    <Label htmlFor="destino_id" className="mb-2 block">Terminal Destino *</Label>
                    <Select 
                      value={formData.destino_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, destino_id: parseInt(value) })}
                      disabled={loading || loadingUbicaciones}
                    >
                      <SelectTrigger className={errors.destino_id ? "border-red-500" : ""}>
                        <SelectValue placeholder={loadingUbicaciones ? "Cargando terminales..." : "Seleccionar terminal de destino"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones.length > 0 ? (
                          ubicaciones.map((ubicacion) => (
                            <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                              {ubicacion.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay terminales disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.destino_id && <p className="text-red-500 text-sm mt-1">{errors.destino_id}</p>}
                  </div>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fecha y Hora</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <Label htmlFor="fecha" className="mb-2 block">Fecha del Viaje *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className={errors.fecha ? "border-red-500" : ""}
                      disabled={loading}
                    />
                    {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
                  </div>

                  {/* Hora */}
                  <div>
                    <Label htmlFor="hora" className="mb-2 block">Hora de Salida *</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={formData.hora}
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                      className={errors.hora ? "border-red-500" : ""}
                      disabled={loading}
                    />
                    {errors.hora && <p className="text-red-500 text-sm mt-1">{errors.hora}</p>}
                  </div>
                </div>
              </div>

              {/* Vehículo y Precio */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Vehículo y Precio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehículo */}
                  <div>
                    <Label htmlFor="vehiculo_id" className="mb-2 block">Vehículo Asignado *</Label>
                    <Select 
                      value={formData.vehiculo_id && formData.vehiculo_id > 0 ? formData.vehiculo_id.toString() : ''} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, vehiculo_id: parseInt(value) });
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className={errors.vehiculo_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehiculosDisponibles.length > 0 ? (
                          vehiculosDisponibles.map((vehiculo) => (
                            <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                              {vehiculo.nombre} - {vehiculo.placa}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay vehículos disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.vehiculo_id && <p className="text-red-500 text-sm mt-1">{errors.vehiculo_id}</p>}
                  </div>

                  {/* Precio */}
                  <div>
                    <Label htmlFor="precio" className="mb-2 block">Precio del Pasaje (BOB) *</Label>
                    <Input
                      id="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                      className={errors.precio ? "border-red-500" : ""}
                      disabled={loading}
                    />
                    {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
                  </div>
                </div>
              </div>

              {/* Estado y Asientos (solo en edición) */}
              {isEdit && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Estado y Asientos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Estado */}
                    <div>
                      <Label htmlFor="estado" className="mb-2 block">Estado del Viaje</Label>
                      <Select 
                        value={formData.estado || 'programado'} 
                        onValueChange={(value) => setFormData({ ...formData, estado: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Asientos Disponibles */}
                    <div>
                      <Label htmlFor="asientos_disponibles" className="mb-2 block">Asientos Disponibles</Label>
                      <Input
                        id="asientos_disponibles"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.asientos_disponibles}
                        onChange={(e) => setFormData({ ...formData, asientos_disponibles: parseInt(e.target.value) || 0 })}
                        disabled={loading}
                      />
                    </div>

                    {/* Asientos Ocupados */}
                    <div>
                      <Label htmlFor="asientos_ocupados" className="mb-2 block">Asientos Ocupados</Label>
                      <Input
                        id="asientos_ocupados"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.asientos_ocupados}
                        onChange={(e) => setFormData({ ...formData, asientos_ocupados: parseInt(e.target.value) || 0 })}
                        disabled={loading}
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