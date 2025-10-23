// components/StripeCheckout.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { 
  loadStripe, 
  type Stripe, 
  type StripeElementsOptions, 
  type Appearance 
} from '@stripe/stripe-js';
import { 
  Elements, 
  useStripe, 
  useElements, 
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Lock
} from 'lucide-react';
import { pagosApi } from '@/services/pagosService';

declare global {
  interface ImportMetaEnv {
    readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  }
}

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SFOxOB9S1VdGc0Rs6sEecz84SqlUSMGZ7CzOTNf1WLUPMrZfcEdPe3y0zDsfBPsxM0pR1cV4azJCjLspvfzLboL00KY7wBet1';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface StripeCheckoutProps {
  pagoId: number;
  clientSecret: string;
  monto: number;
  onExitoso: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function StripeCheckoutForm({ 
  pagoId, 
  monto, 
  onExitoso, 
  onError, 
  onCancel 
}: Omit<StripeCheckoutProps, 'clientSecret'> & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [pagoConfirmado, setPagoConfirmado] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;

      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('¡Pago exitoso!');
          setIsSuccess(true);
          break;
        case 'processing':
          setMessage('Tu pago se está procesando.');
          break;
        case 'requires_payment_method':
          setMessage('Tu pago no se pudo procesar. Por favor intenta nuevamente.');
          break;
        default:
          setMessage('Algo salió mal.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pago-exitoso?pago_id=${pagoId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('❌ Error de Stripe:', error);
        
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Error en la tarjeta');
        } else {
          setMessage('Ocurrió un error inesperado');
        }
        
        onError(error.message || 'Error al procesar el pago');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          console.log('✅ Pago exitoso con Stripe - PaymentIntent:', paymentIntent);
          
          // ✅ CONFIRMAR PAGO EN EL BACKEND (solo una vez)
          if (!pagoConfirmado) {
            try {
              console.log('🔄 Confirmando pago en backend...', {
                pagoId: pagoId,
                paymentIntentId: paymentIntent.id
              });

              const confirmarResult = await pagosApi.confirmarPago(pagoId, {
                payment_intent_id: paymentIntent.id
              });

              if (confirmarResult.success) {
                console.log('✅ Pago confirmado en backend:', confirmarResult.data);
                setIsSuccess(true);
                setMessage('¡Pago completado exitosamente!');
                setPagoConfirmado(true);
                
                // ✅ SOLO llamar onExitoso una vez después de confirmar el backend
                setTimeout(() => {
                  onExitoso();
                }, 1500);
              } else {
                console.error('❌ Error confirmando pago en backend:', confirmarResult.error);
                setMessage('Pago procesado pero error al confirmar. Contacte soporte.');
                onError('Error al confirmar pago en el sistema: ' + confirmarResult.error);
              }
            } catch (confirmError: any) {
              console.error('❌ Error en confirmación backend:', confirmError);
              setMessage('Pago procesado pero error al confirmar. Contacte soporte.');
              onError('Error de conexión al confirmar pago: ' + confirmError.message);
            }
          }
        } else {
          setMessage(`Estado del pago: ${paymentIntent.status}`);
          onError(`El pago no se completó. Estado: ${paymentIntent.status}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error al procesar pago:', error);
      setMessage('Error al procesar el pago');
      onError(error.message || 'Error desconocido al procesar pago');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="text-center bg-white rounded-lg p-4 border">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Pago con Tarjeta</h3>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Total: {formatPrice(monto)}
        </Badge>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border ${
          isSuccess 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de Facturación
              </label>
              <AddressElement 
                options={{
                  mode: 'billing',
                  allowedCountries: ['BO', 'US'],
                  fields: {
                    phone: 'always',
                  },
                  validation: {
                    phone: {
                      required: 'never',
                    },
                  },
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de Pago
              </label>
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  wallets: {
                    applePay: 'never',
                    googlePay: 'never',
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-600">
            Pagos 100% seguros con encriptación SSL
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSuccess}
            className="flex-1"
          >
            {isSuccess ? 'Volver' : 'Cancelar'}
          </Button>
          <Button
            type="submit"
            disabled={!stripe || isLoading || isSuccess}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completado
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pagar {formatPrice(monto)}
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500 mb-2">Métodos de pago aceptados</p>
        <div className="flex justify-center gap-3 opacity-60">
          <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
            VISA
          </div>
          <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
            MC
          </div>
          <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
            AMEX
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const { clientSecret, monto } = props;

  const appearance: Appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        border: '1px solid #d1d5db',
        padding: '12px',
        fontSize: '14px',
      },
      '.Input:focus': {
        borderColor: '#2563eb',
        boxShadow: '0 0 0 1px #2563eb',
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '4px',
      },
    },
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
    loader: 'always',
  };

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Error: No se pudo cargar la información de pago</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={props.onCancel}
          >
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
}