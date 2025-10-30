
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';
import { getApiBaseUrl } from '@/lib/api';

export interface Pago {
  id: number;
  usuario: number;
  usuario_nombre: string;
  usuario_email: string;
  reserva: number;
  reserva_info?: {
    origen: string;
    destino: string;
    fecha: string;
    hora: string;
    cantidad_asientos: number;
  };
  codigo_reserva: string;
  reserva_estado: string;
  monto: number;
  metodo_pago: 'stripe' | 'efectivo' | 'transferencia';
  estado: 'pendiente' | 'procesando' | 'completado' | 'cancelado' | 'fallido';
  descripcion: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  fecha_creacion: string;
  fecha_completado?: string;
  fecha_cancelado?: string;
}

export interface CrearPagoData {
  reserva_id: number;
  metodo_pago: 'stripe' | 'efectivo' | 'transferencia';
}

export interface ConfirmarPagoData {
  payment_intent_id: string;
}

export interface CrearPagoResponse {
  success: boolean;
  message: string;
  pago_id: number;
  reserva_id: number;
  codigo_reserva: string;
  client_secret?: string;
  monto: number;
  estado: string;
  payment_intent_id?: string;
}

export interface ListarPagosResponse {
  count: number;
  pagos: Pago[];
}

export interface MisPagosResponse {
  count: number;
  total_pagado: number;
  pagos: Pago[];
}

export interface EstadisticasPagos {
  success: boolean;
  total_pagos: number;
  pagos_completados: number;
  pagos_pendientes: number;
  pagos_procesando: number;
  pagos_cancelados: number;
  monto_total_recaudado: number;
  por_metodo: Record<string, number>;
}

export interface ConfirmarPagoResponse {
  success: boolean;
  message: string;
  pago: Pago;
  reserva_actualizada?: string;
}

export interface CancelarPagoResponse {
  success: boolean;
  message: string;
  pago: Pago;
}

export const pagosApi = {
  async list(): Promise<ApiResponse<Pago[]>> {
    try {
      const response = await apiRequest('/api/pagos/pagos/');

      if (response.success && response.data) {
        const data = response.data as ListarPagosResponse | Pago[];
        
        let pagos: Pago[] = [];
        
        if (Array.isArray(data)) {
          pagos = data;
        } else if (typeof data === 'object' && 'pagos' in data) {
          pagos = data.pagos;
        } else if (typeof data === 'object' && 'results' in data) {
          pagos = (data as any).results;
        }
        
        return {
          success: true,
          data: pagos,
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudieron cargar los pagos',
        data: []
      };

    } catch (error) {
      console.error('Error al cargar pagos:', error);
      return {
        success: false,
        error: 'Error de conexión al cargar pagos',
        data: []
      };
    }
  },

  async crearPago(pagoData: CrearPagoData): Promise<ApiResponse<CrearPagoResponse>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/pagos/pagos/crear_pago/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pagoData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            error: errorData.error || errorData.detalles || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      try {
        const data: CrearPagoResponse = JSON.parse(responseText);
        return { success: true, data };
      } catch (e) {
        return { 
          success: false, 
          error: 'Error al procesar respuesta del servidor' 
        };
      }
      
    } catch (error) {
      console.error('Error de red al crear pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async confirmarPago(pagoId: number, confirmarData: ConfirmarPagoData): Promise<ApiResponse<ConfirmarPagoResponse>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/pagos/pagos/${pagoId}/confirmar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(confirmarData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            error: errorData.error || errorData.detalles || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      const data: ConfirmarPagoResponse = JSON.parse(responseText);
      return { success: true, data };

    } catch (error) {
      console.error('Error al confirmar pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async cancelarPago(pagoId: number): Promise<ApiResponse<CancelarPagoResponse>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/pagos/pagos/${pagoId}/cancelar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            error: errorData.error || errorData.detalles || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      const data: CancelarPagoResponse = JSON.parse(responseText);
      return { success: true, data };

    } catch (error) {
      console.error('Error al cancelar pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async misPagos(): Promise<ApiResponse<MisPagosResponse>> {
    try {
      const response = await apiRequest('/api/pagos/pagos/mis_pagos/');
      
      if (response.success && response.data) {
        const data = response.data as MisPagosResponse;
        return {
          success: true,
          data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cargar mis pagos'
      };

    } catch (error) {
      console.error('Error al obtener mis pagos:', error);
      return {
        success: false,
        error: 'Error al cargar mis pagos'
      };
    }
  },

  async estadisticas(): Promise<ApiResponse<EstadisticasPagos>> {
    try {
      const response = await apiRequest('/api/pagos/pagos/estadisticas/');
      
      if (response.success && response.data) {
        const data = response.data as EstadisticasPagos;
        return {
          success: true,
          data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cargar estadísticas'
      };

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'Error al cargar estadísticas'
      };
    }
  },

  async getDetallePago(pagoId: number): Promise<ApiResponse<Pago>> {
    try {
      const response = await apiRequest(`/api/pagos/pagos/${pagoId}/`);
      
      if (response.success && response.data) {
        const data = response.data as Pago;
        return {
          success: true,
          data
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cargar detalle del pago'
      };

    } catch (error) {
      console.error('Error al obtener detalle del pago:', error);
      return {
        success: false,
        error: 'Error al cargar el detalle del pago'
      };
    }
  }
};