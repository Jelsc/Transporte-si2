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
    import { Loader2, AlertTriangle, Package, User, MapPin } from 'lucide-react';
    import type { Encomienda } from '@/types/encomienda';

    interface EncomiendaDeleteProps {
      isOpen: boolean;
      onClose: () => void;
      onConfirm: () => Promise<boolean>;
      encomienda: Encomienda | null;
      loading?: boolean;
    }

    export function EncomiendaDelete({ 
      isOpen, 
      onClose, 
      onConfirm, 
      encomienda, 
      loading = false 
    }: EncomiendaDeleteProps) {
      if (!encomienda) return null;

      const handleConfirm = async () => {
        const success = await onConfirm();
        if (success) {
          onClose();
        }
      };

      const getStatusBadge = (estado: string) => {
        const variants: Record<string, "success" | "warning" | "error" | "neutral"> = {
          'pendiente': 'warning',
          'en_ruta': 'neutral',
          'entregado': 'success',
          'cancelado': 'error',
        };

        const labels: Record<string, string> = {
          'pendiente': 'Pendiente',
          'en_ruta': 'En Ruta',
          'entregado': 'Entregado',
          'cancelado': 'Cancelado',
        };

        return (
          <Badge 
            variant={variants[estado] || 'neutral'} 
            badgeType="no-icon"
            size="sm"
          >
            {labels[estado] || estado}
          </Badge>
        );
      };

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-BO');
      };

      return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirmar Eliminación de Encomienda
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    ¿Estás seguro de que deseas eliminar esta encomienda? 
                    Esta acción no se puede deshacer.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Información de la Encomienda:
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Código:</span>
                        <div className="mt-1">
                          <Badge variant="neutral" badgeType="no-icon" size="sm" className="font-mono">
                            {encomienda.codigo_seguimiento}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span>
                        <div className="mt-1">
                          {getStatusBadge(encomienda.estado)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Remitente:</span>
                        <div>{encomienda.remitente_nombre}</div>
                        <div className="text-gray-500 text-xs">{encomienda.remitente_telefono}</div>
                      </div>
                      <div>
                        <span className="font-medium">Destinatario:</span>
                        <div>{encomienda.destinatario_nombre}</div>
                        <div className="text-gray-500 text-xs">{encomienda.destinatario_telefono}</div>
                      </div>
                      <div>
                        <span className="font-medium">Destino:</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {encomienda.destino_ciudad}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Peso:</span>
                        <div className="mt-1">
                          <Badge variant="information" badgeType="no-icon" size="sm">
                            {encomienda.peso} kg
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span>
                        <div className="font-semibold text-green-600">
                          {encomienda.precio.toFixed(2)} BOB
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Fecha Registro:</span>
                        <div>{formatDate(encomienda.fecha_creacion)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="text-red-800 text-sm">
                      <strong>Advertencia:</strong> Al eliminar esta encomienda, se perderá 
                      toda la información asociada incluyendo historial de seguimiento.
                    </div>
                  </div>

                  {encomienda.estado === 'en_ruta' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <div className="text-yellow-800 text-sm">
                        <strong>Nota:</strong> Esta encomienda está actualmente en ruta. 
                        Asegúrate de notificar al conductor antes de eliminarla.
                      </div>
                    </div>
                  )}

                  {encomienda.estado === 'entregado' && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <div className="text-blue-800 text-sm">
                        <strong>Importante:</strong> Esta encomienda ya fue entregada. 
                        La eliminación afectará los reportes históricos.
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
                Eliminar Encomienda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }