/**
 * Servicio para consumir API de ETA (Estimated Time of Arrival)
 */
import { api } from '@/lib/api';
import type {
  ETARutaResponse,
  ETASolicitudResponse,
  ActualizarUbicacionRequest,
  ActualizarUbicacionResponse,
} from '@/types/eta';

export class ETAService {
  private static readonly BASE_URL = '/api/rutas-optimizadas/eta';

  /**
   * Obtener ETAs de una ruta específica
   */
  static async obtenerETARuta(
    rutaId: number,
    options?: {
      incluirCompletadas?: boolean;
      lat?: number;
      lng?: number;
    }
  ): Promise<ETARutaResponse> {
    const params: Record<string, string> = {};
    
    if (options?.incluirCompletadas) {
      params.incluir_completadas = 'true';
    }
    
    if (options?.lat !== undefined && options?.lng !== undefined) {
      params.lat = options.lat.toString();
      params.lng = options.lng.toString();
    }

    const response = await api.get<ETARutaResponse>(
      `${this.BASE_URL}/ruta/${rutaId}/`,
      { params }
    );
    
    return response.data;
  }

  /**
   * Obtener ETAs de todas las rutas de una solicitud
   */
  static async obtenerETASolicitud(solicitudId: number): Promise<ETASolicitudResponse> {
    const response = await api.get<ETASolicitudResponse>(
      `${this.BASE_URL}/solicitud/${solicitudId}/`
    );
    
    return response.data;
  }

  /**
   * Actualizar ubicación del vehículo y recalcular ETAs
   */
  static async actualizarUbicacion(
    data: ActualizarUbicacionRequest
  ): Promise<ActualizarUbicacionResponse> {
    const response = await api.post<ActualizarUbicacionResponse>(
      `${this.BASE_URL}/actualizar-ubicacion/`,
      data
    );
    
    return response.data;
  }

  /**
   * Polling automático de ETAs para una ruta
   * Devuelve una función de cleanup para detener el polling
   */
  static iniciarPollingETA(
    rutaId: number,
    callback: (data: ETARutaResponse) => void,
    options?: {
      intervalo?: number; // ms (default: 30000 = 30 segundos)
      incluirCompletadas?: boolean;
      obtenerUbicacion?: () => Promise<{ lat: number; lng: number } | null>;
    }
  ): () => void {
    const intervalo = options?.intervalo || 30000; // 30 segundos por defecto
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isRunning = true;

    const poll = async () => {
      if (!isRunning) return;

      try {
        let ubicacion: { lat: number; lng: number } | undefined;
        
        // Obtener ubicación si se proporcionó función
        if (options?.obtenerUbicacion) {
          const loc = await options.obtenerUbicacion();
          if (loc) {
            ubicacion = loc;
          }
        }

        // Preparar opciones solo si tienen valores definidos
        const etaOptions: {
          incluirCompletadas?: boolean;
          lat?: number;
          lng?: number;
        } = {};

        if (options?.incluirCompletadas !== undefined) {
          etaOptions.incluirCompletadas = options.incluirCompletadas;
        }
        if (ubicacion?.lat !== undefined) {
          etaOptions.lat = ubicacion.lat;
        }
        if (ubicacion?.lng !== undefined) {
          etaOptions.lng = ubicacion.lng;
        }

        const data = await this.obtenerETARuta(rutaId, etaOptions);

        callback(data);
      } catch (error) {
        console.error('Error en polling de ETA:', error);
      }
    };

    // Primera llamada inmediata
    poll();

    // Iniciar polling
    intervalId = setInterval(poll, intervalo);

    // Función de cleanup
    return () => {
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }

  /**
   * Calcular tiempo estimado hasta una parada específica
   * Útil para notificaciones y alertas
   */
  static calcularTiempoHastaParada(
    horaActual: Date,
    etaLlegada: string
  ): number {
    try {
      const partes = etaLlegada.split(':').map(Number);
      const horas = partes[0];
      const minutos = partes[1];
      
      if (horas === undefined || minutos === undefined) {
        return 0;
      }
      
      const eta = new Date(horaActual);
      eta.setHours(horas, minutos, 0, 0);

      const diff = eta.getTime() - horaActual.getTime();
      return Math.max(0, Math.round(diff / 60000)); // minutos
    } catch {
      return 0;
    }
  }

  /**
   * Determinar si una ruta tiene demoras significativas
   */
  static tieneDemoraCritica(
    paradas: ETARutaResponse['paradas']
  ): boolean {
    return paradas.some(
      p => p.eta_estado === 'critical' || p.eta_estado === 'delayed'
    );
  }

  /**
   * Obtener próxima parada no completada
   */
  static obtenerProximaParada(
    paradas: ETARutaResponse['paradas']
  ): ETARutaResponse['paradas'][0] | null {
    return paradas.find(p => !p.completada) || null;
  }
}

export default ETAService;
