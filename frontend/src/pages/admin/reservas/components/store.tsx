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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, User, MapPin, CreditCard, Hash, X, Check, Users } from 'lucide-react';
import type { Reserva, ReservaFormData, ViajeOption, Cliente, Asiento } from '@/types/reservas';

interface ReservaStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReservaFormData) => Promise<boolean>;
  initialData?: Reserva | null;
  loading?: boolean;
  viajesDisponibles: ViajeOption[];
  clientesDisponibles: Cliente[];
}

interface AsientoConEstado extends Asiento {
  seleccionado: boolean;
}

export function ReservaStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false,
  viajesDisponibles,
  clientesDisponibles
}: ReservaStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Reserva' : 'Crear Reserva';
  const description = isEdit 
    ? 'Modifica la información de la reserva seleccionada' 
    : 'Crea una nueva reserva con múltiples asientos';

  // ✅ ACTUALIZADO: FormData ahora usa asientos_ids en lugar de asiento
  const [formData, setFormData] = useState<ReservaFormData>({
    cliente: null,
    asientos_ids: [], // ✅ Cambiado de asiento a asientos_ids
    pagado: false,
  });

  const [selectedViaje, setSelectedViaje] = useState<string>('');
  const [asientosDisponibles, setAsientosDisponibles] = useState<AsientoConEstado[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen && initialData) {
      // ✅ CORREGIDO: Cargar datos para edición con múltiples asientos (con validación segura)
      setFormData({
        cliente: typeof initialData.cliente === 'object' && initialData.cliente !== null 
          ? (initialData.cliente as Cliente).id 
          : initialData.cliente || null,
        asientos_ids: initialData.items?.map(item => {
          if (!item.asiento) return 0;
          return typeof item.asiento === 'object' ? (item.asiento as Asiento).id : item.asiento;
        }).filter(id => id !== 0) || [], // ✅ Array de IDs de asientos con filtro seguro
        pagado: initialData.pagado || false,
      });

      // ✅ CORREGIDO: Cargar viaje desde el primer asiento con validación segura
      if (initialData.items && initialData.items.length > 0) {
        const primerItem = initialData.items[0];
        if (primerItem && primerItem.asiento) {
          const primerAsiento = primerItem.asiento;
          if (typeof primerAsiento === 'object' && primerAsiento.viaje) {
            const viaje = primerAsiento.viaje;
            if (typeof viaje === 'object') {
              setSelectedViaje(viaje.id.toString());
              loadAsientosDisponibles(viaje.id, initialData.items.map(item => {
                if (!item.asiento) return 0;
                return typeof item.asiento === 'object' ? (item.asiento as Asiento).id : item.asiento;
              }).filter(id => id !== 0));
            } else if (typeof viaje === 'number') {
              setSelectedViaje(viaje.toString());
              loadAsientosDisponibles(viaje, initialData.items.map(item => {
                if (!item.asiento) return 0;
                return typeof item.asiento === 'object' ? (item.asiento as Asiento).id : item.asiento;
              }).filter(id => id !== 0));
            }
          }
        }
      }
    } else if (isOpen && !initialData) {
      // Resetear formulario para crear nuevo
      setFormData({
        cliente: null,
        asientos_ids: [],
        pagado: false,
      });
      setSelectedViaje('');
      setAsientosDisponibles([]);
    }
    setErrors({});
  }, [isOpen, initialData]);

  // ✅ ACTUALIZADO: Cargar asientos marcando los seleccionados
  const loadAsientosDisponibles = async (viajeId: number, asientosSeleccionadosIds: number[] = []) => {
    try {
      const response = await fetch(`http://localhost:8000/api/asientos/?viaje=${viajeId}`);
      if (!response.ok) throw new Error('Error al cargar asientos');
      
      const result = await response.json();
      const asientosData = result.results || [];
      
      // ✅ Marcar asientos seleccionados
      const asientosConEstado: AsientoConEstado[] = asientosData.map((asiento: Asiento) => ({
        ...asiento,
        seleccionado: asientosSeleccionadosIds.includes(asiento.id)
      }));
      
      setAsientosDisponibles(asientosConEstado);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, asientos: 'Error al cargar asientos disponibles' }));
    }
  };

  const handleViajeChange = (viajeId: string) => {
    // ✅ CORREGIDO: Manejar el valor "null"
    if (viajeId === "null") {
      setSelectedViaje('');
      setFormData(prev => ({ ...prev, asientos_ids: [] }));
      setAsientosDisponibles([]);
      return;
    }
    
    setSelectedViaje(viajeId);
    setFormData(prev => ({ ...prev, asientos_ids: [] }));
    
    if (viajeId) {
      loadAsientosDisponibles(parseInt(viajeId));
    } else {
      setAsientosDisponibles([]);
    }
  };

  // ✅ NUEVA FUNCIÓN: Toggle de selección de asiento
  const toggleAsiento = (asientoId: number) => {
    setAsientosDisponibles(prev => 
      prev.map(asiento => 
        asiento.id === asientoId 
          ? { ...asiento, seleccionado: !asiento.seleccionado }
          : asiento
      )
    );

    setFormData(prev => {
      const asientosIds = prev.asientos_ids || [];
      if (asientosIds.includes(asientoId)) {
        return {
          ...prev,
          asientos_ids: asientosIds.filter(id => id !== asientoId)
        };
      } else {
        return {
          ...prev,
          asientos_ids: [...asientosIds, asientoId]
        };
      }
    });
  };

  // ✅ NUEVA FUNCIÓN: Obtener estado visual del asiento
  const getEstadoAsiento = (asiento: AsientoConEstado) => {
    if (asiento.estado === 'ocupado' || asiento.estado === 'reservado') return 'ocupado';
    if (asiento.seleccionado) return 'seleccionado';
    return 'libre';
  };

  // ✅ NUEVA FUNCIÓN: Obtener color del asiento
  const getColorAsiento = (estado: string) => {
    const colores = {
      'libre': 'bg-green-500 hover:bg-green-600 border-green-600 text-white',
      'ocupado': 'bg-red-500 cursor-not-allowed border-red-600 text-white',
      'seleccionado': 'bg-blue-500 border-blue-600 text-white'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-300 border-gray-400 text-gray-700';
  };

  // ✅ ACTUALIZADA: Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente) {
      newErrors.cliente = 'Debe seleccionar un cliente';
    }
    if (!formData.asientos_ids || formData.asientos_ids.length === 0) {
      newErrors.asientos = 'Debe seleccionar al menos un asiento';
    }
    if (!selectedViaje) {
      newErrors.viaje = 'Debe seleccionar un viaje';
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
        cliente: null,
        asientos_ids: [],
        pagado: false,
      });
      setSelectedViaje('');
      setAsientosDisponibles([]);
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      cliente: null,
      asientos_ids: [],
      pagado: false,
    });
    setSelectedViaje('');
    setAsientosDisponibles([]);
    setErrors({});
    onClose();
  };

  const getViajeInfo = (viajeId: string) => {
    const viaje = viajesDisponibles.find(v => v.id.toString() === viajeId);
    if (!viaje) return null;
    
    return {
      origen: viaje.origen,
      destino: viaje.destino,
      fecha: new Date(viaje.fecha).toLocaleDateString('es-ES'),
      hora: viaje.hora,
      precio: viaje.precio,
    };
  };

  // ✅ NUEVA FUNCIÓN: Organizar asientos en filas
  const organizarAsientosEnFilas = () => {
    const filas = [];
    const asientosOrdenados = [...asientosDisponibles].sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    
    for (let i = 0; i < asientosOrdenados.length; i += 4) {
      filas.push(asientosOrdenados.slice(i, i + 4));
    }
    
    return filas;
  };

  // ✅ CORREGIDO: Función para obtener nombre del cliente (usa nombre/apellido en lugar de first_name/last_name)
  const getNombreCliente = (cliente: Cliente) => {
    return `${cliente.nombre} ${cliente.apellido}`;
  };

  const filasDeAsientos = organizarAsientosEnFilas();
  const asientosSeleccionados = asientosDisponibles.filter(a => a.seleccionado);
  const totalPrecio = getViajeInfo(selectedViaje) ? 
    (getViajeInfo(selectedViaje)?.precio || 0) * asientosSeleccionados.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información del Cliente y Viaje */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliente */}
                  <div>
                    <Label htmlFor="cliente" className="mb-2 block">Cliente *</Label>
                    <Select 
                      value={formData.cliente ? formData.cliente.toString() : 'null'} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        cliente: value === "null" ? null : parseInt(value) 
                      })}
                    >
                      <SelectTrigger className={errors.cliente ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Seleccionar cliente</SelectItem>
                        {clientesDisponibles.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            <div className="flex flex-col">
                              {/* ✅ CORREGIDO: Usar nombre y apellido en lugar de first_name y last_name */}
                              <span>{getNombreCliente(cliente)}</span>
                              <span className="text-xs text-gray-500">{cliente.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
                  </div>

                  {/* Viaje */}
                  <div>
                    <Label htmlFor="viaje" className="mb-2 block">Viaje *</Label>
                    <Select 
                      value={selectedViaje} 
                      onValueChange={handleViajeChange}
                    >
                      <SelectTrigger className={errors.viaje ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar viaje" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Seleccionar viaje</SelectItem>
                        {viajesDisponibles.map((viaje) => (
                          <SelectItem key={viaje.id} value={viaje.id.toString()}>
                            <div className="flex flex-col">
                              <span>{viaje.origen} → {viaje.destino}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(viaje.fecha).toLocaleDateString('es-ES')} {viaje.hora}
                              </span>
                              <span className="text-xs text-green-600">
                                Bs. {viaje.precio}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.viaje && <p className="text-red-500 text-sm mt-1">{errors.viaje}</p>}
                  </div>
                </div>
              </div>

              {/* Información del Viaje Seleccionado */}
              {selectedViaje && getViajeInfo(selectedViaje) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Información del Viaje Seleccionado
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Origen:</span>
                      <div>{getViajeInfo(selectedViaje)?.origen}</div>
                    </div>
                    <div>
                      <span className="font-medium">Destino:</span>
                      <div>{getViajeInfo(selectedViaje)?.destino}</div>
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span>
                      <div>{getViajeInfo(selectedViaje)?.fecha}</div>
                    </div>
                    <div>
                      <span className="font-medium">Precio por asiento:</span>
                      <div className="text-green-600 font-semibold">
                        Bs. {getViajeInfo(selectedViaje)?.precio}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ ACTUALIZADO: Selección MÚLTIPLE de Asientos */}
              {selectedViaje && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Selección de Asientos</h3>
                    {asientosSeleccionados.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Hash className="h-3 w-3 mr-1" />
                        {asientosSeleccionados.length} asiento(s) seleccionado(s)
                      </Badge>
                    )}
                  </div>
                  
                  {errors.asientos && (
                    <p className="text-red-500 text-sm">{errors.asientos}</p>
                  )}

                  {/* Leyenda */}
                  <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
                      <span className="text-sm">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                      <span className="text-sm">Seleccionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
                      <span className="text-sm">Ocupado</span>
                    </div>
                  </div>

                  {/* Grid de Asientos */}
                  {asientosDisponibles.length > 0 ? (
                    <div className="border-2 border-gray-300 rounded-lg bg-gray-50">
                      <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg">
                        <Users className="h-4 w-4 inline mr-2" />
                        <span className="font-semibold text-sm">Distribución de Asientos</span>
                      </div>
                      
                      <div className="p-4">
                        {filasDeAsientos.map((fila, filaIndex) => (
                          <div key={filaIndex} className="flex justify-center gap-4 mb-3 items-center">
                            <div className="w-6 text-center text-xs font-medium text-gray-600">
                              F.{filaIndex + 1}
                            </div>
                            
                            <div className="flex gap-2">
                              {fila.slice(0, 2).map((asiento) => {
                                const estado = getEstadoAsiento(asiento);
                                const color = getColorAsiento(estado);
                                
                                return (
                                  <button
                                    key={asiento.id}
                                    type="button"
                                    className={`
                                      w-8 h-8 rounded border-2 flex items-center justify-center
                                      font-semibold text-xs transition-all duration-200
                                      ${color}
                                      ${estado === 'libre' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                                    `}
                                    onClick={() => estado === 'libre' && toggleAsiento(asiento.id)}
                                    disabled={estado === 'ocupado'}
                                    title={`Asiento ${asiento.numero} - ${estado}`}
                                  >
                                    {estado === 'seleccionado' && <Check className="h-3 w-3" />}
                                    {estado === 'ocupado' && <X className="h-3 w-3" />}
                                    {(estado === 'libre' || estado === 'seleccionado') && asiento.numero}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="w-12 flex items-center justify-center text-xs text-gray-500 font-medium">
                              Pasillo
                            </div>
                            
                            <div className="flex gap-2">
                              {fila.slice(2, 4).map((asiento) => {
                                const estado = getEstadoAsiento(asiento);
                                const color = getColorAsiento(estado);
                                
                                return (
                                  <button
                                    key={asiento.id}
                                    type="button"
                                    className={`
                                      w-8 h-8 rounded border-2 flex items-center justify-center
                                      font-semibold text-xs transition-all duration-200
                                      ${color}
                                      ${estado === 'libre' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                                    `}
                                    onClick={() => estado === 'libre' && toggleAsiento(asiento.id)}
                                    disabled={estado === 'ocupado'}
                                    title={`Asiento ${asiento.numero} - ${estado}`}
                                  >
                                    {estado === 'seleccionado' && <Check className="h-3 w-3" />}
                                    {estado === 'ocupado' && <X className="h-3 w-3" />}
                                    {(estado === 'libre' || estado === 'seleccionado') && asiento.numero}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      Cargando asientos disponibles...
                    </div>
                  )}

                  {/* Resumen de selección */}
                  {asientosSeleccionados.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Resumen de tu selección:</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {asientosSeleccionados.map(asiento => (
                          <Badge key={asiento.id} variant="secondary" className="bg-blue-100 text-blue-800">
                            Asiento {asiento.numero}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">
                          {asientosSeleccionados.length} asiento(s) seleccionado(s)
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                          Total: {new Intl.NumberFormat('es-BO', {
                            style: 'currency',
                            currency: 'BOB'
                          }).format(totalPrecio)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Estado de Pago */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Estado de Pago</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pagado" 
                    checked={formData.pagado}
                    onCheckedChange={(checked) => setFormData({ ...formData, pagado: checked as boolean })}
                  />
                  <Label htmlFor="pagado" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Reserva pagada
                  </Label>
                </div>
                {formData.pagado && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-green-800 text-sm">
                      La reserva será marcada como pagada. El cliente recibirá confirmación.
                    </p>
                  </div>
                )}
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
                <Button 
                  type="submit" 
                  disabled={loading || !selectedViaje || asientosSeleccionados.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? 'Actualizar' : 'Crear'} Reserva ({asientosSeleccionados.length})
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}