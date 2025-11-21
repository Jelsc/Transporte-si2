// src/pages/client/MisReservas/components/DetalleReservaModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Hash,
  CheckCircle,
  XCircle,
  Clock4,
} from 'lucide-react';
import type { Reserva } from '@/types/reservas';

interface DetalleReservaModalProps {
  reserva: Reserva | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetalleReservaModal({
  reserva,
  isOpen,
  onClose,
}: DetalleReservaModalProps) {
  if (!reserva) return null;

  // ✅ USAR viaje_info QUE YA EXISTE EN LOS DATOS
  const viajeInfo = reserva.viaje_info;

  const getEstadoBadge = () => {
    const variants = {
      pendiente_pago: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-green-100 text-green-800',
      pagada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
      expirada: 'bg-gray-100 text-gray-800',
    };

    const icons = {
      pendiente_pago: <Clock4 className="h-4 w-4 mr-1" />,
      confirmada: <CheckCircle className="h-4 w-4 mr-1" />,
      pagada: <CheckCircle className="h-4 w-4 mr-1" />,
      cancelada: <XCircle className="h-4 w-4 mr-1" />,
      expirada: <XCircle className="h-4 w-4 mr-1" />,
    };

    const estadoTexto = {
      pendiente_pago: 'Pendiente Pago',
      confirmada: 'Confirmada',
      pagada: 'Pagada',
      cancelada: 'Cancelada',
      expirada: 'Expirada',
    };

    return (
      <Badge variant="secondary" className={variants[reserva.estado as keyof typeof variants]}>
        {icons[reserva.estado as keyof typeof icons]}
        {estadoTexto[reserva.estado as keyof typeof estadoTexto] || reserva.estado}
      </Badge>
    );
  };

  const getPagoBadge = () => {
    return reserva.pagado ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-4 w-4 mr-1" />
        Pagado
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock4 className="h-4 w-4 mr-1" />
        Pendiente de pago
      </Badge>
    );
  };

  // ✅ FUNCIÓN PARA OBTENER INFORMACIÓN DEL VIAJE
  const getViajeInfo = () => {
    if (viajeInfo && viajeInfo.origen && viajeInfo.destino) {
      return `${viajeInfo.origen} → ${viajeInfo.destino}`;
    }
    return 'Información no disponible';
  };

  // ✅ FUNCIÓN PARA OBTENER FECHA DEL VIAJE
  const getFechaViaje = () => {
    if (viajeInfo?.fecha) {
      return new Date(viajeInfo.fecha).toLocaleDateString('es-BO');
    }
    return 'Fecha no disponible';
  };

  // ✅ FUNCIÓN PARA OBTENER HORA DEL VIAJE
  const getHoraViaje = () => {
    if (viajeInfo?.hora) {
      return viajeInfo.hora.split(':').slice(0, 2).join(':');
    }
    return '--:--';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Detalle de Reserva - {reserva.codigo_reserva}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información de la Reserva</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Código:</span>
                      <span className="font-mono font-medium">{reserva.codigo_reserva}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      {getEstadoBadge()}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pago:</span>
                      {getPagoBadge()}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(reserva.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ INFORMACIÓN DEL VIAJE - SIMPLIFICADA */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del Viaje</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium">{getViajeInfo()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{getFechaViaje()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span>{getHoraViaje()}</span>
                    </div>
                    
                    {viajeInfo?.precio && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>
                          Precio por asiento: {new Intl.NumberFormat('es-BO', {
                            style: 'currency',
                            currency: 'BOB'
                          }).format(viajeInfo.precio)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asientos Reservados */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asientos Reservados ({reserva.items?.length || 0})
              </h3>
              
              {reserva.items && reserva.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {reserva.items.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.asiento?.estado === 'ocupado' ? 'bg-green-500' : 
                          item.asiento?.estado === 'reservado' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-semibold">Asiento {item.asiento?.numero || 'N/A'}</span>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(item.precio)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay asientos registrados para esta reserva.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resumen de Costos */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Resumen de Costos</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Asientos ({reserva.items?.length || 0}):</span>
                  <span>
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB'
                    }).format(reserva.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB'
                    }).format(reserva.total || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}