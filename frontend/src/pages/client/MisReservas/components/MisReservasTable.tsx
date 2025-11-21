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
  DollarSign,
  Navigation
} from 'lucide-react';
import type { Reserva } from '@/types/reservas';

interface MisReservasTableProps {
  reservas: Reserva[];
  loading: boolean;
  onVerDetalle: (reserva: Reserva) => void;
  onCancelar: (reserva: Reserva) => void;
  onMarcarPagada: (id: number) => void;
}

export function MisReservasTable({
  reservas,
  loading,
  onVerDetalle,
  onCancelar,
  onMarcarPagada,
}: MisReservasTableProps) {

  const getEstadoBadge = (reserva: Reserva) => {
    const variants = {
      pendiente_pago: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      confirmada: 'bg-green-100 text-green-800 hover:bg-green-100',
      pagada: 'bg-green-100 text-green-800 hover:bg-green-100',
      cancelada: 'bg-red-100 text-red-800 hover:bg-red-100',
      expirada: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    const estadoTexto = {
      pendiente_pago: 'Pendiente Pago',
      confirmada: 'Confirmada', 
      pagada: 'Pagada',
      cancelada: 'Cancelada',
      expirada: 'Expirada',
    };

    return (
      <Badge variant="secondary" className={variants[reserva.estado as keyof typeof variants] || 'bg-gray-100'}>
        {reserva.estado === 'pendiente_pago' && <Clock className="h-3 w-3 mr-1" />}
        {(reserva.estado === 'confirmada' || reserva.estado === 'pagada') && <CheckCircle className="h-3 w-3 mr-1" />}
        {reserva.estado === 'cancelada' && <X className="h-3 w-3 mr-1" />}
        {estadoTexto[reserva.estado as keyof typeof estadoTexto] || reserva.estado}
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

  // ✅ FUNCIÓN SIMPLIFICADA: Solo origen → destino
  const getViajeInfo = (reserva: Reserva): string => {
    if (reserva.viaje_info && reserva.viaje_info.origen && reserva.viaje_info.destino) {
      return `${reserva.viaje_info.origen} → ${reserva.viaje_info.destino}`;
    }
    return 'Información no disponible';
  };

  // ✅ FUNCIÓN SIMPLIFICADA: Obtener fecha del viaje
  const getFechaViaje = (reserva: Reserva): string => {
    if (reserva.viaje_info?.fecha) {
      return new Date(reserva.viaje_info.fecha).toLocaleDateString('es-BO');
    }
    return 'Fecha no disponible';
  };

  // ✅ FUNCIÓN SIMPLIFICADA: Obtener hora del viaje
  const getHoraViaje = (reserva: Reserva): string => {
    if (reserva.viaje_info?.hora) {
      return reserva.viaje_info.hora.split(':').slice(0, 2).join(':');
    }
    return '--:--';
  };

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
            <TableHead className="min-w-[200px]">Viaje</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Asientos</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Reserva</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((reserva) => (
            <TableRow key={reserva.id}>
              <TableCell className="font-mono font-medium">
                {reserva.codigo_reserva}
              </TableCell>
              
              {/* ✅ COLUMNA VIAJE - Limpia y simple */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">
                    {getViajeInfo(reserva)}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{getFechaViaje(reserva)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-mono">{getHoraViaje(reserva)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">
                    {reserva.items?.length || 0}
                  </span>
                  {reserva.items && reserva.items.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({reserva.items.map(item => item.asiento?.numero).join(', ')})
                    </span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2 font-semibold">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB'
                    }).format(reserva.total || 0)}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>{getEstadoBadge(reserva)}</TableCell>
              <TableCell>{getPagoBadge(reserva.pagado)}</TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {new Date(reserva.fecha_reserva).toLocaleDateString('es-BO')}
                </span>
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
                  
                  {reserva.estado !== 'cancelada' && reserva.estado !== 'expirada' && (
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