import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, MapIcon, List, Clock, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import AdminLayout from '@/app/layout/admin-layout';
import MapaRutasOptimizadas from './components/MapaRutasOptimizadas';
import ETAPanel from '@/components/ETAPanel';
import type { RutaOptimizada, SolicitudRuta } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Helper para obtener variante del badge según el estado
const getEstadoBadgeVariant = (estado: SolicitudRuta['estado']): 'error' | 'warning' | 'success' | 'information' | 'neutral' | 'brand' => {
  const variants = {
    pendiente: 'warning' as const,
    procesando: 'information' as const,
    completado: 'success' as const,
    fallido: 'error' as const,
    cancelado: 'neutral' as const,
  };
  return variants[estado] || 'neutral';
};

const getEstadoTexto = (estado: SolicitudRuta['estado']): string => {
  const textos = {
    pendiente: 'Pendiente',
    procesando: 'Procesando',
    completado: 'Completado',
    fallido: 'Fallido',
    cancelado: 'Cancelado',
  };
  return textos[estado] || estado;
};

// Helper para convertir minutos a formato "Xh Ym"
const formatearTiempo = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  
  if (horas === 0) {
    return `${mins}m`;
  }
  
  return `${horas}h ${mins}m`;
};

export default function RutasOptimizadasPage() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudRuta[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'mapa' | 'lista' | 'eta'>('mapa');
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
      
      
      const solicitudesData = data.results || data;
      setSolicitudes(solicitudesData);
      
      // Mantener la solicitud seleccionada o seleccionar la primera
      if (solicitudSeleccionada) {
        // Buscar la solicitud actual actualizada
        const solicitudActualizada = solicitudesData.find(
          (s: SolicitudRuta) => s.id === solicitudSeleccionada.id
        );
        if (solicitudActualizada) {
          setSolicitudSeleccionada(solicitudActualizada);
        }
      } else {
        // Seleccionar automáticamente la primera solicitud
        if (solicitudesData.length > 0) {
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
        tiempoTotal: '0h 0m',
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
      tiempoTotal: formatearTiempo(tiempoTotalNum),
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando rutas optimizadas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error}
            </AlertDescription>
            <Button 
              onClick={cargarSolicitudes} 
              variant="outline" 
              size="sm"
              className="mt-4"
            >
              Reintentar
            </Button>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-6">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <MapIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No hay rutas optimizadas</CardTitle>
              <CardDescription>
                Aún no se han generado rutas optimizadas. Crea una nueva solicitud de optimización para comenzar.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/admin/rutas-optimizadas/crear')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Solicitud
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rutas Optimizadas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualización y análisis de rutas optimizadas
              </p>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={cargarSolicitudes}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/admin/rutas-optimizadas/crear')}
                className='bg-green-600'
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>
          </div>

          {/* Selector de solicitud y estado */}
          {solicitudes.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium min-w-fit">
                  Solicitud:
                </label>
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                  <Select
                    value={solicitudSeleccionada?.id.toString() || ''}
                    onValueChange={(value) => {
                      const solicitud = solicitudes.find(s => s.id === parseInt(value));
                      setSolicitudSeleccionada(solicitud || null);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="Selecciona una solicitud" />
                    </SelectTrigger>
                    <SelectContent>
                      {solicitudes.map((solicitud) => (
                        <SelectItem key={solicitud.id} value={solicitud.id.toString()}>
                          Solicitud #{solicitud.id} - {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {solicitudSeleccionada && (
                    <Badge variant={getEstadoBadgeVariant(solicitudSeleccionada.estado)} size="sm">
                      {solicitudSeleccionada.estado === 'procesando' && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      {getEstadoTexto(solicitudSeleccionada.estado)}
                    </Badge>
                  )}
                </div>

                {/* Botón de optimizar */}
                {solicitudSeleccionada && solicitudSeleccionada.estado === 'pendiente' && (
                  <Button
                    onClick={optimizarSolicitud}
                    disabled={optimizando}
                    variant="secondary"
                    size="sm"
                  >
                    {optimizando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Optimizando...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Optimizar Ruta
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Mensaje de optimización */}
              {mensajeOptimizacion && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    {mensajeOptimizacion}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Total Rutas</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {estadisticas.totalRutas}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">Paradas</span>
                <MapIcon className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {estadisticas.totalParadas}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600 font-medium">Distancia</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {estadisticas.distanciaTotal} km
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-600 font-medium">Tiempo</span>
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {estadisticas.tiempoTotal}
              </p>
            </div>

            <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
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

        {/* Contenido principal con Tabs */}
        <div className="flex-1 overflow-hidden p-6">
          {solicitudSeleccionada && (
            <Tabs value={vistaActual} onValueChange={(value) => setVistaActual(value as any)} className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="mapa">
                  <MapIcon className="w-4 h-4 mr-2" />
                  Mapa
                </TabsTrigger>
                <TabsTrigger value="lista">
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="eta">
                  <Clock className="w-4 h-4 mr-2" />
                  ETA Baseline
                </TabsTrigger>
              </TabsList>

              {/* Vista Mapa */}
              <TabsContent value="mapa" className="flex-1 mt-0 h-full">
                {solicitudSeleccionada.rutas_optimizadas && solicitudSeleccionada.rutas_optimizadas.length > 0 ? (
                  <div className="h-full">
                    <MapaRutasOptimizadas
                      rutas={solicitudSeleccionada.rutas_optimizadas || []}
                      altura="calc(100vh - 400px)"
                      mostrarControles={true}
                      mostrarLeyenda={true}
                      onRutaClick={handleRutaClick}
                      className="shadow-lg rounded-lg"
                    />
                  </div>
                ) : (
                  <EstadoVacioMapa 
                    solicitud={solicitudSeleccionada} 
                    onOptimizar={optimizarSolicitud}
                    optimizando={optimizando}
                  />
                )}
              </TabsContent>

              {/* Vista Lista */}
              <TabsContent value="lista" className="flex-1 mt-0 overflow-auto h-full">
                <div className="grid gap-4">
                  {solicitudSeleccionada.rutas_optimizadas?.map((ruta: RutaOptimizada, index: number) => (
                    <RutaCard key={ruta.id} ruta={ruta} index={index} />
                  ))}
                </div>
              </TabsContent>

              {/* Vista ETA */}
              <TabsContent value="eta" className="flex-1 mt-0 overflow-auto h-full">
                {solicitudSeleccionada.rutas_optimizadas && solicitudSeleccionada.rutas_optimizadas.length > 0 ? (
                  <div className="space-y-6">
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Monitoreo en Tiempo Real - ETA Baseline</strong>
                        <p className="text-sm mt-1">
                          Los tiempos mostrados son estimaciones basadas en la planificación inicial (baseline). 
                          Se actualizan automáticamente cada 30 segundos.
                        </p>
                      </AlertDescription>
                    </Alert>

                    {solicitudSeleccionada.rutas_optimizadas.map((ruta: RutaOptimizada, index: number) => (
                      <Card key={ruta.id}>
                        <CardHeader>
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
                            <CardTitle>
                              Ruta #{ruta.numero_ruta} - {
                                typeof ruta.vehiculo === 'object' 
                                  ? (ruta.vehiculo.nombre || ruta.vehiculo.placa)
                                  : `Vehículo ${ruta.vehiculo}`
                              }
                            </CardTitle>
                            <CardDescription>
                              ({ruta.numero_paradas} paradas, {ruta.distancia_total_km} km)
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ETAPanel 
                            rutaId={ruta.id}
                            autoRefresh={true}
                            refreshInterval={30000}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader className="text-center">
                      <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <CardTitle>No hay rutas para monitorear</CardTitle>
                      <CardDescription>
                        Esta solicitud no tiene rutas optimizadas completadas para mostrar ETAs.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente auxiliar para estado vacío en vista de mapa
function EstadoVacioMapa({ 
  solicitud, 
  onOptimizar, 
  optimizando 
}: { 
  solicitud: SolicitudRuta; 
  onOptimizar: () => void;
  optimizando: boolean;
}) {
  return (
    <Card className="w-full h-full flex items-center justify-center border-2 border-dashed">
      <CardHeader className="text-center max-w-md">
        <MapIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <CardTitle>No hay rutas optimizadas</CardTitle>
        <CardDescription className="mb-4">
          Esta solicitud está en estado: <Badge variant={getEstadoBadgeVariant(solicitud.estado)} size="sm">{getEstadoTexto(solicitud.estado)}</Badge>
        </CardDescription>
        
        {solicitud.estado === 'pendiente' && (
          <Alert className="mb-4">
            <AlertDescription>
              <p className="text-sm mb-3">
                Esta solicitud tiene {solicitud.numero_entregas || solicitud.entregas?.length || 0} entregas 
                y {solicitud.vehiculos_disponibles?.length || 0} vehículos disponibles.
              </p>
              <Button
                onClick={onOptimizar}
                disabled={optimizando}
                className="w-full"
              >
                {optimizando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Optimizar Ruta Ahora
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {solicitud.estado === 'procesando' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <strong>Las rutas se están generando...</strong>
              <p className="text-xs mt-1">
                Esto puede tomar algunos segundos. La página se actualizará automáticamente.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {solicitud.estado === 'fallido' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Hubo un error al generar las rutas.</strong>
              {solicitud.mensaje_resultado && (
                <p className="text-xs mt-2 p-2 bg-destructive/10 rounded">
                  {solicitud.mensaje_resultado}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
    </Card>
  );
}

// Componente auxiliar para tarjeta de ruta en vista lista
function RutaCard({ ruta, index }: { ruta: RutaOptimizada; index: number }) {
  const getEstadoRutaBadge = (estado: string): 'success' | 'information' | 'warning' | 'neutral' => {
    if (estado === 'completada') return 'success';
    if (estado === 'en_progreso') return 'information';
    if (estado === 'pendiente') return 'warning';
    return 'neutral';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
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
            <CardTitle className="text-lg">
              Ruta #{ruta.numero_ruta} - {
                typeof ruta.vehiculo === 'object' 
                  ? (ruta.vehiculo.nombre || ruta.vehiculo.placa)
                  : `Vehículo ${ruta.vehiculo}`
              }
            </CardTitle>
          </div>
          <Badge variant={getEstadoRutaBadge(ruta.estado || 'pendiente')} size="sm">
            {ruta.estado || 'pendiente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Paradas:</span>
            <span className="font-semibold ml-2">{ruta.numero_paradas}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Distancia:</span>
            <span className="font-semibold ml-2">{ruta.distancia_total_km} km</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tiempo:</span>
            <span className="font-semibold ml-2">{formatearTiempo(Number(ruta.tiempo_total_min))}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Capacidad:</span>
            <span className="font-semibold ml-2">{((ruta.utilizacion_capacidad || 0) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {ruta.paradas && ruta.paradas.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-2">Paradas:</p>
            <div className="flex flex-wrap gap-2">
              {ruta.paradas.map((parada, idx) => {
                const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
                const nombreUbicacion = ubicacion && typeof ubicacion === 'object' ? ubicacion.nombre : 'Ubicación';
                
                return (
                  <Badge key={parada.id} variant="neutral" size="sm">
                    {idx + 1}. {nombreUbicacion}
                    {parada.es_depot && ' (Depot)'}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
