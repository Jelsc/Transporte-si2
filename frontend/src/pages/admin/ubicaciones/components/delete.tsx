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
import { Loader2, AlertTriangle, MapPin, Building, Home } from 'lucide-react';
import type { Ubicacion, TipoUbicacion } from '@/types';
import { TIPO_UBICACION_OPTIONS } from '@/types';
import { UbicacionesService } from '@/services/ubicacionesService';

interface UbicacionDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  ubicacion: Ubicacion | null;
  loading?: boolean;
}

export function UbicacionDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  ubicacion, 
  loading = false 
}: UbicacionDeleteProps) {
  if (!ubicacion) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const getTipoIcon = (tipo: TipoUbicacion) => {
    switch (tipo) {
      case 'TERMINAL':
        return <MapPin className="w-4 h-4 text-blue-600" />;
      case 'AGENCIA':
        return <Building className="w-4 h-4 text-green-600" />;
      case 'PRIVADO':
        return <Home className="w-4 h-4 text-yellow-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTipoBadge = (tipo: TipoUbicacion) => {
    const tipoOption = TIPO_UBICACION_OPTIONS.find(opt => opt.value === tipo);
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {getTipoIcon(tipo)}
        {tipoOption?.label || tipo}
      </Badge>
    );
  };

  const getStatusBadge = (activo: boolean) => {
    return (
      <Badge variant={activo ? "default" : "destructive"}>
        {activo ? "Activa" : "Inactiva"}
      </Badge>
    );
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
                ¿Estás seguro de que deseas eliminar la ubicación{' '}
                <span className="font-semibold text-gray-900">{ubicacion.nombre}</span>?
              </p>
              
              {/* Información resumida con badges */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getTipoIcon(ubicacion.tipo)}
                  <Badge variant="outline" badgeType="no-icon" size="sm">
                    {TIPO_UBICACION_OPTIONS.find(opt => opt.value === ubicacion.tipo)?.label || ubicacion.tipo}
                  </Badge>
                </div>
                
                <span className="text-gray-300">|</span>
                
                <Badge 
                  variant={ubicacion.activo ? "success" : "error"} 
                  badgeType={ubicacion.activo ? "dot" : "icon"}
                  size="sm"
                >
                  {ubicacion.activo ? "Activa" : "Inactiva"}
                </Badge>
                
                {ubicacion.direccion_texto && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {ubicacion.direccion_texto}
                    </span>
                  </>
                )}
              </div>

              {/* Detalles adicionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">Coordenadas:</span>
                  <div>
                    <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                      {UbicacionesService.formatearCoordenadas(ubicacion.lat, ubicacion.lng, 4)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">Tiempo de Servicio:</span>
                  <div>
                    <Badge variant="information" badgeType="no-icon" size="sm">
                      {ubicacion.service_min} min
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Advertencia principal */}
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Esta acción es irreversible</p>
                  <p>
                    Se eliminará permanentemente toda la información de esta ubicación.
                    {ubicacion.activo && ' La ubicación está actualmente activa.'}
                    {ubicacion.tipo === 'TERMINAL' && ' Su eliminación puede afectar múltiples rutas.'}
                  </p>
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