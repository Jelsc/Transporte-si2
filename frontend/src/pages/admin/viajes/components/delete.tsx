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
import { Loader2, AlertTriangle, Bus, MapPin, Calendar, Clock, DollarSign, Users } from 'lucide-react';
import type { Viaje } from '@/types';

interface ViajeDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  viaje: Viaje | null;
  loading?: boolean;
}

export function ViajeDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  viaje, 
  loading = false 
}: ViajeDeleteProps) {
  if (!viaje) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  const getStatusBadge = (estado?: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "neutral"> = {
      'programado': 'neutral',
      'en_curso': 'warning',
      'completado': 'success',
      'cancelado': 'error',
    };

    const labels: Record<string, string> = {
      'programado': 'Programado',
      'en_curso': 'En Curso',
      'completado': 'Completado',
      'cancelado': 'Cancelado',
    };

    const variant = variants[estado || 'programado'] || 'neutral';
    const label = labels[estado || 'programado'] || 'Programado';

    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el viaje y toda su información.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Información del viaje a eliminar */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Información del Viaje:</h4>
            
            {/* Ruta */}
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{viaje.origen} → {viaje.destino}</div>
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatDate(viaje.fecha)}</div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(viaje.hora)}
                </div>
              </div>
            </div>

            {/* Vehículo */}
            <div className="flex items-center space-x-2">
              <Bus className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {typeof viaje.vehiculo === 'object' && viaje.vehiculo 
                    ? `${viaje.vehiculo.nombre} (${viaje.vehiculo.placa})`
                    : `Vehículo ${viaje.vehiculo_id}`}
                </div>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{formatPrice(viaje.precio)}</div>
              </div>
            </div>

            {/* Asientos */}
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {viaje.asientos_ocupados || 0} / {viaje.asientos_disponibles || 0} asientos
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado:</span>
              {getStatusBadge(viaje.estado)}
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Advertencia:</p>
                <p>Al eliminar este viaje, también se eliminarán todas las reservas asociadas.</p>
              </div>
            </div>
          </div>
        </div>

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
            Eliminar Viaje
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}