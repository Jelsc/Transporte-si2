import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, MapIcon, List, Filter, Calendar, TrendingUp, Plus } from 'lucide-react';
import AdminLayout from '@/app/layout/admin-layout';
import MapaRutasOptimizadas from './components/MapaRutasOptimizadas';
import type { RutaOptimizada, SolicitudRuta } from '@/types';
import { api } from '@/lib/api';

// Helper para obtener el color del badge según el estado
const getEstadoBadge = (estado: SolicitudRuta['estado']) => {
  const badges = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    procesando: 'bg-blue-100 text-blue-800 border-blue-200',
    completado: 'bg-green-100 text-green-800 border-green-200',
    fallido: 'bg-red-100 text-red-800 border-red-200',
    cancelado: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return badges[estado] || badges.pendiente;
};

export default function RutasOptimizadasPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudRuta[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'mapa' | 'lista'>('mapa');
  const [optimizando, setOptimizando] = useState(false);
  const [mensajeOptimizacion, setMensajeOptimizacion] = useState<string | null>(null);

  // Cargar solicitudes de optimización
  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Auto-refresh cuando la solicitud está procesando
  useEffect(() => {
    if (solicitudSeleccionada?.estado === 'procesando') {
      console.log('⏳ Solicitud en estado procesando, configurando auto-refresh...');
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh: Recargando solicitudes...');
        cargarSolicitudes();
      }, 5000); // Recargar cada 5 segundos

      return () => {
        console.log('🛑 Deteniendo auto-refresh');
        clearInterval(interval);
      };
    }
  }, [solicitudSeleccionada?.estado]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/rutas-optimizadas/solicitudes/');
      const data = response.data;
      
      console.log('📦 Datos recibidos del backend:', data);
      console.log('📦 Solicitudes:', data.results || data);
      
      const solicitudesData = data.results || data;
      setSolicitudes(solicitudesData);
      
      // Mantener la solicitud seleccionada o seleccionar la primera
      if (solicitudSeleccionada) {
        // Buscar la solicitud actual actualizada
        const solicitudActualizada = solicitudesData.find(
          (s: SolicitudRuta) => s.id === solicitudSeleccionada.id
        );
        if (solicitudActualizada) {
          console.log('📍 Solicitud actualizada:', solicitudActualizada);
          console.log('📍 Rutas optimizadas:', solicitudActualizada.rutas_optimizadas);
          setSolicitudSeleccionada(solicitudActualizada);
        }
      } else {
        // Seleccionar automáticamente la primera solicitud
        if (solicitudesData.length > 0) {
          console.log('📍 Solicitud seleccionada:', solicitudesData[0]);
          console.log('📍 Rutas optimizadas:', solicitudesData[0].rutas_optimizadas);
          setSolicitudSeleccionada(solicitudesData[0]);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar solicitudes:', err);
      setError(err.response?.data?.message || 'Error al cargar las rutas optimizadas');
    } finally {
      setLoading(false);
    }
  };

  const handleRutaClick = (ruta: RutaOptimizada) => {
    console.log('Ruta seleccionada:', ruta);
    // Aquí puedes mostrar un modal o panel con detalles de la ruta
  };

  const optimizarSolicitud = async () => {
    if (!solicitudSeleccionada) return;

    try {
      setOptimizando(true);
      setMensajeOptimizacion(null);
      setError(null);

      console.log(`🚀 Iniciando optimización de solicitud ${solicitudSeleccionada.id}...`);

      const response = await api.post(
        `/api/rutas-optimizadas/solicitudes/${solicitudSeleccionada.id}/optimizar/`
      );

      console.log('✅ Respuesta de optimización:', response.data);

      setMensajeOptimizacion(
        response.data.detail || 'Optimización iniciada exitosamente'
      );

      // Actualizar el estado de la solicitud
      setSolicitudSeleccionada({
        ...solicitudSeleccionada,
        estado: 'procesando'
      });

      // Recargar las solicitudes después de un breve delay
      setTimeout(() => {
        cargarSolicitudes();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error al optimizar:', err);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      'Error al iniciar la optimización';
      setError(errorMsg);
    } finally {
      setOptimizando(false);
    }
  };

  const calcularEstadisticas = () => {
    if (!solicitudSeleccionada || !solicitudSeleccionada.rutas_optimizadas || solicitudSeleccionada.rutas_optimizadas.length === 0) {
      return {
        totalRutas: 0,
        totalParadas: 0,
        distanciaTotal: '0.00',
        tiempoTotal: 0,
        utilizacionPromedio: '0.0',
      };
    }

    console.log('📊 Calculando estadísticas para:', solicitudSeleccionada); // Debug

    const totalRutas = solicitudSeleccionada.rutas_optimizadas.length;
    const totalParadas = solicitudSeleccionada.rutas_optimizadas.reduce(
      (sum: number, ruta: RutaOptimizada) => sum + (Number(ruta.numero_paradas) || 0),
      0
    );
    const distanciaTotalNum = solicitudSeleccionada.rutas_optimizadas.reduce(
      (sum: number, ruta: RutaOptimizada) => sum + (Number(ruta.distancia_total_km) || 0),
      0
    );
    const tiempoTotalNum = solicitudSeleccionada.rutas_optimizadas.reduce(
      (sum: number, ruta: RutaOptimizada) => sum + (Number(ruta.tiempo_total_min) || 0),
      0
    );
    const utilizacionPromedioNum =
      totalRutas > 0
        ? solicitudSeleccionada.rutas_optimizadas.reduce(
            (sum: number, ruta: RutaOptimizada) => sum + (Number(ruta.utilizacion_capacidad) || 0),
            0
          ) / totalRutas
        : 0;

    const result = {
      totalRutas,
      totalParadas,
      distanciaTotal: distanciaTotalNum.toFixed(2),
      tiempoTotal: Math.round(tiempoTotalNum),
      utilizacionPromedio: (utilizacionPromedioNum * 100).toFixed(1),
    };

    console.log('📈 Estadísticas calculadas:', result); // Debug

    return result;
  };

  const estadisticas = calcularEstadisticas();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Cargando rutas optimizadas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={cargarSolicitudes}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay rutas optimizadas
            </h3>
            <p className="text-gray-600 mb-6">
              Aún no se han generado rutas optimizadas. Crea una nueva solicitud de optimización
              para comenzar.
            </p>
            <button
              onClick={() => navigate('/admin/rutas-optimizadas/crear')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Solicitud</span>
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rutas Optimizadas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Visualización y análisis de rutas optimizadas
              </p>
            </div>
            
            {/* Controles principales */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Selector de vista */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setVistaActual('mapa')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    vistaActual === 'mapa'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapIcon className="w-4 h-4 inline mr-2" />
                  Mapa
                </button>
                <button
                  onClick={() => setVistaActual('lista')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    vistaActual === 'lista'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Lista
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/admin/rutas-optimizadas/crear')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva Solicitud</span>
                </button>

                <button
                  onClick={cargarSolicitudes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Selector de solicitud */}
          {solicitudes.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Solicitud:
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={solicitudSeleccionada?.id || ''}
                    onChange={(e) => {
                      const solicitud = solicitudes.find(
                        (s) => s.id === parseInt(e.target.value)
                      );
                      setSolicitudSeleccionada(solicitud || null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1 sm:max-w-xs"
                  >
                    {solicitudes.map((solicitud) => (
                      <option key={solicitud.id} value={solicitud.id}>
                        Solicitud #{solicitud.id} - {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  
                  {/* Badge de estado */}
                  {solicitudSeleccionada && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoBadge(solicitudSeleccionada.estado)} whitespace-nowrap`}>
                      {solicitudSeleccionada.estado === 'procesando' && (
                        <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                      )}
                      {solicitudSeleccionada.estado}
                    </span>
                  )}
                </div>

                {/* Botón de optimizar */}
                {solicitudSeleccionada && solicitudSeleccionada.estado === 'pendiente' && (
                  <button
                    onClick={optimizarSolicitud}
                    disabled={optimizando}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {optimizando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Optimizando...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>Optimizar Ruta</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Mensaje de optimización */}
              {mensajeOptimizacion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700">{mensajeOptimizacion}</span>
                </div>
              )}
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Total Rutas</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {estadisticas.totalRutas}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">Paradas</span>
                <MapIcon className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {estadisticas.totalParadas}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600 font-medium">Distancia</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {estadisticas.distanciaTotal} km
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600 font-medium">Tiempo</span>
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {estadisticas.tiempoTotal} min
              </p>
            </div>

            <div className="bg-teal-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-teal-600 font-medium">Utilización</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {estadisticas.utilizacionPromedio}%
              </p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden">
          {vistaActual === 'mapa' && solicitudSeleccionada && (
            <div className="h-full p-6">
              {solicitudSeleccionada.rutas_optimizadas && solicitudSeleccionada.rutas_optimizadas.length > 0 ? (
                <MapaRutasOptimizadas
                  rutas={solicitudSeleccionada.rutas_optimizadas || []}
                  altura="calc(100vh - 280px)"
                  mostrarControles={true}
                  mostrarLeyenda={true}
                  onRutaClick={handleRutaClick}
                  className="shadow-lg"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center p-8 max-w-md">
                    <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay rutas optimizadas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Esta solicitud está en estado: <span className="font-semibold capitalize">{solicitudSeleccionada.estado}</span>
                    </p>
                    
                    {solicitudSeleccionada.estado === 'pendiente' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 mb-3">
                          Esta solicitud tiene {solicitudSeleccionada.numero_entregas || solicitudSeleccionada.entregas?.length || 0} entregas 
                          y {solicitudSeleccionada.vehiculos_disponibles?.length || 0} vehículos disponibles.
                        </p>
                        <button
                          onClick={optimizarSolicitud}
                          disabled={optimizando}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {optimizando ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Optimizando...</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4" />
                              <span>Optimizar Ruta Ahora</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {solicitudSeleccionada.estado === 'procesando' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-center space-x-2 text-yellow-800">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Las rutas se están generando...</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-2">
                          Esto puede tomar algunos segundos. La página se actualizará automáticamente.
                        </p>
                      </div>
                    )}
                    
                    {solicitudSeleccionada.estado === 'fallido' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 mb-2">
                          Hubo un error al generar las rutas.
                        </p>
                        {solicitudSeleccionada.mensaje_resultado && (
                          <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                            {solicitudSeleccionada.mensaje_resultado}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {vistaActual === 'lista' && solicitudSeleccionada && (
            <div className="p-6 overflow-auto h-full">
              <div className="grid gap-4">
                {solicitudSeleccionada.rutas_optimizadas?.map((ruta: RutaOptimizada, index: number) => (
                  <div
                    key={ruta.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: [
                              '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                              '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
                            ][index % 8]
                          }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Ruta #{ruta.numero_ruta} - {
                            typeof ruta.vehiculo === 'object' 
                              ? (ruta.vehiculo.nombre || ruta.vehiculo.placa)
                              : `Vehículo ${ruta.vehiculo}`
                          }
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ruta.estado === 'completada'
                            ? 'bg-green-100 text-green-800'
                            : ruta.estado === 'en_progreso'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {ruta.estado || 'pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Paradas:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {ruta.numero_paradas}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Distancia:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {ruta.distancia_total_km} km
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tiempo:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {ruta.tiempo_total_min} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacidad:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {((ruta.utilizacion_capacidad || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {ruta.paradas && ruta.paradas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Paradas:</p>
                        <div className="flex flex-wrap gap-2">
                          {ruta.paradas.map((parada, idx) => {
                            const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
                            const nombreUbicacion = ubicacion && typeof ubicacion === 'object' ? ubicacion.nombre : 'Ubicación';
                            
                            return (
                              <span
                                key={parada.id}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {idx + 1}. {nombreUbicacion}
                                {parada.es_depot && ' (Depot)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
