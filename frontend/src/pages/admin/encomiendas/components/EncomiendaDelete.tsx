import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, User, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Encomienda } from '@/types/encomienda';

interface EncomiendaDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  encomienda: Encomienda | null;
  loading: boolean;
}

export function EncomiendaDelete({
  isOpen,
  onClose,
  onConfirm,
  encomienda,
  loading,
}: EncomiendaDeleteProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  if (!encomienda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
          {/* ✅ DESCRIPCIÓN AGREGADA */}
          <DialogDescription>
            Esta acción eliminará permanentemente la encomienda y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>

          <p className="text-center text-gray-600">
            ¿Estás seguro de que deseas eliminar esta encomienda? Esta acción no se puede deshacer.
          </p>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-mono font-semibold">{encomienda.codigo_seguimiento}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{encomienda.destinatario_nombre}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{encomienda.destino_ciudad}</span>
                </div>
                
                <div className="text-sm text-gray-500">
                  Creado: {new Date(encomienda.fecha_creacion).toLocaleDateString('es-BO')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar Encomienda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}