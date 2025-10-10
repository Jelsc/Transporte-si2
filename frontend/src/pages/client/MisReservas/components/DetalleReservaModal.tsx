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

// 👇 Mismos tipos que en MisReservasTable
interface ViajeEnItem {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
}

interface AsientoConViaje {
  id: number;
  numero: string;
  estado: string;
  viaje: ViajeEnItem;
}

interface ItemReservaConDetalle {
  id: number;
  precio: number;
  asiento: AsientoConViaje;
}

interface ReservaConDetalle extends Omit<Reserva, 'items'> {
  items: ItemReservaConDetalle[];
}

interface DetalleReservaModalProps {
  reserva: ReservaConDetalle | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetalleReservaModal({
  reserva,
  isOpen,
  onClose,
}: DetalleReservaModalProps) {
  if (!reserva) return null;

  const primerItem = reserva.items?.[0];
  const viaje = primerItem?.asiento.viaje;

  const getEstadoBadge = () => {
    const variants = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };

    const icons = {
      pendiente: <Clock4 className="h-4 w-4 mr-1" />,
      confirmada: <CheckCircle className="h-4 w-4 mr-1" />,
      cancelada: <XCircle className="h-4 w-4 mr-1" />,
    };

    return (
      <Badge variant="secondary" className={variants[reserva.estado as keyof typeof variants]}>
        {icons[reserva.estado as keyof typeof icons]}
        {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
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
                      <span className="text-sm text-muted-foreground">Fecha Reserva:</span>
                      <span>{new Date(reserva.fecha_reserva).toLocaleString('es-BO')}</span>
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

                {/* Información del Viaje */}
                {viaje && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Información del Viaje</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span><strong>{viaje.origen}</strong> → <strong>{viaje.destino}</strong></span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span>{new Date(viaje.fecha).toLocaleDateString('es-BO')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span>{viaje.hora?.substring(0, 5)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Precio por asiento: {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(viaje.precio)}</span>
                      </div>
                    </div>
                  </div>
                )}
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
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold">Asiento {item.asiento.numero}</span>
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