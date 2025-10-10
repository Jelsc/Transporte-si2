// src/pages/client/MisReservas/components/MisReservasTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  X, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import type { Reserva } from '@/types/reservas';

// 👇 Tipo seguro para el viaje dentro de los items
interface ViajeEnItem {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
}

// 👇 Tipo seguro para el asiento
interface AsientoConViaje {
  id: number;
  numero: string;
  estado: string;
  viaje: ViajeEnItem;
}

// 👇 Tipo seguro para el item de reserva
interface ItemReservaConDetalle {
  id: number;
  precio: number;
  asiento: AsientoConViaje;
}

// 👇 Tipo seguro para la reserva completa
interface ReservaConDetalle extends Omit<Reserva, 'items'> {
  items: ItemReservaConDetalle[];
}

interface MisReservasTableProps {
  reservas: ReservaConDetalle[];
  loading: boolean;
  onVerDetalle: (reserva: ReservaConDetalle) => void;
  onCancelar: (reserva: ReservaConDetalle) => void;
  onMarcarPagada: (id: number) => void;
}

export function MisReservasTable({
  reservas,
  loading,
  onVerDetalle,
  onCancelar,
  onMarcarPagada,
}: MisReservasTableProps) {
  const getEstadoBadge = (reserva: ReservaConDetalle) => {
    const variants = {
      pendiente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      confirmada: 'bg-green-100 text-green-800 hover:bg-green-100',
      cancelada: 'bg-red-100 text-red-800 hover:bg-red-100',
    };

    return (
      <Badge variant="secondary" className={variants[reserva.estado as keyof typeof variants]}>
        {reserva.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
        {reserva.estado === 'confirmada' && <CheckCircle className="h-3 w-3 mr-1" />}
        {reserva.estado === 'cancelada' && <X className="h-3 w-3 mr-1" />}
        {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
      </Badge>
    );
  };

  const getPagoBadge = (pagado: boolean) => {
    return pagado ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Pagado
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const getViajeInfo = (reserva: ReservaConDetalle) => {
    const primerItem = reserva.items?.[0];
    if (!primerItem) return 'No hay información del viaje';
    
    const viaje = primerItem.asiento.viaje;
    return `${viaje.origen} → ${viaje.destino}`;
  };

  const getFechaViaje = (reserva: ReservaConDetalle) => {
    const primerItem = reserva.items?.[0];
    const viaje = primerItem?.asiento.viaje;
    
    if (!viaje?.fecha) return 'Fecha no disponible';
    
    return new Date(viaje.fecha).toLocaleDateString('es-BO');
  };

  // ... el resto del código permanece igual (pero usando ReservaConDetalle)
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Cargando reservas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
            <p className="text-muted-foreground">
              No se encontraron reservas con los filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Viaje</TableHead>
            <TableHead>Fecha Viaje</TableHead>
            <TableHead>Asientos</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Fecha Reserva</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((reserva) => (
            <TableRow key={reserva.id}>
              <TableCell className="font-mono font-medium">
                {reserva.codigo_reserva}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="max-w-[150px] truncate" title={getViajeInfo(reserva)}>
                    {getViajeInfo(reserva)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  {getFechaViaje(reserva)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  {reserva.items?.length || 0} asiento(s)
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-semibold">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB'
                  }).format(reserva.total || 0)}
                </div>
              </TableCell>
              <TableCell>{getEstadoBadge(reserva)}</TableCell>
              <TableCell>{getPagoBadge(reserva.pagado)}</TableCell>
              <TableCell>
                {new Date(reserva.fecha_reserva).toLocaleDateString('es-BO')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerDetalle(reserva)}
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {reserva.estado !== 'cancelada' && !reserva.pagado && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarcarPagada(reserva.id)}
                      title="Marcar como pagada"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {reserva.estado !== 'cancelada' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelar(reserva)}
                      title="Cancelar reserva"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}