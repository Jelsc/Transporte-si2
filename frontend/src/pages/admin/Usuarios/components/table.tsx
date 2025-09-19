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
import { MoreHorizontal, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import type { Usuario } from '@/types';

interface UsuarioTableProps {
  data: Usuario[];
  loading: boolean;
  onEdit: (item: Usuario) => void;
  onDelete: (item: Usuario) => void;
  onToggleStatus?: (item: Usuario) => void;
  onView?: (item: Usuario) => void;
}

export function UsuarioTable({ 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onView 
}: UsuarioTableProps) {
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

  const getRolBadge = (rol: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Administrador': 'destructive',
      'Supervisor': 'default',
      'Operador': 'secondary',
      'Conductor': 'outline',
      'Cliente': 'outline',
    };

    return (
      <Badge variant={variants[rol] || 'outline'}>
        {rol}
      </Badge>
    );
  };

  const getAdminPortalBadge = (isAdminPortal: boolean) => {
    return (
      <Badge variant={isAdminPortal ? "default" : "outline"}>
        {isAdminPortal ? "Admin Portal" : "Cliente"}
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
        No se encontraron usuarios registrados
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Portal</TableHead>
            <TableHead>Vinculaciones</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[70px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="font-medium">
                {usuario.username}
              </TableCell>
              <TableCell>
                {usuario.nombre} {usuario.apellido}
              </TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell>{usuario.telefono}</TableCell>
              <TableCell>{getRolBadge(usuario.rol)}</TableCell>
              <TableCell>{getAdminPortalBadge(usuario.is_admin_portal)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {usuario.personal_id && (
                    <Badge variant="outline" className="text-xs">
                      Personal #{usuario.personal_id}
                    </Badge>
                  )}
                  {usuario.conductor_id && (
                    <Badge variant="outline" className="text-xs">
                      Conductor #{usuario.conductor_id}
                    </Badge>
                  )}
                  {!usuario.personal_id && !usuario.conductor_id && (
                    <span className="text-gray-400 text-xs">Sin vinculaciones</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(usuario.es_activo)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(usuario)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(usuario)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {onToggleStatus && (
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus(usuario)}
                        className={usuario.es_activo ? "text-orange-600" : "text-green-600"}
                      >
                        {usuario.es_activo ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDelete(usuario)}
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
