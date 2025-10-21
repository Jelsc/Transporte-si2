// src/pages/client/MisReservas/components/CancelarReservaModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import type { Reserva } from '@/types/reservas';

// 👇 Mismos tipos que en los otros componentes
interface ViajeEnItem {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
}

interface AsientoConViaje {
  id: number;
  numero: string;
  estado: string;
  viaje: ViajeEnItem;
}

interface ItemReservaConDetalle {
  id: number;
  precio: number;
  asiento: AsientoConViaje;
}

interface ReservaConDetalle extends Omit<Reserva, 'items'> {
  items: ItemReservaConDetalle[];
}

interface CancelarReservaModalProps {
  reserva: ReservaConDetalle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function CancelarReservaModal({
  reserva,
  isOpen,
  onClose,
  onConfirm,
  loading,
}: CancelarReservaModalProps) {
  if (!reserva) return null;

  const getViajeInfo = () => {
    const primerItem = reserva.items?.[0];
    if (!primerItem) return 'Viaje no disponible';
    
    const viaje = primerItem.asiento.viaje;
    return `${viaje.origen} → ${viaje.destino}`;
  };

  const getFechaViaje = () => {
    const primerItem = reserva.items?.[0];
    const viaje = primerItem?.asiento.viaje;
    
    if (!viaje?.fecha) return 'Fecha no disponible';
    
    return new Date(viaje.fecha).toLocaleDateString('es-BO');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Reserva
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la reserva */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Código:</span>
              <span className="font-mono">{reserva.codigo_reserva}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Viaje:</span>
              <span className="text-right">{getViajeInfo()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Fecha Viaje:</span>
              <span>{getFechaViaje()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Asientos:</span>
              <span>{reserva.items?.length || 0}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Total:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('es-BO', {
                  style: 'currency',
                  currency: 'BOB'
                }).format(reserva.total || 0)}
              </span>
            </div>
          </div>

          {/* Advertencias */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Considera lo siguiente:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Los asientos se liberarán automáticamente</li>
                  <li>Esta acción no se puede deshacer</li>
                  {reserva.pagado && (
                    <li className="font-semibold">
                      Esta reserva ya fue pagada. Contacta con soporte para reembolso.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Mantener Reserva
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cancelando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sí, Cancelar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}