import { apiRequest } from './authService';
import type { ApiResponse } from './authService';

export interface DashboardPredictions {
  estadisticas_actuales: {
    total_viajes: number;
    total_vehiculos: number;
    total_conductores: number;
    total_usuarios: number;
  };
  predicciones_semana: Array<{
    fecha: string;
    dia_semana: string;
    viajes_programados: number;
    demanda_prevista: number;
    ocupacion_promedio: number;
    ingresos_previstos: number;
  }>;
  tendencias: {
    crecimiento_viajes: number;
    viajes_ultimo_mes: number;
    viajes_mes_anterior: number;
  };
  modelo_entrenado: boolean;
}

export interface HistoricalDataPoint {
  fecha: string;
  dia_semana: string;
  total_viajes: number;
  viajes_completados: number;
  demanda_real: number;
  ocupacion_promedio: number;
  ingresos_reales: number;
}

export interface PredictDemandParams {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  precio: number;
  origen_id: number;
  destino_id: number;
}

export const analyticsService = {
  /**
   * Obtiene predicciones y estadísticas para el dashboard
   * @param days Número de días a predecir (7, 14, o 30)
   */
  async getDashboardPredictions(days: number = 7): Promise<ApiResponse<DashboardPredictions>> {
    try {
      const queryParams = new URLSearchParams({ days: days.toString() });
      const response = await apiRequest<any>(`/api/analytics/dashboard-predictions/?${queryParams.toString()}`);
      
      // El backend devuelve {success: true, data: {...}}
      // Necesitamos extraer el data interno
      if (response.success && response.data) {
        if (response.data.success && response.data.data) {
          // Si viene anidado: {success: true, data: {success: true, data: {...}}}
          return {
            success: true,
            data: response.data.data as DashboardPredictions
          };
        } else if (response.data.data) {
          // Si solo tiene data anidado
          return {
            success: true,
            data: response.data.data as DashboardPredictions
          };
        } else {
          // Si los datos están directamente en response.data
          return {
            success: true,
            data: response.data as DashboardPredictions
          };
        }
      }
      
      return response as ApiResponse<DashboardPredictions>;
    } catch (error: any) {
      console.error('Error en getDashboardPredictions:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener predicciones'
      };
    }
  },

  /**
   * Entrena los modelos de predicción
   */
  async trainModels(): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/api/analytics/train-models/', {
      method: 'POST',
    });
  },

  /**
   * Obtiene datos históricos agrupados por fecha
   * @param days Número de días hacia atrás (7, 30, o 60)
   */
  async getHistoricalData(days: number = 7): Promise<ApiResponse<HistoricalDataPoint[]>> {
    try {
      const queryParams = new URLSearchParams({ days: days.toString() });
      const response = await apiRequest<any>(`/api/analytics/historical-data/?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        if (response.data.success && response.data.data) {
          return {
            success: true,
            data: response.data.data as HistoricalDataPoint[]
          };
        } else if (response.data.data) {
          return {
            success: true,
            data: response.data.data as HistoricalDataPoint[]
          };
        } else {
          return {
            success: true,
            data: response.data as HistoricalDataPoint[]
          };
        }
      }
      
      return response as ApiResponse<HistoricalDataPoint[]>;
    } catch (error: any) {
      console.error('Error en getHistoricalData:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener datos históricos'
      };
    }
  },

  /**
   * Predice demanda para un viaje específico
   */
  async predictDemand(params: PredictDemandParams): Promise<ApiResponse<{ demanda_prevista: number }>> {
    const queryParams = new URLSearchParams({
      fecha: params.fecha,
      hora: params.hora,
      precio: params.precio.toString(),
      origen_id: params.origen_id.toString(),
      destino_id: params.destino_id.toString(),
    });

    return apiRequest<{ demanda_prevista: number }>(
      `/api/analytics/predict-demand/?${queryParams.toString()}`
    );
  },
};

