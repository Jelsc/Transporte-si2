import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Calendar, User, MapPin, CreditCard, Hash, Ticket, DollarSign } from 'lucide-react';
import type { Reserva } from '@/types/reservas';

interface ReservaDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  reserva: Reserva | null;
  loading?: boolean;
}

export function ReservaDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  reserva, 
  loading = false 
}: ReservaDeleteProps) {
  if (!reserva) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  // Badge para estado de reserva con valor por defecto
  const getEstadoBadge = (estado: string = 'pendiente') => {
    const variants = {
      'pendiente': { variant: "warning" as const, label: 'Pendiente' },
      'confirmada': { variant: "success" as const, label: 'Confirmada' },
      'pagada': { variant: "success" as const, label: 'Pagada' },
      'cancelada': { variant: "destructive" as const, label: 'Cancelada' }
    };
    
    const config = variants[estado as keyof typeof variants] || { variant: "default" as const, label: estado };
    
    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  };

  // Badge para estado de pago
  const getPagoBadge = (pagado: boolean = false) => {
    return (
      <Badge 
        variant={pagado ? "success" : "warning"} 
        size="sm"
      >
        {pagado ? 'Pagado' : 'Pendiente'}
      </Badge>
    );
  };

  // Info del cliente con validaciones seguras
  const getClienteInfo = (cliente: any) => {
    if (!cliente) return "Sin cliente asignado";
    
    if (typeof cliente === 'object' && cliente !== null) {
      // ✅ Compatibilidad con ambos formatos
      if (cliente.first_name && cliente.last_name) {
        return `${cliente.first_name} ${cliente.last_name}`;
      }
      else if (cliente.first_name) {
        return cliente.first_name;
      }
      else if (cliente.last_name) {
        return cliente.last_name;
      }
      else if (cliente.username) {
        return cliente.username;
      }
      else if (cliente.nombre && cliente.apellido) {
        return `${cliente.nombre} ${cliente.apellido}`;
      }
      else if (cliente.nombre) {
        return cliente.nombre;
      }
      else if (cliente.apellido) {
        return cliente.apellido;
      }
    }
    
    return "Sin cliente asignado";
  };

  // Obtener información del viaje con validaciones seguras
  const getViajeInfo = (reserva: Reserva) => {
    if (!reserva.items || reserva.items.length === 0) return "Sin información de viaje";
    
    const primerAsiento = reserva.items[0]?.asiento;
    if (!primerAsiento?.viaje) return "Sin información de viaje";
    
    const viaje = primerAsiento.viaje;
    
    if (typeof viaje === 'number') return "ID de viaje: " + viaje;
    
    return `${viaje.origen} → ${viaje.destino}`;
  };

  // Obtener fecha del viaje con validaciones seguras
  const getFechaViaje = (reserva: Reserva) => {
    if (!reserva.items || reserva.items.length === 0) return "-";
    
    const primerAsiento = reserva.items[0]?.asiento;
    if (!primerAsiento?.viaje) return "-";
    
    const viaje = primerAsiento.viaje;
    
    if (typeof viaje === 'number') return "-";
    
    try {
      return new Date(`${viaje.fecha}T${viaje.hora}`).toLocaleDateString('es-ES');
    } catch {
      return "-";
    }
  };

  // ✅ CORREGIDO: Lista de asientos con validaciones seguras
  const getAsientosLista = (reserva: Reserva) => {
    if (!reserva.items || reserva.items.length === 0) return "Sin asientos";
    
    const numerosAsientos = reserva.items.map(item => {
      if (!item.asiento) return "N/A";
      
      // ✅ CORRECCIÓN: Asignar a variable primero para el type narrowing
      const asiento = item.asiento;
      if (typeof asiento === 'number') {
        return asiento.toString();
      }
      
      return asiento.numero || "N/A";
    });
    
    return numerosAsientos.join(', ');
  };

  // Cantidad de asientos con validación segura
  const getCantidadAsientos = (reserva: Reserva) => {
    return reserva.items?.length || 0;
  };

  // Calcular total de reembolso si está pagado
  const getTotalReembolso = (reserva: Reserva) => {
    if (!reserva.pagado) return 0;
    return reserva.total || 0;
  };

  // Obtener código de reserva seguro
  const getCodigoReserva = (reserva: Reserva) => {
    return reserva.codigo_reserva || `RES${reserva.id}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación de Reserva
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar esta reserva? 
                Esta acción no se puede deshacer y liberará {getCantidadAsientos(reserva)} asiento(s) para nuevas reservas.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Información de la Reserva:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* Código de reserva */}
                  <div>
                    <span className="font-medium">Código:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Ticket className="h-4 w-4 text-blue-500" />
                      <span className="font-mono">{getCodigoReserva(reserva)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Cliente:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      {getClienteInfo(reserva.cliente)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Viaje:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      {getViajeInfo(reserva)}
                    </div>
                  </div>
                  
                  {/* Asientos (múltiples) */}
                  <div>
                    <span className="font-medium">Asientos:</span>
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">
                          {getCantidadAsientos(reserva)} asiento(s)
                        </span>
                      </div>
                      <Badge variant="outline" size="sm" className="text-xs">
                        {getAsientosLista(reserva)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Fecha Viaje:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-green-500" />
                      {getFechaViaje(reserva)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Fecha Reserva:</span>
                    <div>
                      {reserva.fecha_reserva ? 
                        new Date(reserva.fecha_reserva).toLocaleDateString('es-ES') : 
                        "-"
                      }
                    </div>
                  </div>
                  
                  {/* Estado de reserva */}
                  <div>
                    <span className="font-medium">Estado:</span>
                    <div className="mt-1">
                      {getEstadoBadge(reserva.estado)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Estado Pago:</span>
                    <div className="mt-1">
                      {getPagoBadge(reserva.pagado)}
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div>
                    <span className="font-medium">Total:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'BOB'
                      }).format(reserva.total || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-red-800 text-sm">
                  <strong>Advertencia:</strong> Al eliminar esta reserva, {getCantidadAsientos(reserva)} asiento(s) 
                  quedarán disponible(s) para que otros clientes lo(s) reserven y se perderá el historial de esta transacción.
                </div>
              </div>

              {reserva.pagado && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Esta reserva está marcada como pagada. 
                    <div className="mt-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        <strong>Reembolso requerido:</strong>{' '}
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(getTotalReembolso(reserva))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="text-blue-800 text-sm">
                  <strong>Información:</strong> Los asientos {getAsientosLista(reserva)} serán liberados 
                  y podrán ser reservados por otros clientes inmediatamente.
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar Reserva ({getCantidadAsientos(reserva)} asiento(s))
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}