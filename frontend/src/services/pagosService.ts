// services/pagosService.ts - VERSIÓN CORREGIDA
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';

// Interfaces para tipos de datos
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

// Interfaces para respuestas específicas
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
  /**
   * Obtiene todos los pagos del usuario autenticado
   */
  async list(): Promise<ApiResponse<Pago[]>> {
    try {
      console.log('🔍 Solicitando lista de pagos...');
      
      const response = await apiRequest('/api/pagos/pagos/');
      console.log('📦 Respuesta de pagos:', response);

      if (response.success && response.data) {
        // Manejar diferentes formatos de respuesta
        const data = response.data as ListarPagosResponse | Pago[];
        
        let pagos: Pago[] = [];
        
        if (Array.isArray(data)) {
          pagos = data;
        } else if (typeof data === 'object' && 'pagos' in data) {
          pagos = data.pagos;
        } else if (typeof data === 'object' && 'results' in data) {
          // Para compatibilidad con DRF
          pagos = (data as any).results;
        }
        
        console.log(`✅ ${pagos.length} pagos cargados`);
        
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
      console.error('❌ Error al cargar pagos:', error);
      return {
        success: false,
        error: 'Error de conexión al cargar pagos',
        data: []
      };
    }
  },

  /**
   * Crea un nuevo pago para una reserva
   */
  async crearPago(pagoData: CrearPagoData): Promise<ApiResponse<CrearPagoResponse>> {
    try {
      console.log('💰 CREANDO PAGO:', pagoData);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch('http://localhost:8000/api/pagos/pagos/crear_pago/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pagoData),
      });

      console.log('📥 Status:', response.status);
      
      const responseText = await response.text();
      console.log('📥 RESPUESTA COMPLETA:', responseText);

      if (!response.ok) {
        console.error('❌ ERROR HTTP:', response.status);
        
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

      // ✅ Éxito
      try {
        const data: CrearPagoResponse = JSON.parse(responseText);
        console.log('✅ PAGO CREADO EXITOSAMENTE:', data);
        return { success: true, data };
      } catch (e) {
        console.error('❌ Error parseando respuesta exitosa:', e);
        return { 
          success: false, 
          error: 'Error al procesar respuesta del servidor' 
        };
      }
      
    } catch (error) {
      console.error('❌ Error de red al crear pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Confirma un pago con Stripe
   */
  async confirmarPago(pagoId: number, confirmarData: ConfirmarPagoData): Promise<ApiResponse<ConfirmarPagoResponse>> {
    try {
      console.log(`✅ CONFIRMANDO PAGO ${pagoId}:`, confirmarData);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(`http://localhost:8000/api/pagos/pagos/${pagoId}/confirmar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(confirmarData),
      });

      const responseText = await response.text();
      console.log('📥 Respuesta confirmación:', responseText);

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
      console.error('❌ Error al confirmar pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Cancela un pago
   */
  async cancelarPago(pagoId: number): Promise<ApiResponse<CancelarPagoResponse>> {
    try {
      console.log(`❌ CANCELANDO PAGO ${pagoId}`);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(`http://localhost:8000/api/pagos/pagos/${pagoId}/cancelar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const responseText = await response.text();
      console.log('📥 Respuesta cancelación:', responseText);

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
      console.error('❌ Error al cancelar pago:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Obtiene los pagos del usuario autenticado
   */
  async misPagos(): Promise<ApiResponse<MisPagosResponse>> {
    try {
      console.log('🔍 Solicitando mis pagos...');
      
      const response = await apiRequest('/api/pagos/pagos/mis_pagos/');
      
      if (response.success && response.data) {
        const data = response.data as MisPagosResponse;
        console.log(`✅ ${data.count} pagos personales cargados`);
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
      console.error('❌ Error al obtener mis pagos:', error);
      return {
        success: false,
        error: 'Error al cargar mis pagos'
      };
    }
  },

  /**
   * Obtiene estadísticas de pagos (solo para administradores)
   */
  async estadisticas(): Promise<ApiResponse<EstadisticasPagos>> {
    try {
      console.log('📊 Solicitando estadísticas de pagos...');
      
      const response = await apiRequest('/api/pagos/pagos/estadisticas/');
      
      if (response.success && response.data) {
        const data = response.data as EstadisticasPagos;
        console.log('✅ Estadísticas de pagos cargadas');
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
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'Error al cargar estadísticas'
      };
    }
  },

  /**
   * Obtiene el detalle de un pago específico
   */
  async getDetallePago(pagoId: number): Promise<ApiResponse<Pago>> {
    try {
      console.log(`🔍 Solicitando detalle del pago ${pagoId}...`);
      
      const response = await apiRequest(`/api/pagos/pagos/${pagoId}/`);
      
      if (response.success && response.data) {
        const data = response.data as Pago;
        console.log('✅ Detalle de pago cargado');
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
      console.error('❌ Error al obtener detalle del pago:', error);
      return {
        success: false,
        error: 'Error al cargar el detalle del pago'
      };
    }
  }
};