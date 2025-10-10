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
import { MoreHorizontal, Edit, Trash2, Eye, Car } from 'lucide-react';
import type { Vehiculo } from '@/types';

interface VehiculoTableProps {
  data: Vehiculo[];
  loading: boolean;
  onEdit: (item: Vehiculo) => void;
  onDelete: (item: Vehiculo) => void;
  onView?: (item: Vehiculo) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function VehiculoTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: VehiculoTableProps) {
  const getStatusBadge = (estado: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "neutral"> = {
      'activo': 'success',
      'mantenimiento': 'warning',
      'baja': 'error',
    };

    const labels: Record<string, string> = {
      'activo': 'Activo',
      'mantenimiento': 'Mantenimiento',
      'baja': 'Baja',
    };

    const badgeTypes: Record<string, "icon" | "dot" | "no-icon"> = {
      'activo': 'dot',
      'mantenimiento': 'icon',
      'baja': 'icon',
    };

    return (
      <Badge 
        variant={variants[estado] || 'neutral'} 
        badgeType={badgeTypes[estado] || 'no-icon'}
        size="sm"
      >
        {labels[estado] || estado}
      </Badge>
    );
  };

  const getTipoVehiculoBadge = (tipo: string) => {
    return (
      <Badge variant="brand" badgeType="no-icon" size="sm">
        {tipo}
      </Badge>
    );
  };

  const getConductorInfo = (conductor: any) => {
    if (!conductor) return "-";
    
    if (typeof conductor === 'object' && conductor !== null) {
      return `${conductor.nombre} ${conductor.apellido}`;
    }
    
    return "-";
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
        No se encontraron vehículos registrados
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Pasajeros</TableHead>
              <TableHead>Carga (kg)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((vehiculo) => (
              <TableRow key={vehiculo.id}>
                <TableCell className="font-medium">
                  {vehiculo.nombre}
                </TableCell>
                <TableCell>
                  {getTipoVehiculoBadge(vehiculo.tipo_vehiculo)}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                    {vehiculo.placa}
                  </Badge>
                </TableCell>
                <TableCell>{vehiculo.marca}</TableCell>
                <TableCell>{vehiculo.modelo}</TableCell>
                <TableCell>{vehiculo.año_fabricacion || "-"}</TableCell>
                <TableCell>
                  <Badge variant="information" badgeType="no-icon" size="sm">
                    {vehiculo.capacidad_pasajeros}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="information" badgeType="no-icon" size="sm">
                    {vehiculo.capacidad_carga} kg
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(vehiculo.estado)}</TableCell>
                <TableCell>{getConductorInfo(vehiculo.conductor)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(vehiculo)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(vehiculo)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(vehiculo)}
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
