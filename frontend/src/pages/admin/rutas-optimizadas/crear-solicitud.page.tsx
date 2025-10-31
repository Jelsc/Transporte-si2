import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, MapPin, Truck, Calendar, Save, Plus, Trash2, Package } from 'lucide-react';
import AdminLayout from '@/app/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Ubicacion, Vehiculo, Viaje } from '@/types';

interface EntregaForm {
  ubicacion: number | null;
  tipo: 'delivery' | 'pickup' | 'both';
  ventana_tiempo_inicio: string;
  ventana_tiempo_fin: string;
  demanda_peso: number;
  demanda_volumen: number;
  tiempo_servicio_min: number;
  prioridad: number;
  observaciones: string;
}

interface SolicitudFormData {
  fecha_viaje: string;
  hora_inicio: string;
  vehiculos_disponibles: number[];
  depot: number | null;
  entregas: EntregaForm[];
  viajes_seleccionados: number[]; // IDs de viajes para convertir en entregas
}

export default function CrearSolicitudPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SolicitudFormData>({
    fecha_viaje: new Date().toISOString().split('T')[0] || '',
    hora_inicio: '08:00',
    vehiculos_disponibles: [],
    depot: null,
    entregas: [],
    viajes_seleccionados: [],
  });

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [modoCreacion, setModoCreacion] = useState<'manual' | 'viajes'>('manual');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);
      const [ubicacionesRes, vehiculosRes, viajesRes] = await Promise.all([
        api.get('/api/ubicaciones/'),
        api.get('/api/vehiculos/'),
        api.get('/api/viajes/?estado=programado'),
      ]);

      setUbicaciones(ubicacionesRes.data.results || ubicacionesRes.data);
      setVehiculos(vehiculosRes.data.results || vehiculosRes.data);
      setViajes(viajesRes.data.results || viajesRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const agregarEntrega = () => {
    setFormData({
      ...formData,
      entregas: [
        ...formData.entregas,
        {
          ubicacion: null,
          tipo: 'delivery',
          ventana_tiempo_inicio: '08:00',
          ventana_tiempo_fin: '18:00',
          demanda_peso: 0,
          demanda_volumen: 0,
          tiempo_servicio_min: 15,
          prioridad: 1,
          observaciones: '',
        },
      ],
    });
  };

  const eliminarEntrega = (index: number) => {
    setFormData({
      ...formData,
      entregas: formData.entregas.filter((_, i) => i !== index),
    });
  };

  const actualizarEntrega = (index: number, field: keyof EntregaForm, value: string | number | null) => {
    const nuevasEntregas = [...formData.entregas];
    nuevasEntregas[index] = {
      ...nuevasEntregas[index],
      [field]: value,
    } as EntregaForm;
    setFormData({ ...formData, entregas: nuevasEntregas });
  };

  const toggleVehiculo = (id: number) => {
    setFormData({
      ...formData,
      vehiculos_disponibles: formData.vehiculos_disponibles.includes(id)
        ? formData.vehiculos_disponibles.filter((vId) => vId !== id)
        : [...formData.vehiculos_disponibles, id],
    });
  };

  const toggleViaje = (id: number) => {
    setFormData({
      ...formData,
      viajes_seleccionados: formData.viajes_seleccionados.includes(id)
        ? formData.viajes_seleccionados.filter((vId) => vId !== id)
        : [...formData.viajes_seleccionados, id],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: Depósito
    if (!formData.depot) {
      setError('Debes seleccionar un depósito');
      return;
    }

    // Validación: Vehículos (solo en modo manual)
    if (modoCreacion === 'manual' && formData.vehiculos_disponibles.length === 0) {
      setError('Debes seleccionar al menos un vehículo');
      return;
    }

    // Validación: Entregas o Viajes
    if (modoCreacion === 'manual' && formData.entregas.length === 0) {
      setError('Debes agregar al menos una entrega');
      return;
    }

    // Validación: Mínimo 2 entregas para optimizar
    if (modoCreacion === 'manual' && formData.entregas.length < 2) {
      setError('Se necesitan al menos 2 entregas para optimizar una ruta');
      return;
    }

    if (modoCreacion === 'viajes' && formData.viajes_seleccionados.length === 0) {
      setError('Debes seleccionar al menos un viaje');
      return;
    }

    // Validación: Mínimo 2 viajes para optimizar
    if (modoCreacion === 'viajes' && formData.viajes_seleccionados.length < 2) {
      setError('Se necesitan al menos 2 viajes para optimizar una ruta');
      return;
    }

    // Validar que todas las entregas tengan ubicación (solo en modo manual)
    if (modoCreacion === 'manual') {
      const entregasInvalidas = formData.entregas.filter(e => !e.ubicacion);
      if (entregasInvalidas.length > 0) {
        setError(`${entregasInvalidas.length} entrega(s) no tienen ubicación asignada`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Preparar datos según el modo
      let dataToSend: any;
      
      if (modoCreacion === 'viajes') {
        // Convertir viajes en entregas automáticamente
        // Los viajes ya incluyen: fecha, hora, origen, destino, vehículo
        dataToSend = {
          depot: formData.depot,
          viajes_ids: formData.viajes_seleccionados,
        };
      } else {
        // Modo manual - enviar entregas
        dataToSend = {
          fecha_viaje: formData.fecha_viaje,
          hora_inicio: formData.hora_inicio,
          depot: formData.depot,
          vehiculos_disponibles: formData.vehiculos_disponibles,
          entregas: formData.entregas.map(e => ({
            ubicacion: Number(e.ubicacion),
            tipo: e.tipo,
            ventana_tiempo_inicio: e.ventana_tiempo_inicio || null,
            ventana_tiempo_fin: e.ventana_tiempo_fin || null,
            demanda_peso: Number(e.demanda_peso) || 0,
            demanda_volumen: Number(e.demanda_volumen) || 0,
            tiempo_servicio_min: Number(e.tiempo_servicio_min) || 15,
            prioridad: Number(e.prioridad) || 1,
            observaciones: e.observaciones || '',
          })),
        };
      }
      
      console.log('📤 Datos a enviar:', JSON.stringify(dataToSend, null, 2));
      
      const response = await api.post('/api/rutas-optimizadas/solicitudes/', dataToSend);
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/rutas-optimizadas');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta del error:', err.response?.data);
      
      // Formatear el mensaje de error
      let errorMessage = 'Error al crear la solicitud';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Si hay errores de validación
        if (errorData.entregas && Array.isArray(errorData.entregas)) {
          const entregasErrors = errorData.entregas
            .map((e: any, idx: number) => {
              if (typeof e === 'object' && e !== null) {
                const campos = Object.entries(e)
                  .map(([campo, mensajes]) => {
                    const mensajesArray = Array.isArray(mensajes) ? mensajes : [mensajes];
                    return `${campo}: ${mensajesArray.join(', ')}`;
                  })
                  .join('; ');
                return `Entrega ${idx + 1}: ${campos}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n');
          
          if (entregasErrors) {
            errorMessage = `Errores en entregas:\n${entregasErrors}`;
          }
        } else if (typeof errorData === 'object') {
          // Otros errores de validación
          const errores = Object.entries(errorData)
            .map(([campo, mensajes]) => {
              const mensajesArray = Array.isArray(mensajes) ? mensajes : [mensajes];
              return `${campo}: ${mensajesArray.join(', ')}`;
            })
            .join('\n');
          errorMessage = errores;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/rutas-optimizadas')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Rutas Optimizadas
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Solicitud de Optimización</h1>
          <p className="text-gray-600 mt-2">
            Crea una nueva solicitud para optimizar rutas de entregas
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-900">¡Solicitud creada exitosamente!</h3>
              <p className="text-sm text-green-700">Redirigiendo...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datos Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Solo mostrar fecha/hora en modo manual */}
              {modoCreacion === 'manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Viaje *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_viaje}
                      onChange={(e) => setFormData({ ...formData, fecha_viaje: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depósito (Punto de Partida/Regreso) *
                </label>
                <select
                  value={formData.depot || ''}
                  onChange={(e) => setFormData({ ...formData, depot: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar depósito...</option>
                  {ubicaciones.map((ubicacion) => (
                    <option key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.nombre} - {ubicacion.direccion_texto || 'Sin dirección'}
                    </option>
                  ))}
                </select>
                {modoCreacion === 'viajes' && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 Los vehículos partirán y regresarán a este punto
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modo de Creación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Modo de Creación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" 
                       style={{ borderColor: modoCreacion === 'manual' ? '#3B82F6' : '#E5E7EB' }}>
                  <input
                    type="radio"
                    value="manual"
                    checked={modoCreacion === 'manual'}
                    onChange={(e) => setModoCreacion(e.target.value as 'manual' | 'viajes')}
                    className="text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Crear Manualmente</p>
                    <p className="text-sm text-gray-500">Agregar entregas una por una</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                       style={{ borderColor: modoCreacion === 'viajes' ? '#3B82F6' : '#E5E7EB' }}>
                  <input
                    type="radio"
                    value="viajes"
                    checked={modoCreacion === 'viajes'}
                    onChange={(e) => setModoCreacion(e.target.value as 'manual' | 'viajes')}
                    className="text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Desde Viajes</p>
                    <p className="text-sm text-gray-500">Usar viajes programados</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Viajes Disponibles (solo si modo = viajes) */}
          {modoCreacion === 'viajes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Viajes Programados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {viajes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No hay viajes programados disponibles</p>
                    <p className="text-xs text-gray-400 mt-1">Los viajes seleccionados deben estar en estado "programado"</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {viajes.map((viaje) => (
                      <label
                        key={viaje.id}
                        className={`
                          flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                          ${formData.viajes_seleccionados.includes(viaje.id)
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={formData.viajes_seleccionados.includes(viaje.id)}
                          onChange={() => toggleViaje(viaje.id)}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">Viaje #{viaje.id}</span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-200">
                              {viaje.estado}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{viaje.fecha} a las {viaje.hora}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Asientos: {viaje.asientos_ocupados}/{viaje.asientos_disponibles}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Este viaje ya incluye: ubicaciones, horarios y vehículo
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {viajes.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>{formData.viajes_seleccionados.length}</strong> viaje(s) seleccionado(s)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Se crearán automáticamente entregas para origen y destino de cada viaje
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vehículos - Solo en modo manual */}
          {modoCreacion === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehículos Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehiculos.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay vehículos disponibles</p>
              ) : (
                <div className="space-y-2">
                  {vehiculos.map((vehiculo) => (
                    <label
                      key={vehiculo.id}
                      className={`
                        flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                        ${formData.vehiculos_disponibles.includes(vehiculo.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={formData.vehiculos_disponibles.includes(vehiculo.id)}
                        onChange={() => toggleVehiculo(vehiculo.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{vehiculo.placa}</div>
                        <div className="text-sm text-gray-500">
                          {vehiculo.tipo_vehiculo} - Cap: {vehiculo.capacidad_pasajeros} personas
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Vehículos seleccionados: <span className="font-semibold">{formData.vehiculos_disponibles.length}</span>
              </p>
            </CardContent>
          </Card>
          )}

          {/* Entregas - Solo en modo manual */}
          {modoCreacion === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Entregas
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarEntrega}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Entrega
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mensajes de validación */}
              {formData.entregas.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        ⚠️ Mínimo 2 entregas requeridas
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Para generar una ruta optimizada, necesitas agregar al menos 2 ubicaciones de entrega. Haz clic en "Agregar Entrega" para comenzar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.entregas.length === 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        ℹ️ Agrega una entrega más
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Necesitas al menos una entrega adicional para poder optimizar la ruta.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.entregas.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No hay entregas agregadas.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.entregas.map((entrega, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Entrega #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarEntrega(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Operación
                          </label>
                          <select
                            value={entrega.tipo}
                            onChange={(e) => actualizarEntrega(index, 'tipo', e.target.value as 'delivery' | 'pickup' | 'both')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="delivery">Entrega</option>
                            <option value="pickup">Recogida</option>
                            <option value="both">Entrega y Recogida</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ubicación *
                          </label>
                          <select
                            value={entrega.ubicacion || ''}
                            onChange={(e) => actualizarEntrega(index, 'ubicacion', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Seleccionar ubicación...</option>
                            {ubicaciones.map((ubicacion) => (
                              <option key={ubicacion.id} value={ubicacion.id}>
                                {ubicacion.nombre} - {ubicacion.direccion_texto || 'Sin dirección'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observaciones
                          </label>
                          <input
                            type="text"
                            value={entrega.observaciones}
                            onChange={(e) => actualizarEntrega(index, 'observaciones', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Paquete de 5kg, frágil"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Peso (kg)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entrega.demanda_peso}
                            onChange={(e) => actualizarEntrega(index, 'demanda_peso', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Volumen (m³)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entrega.demanda_volumen}
                            onChange={(e) => actualizarEntrega(index, 'demanda_volumen', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiempo de Servicio (min)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={entrega.tiempo_servicio_min}
                            onChange={(e) => actualizarEntrega(index, 'tiempo_servicio_min', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prioridad (1-5)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={entrega.prioridad}
                            onChange={(e) => actualizarEntrega(index, 'prioridad', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ventana Inicio
                          </label>
                          <input
                            type="time"
                            value={entrega.ventana_tiempo_inicio}
                            onChange={(e) => actualizarEntrega(index, 'ventana_tiempo_inicio', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ventana Fin
                          </label>
                          <input
                            type="time"
                            value={entrega.ventana_tiempo_fin}
                            onChange={(e) => actualizarEntrega(index, 'ventana_tiempo_fin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Acciones */}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/rutas-optimizadas')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Solicitud
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
