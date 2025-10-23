import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, MapIcon, List, Filter, Calendar, TrendingUp } from 'lucide-react';
import AdminLayout from '@/app/layout/admin-layout';
import MapaRutasOptimizadas from './components/MapaRutasOptimizadas';
import type { RutaOptimizada, SolicitudRuta } from '@/types';
import { api } from '@/lib/api';

export default function RutasOptimizadasPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudRuta[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'mapa' | 'lista'>('mapa');

  // Cargar solicitudes de optimización
  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/rutas-optimizadas/solicitudes/');
      const data = response.data;
      
      console.log('📦 Datos recibidos:', data); // Debug
      
      setSolicitudes(data.results || data);
      
      // Seleccionar automáticamente la última solicitud
      if (data.results?.length > 0) {
        console.log('✅ Solicitud seleccionada:', data.results[0]); // Debug
        setSolicitudSeleccionada(data.results[0]);
      } else if (data.length > 0) {
        console.log('✅ Solicitud seleccionada:', data[0]); // Debug
        setSolicitudSeleccionada(data[0]);
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
              onClick={cargarSolicitudes}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualizar
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rutas Optimizadas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Visualización y análisis de rutas optimizadas
              </p>
            </div>
            <div className="flex items-center space-x-3">
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

              {/* Selector de solicitud */}
              <select
                value={solicitudSeleccionada?.id || ''}
                onChange={(e) => {
                  const solicitud = solicitudes.find(
                    (s) => s.id === parseInt(e.target.value)
                  );
                  setSolicitudSeleccionada(solicitud || null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {solicitudes.map((solicitud) => (
                  <option key={solicitud.id} value={solicitud.id}>
                    Solicitud #{solicitud.id} - {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                  </option>
                ))}
              </select>

              <button
                onClick={cargarSolicitudes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-5 gap-4">
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
              <MapaRutasOptimizadas
                rutas={solicitudSeleccionada.rutas_optimizadas || []}
                altura="calc(100vh - 280px)"
                mostrarControles={true}
                mostrarLeyenda={true}
                onRutaClick={handleRutaClick}
                className="shadow-lg"
              />
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
