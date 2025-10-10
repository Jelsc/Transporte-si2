import React, { useState } from 'react';
import { CreditCard, DollarSign, FileText, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Tu clave pública de Stripe - se carga una sola vez
const stripePromise = loadStripe('pk_test_51SFOxOB9S1VdGc0Rs6sEecz84SqlUSMGZ7CzOTNf1WLUPMrZfcEdPe3y0zDsfBPsxM0pR1cV4azJCjLspvfzLboL00KY7wBet1');

// Opciones de Elements (fuera del componente para evitar re-renders)
const elementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css?family=Roboto',
    },
  ],
};

// Este componente DEBE estar dentro de <Elements>
const FormularioPago = ({ onPagoCompletado, onError }) => {
  const [formData, setFormData] = useState({
    monto: '',
    metodo_pago: 'stripe',
    descripcion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [pagoId, setPagoId] = useState(null);

  const stripe = useStripe();
  const elements = useElements();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const crearIntentoPago = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:8000/api/pagos/pagos/crear_pago/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          metodo_pago: formData.metodo_pago,
          descripcion: formData.descripcion
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (formData.metodo_pago === 'stripe') {
          setClientSecret(data.client_secret);
          setPagoId(data.pago_id);
        } else {
          onPagoCompletado(data);
          setFormData({
            monto: '',
            metodo_pago: 'stripe',
            descripcion: ''
          });
        }
      } else {
        throw new Error(data.error || 'Error al crear el pago');
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmarPago = async () => {
    if (!clientSecret || procesandoPago) return;

    if (!stripe || !elements) {
      onError('Stripe no está cargado correctamente');
      return;
    }

    setProcesandoPago(true);
    onError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`http://localhost:8000/api/pagos/pagos/${pagoId}/confirmar/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id
          })
        });

        const data = await response.json();

        if (response.ok) {
          onPagoCompletado({
            success: true,
            message: 'Pago completado exitosamente',
            pago_id: pagoId,
            monto: formData.monto,
            estado: 'completado'
          });
          
          setFormData({
            monto: '',
            metodo_pago: 'stripe',
            descripcion: ''
          });
          setClientSecret(null);
          setPagoId(null);
        } else {
          throw new Error(data.error || 'Error al confirmar el pago');
        }
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="space-y-6">
      {!clientSecret ? (
        <>
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Monto
            </label>
            <input
              type="number"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              placeholder="150.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 mr-2" />
              Método de Pago
            </label>
            <select
              name="metodo_pago"
              value={formData.metodo_pago}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="stripe">Tarjeta (Stripe)</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Pago de servicio de transporte"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          <button
            onClick={crearIntentoPago}
            disabled={loading || !formData.monto || !formData.descripcion}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Continuar al Pago</span>
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Paso 2: Ingresa los datos de tu tarjeta</p>
                <p>Monto a pagar: <span className="font-bold">${formData.monto}</span></p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Información de la Tarjeta
            </label>
            
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              🧪 Modo Prueba - Usa: 4242 4242 4242 4242 | Fecha: cualquier futura | CVC: cualquier 3 dígitos
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setClientSecret(null);
                setPagoId(null);
              }}
              disabled={procesandoPago}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              onClick={confirmarPago}
              disabled={procesandoPago || !stripe}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {procesandoPago ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Procesando Pago...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Pagar ${formData.monto}</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const VentasReserva = () => {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Pagos con Stripe
          </h1>
          <p className="text-gray-600">
            Procesa pagos de forma segura con tarjeta
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <Elements stripe={stripePromise}>
            <FormularioPago 
              onPagoCompletado={setResultado}
              onError={setError}
            />
          </Elements>
        </div>

        {resultado && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ¡Pago completado exitosamente!
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  {resultado.pago_id && <p><strong>ID:</strong> {resultado.pago_id}</p>}
                  {resultado.pago?.id && <p><strong>ID:</strong> {resultado.pago.id}</p>}
                  {resultado.monto && <p><strong>Monto:</strong> ${resultado.monto}</p>}
                  {resultado.pago?.monto && <p><strong>Monto:</strong> ${resultado.pago.monto}</p>}
                  {resultado.estado && <p><strong>Estado:</strong> {resultado.estado}</p>}
                  {resultado.pago?.estado && <p><strong>Estado:</strong> {resultado.pago.estado}</p>}
                  {resultado.message && <p className="text-green-700 mt-2">{resultado.message}</p>}
                </div>
                <button
                  onClick={() => setResultado(null)}
                  className="mt-4 text-sm text-green-700 hover:text-green-900 font-semibold"
                >
                  Realizar otro pago →
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <XCircle className="w-6 h-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  Error en el pago
                </h3>
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div>
            <p className="font-semibold text-green-900 mb-2">🧪 Modo de Prueba Activo</p>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>Tarjeta de prueba:</strong> 4242 4242 4242 4242</p>
              <p><strong>Fecha:</strong> Cualquier fecha futura (ej: 12/25)</p>
              <p><strong>CVC:</strong> Cualquier 3 dígitos (ej: 123)</p>
              <p><strong>ZIP:</strong> Cualquier código postal válido</p>
            </div>
          </div>
          
          <div className="border-t border-green-200 pt-4">
            <p className="font-semibold text-green-900 mb-2">✅ Configuración Lista:</p>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Stripe Elements integrado correctamente</li>
              <li>API de Django conectada</li>
              <li>Flujo de pago completo funcionando</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};