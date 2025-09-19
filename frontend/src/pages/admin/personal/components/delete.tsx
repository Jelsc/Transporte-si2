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
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Personal } from '@/types';

interface PersonalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  personal: Personal | null;
  loading?: boolean;
}

export function PersonalDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  personal, 
  loading = false 
}: PersonalDeleteProps) {
  if (!personal) return null;

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

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              ¿Estás seguro de que deseas eliminar este miembro del personal? 
              Esta acción no se puede deshacer.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Información del Personal:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p>{personal.nombre} {personal.apellido}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{personal.email}</p>
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span>
                  <p>{personal.telefono}</p>
                </div>
                <div>
                  <span className="font-medium">CI:</span>
                  <p>{personal.ci}</p>
                </div>
                <div>
                  <span className="font-medium">Departamento:</span>
                  <p>{personal.departamento || 'No asignado'}</p>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge variant={personal.es_activo ? "default" : "secondary"}>
                    {personal.es_activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Fecha de Nacimiento:</span>
                  <p>{formatDate(personal.fecha_nacimiento)}</p>
                </div>
                <div>
                  <span className="font-medium">Código de Empleado:</span>
                  <p>{personal.codigo_empleado || 'No asignado'}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Advertencia:</strong> Al eliminar este personal, se perderá 
                toda la información asociada y no podrá ser recuperada.
              </p>
            </div>
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
            Eliminar Personal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
