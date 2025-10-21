 import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,  
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, User, MapPin } from 'lucide-react';
import type { Encomienda } from '@/types/encomienda';

interface EncomiendaDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  encomienda?: Encomienda | null;
  loading?: boolean;
}

export function EncomiendaDelete({
  isOpen,
  onClose,
  onConfirm,
  encomienda,
  loading = false
}: EncomiendaDeleteProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!encomienda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. La encomienda será eliminada permanentemente del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la encomienda a eliminar */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <h4 className="font-semibold text-red-800">
                    {encomienda.codigo_seguimiento}
                  </h4>
                  <p className="text-sm text-red-700">
                    {encomienda.destinatario_nombre} - {encomienda.destino_ciudad}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-red-600">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Remitente: {encomienda.remitente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Destino: {encomienda.destino_ciudad}</span>
                  </div>
                </div>
                
                <div className="text-xs text-red-600">
                  <strong>Peso:</strong> {encomienda.peso} kg • 
                  <strong> Precio:</strong> {encomienda.precio.toFixed(2)} BOB
                </div>
              </div>
            </div>
          </div>

          {/* Advertencias */}
          <div className="space-y-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-medium">⚠️ Consideraciones importantes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Se eliminará todo el historial de seguimiento</li>
              <li>Los datos de pago asociados también serán eliminados</li>
              <li>Esta acción afectará los reportes y estadísticas</li>
              <li>No podrás recuperar esta información posteriormente</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="sm:flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="sm:flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Sí, Eliminar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}