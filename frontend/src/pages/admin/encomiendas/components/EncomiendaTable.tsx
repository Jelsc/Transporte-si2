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
import { MoreHorizontal, Edit, Trash2, Eye, Package, User, MapPin } from 'lucide-react';
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
    const variants: Record<string, "success" | "warning" | "error" | "neutral"> = {
      'pendiente': 'warning',
      'en_ruta': 'neutral',
      'entregado': 'success',
      'cancelado': 'error',
    };

    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_ruta': 'En Ruta',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
    };

    return (
      <Badge 
        variant={variants[estado] || 'neutral'} 
        badgeType="no-icon"
        size="sm"
      >
        {labels[estado] || estado}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO');
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
        No se encontraron encomiendas registradas
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
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((encomienda) => (
              <TableRow key={encomienda.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-mono font-semibold">
                      {encomienda.codigo_seguimiento}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{encomienda.remitente_nombre}</div>
                    <div className="text-sm text-gray-500">{encomienda.remitente_telefono}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{encomienda.destinatario_nombre}</div>
                    <div className="text-sm text-gray-500">{encomienda.destinatario_telefono}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">{encomienda.destino_ciudad}</span>
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-[150px]">
                    {encomienda.destino_direccion}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="information" badgeType="no-icon" size="sm">
                    {encomienda.peso} kg
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  {encomienda.precio.toFixed(2)} BOB
                </TableCell>
                <TableCell>{getStatusBadge(encomienda.estado)}</TableCell>
                <TableCell>{formatDate(encomienda.fecha_creacion)}</TableCell>
                <TableCell>
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
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
              ))}
              
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