import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  MapPin, 
  Ticket,
  DollarSign,
  Hash
} from 'lucide-react';
import type { Reserva } from '@/types/reservas';

interface ReservaTableProps {
  data: Reserva[];
  loading: boolean;
  onEdit: (item: Reserva) => void;
  onDelete: (item: Reserva) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ReservaTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  page,
  totalPages,
  onPageChange
}: ReservaTableProps) {
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
    if (!cliente) return "-";
    
    if (typeof cliente === 'object' && cliente !== null) {
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
      // ✅ También manejar nombre/apellido por compatibilidad
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
    
    return "-";
  };

  // Obtener información del viaje con validaciones seguras
  const getViajeInfo = (reserva: Reserva) => {
    if (!reserva.items || reserva.items.length === 0) return "-";
    
    const primerAsiento = reserva.items[0]?.asiento;
    if (!primerAsiento?.viaje) return "-";
    
    const viaje = primerAsiento.viaje;
    
    if (typeof viaje === 'number') return "Viaje ID: " + viaje;
    
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
    if (!reserva.items || reserva.items.length === 0) return "-";
    
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

  // Obtener código de reserva seguro
  const getCodigoReserva = (reserva: Reserva) => {
    return reserva.codigo_reserva || `RES${reserva.id}`;
  };

  // Obtener total seguro
  const getTotalReserva = (reserva: Reserva) => {
    return reserva.total || 0;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron reservas registradas
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Viaje</TableHead>
              <TableHead>Asientos</TableHead>
              <TableHead>Fecha Viaje</TableHead>
              <TableHead>Fecha Reserva</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((reserva) => (
              <TableRow key={reserva.id}>
                {/* Código de reserva */}
                <TableCell className="font-mono font-medium">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-blue-500" />
                    {getCodigoReserva(reserva)}
                  </div>
                </TableCell>
                
                {/* Cliente */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    {getClienteInfo(reserva.cliente)}
                  </div>
                </TableCell>
                
                {/* Viaje */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {getViajeInfo(reserva)}
                  </div>
                </TableCell>
                
                {/* Asientos (múltiples) */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {getCantidadAsientos(reserva)} asiento(s)
                      </span>
                    </div>
                    <Badge variant="outline" size="sm" className="text-xs">
                      {getAsientosLista(reserva)}
                    </Badge>
                  </div>
                </TableCell>
                
                {/* Fecha Viaje */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    {getFechaViaje(reserva)}
                  </div>
                </TableCell>
                
                {/* Fecha Reserva */}
                <TableCell>
                  {reserva.fecha_reserva ? 
                    new Date(reserva.fecha_reserva).toLocaleDateString('es-ES') : 
                    "-"
                  }
                </TableCell>
                
                {/* Total */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {new Intl.NumberFormat('es-BO', {
                      style: 'currency',
                      currency: 'BOB'
                    }).format(getTotalReserva(reserva))}
                  </div>
                </TableCell>
                
                {/* Estado de reserva */}
                <TableCell>
                  {getEstadoBadge(reserva.estado)}
                </TableCell>
                
                {/* Estado de pago */}
                <TableCell>
                  {getPagoBadge(reserva.pagado)}
                </TableCell>
                
                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(reserva)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(reserva)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && onPageChange(page - 1)}
                size="default"
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === page;
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={isActive}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    isActive={page === totalPages}
                    size="icon"
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && onPageChange(page + 1)}
                size="default"
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}