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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Eliminación de Vehículo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar este vehículo? 
                Esta acción no se puede deshacer y afectará todas las operaciones asociadas.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Información del Vehículo:
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <div>{vehiculo.nombre}</div>
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>
                    <div className="mt-1">
                      <Badge variant="brand" badgeType="no-icon" size="sm">
                        {vehiculo.tipo_vehiculo}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Placa:</span>
                    <div className="mt-1">
                      <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                        {vehiculo.placa}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Marca:</span>
                    <div>{vehiculo.marca}</div>
                  </div>
                  <div>
                    <span className="font-medium">Modelo:</span>
                    <div>{vehiculo.modelo || "-"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Año:</span>
                    <div>{vehiculo.año_fabricacion || "-"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Capacidad Pasajeros:</span>
                    <div className="mt-1">
                      <Badge variant="information" badgeType="no-icon" size="sm">
                        {vehiculo.capacidad_pasajeros} personas
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Capacidad Carga:</span>
                    <div className="mt-1">
                      <Badge variant="information" badgeType="no-icon" size="sm">
                        {vehiculo.capacidad_carga} kg
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <div className="mt-1">
                      {getStatusBadge(vehiculo.estado)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Conductor:</span>
                    <div>{getConductorInfo(vehiculo.conductor)}</div>
                  </div>
                  {vehiculo.kilometraje && (
                    <div>
                      <span className="font-medium">Kilometraje:</span>
                      <div className="mt-1">
                        <Badge variant="neutral" badgeType="no-icon" size="sm">
                          {vehiculo.kilometraje.toLocaleString()} km
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="text-red-800 text-sm">
                  <strong>Advertencia:</strong> Al eliminar este vehículo, se perderá 
                  toda la información asociada incluyendo historial de viajes, 
                  mantenimientos y no podrá ser recuperada.
                </div>
              </div>

              {vehiculo.estado === 'activo' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Este vehículo está actualmente activo. 
                    Asegúrate de que no tenga viajes pendientes antes de eliminarlo.
                  </div>
                </div>
              )}

              {vehiculo.conductor && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="text-blue-800 text-sm">
                    <strong>Importante:</strong> Este vehículo tiene un conductor asignado. 
                    El conductor quedará disponible para asignación a otro vehículo.
                  </div>
                </div>
              )}
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
            Eliminar Vehículo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
