/**
 * Componente para mostrar panel de ETA de una ruta
 * Muestra tiempos baseline vs real-time con estados visuales
 */
import { useEffect, useState } from 'react';
import { Clock, MapPin, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ETAService from '@/services/etaService';
import { ETAUtils, type ETARutaResponse, type ParadaConETA } from '@/types/eta';

interface ETAPanelProps {
  rutaId: number;
  autoRefresh?: boolean; // Activar polling automático
  refreshInterval?: number; // Intervalo en ms
  ubicacionActual?: { lat: number; lng: number };
}

export function ETAPanel({
  rutaId,
  autoRefresh = false,
  refreshInterval = 30000,
  ubicacionActual,
}: ETAPanelProps) {
  const [etaData, setEtaData] = useState<ETARutaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarETA = async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar opciones solo con valores definidos
      const options: {
        incluirCompletadas?: boolean;
        lat?: number;
        lng?: number;
      } = {
        incluirCompletadas: false,
      };

      if (ubicacionActual?.lat !== undefined) {
        options.lat = ubicacionActual.lat;
      }
      if (ubicacionActual?.lng !== undefined) {
        options.lng = ubicacionActual.lng;
      }

      const data = await ETAService.obtenerETARuta(rutaId, options);

      setEtaData(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ETAs');
      console.error('Error cargando ETA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarETA();

    if (!autoRefresh) return;

    // Configurar polling automático
    const pollingOptions: {
      intervalo: number;
      incluirCompletadas: boolean;
      obtenerUbicacion?: () => Promise<{ lat: number; lng: number } | null>;
    } = {
      intervalo: refreshInterval,
      incluirCompletadas: false,
    };

    if (ubicacionActual) {
      pollingOptions.obtenerUbicacion = async () => ubicacionActual;
    }

    const cleanup = ETAService.iniciarPollingETA(
      rutaId,
      (data) => {
        setEtaData(data);
        setLoading(false);
      },
      pollingOptions
    );

    return cleanup;
  }, [rutaId, autoRefresh, refreshInterval, ubicacionActual]);

  if (loading && !etaData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Cargando ETAs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !etaData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="mt-4 text-sm text-red-600">{error || 'No hay datos'}</p>
        </CardContent>
      </Card>
    );
  }

  const progreso = ETAUtils.calcularProgreso(etaData.paradas);
  const proximaParada = ETAService.obtenerProximaParada(etaData.paradas);
  const tieneDemoraCritica = ETAService.tieneDemoraCritica(etaData.paradas);

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Seguimiento ETA - {etaData.vehiculo.placa}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {etaData.paradas.length} paradas · {etaData.distancia_total_km.toFixed(1)} km · {Math.round(etaData.tiempo_total_min)} min
              </p>
            </div>
            {autoRefresh && (
              <Badge variant="neutral" badgeType="no-icon" className="animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                Auto-actualización
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progreso de Ruta</span>
              <span className="text-gray-600">{progreso}%</span>
            </div>
            <Progress value={progreso} className="h-2" />
          </div>

          {/* Alerta de demora */}
          {tieneDemoraCritica && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                Se detectaron demoras en la ruta. Revisar paradas marcadas.
              </p>
            </div>
          )}

          {/* Estadísticas de demora */}
          {etaData.estadisticas_demora.total_paradas_analizadas > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Demora Promedio</p>
                <p className="text-sm font-bold text-gray-900">
                  {ETAUtils.formatDiferencia(etaData.estadisticas_demora.demora_promedio_min)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Demora Máxima</p>
                <p className="text-sm font-bold text-gray-900">
                  {ETAUtils.formatDiferencia(etaData.estadisticas_demora.demora_maxima_min)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Paradas Demoradas</p>
                <p className="text-sm font-bold text-gray-900">
                  {etaData.estadisticas_demora.paradas_demoradas}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próxima parada destacada */}
      {proximaParada && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                {proximaParada.orden}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">
                  Próxima Parada: {proximaParada.ubicacion_detalle.nombre}
                </p>
                <div className="flex items-center gap-4 mt-1 text-sm text-blue-700">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ETA: {ETAUtils.formatHora(proximaParada.eta_realtime_llegada || proximaParada.tiempo_llegada_estimado || '')}
                  </span>
                  {proximaParada.eta_diferencia_minutos !== undefined && (
                    <span className={`flex items-center gap-1 ${
                      proximaParada.eta_diferencia_minutos > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {proximaParada.eta_diferencia_minutos > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {ETAUtils.formatDiferencia(proximaParada.eta_diferencia_minutos)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de paradas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paradas de la Ruta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {etaData.paradas.map((parada) => (
              <ParadaETAItem key={parada.id} parada={parada} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ParadaETAItemProps {
  parada: ParadaConETA;
}

function ParadaETAItem({ parada }: ParadaETAItemProps) {
  const tieneEtaRealtime = Boolean(parada.eta_realtime_llegada);
  const estadoColor = parada.eta_estado
    ? ETAUtils.getEstadoColor(parada.eta_estado)
    : 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className={`border rounded-lg p-3 ${parada.completada ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        {/* Número de orden */}
        <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold ${
          parada.es_depot ? 'bg-purple-600 text-white' : 
          parada.completada ? 'bg-green-600 text-white' : 
          'bg-gray-200 text-gray-700'
        }`}>
          {parada.es_depot ? '🏠' : parada.orden}
        </div>

        <div className="flex-1 min-w-0">
          {/* Nombre y ubicación */}
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
            <p className="font-medium text-gray-900 truncate">
              {parada.ubicacion_detalle.nombre}
            </p>
            {parada.completada && (
              <Badge variant="success" badgeType="no-icon" size="sm">
                Completada ✓
              </Badge>
            )}
          </div>

          {/* ETAs */}
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            {/* ETA Baseline */}
            <div>
              <p className="text-xs text-gray-500 mb-1">ETA Baseline</p>
              <p className="font-mono text-gray-900">
                {ETAUtils.formatHora(parada.tiempo_llegada_estimado || '')}
              </p>
            </div>

            {/* ETA Real-time */}
            {tieneEtaRealtime && (
              <div>
                <p className="text-xs text-gray-500 mb-1">ETA Real-time</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-gray-900">
                    {ETAUtils.formatHora(parada.eta_realtime_llegada || '')}
                  </p>
                  {parada.eta_estado && (
                    <span className="text-xs">
                      {ETAUtils.getEstadoIcono(parada.eta_estado)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estado y diferencia */}
          {parada.eta_estado && parada.eta_diferencia_minutos !== undefined && (
            <div className="mt-2">
              <Badge
                variant="neutral"
                badgeType="no-icon"
                size="sm"
                className={estadoColor}
              >
                {ETAUtils.getEstadoLabel(parada.eta_estado)} · {ETAUtils.formatDiferencia(parada.eta_diferencia_minutos)}
              </Badge>
            </div>
          )}

          {/* Hora llegada real */}
          {parada.hora_llegada_real && (
            <p className="text-xs text-gray-600 mt-1">
              Llegada real: {new Date(parada.hora_llegada_real).toLocaleTimeString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ETAPanel;
