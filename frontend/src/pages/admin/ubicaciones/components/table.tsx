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
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, Building, Home } from 'lucide-react';
import type { Ubicacion } from '@/types';
import { TipoUbicacion, TIPO_UBICACION_OPTIONS } from '@/types';
import { UbicacionesService } from '@/services/ubicacionesService';

interface UbicacionTableProps {
  data: Ubicacion[];
  loading: boolean;
  onEdit: (item: Ubicacion) => void;
  onDelete: (item: Ubicacion) => void;
  onView?: (item: Ubicacion) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UbicacionTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  page,
  totalPages,
  onPageChange
}: UbicacionTableProps) {
  const getStatusBadge = (activo: boolean) => {
    return (
      <Badge 
        variant={activo ? "success" : "error"} 
        badgeType={activo ? "dot" : "icon"}
        size="sm"
      >
        {activo ? "Activa" : "Inactiva"}
      </Badge>
    );
  };

  const getTipoUbicacionBadge = (tipo: TipoUbicacion) => {
    const tipoLabel = TIPO_UBICACION_OPTIONS.find(opt => opt.value === tipo)?.label || tipo;
    
    // Obtener icono según tipo
    const getTipoIcon = (tipo: TipoUbicacion) => {
      switch (tipo) {
        case TipoUbicacion.TERMINAL:
          return <MapPin className="w-3 h-3 text-blue-600" />;
        case TipoUbicacion.AGENCIA:
          return <Building className="w-3 h-3 text-green-600" />;
        case TipoUbicacion.PRIVADO:
          return <Home className="w-3 h-3 text-yellow-600" />;
        default:
          return <MapPin className="w-3 h-3 text-gray-600" />;
      }
    };
    
    return (
      <div className="flex items-center gap-2">
        {getTipoIcon(tipo)}
        <Badge variant="outline" badgeType="no-icon" size="sm">
          {tipoLabel}
        </Badge>
      </div>
    );
  };

  const getCoordenadasBadge = (lat: number | string, lng: number | string) => {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    return (
      <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
        {latNum.toFixed(4)}, {lngNum.toFixed(4)}
      </Badge>
    );
  };

  const getServiceTimeBadge = (serviceMin: number) => {
    return (
      <Badge variant="information" badgeType="no-icon" size="sm">
        {serviceMin} min
      </Badge>
    );
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
        No se encontraron ubicaciones registradas
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
              <TableHead>Dirección</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Tiempo de Servicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ubicacion) => (
              <TableRow key={ubicacion.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div>{ubicacion.nombre}</div>
                    {ubicacion.descripcion && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ubicacion.descripcion}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getTipoUbicacionBadge(ubicacion.tipo)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {ubicacion.direccion_texto || (
                      <span className="text-gray-400 italic">Sin dirección</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getCoordenadasBadge(ubicacion.lat, ubicacion.lng)}
                </TableCell>
                <TableCell>
                  {getServiceTimeBadge(ubicacion.service_min)}
                </TableCell>
                <TableCell>{getStatusBadge(ubicacion.activo)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(ubicacion)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(ubicacion)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(ubicacion)}
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