// components/PagoModal.tsx - VERSIÓN ESPECÍFICA PARA ENCOMIENDAS// components/PagoModal.tsx - VERSIÓN CORREGIDA
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Wallet,
  DollarSign,
  Package,
  User,
  MapPin,
  CheckCircle,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';
import type { Encomienda } from '@/types/encomienda';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  encomienda: Encomienda | null;
  onProcesarPago: (metodoPago: 'efectivo' | 'tarjeta') => void;
  loading: boolean;
  esAdmin?: boolean; // Para diferenciar entre admin y cliente
}

export function PagoModal({
  isOpen,
  onClose,
  encomienda,
  onProcesarPago,
  loading,
  esAdmin = false,
}: PagoModalProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'tarjeta' | null>(null);

  if (!encomienda) return null;

  const handlePagar = () => {
    if (metodoSeleccionado) {
      onProcesarPago(metodoSeleccionado);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {esAdmin ? 'Registrar Pago' : 'Procesar Pago'}
          </DialogTitle>
          <DialogDescription>
            {esAdmin 
              ? 'Registra el pago de esta encomienda' 
              : 'Selecciona el método de pago para tu encomienda'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la encomienda */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-mono font-semibold">{encomienda.codigo_seguimiento}</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {encomienda.precio?.toFixed(2)} BOB
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{encomienda.destinatario_nombre}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{encomienda.destino_ciudad}</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  Creado: {formatDate(encomienda.fecha_creacion)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de método de pago */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Método de Pago</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta de Crédito/Débito */}
              <Card 
                className={`cursor-pointer transition-all ${
                  metodoSeleccionado === 'tarjeta' 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'hover:border-gray-300 border-2'
                }`}
                onClick={() => setMetodoSeleccionado('tarjeta')}
              >
                <CardContent className="p-3 text-center">
                  <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                    metodoSeleccionado === 'tarjeta' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    metodoSeleccionado === 'tarjeta' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    Tarjeta
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Pago inmediato</p>
                </CardContent>
              </Card>

              {/* Efectivo */}
              <Card 
                className={`cursor-pointer transition-all ${
                  metodoSeleccionado === 'efectivo' 
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                    : 'hover:border-gray-300 border-2'
                }`}
                onClick={() => setMetodoSeleccionado('efectivo')}
              >
                <CardContent className="p-3 text-center">
                  <Wallet className={`h-6 w-6 mx-auto mb-2 ${
                    metodoSeleccionado === 'efectivo' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    metodoSeleccionado === 'efectivo' ? 'text-green-600' : 'text-gray-700'
                  }`}>
                    Efectivo
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {esAdmin ? 'Registrar pago' : 'Al entregar'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Información adicional según método seleccionado */}
            {metodoSeleccionado === 'tarjeta' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Pago Seguro</span>
                </div>
                <p className="text-xs text-blue-700">
                  {esAdmin 
                    ? 'El cliente será redirigido a una pasarela de pago segura.'
                    : 'Serás redirigido a una pasarela de pago segura para completar la transacción.'
                  }
                </p>
              </div>
            )}

            {metodoSeleccionado === 'efectivo' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {esAdmin ? 'Pago Registrado' : 'Pago al Entregar'}
                  </span>
                </div>
                <p className="text-xs text-green-700">
                  {esAdmin 
                    ? 'El pago en efectivo será marcado como completado en el sistema.'
                    : 'Deberás pagar al conductor al momento de la entrega del paquete.'
                  }
                </p>
              </div>
            )}

            {/* Información de seguridad */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              <span>Todos los pagos están protegidos y encriptados</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePagar}
              disabled={!metodoSeleccionado || loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {esAdmin ? 'Registrar Pago' : 'Pagar'} {encomienda.precio?.toFixed(2)} BOB
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}