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
import { Loader2, AlertTriangle, Car } from 'lucide-react';
import type { Conductor } from '@/types';

interface ConductorDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  conductor: Conductor | null;
  loading?: boolean;
}

export function ConductorDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conductor, 
  loading = false 
}: ConductorDeleteProps) {
  if (!conductor) return null;

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

  const getLicenseStatus = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return {
        status: 'Vencida',
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-3 w-3" />
      };
    } else if (diasRestantes <= 30) {
      return {
        status: `Por vencer (${diasRestantes} días)`,
        variant: 'secondary' as const,
        icon: null
      };
    } else {
      return {
        status: 'Vigente',
        variant: 'outline' as const,
        icon: null
      };
    }
  };

  const licenseStatus = getLicenseStatus(conductor.fecha_venc_licencia);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación de Conductor
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              ¿Estás seguro de que deseas eliminar este conductor? 
              Esta acción no se puede deshacer y afectará todas las operaciones asociadas.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Información del Conductor:
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p>{conductor.nombre} {conductor.apellido}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{conductor.email}</p>
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span>
                  <p>{conductor.telefono}</p>
                </div>
                <div>
                  <span className="font-medium">CI:</span>
                  <p>{conductor.ci}</p>
                </div>
                <div>
                  <span className="font-medium">Número de Licencia:</span>
                  <p className="font-mono">{conductor.nro_licencia}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo de Licencia:</span>
                  <p>Tipo {conductor.tipo_licencia}</p>
                </div>
                <div>
                  <span className="font-medium">Vencimiento:</span>
                  <p>{formatDate(conductor.fecha_venc_licencia)}</p>
                </div>
                <div>
                  <span className="font-medium">Estado de Licencia:</span>
                  <Badge variant={licenseStatus.variant} className="flex items-center gap-1 w-fit">
                    {licenseStatus.icon}
                    {licenseStatus.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Experiencia:</span>
                  <p>{conductor.experiencia_anios} años</p>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <Badge variant={conductor.es_activo ? "default" : "secondary"}>
                    {conductor.es_activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Advertencia:</strong> Al eliminar este conductor, se perderá 
                toda la información asociada incluyendo historial de viajes, 
                ubicaciones y no podrá ser recuperada.
              </p>
            </div>

            {conductor.es_activo && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Este conductor está actualmente activo. 
                  Asegúrate de que no tenga viajes pendientes antes de eliminarlo.
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
            Eliminar Conductor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
