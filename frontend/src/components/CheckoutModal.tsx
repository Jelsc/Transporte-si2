// components/CheckoutModal.tsx - VERSIÓN MEJORADA CON MENSAJE DE ÉXITO PERSISTENTE
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle2,
  Loader2,
  Shield,
  Zap,
  AlertTriangle,
  AlertCircle,
  Home
} from 'lucide-react';
import { pagosApi, type CrearPagoData } from '@/services/pagosService';
import { reservasApi } from '@/services/reservasService';
import { type Reserva } from '@/types/reservas';
import StripeCheckout from './StripeCheckout';
import { useNavigate } from 'react-router-dom';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  reserva: Reserva;
  onPagoExitoso: () => void;
  tiempoRestante?: number;
  onExpiracion?: () => void;
}

type MetodoPago = 'stripe' | 'efectivo' | 'transferencia';
type EstadoPago = 'seleccionando' | 'creando_pago' | 'procesando_stripe' | 'completado' | 'error';

interface ViajeInfo {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  estado?: string;
}

export default function CheckoutModal({ 
  open, 
  onClose, 
  reserva, 
  onPagoExitoso,
  tiempoRestante = 0,
  onExpiracion
}: CheckoutModalProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('stripe');
  const [estado, setEstado] = useState<EstadoPago>('seleccionando');
  const [pagoId, setPagoId] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [tiempoLocal, setTiempoLocal] = useState<number>(tiempoRestante);
  const [pagoExitoso, setPagoExitoso] = useState<boolean>(false);
  const navigate = useNavigate();

  const getViajeInfo = (): ViajeInfo | null => {
    try {
      if (reserva.viaje && typeof reserva.viaje === 'object' && 'origen' in reserva.viaje) {
        const viajeData = reserva.viaje as ViajeInfo;
        if (viajeData.origen && viajeData.destino && viajeData.fecha) {
          return viajeData;
        }
      }
      
      if (reserva?.items?.[0]?.asiento?.viaje) {
        const viajeData = reserva.items[0].asiento.viaje;
        
        if (typeof viajeData === 'object' && viajeData !== null && 'origen' in viajeData) {
          const viajeObj = viajeData as ViajeInfo;
          if (viajeObj.origen && viajeObj.destino && viajeObj.fecha) {
            return viajeObj;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo info del viaje:', error);
      return null;
    }
  };

  const viajeInfo = getViajeInfo();

  useEffect(() => {
    setTiempoLocal(tiempoRestante);
  }, [tiempoRestante]);

  const handleExpiracion = useCallback(() => {
    console.log('⏰ CheckoutModal: Reserva expirada');
    setError('El tiempo para completar el pago ha expirado. Los asientos se han liberado.');
    setEstado('error');
    onExpiracion?.();
  }, [onExpiracion]);

  useEffect(() => {
    let interval: number | undefined;
    
    if (tiempoLocal > 0 && estado !== 'completado' && !pagoExitoso) {
      interval = window.setInterval(() => {
        setTiempoLocal(prev => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            handleExpiracion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tiempoLocal, estado, pagoExitoso, handleExpiracion]);

  const resetEstado = () => {
    setEstado('seleccionando');
    setMetodoPago('stripe');
    setPagoId(null);
    setClientSecret('');
    setError('');
    setPagoExitoso(false);
  };

  const handleClose = () => {
    resetEstado();
    onClose();
  };

  // ✅ MODIFICADO: Lógica de cierre - NO cerrar automáticamente después de pago exitoso
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // ✅ SI EL PAGO FUE EXITOSO: NO cerrar automáticamente, esperar a que el usuario haga clic en "Continuar"
      if (pagoExitoso || estado === 'completado') {
        console.log('✅ Pago exitoso - El usuario debe cerrar manualmente con el botón "Continuar"');
        return; // ❌ NO cerrar, dejar que el usuario vea el mensaje de éxito
      }
      
      // ✅ SI HAY RESERVA TEMPORAL ACTIVA: Mostrar confirmación solo si no hay pago exitoso
      if (tiempoLocal > 0 && !pagoExitoso) {
        if (window.confirm('¿Estás seguro de que quieres cancelar el pago? La reserva expirará en 15 minutos.')) {
          handleClose();
        }
        // Si el usuario cancela la confirmación, no hacer nada (el modal permanece abierto)
      } else {
        // ✅ EN CUALQUIER OTRO CASO: Cerrar directamente
        handleClose();
      }
    }
  };

  const handleCrearPago = async () => {
    if (!reserva) return;

    if (tiempoLocal <= 0) {
      setError('La reserva ha expirado. Por favor, selecciona nuevos asientos.');
      setEstado('error');
      return;
    }

    setEstado('creando_pago');
    setError('');

    try {
      console.log('💰 Procesando pago para reserva:', reserva.id);
      console.log('📤 Método de pago:', metodoPago);

      if (metodoPago === 'stripe') {
        console.log('💳 Procesando con Stripe...');
        
        const pagoData: CrearPagoData = {
          reserva_id: reserva.id,
          metodo_pago: 'stripe'
        };
        
        const resultadoPago = await pagosApi.crearPago(pagoData);
        console.log('📥 Respuesta de crear pago:', resultadoPago);

        if (resultadoPago.success && resultadoPago.data) {
          console.log('✅ Pago creado para Stripe:', resultadoPago.data);
          
          if (resultadoPago.data.client_secret) {
            setClientSecret(resultadoPago.data.client_secret);
            setPagoId(resultadoPago.data.pago_id);
            setEstado('procesando_stripe');
          } else {
            throw new Error('No se recibió client_secret para Stripe');
          }
        } else {
          throw new Error(resultadoPago.error || 'Error al crear pago con Stripe');
        }
      } else {
        console.log('💵 Procesando con método offline...');
        
        const resultado = await reservasApi.confirmarPago(reserva.id);
        console.log('📥 Respuesta de confirmar pago:', resultado);

        if (resultado.success && resultado.data) {
          console.log('✅ Pago confirmado exitosamente');
          setEstado('completado');
          setPagoExitoso(true);
          onPagoExitoso();
        } else {
          throw new Error(resultado.error || 'Error al confirmar pago');
        }
      }
    } catch (err: any) {
      console.error('❌ Error en pago:', err);
      setError(err.response?.data?.detalles || err.message || 'Error al procesar el pago');
      setEstado('error');
    }
  };

  const handleStripeExitoso = () => {
    console.log('✅ Pago con Stripe exitoso - Mostrando confirmación');
    setEstado('completado');
    setPagoExitoso(true);
    onPagoExitoso(); // ✅ Notificar al padre inmediatamente
    // ❌ NO llamar handleClose() aquí - dejar que el usuario vea el mensaje
  };

  const handleStripeError = (errorMsg: string) => {
    console.error('❌ Error en Stripe:', errorMsg);
    setError(errorMsg);
    setEstado('error');
  };

  // ✅ MEJORADO: Manejo del cierre después de pago exitoso - Redirige al inicio
  const handleContinuar = () => {
    console.log('🔄 Cerrando modal y redirigiendo al inicio');
    handleClose(); // Esto ya llama a resetEstado() y onClose()
    
    // ✅ Redirigir a la página de inicio después de un breve delay
    setTimeout(() => {
      navigate('/');
      window.location.reload(); // Opcional: para asegurar que se actualicen los datos
    }, 300);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {pagoExitoso ? '¡Pago Completado!' : 'Finalizar Compra'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Timer - Ocultar cuando el pago es exitoso */}
          {tiempoLocal > 0 && estado !== 'completado' && !pagoExitoso && (
            <div className={`
              border rounded-lg p-4 transition-all duration-300
              ${tiempoLocal < 300 
                ? 'bg-red-50 border-red-300 text-red-800' 
                : 'bg-orange-50 border-orange-300 text-orange-800'
              }
            `}>
              <div className="flex items-center gap-3">
                {tiempoLocal < 300 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Tiempo restante:
                    <span className={`
                      text-lg font-bold
                      ${tiempoLocal < 300 ? 'text-red-700' : 'text-orange-700'}
                    `}>
                      {formatearTiempo(tiempoLocal)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {tiempoLocal < 300 
                      ? '¡Últimos minutos! Completa el pago antes de que expire la reserva.'
                      : 'Completa tu pago para confirmar los asientos.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información de la reserva - Ocultar cuando el pago es exitoso para evitar duplicados */}
          {estado !== 'completado' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Reserva {reserva.codigo_reserva}</h3>
                    <p className="text-sm text-gray-600">
                      {reserva.items?.length || 0} asiento(s) seleccionado(s)
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {pagoExitoso ? 'Confirmada' : reserva.estado}
                  </Badge>
                </div>

                {viajeInfo ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">
                        {viajeInfo.origen} → {viajeInfo.destino}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span>
                        {new Date(viajeInfo.fecha).toLocaleDateString('es-BO')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span>
                        {viajeInfo.hora ? viajeInfo.hora.substring(0, 5) : 'Hora no disponible'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="font-semibold">{formatPrice(reserva.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    <p>Información del viaje no disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estados del flujo de pago */}
          {estado === 'seleccionando' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Selecciona método de pago:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card 
                  className={`cursor-pointer border-2 transition-all ${
                    metodoPago === 'stripe' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMetodoPago('stripe')}
                >
                  <CardContent className="p-3 text-center">
                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <h5 className="font-semibold text-sm">Tarjeta Crédito/Débito</h5>
                    <p className="text-xs text-gray-600 mt-1">Pago seguro con Stripe</p>
                    {metodoPago === 'stripe' && (
                      <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">
                        Seleccionado
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer border-2 transition-all ${
                    metodoPago === 'efectivo' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMetodoPago('efectivo')}
                >
                  <CardContent className="p-3 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <h5 className="font-semibold text-sm">Pago en Efectivo</h5>
                    <p className="text-xs text-gray-600 mt-1">Pagar al subir al bus</p>
                    {metodoPago === 'efectivo' && (
                      <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                        Seleccionado
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer border-2 transition-all ${
                    metodoPago === 'transferencia' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMetodoPago('transferencia')}
                >
                  <CardContent className="p-3 text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <h5 className="font-semibold text-sm">Transferencia</h5>
                    <p className="text-xs text-gray-600 mt-1">Depósito bancario</p>
                    {metodoPago === 'transferencia' && (
                      <Badge className="mt-1 bg-purple-100 text-purple-800 text-xs">
                        Seleccionado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Tus datos de pago están protegidos con encriptación de alta seguridad
                </span>
              </div>
            </div>
          )}

          {estado === 'creando_pago' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-lg font-semibold">Creando transacción de pago...</p>
              <p className="text-gray-600">Preparando todo para tu compra</p>
            </div>
          )}

          {estado === 'procesando_stripe' && pagoId && clientSecret && (
            <StripeCheckout
              pagoId={pagoId}
              clientSecret={clientSecret}
              monto={reserva.total}
              onExitoso={handleStripeExitoso}
              onError={handleStripeError}
              onCancel={() => setEstado('seleccionando')}
            />
          )}

          {/* ✅ MEJORADO: Mensaje de éxito con información completa del viaje */}
          {estado === 'completado' && pagoExitoso && (
            <div className="text-center py-8 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <p className="text-xl font-bold text-green-600 mb-2">¡Pago Completado Exitosamente!</p>
                <p className="text-gray-700 mb-4">Tu reserva ha sido confirmada y está lista para viajar.</p>
                
                {/* Información del viaje en el mensaje de éxito */}
                {viajeInfo && (
                  <Card className="mb-4">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">
                            {viajeInfo.origen} → {viajeInfo.destino}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span>
                            {new Date(viajeInfo.fecha).toLocaleDateString('es-BO')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span>
                            {viajeInfo.hora ? viajeInfo.hora.substring(0, 5) : 'Hora no disponible'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">{formatPrice(reserva.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg mb-2">
                    Código de Reserva: {reserva.codigo_reserva}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Guarda este código para presentarlo al abordar el bus.
                  </p>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    📧 Recibirás un correo de confirmación con los detalles de tu viaje.
                  </p>
                </div>
              </div>
            </div>
          )}

          {estado === 'error' && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-lg font-semibold text-red-600">Error en el pago</p>
                <p className="text-red-600 mt-2">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    if (tiempoLocal > 0) {
                      setEstado('seleccionando');
                    } else {
                      handleClose();
                    }
                  }}
                >
                  {tiempoLocal > 0 ? 'Intentar nuevamente' : 'Cerrar'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t bg-white">
          {estado === 'seleccionando' && (
            <>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                {tiempoLocal > 0 ? 'Cancelar' : 'Cerrar'}
              </Button>
              <Button 
                onClick={handleCrearPago}
                className="bg-green-600 hover:bg-green-700"
                disabled={!metodoPago || tiempoLocal <= 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {tiempoLocal > 0 ? `Pagar ${formatPrice(reserva.total)}` : 'Tiempo agotado'}
              </Button>
            </>
          )}
          
          {/* ✅ MEJORADO: Botón "Continuar al Inicio" para pago exitoso */}
          {estado === 'completado' && pagoExitoso && (
            <Button onClick={handleContinuar} className="bg-green-600 hover:bg-green-700 w-full">
              <Home className="h-4 w-4 mr-2" />
              Continuar al Inicio
            </Button>
          )}
          
          {(estado === 'error' || estado === 'creando_pago' || estado === 'procesando_stripe') && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              {estado === 'error' && tiempoLocal > 0 && (
                <Button onClick={() => setEstado('seleccionando')}>
                  Reintentar
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}