import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, User, Shield, Car } from 'lucide-react';
import type { Usuario } from '@/types';

interface UsuarioDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  usuario: Usuario | null;
  loading?: boolean;
}

export function UsuarioDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  usuario, 
  loading = false 
}: UsuarioDeleteProps) {
  if (!usuario) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'Administrador':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'Supervisor':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'Conductor':
        return <Car className="h-4 w-4 text-orange-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
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
      <Badge variant={variants[rol] || 'outline'} className="flex items-center gap-1">
        {getRolIcon(rol)}
        {rol}
      </Badge>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación de Usuario
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              ¿Estás seguro de que deseas eliminar este usuario? 
              Esta acción no se puede deshacer y afectará todas las operaciones asociadas.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Usuario:
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Username:</span>
                  <p className="font-mono">{usuario.username}</p>
                </div>
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p>{usuario.nombre} {usuario.apellido}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{usuario.email}</p>
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span>
                  <p>{usuario.telefono}</p>
                </div>
                <div>
                  <span className="font-medium">Rol:</span>
                  <div className="mt-1">
                    {getRolBadge(usuario.rol)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Portal:</span>
                  <Badge variant={usuario.is_admin_portal ? "default" : "outline"}>
                    {usuario.is_admin_portal ? "Admin Portal" : "Cliente"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge variant={usuario.es_activo ? "default" : "secondary"}>
                    {usuario.es_activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Fecha de Creación:</span>
                  <p>{formatDate(usuario.created_at)}</p>
                </div>
              </div>

              {/* Vinculaciones */}
              {(usuario.personal_id || usuario.conductor_id) && (
                <div className="mt-3 pt-3 border-t">
                  <span className="font-medium">Vinculaciones:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {usuario.personal_id && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Personal #{usuario.personal_id}
                      </Badge>
                    )}
                    {usuario.conductor_id && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Conductor #{usuario.conductor_id}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Advertencia:</strong> Al eliminar este usuario, se perderá 
                toda la información asociada incluyendo historial de sesiones, 
                permisos y no podrá ser recuperada.
              </p>
            </div>

            {usuario.es_activo && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Este usuario está actualmente activo. 
                  Asegúrate de que no tenga sesiones activas antes de eliminarlo.
                </p>
              </div>
            )}

            {usuario.rol === 'Administrador' && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-orange-800 text-sm">
                  <strong>Advertencia:</strong> Este usuario tiene rol de Administrador. 
                  Asegúrate de que existan otros administradores en el sistema.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar Usuario
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
