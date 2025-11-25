/**
 * Tipos TypeScript para ETA (Estimated Time of Arrival)
 * Sistema de seguimiento de tiempos estimados baseline y en tiempo real
 */

export type ETAEstado = 'on_time' | 'delayed' | 'early' | 'critical';

export interface ETABaseline {
  hora_llegada: string; // Formato "HH:MM:SS"
  hora_salida: string;  // Formato "HH:MM:SS"
}

export interface ETARealtime {
  hora_llegada: string;
  hora_salida: string;
  diferencia_minutos: number; // Diferencia con baseline (+ = demora, - = adelanto)
  estado: ETAEstado;
}

export interface ParadaConETA {
  id: number;
  orden: number;
  ubicacion_detalle: {
    id: number;
    nombre: string;
    lat: number;
    lng: number;
  };
  
  // ETA Baseline (calculado en la optimización)
  tiempo_llegada_estimado?: string; // Hora baseline
  tiempo_salida_estimado?: string;
  
  // ETA Real-time (calculado dinámicamente)
  eta_realtime_llegada?: string;
  eta_realtime_salida?: string;
  eta_diferencia_minutos?: number;
  eta_estado?: ETAEstado;
  
  // Otros campos
  tiempo_servicio_min: number;
  distancia_desde_anterior_km: number;
  completada: boolean;
  hora_llegada_real?: string;
  hora_salida_real?: string;
  es_depot: boolean;
}

export interface EstadisticasDemora {
  demora_promedio_min: number;
  demora_maxima_min: number;
  paradas_demoradas: number;
  factor_demora: number;
  total_paradas_analizadas: number;
}

export interface ETARutaResponse {
  ruta_id: number;
  vehiculo: {
    id: number;
    placa: string;
    nombre?: string;
  };
  distancia_total_km: number;
  tiempo_total_min: number;
  paradas: ParadaConETA[];
  estadisticas_demora: EstadisticasDemora;
  timestamp: string; // ISO datetime
}

export interface ETASolicitudResponse {
  solicitud_id: number;
  estado: string;
  fecha_viaje: string;
  rutas: {
    ruta_id: number;
    vehiculo: string;
    distancia_total_km: number;
    tiempo_total_min: number;
    paradas_restantes: number;
    paradas: {
      orden: number;
      ubicacion: string;
      eta_baseline: string;
      completada: boolean;
    }[];
  }[];
  timestamp: string;
}

export interface ActualizarUbicacionRequest {
  ruta_id: number;
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface ActualizarUbicacionResponse {
  ruta_id: number;
  ubicacion_actual: {
    lat: number;
    lng: number;
  };
  paradas_actualizadas: ParadaConETA[];
  timestamp: string;
}

// Utilidades para formateo y visualización
export const ETAUtils = {
  /**
   * Obtiene el color según el estado del ETA
   */
  getEstadoColor(estado: ETAEstado): string {
    const colores: Record<ETAEstado, string> = {
      on_time: 'text-green-600 bg-green-50 border-green-200',
      early: 'text-blue-600 bg-blue-50 border-blue-200',
      delayed: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200',
    };
    return colores[estado] || 'text-gray-600 bg-gray-50 border-gray-200';
  },

  /**
   * Obtiene el ícono según el estado del ETA
   */
  getEstadoIcono(estado: ETAEstado): string {
    const iconos: Record<ETAEstado, string> = {
      on_time: '✅',
      early: '⚡',
      delayed: '⚠️',
      critical: '🚨',
    };
    return iconos[estado] || '⏱️';
  },

  /**
   * Obtiene el label según el estado del ETA
   */
  getEstadoLabel(estado: ETAEstado): string {
    const labels: Record<ETAEstado, string> = {
      on_time: 'A Tiempo',
      early: 'Adelantado',
      delayed: 'Demorado',
      critical: 'Demora Crítica',
    };
    return labels[estado] || 'Desconocido';
  },

  /**
   * Formatea la diferencia de minutos
   */
  formatDiferencia(minutos: number): string {
    const abs = Math.abs(minutos);
    const signo = minutos >= 0 ? '+' : '-';
    
    if (abs < 1) return '±0 min';
    if (abs < 60) return `${signo}${Math.round(abs)} min`;
    
    const horas = Math.floor(abs / 60);
    const mins = Math.round(abs % 60);
    return `${signo}${horas}h ${mins}min`;
  },

  /**
   * Formatea hora en formato legible
   */
  formatHora(hora: string): string {
    if (!hora) return '--:--';
    
    try {
      const [h, m] = hora.split(':');
      return `${h}:${m}`;
    } catch {
      return hora;
    }
  },

  /**
   * Calcula el porcentaje de progreso de una ruta
   */
  calcularProgreso(paradas: ParadaConETA[]): number {
    if (paradas.length === 0) return 0;
    const completadas = paradas.filter(p => p.completada).length;
    return Math.round((completadas / paradas.length) * 100);
  },
};
