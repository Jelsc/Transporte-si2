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
import type { Vehiculo } from '@/types';

interface VehiculoDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  vehiculo: Vehiculo | null;
  loading?: boolean;
}

export function VehiculoDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  vehiculo, 
  loading = false 
}: VehiculoDeleteProps) {
  if (!vehiculo) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

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

  const getConductorInfo = (conductor: any) => {
    if (!conductor) return "Sin conductor asignado";
    
    if (typeof conductor === 'object' && conductor !== null) {
      return `${conductor.nombre} ${conductor.apellido}`;
    }
    
    return "Sin conductor asignado";
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>Confirmar Eliminación</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar el vehículo{' '}
                <span className="font-semibold text-gray-900">{vehiculo.nombre}</span>?
              </p>
              
              {/* Información resumida con badges */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                  {vehiculo.placa}
                </Badge>
                
                <span className="text-gray-300">|</span>
                
                <Badge variant="brand" badgeType="no-icon" size="sm">
                  {vehiculo.tipo_vehiculo}
                </Badge>
                
                <span className="text-gray-300">|</span>
                
                {getStatusBadge(vehiculo.estado)}
                
                <span className="text-gray-300">|</span>
                
                <span className="text-sm text-gray-600">
                  {vehiculo.marca} {vehiculo.modelo || ''}
                </span>
              </div>

              {/* Detalles en grid responsivo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">Capacidad Pasajeros:</span>
                  <div>
                    <Badge variant="information" badgeType="no-icon" size="sm">
                      {vehiculo.capacidad_pasajeros} personas
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">Capacidad Carga:</span>
                  <div>
                    <Badge variant="information" badgeType="no-icon" size="sm">
                      {vehiculo.capacidad_carga} kg
                    </Badge>
                  </div>
                </div>
                {vehiculo.kilometraje && (
                  <div className="space-y-1">
                    <span className="font-medium text-gray-700">Kilometraje:</span>
                    <div>
                      <Badge variant="neutral" badgeType="no-icon" size="sm">
                        {vehiculo.kilometraje.toLocaleString()} km
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {vehiculo.conductor && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Conductor asignado:</span> {getConductorInfo(vehiculo.conductor)}
                    <br />
                    <span className="text-xs">El conductor quedará disponible para asignación a otro vehículo.</span>
                  </p>
                </div>
              )}

              {vehiculo.estado === 'activo' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Nota:</span> Este vehículo está actualmente activo. 
                    Asegúrate de que no tenga viajes pendientes antes de eliminarlo.
                  </p>
                </div>
              )}

              {/* Advertencia principal */}
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Esta acción es irreversible</p>
                  <p>Se eliminará permanentemente toda la información del vehículo.</p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
