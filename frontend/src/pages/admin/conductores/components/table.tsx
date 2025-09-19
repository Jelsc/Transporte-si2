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
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import type { Conductor } from '@/types';

interface ConductorTableProps {
  data: Conductor[];
  loading: boolean;
  onEdit: (item: Conductor) => void;
  onDelete: (item: Conductor) => void;
  onView?: (item: Conductor) => void;
}

export function ConductorTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView 
}: ConductorTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (esActivo: boolean) => {
    return (
      <Badge variant={esActivo ? "default" : "secondary"}>
        {esActivo ? "Activo" : "Inactivo"}
      </Badge>
    );
  };

  const getLicenseStatusBadge = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencida
        </Badge>
      );
    } else if (diasRestantes <= 30) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Por vencer ({diasRestantes} días)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Vigente
        </Badge>
      );
    }
  };

  const getLicenseNumberBadge = (nroLicencia: string) => {
    return (
      <Badge variant="outline" className="font-mono">
        {nroLicencia}
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
        No se encontraron conductores registrados
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Nro. Licencia</TableHead>
            <TableHead>Vencimiento Licencia</TableHead>
            <TableHead>Experiencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((conductor) => (
            <TableRow key={conductor.id}>
              <TableCell className="font-medium">
                {conductor.nombre} {conductor.apellido}
              </TableCell>
              <TableCell>{conductor.email}</TableCell>
              <TableCell>{conductor.telefono}</TableCell>
              <TableCell>{getLicenseNumberBadge(conductor.nro_licencia)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{formatDate(conductor.fecha_venc_licencia)}</div>
                  {getLicenseStatusBadge(conductor.fecha_venc_licencia)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {conductor.experiencia_anios} años
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(conductor.es_activo)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(conductor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(conductor)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(conductor)}
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
    </ScrollArea>
  );
}
