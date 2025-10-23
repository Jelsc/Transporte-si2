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
} from '@/components/ui/pagination';
import { MoreHorizontal, Edit, Trash2, Eye, Package, User, MapPin, DollarSign, Truck, CreditCard } from 'lucide-react';
import type { Encomienda } from '@/types/encomienda';

interface EncomiendaTableProps {
  data: Encomienda[];
  loading: boolean;
  onEdit: (item: Encomienda) => void;
  onDelete: (item: Encomienda) => void;
  onView?: (item: Encomienda) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EncomiendaTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: EncomiendaTableProps) {
  const getStatusBadge = (estado: string) => {
    const variants = {
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'en_ruta': 'bg-blue-100 text-blue-800 border-blue-200',
      'entregado': 'bg-green-100 text-green-800 border-green-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      'pendiente': 'Pendiente',
      'en_ruta': 'En Ruta',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };

    return (
      <Badge 
        variant="outline"
        className={`${variants[estado as keyof typeof variants]} border`}
      >
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    );
  };

  const getPagoBadge = (encomienda: Encomienda) => {
    let estadoPago = 'pendiente';
    let metodoPago = 'efectivo';

    if (encomienda.estado_pago) {
      estadoPago = encomienda.estado_pago;
    } else if (encomienda.pago_info) {
      estadoPago = encomienda.pago_info.estado;
      metodoPago = encomienda.pago_info.metodo_pago;
    }

    const estados = {
      'pendiente': 'bg-gray-100 text-gray-800',
      'completado': 'bg-green-100 text-green-800',
      'fallido': 'bg-red-100 text-red-800',
      'procesando': 'bg-blue-100 text-blue-800'
    };

    const metodos = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'stripe': 'Tarjeta'
    };

    return (
      <div className="flex flex-col gap-1">
        <Badge 
          variant="outline" 
          className={`${estados[estadoPago as keyof typeof estados] || 'bg-gray-100 text-gray-800'} text-xs`}
        >
          {estadoPago}
        </Badge>
        <Badge 
          variant="outline" 
          className="bg-purple-100 text-purple-800 text-xs"
        >
          <CreditCard className="h-3 w-3 mr-1" />
          {metodos[metodoPago as keyof typeof metodos] || metodoPago}
        </Badge>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No se encontraron encomiendas registradas</p>
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
              <TableHead>Remitente</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((encomienda) => (
              <TableRow key={encomienda.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-mono font-semibold text-sm">
                      {encomienda.codigo_seguimiento}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{encomienda.remitente_nombre}</div>
                    <div className="text-xs text-gray-500">{encomienda.remitente_telefono}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{encomienda.destinatario_nombre}</div>
                    <div className="text-xs text-gray-500">{encomienda.destinatario_telefono}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="font-medium text-sm">{encomienda.destino_ciudad}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    {encomienda.destino_direccion}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    {encomienda.peso} kg
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {encomienda.precio.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(encomienda.estado)}</TableCell>
                <TableCell>{getPagoBadge(encomienda)}</TableCell>
                <TableCell>
                  <div className="text-xs text-gray-600">
                    {formatDate(encomienda.fecha_creacion)}
                  </div>
                </TableCell>
                <TableCell>
                  {encomienda.conductor_nombre ? (
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{encomienda.conductor_nombre}</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                      Sin asignar
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(encomienda)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(encomienda)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(encomienda)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(pageNum);
                      }}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}