import React, { useState } from 'react';
import { CreditCard, DollarSign, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

export const  VentasReserva = () => {
  const [formData, setFormData] = useState({
    monto: '',
    metodo_pago: 'stripe',
    descripcion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicia sesión.');
      }

      // Hacer el POST a la API
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
        setResultado(data);
        // Limpiar formulario
        setFormData({
          monto: '',
          metodo_pago: 'stripe',
          descripcion: ''
        });
      } else {
        throw new Error(data.error || 'Error al crear el pago');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Pago con Stripe
          </h1>
          <p className="text-gray-600">
            Prueba de integración con API de pagos
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="space-y-6">
            {/* Monto */}
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
                placeholder="150.75"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Método de Pago */}
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
                <option value="stripe">Stripe (Tarjeta)</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {/* Descripción */}
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
                placeholder="Pago de servicio de transporte - Prueba"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Botón Submit */}
            <button
              onClick={handleSubmit}
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
                  <span>Crear Pago</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultado Exitoso */}
        {resultado && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ¡Pago creado exitosamente!
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>ID:</strong> {resultado.pago_id}</p>
                  <p><strong>Monto:</strong> ${resultado.monto}</p>
                  <p><strong>Estado:</strong> {resultado.estado}</p>
                  {resultado.client_secret && (
                    <div className="text-xs bg-green-100 p-2 rounded mt-2 break-all">
                      <strong>Client Secret:</strong> {resultado.client_secret}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-start">
              <XCircle className="w-6 h-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info del Token */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Nota:</p>
          <p>El token se obtiene automáticamente del localStorage (clave: 'access_token')</p>
        </div>
      </div>
    </div>
  );
}