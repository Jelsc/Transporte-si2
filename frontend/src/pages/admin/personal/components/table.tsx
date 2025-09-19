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
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import type { Personal } from '@/types';

interface PersonalTableProps {
  data: Personal[];
  loading: boolean;
  onEdit: (item: Personal) => void;
  onDelete: (item: Personal) => void;
  onView?: (item: Personal) => void;
}

export function PersonalTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView 
}: PersonalTableProps) {
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
        No se encontró personal registrado
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
            <TableHead>CI</TableHead>
            <TableHead>Fecha Nacimiento</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((personal) => (
            <TableRow key={personal.id}>
              <TableCell className="font-medium">
                {personal.nombre} {personal.apellido}
              </TableCell>
              <TableCell>{personal.email}</TableCell>
              <TableCell>{personal.telefono}</TableCell>
              <TableCell>{personal.ci}</TableCell>
              <TableCell>{formatDate(personal.fecha_nacimiento)}</TableCell>
              <TableCell>
                {personal.departamento ? (
                  <Badge variant="outline">{personal.departamento}</Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(personal.es_activo)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(personal)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(personal)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(personal)}
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
