// services/asientosService.ts - VERSIÓN ACTUALIZADA CON SISTEMA TEMPORAL
import type { Asiento } from '@/types/asiento';
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';

// Interface para la respuesta paginada de Django REST Framework
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Interface para la NUEVA estructura de Reserva
interface Reserva {
  id: number;
  codigo_reserva: string;
  cliente: number;
  fecha_reserva: string;
  estado: string;
  total: number;
  pagado: boolean;
  items: ItemReserva[];
  fecha_expiracion?: string;
  tiempo_restante?: number;
  esta_expirada?: boolean;
}

interface ItemReserva {
  id: number;
  asiento: Asiento;
  precio: number;
}

// Interface para respuesta de reserva temporal
interface ReservaTemporalResponse {
  success: boolean;
  message?: string;
  data?: Reserva;
  expiracion?: string;
  tiempo_restante?: number;
  error?: string;
}

export const asientosApi = {
  /**
   * Obtiene todos los asientos de un viaje
   */
  async list(viajeId: number): Promise<ApiResponse<Asiento[]>> {
    try {
      console.log('🔍 Solicitando asientos para viaje:', viajeId);
      
      const response = await apiRequest(`/api/asientos/?viaje=${viajeId}`);
      console.log('📦 Respuesta de asientos:', response);

      if (response.success && response.data) {
        let asientosData: Asiento[] = [];

        const data = response.data as PaginatedResponse<Asiento> | Asiento[] | any;
        
        if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          asientosData = data.results;
        } else if (Array.isArray(data)) {
          asientosData = data;
        }

        // Ordenar asientos por número
        asientosData.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
        
        console.log(`✅ ${asientosData.length} asientos cargados y ordenados`);
        
        return {
          success: true,
          data: asientosData,
        };
      }

      return {
        success: false,
        error: response.error || 'No se pudieron cargar los asientos',
        data: []
      };

    } catch (error) {
      console.error('❌ Error al cargar asientos:', error);
      return {
        success: false,
        error: 'Error de conexión',
        data: []
      };
    }
  },

  /**
   * ✅ ACTUALIZADO: Realiza reserva de MÚLTIPLES asientos (CON SISTEMA TEMPORAL)
   */
  async reservarMultiple(
    asientosIds: number[], 
    viajeId?: number, 
    montoTotal?: number
  ): Promise<ReservaTemporalResponse> {
    try {
      console.log(`🪑 RESERVANDO MÚLTIPLES ASIENTOS:`, asientosIds);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        return { success: false, error: 'No autenticado' };
      }

      // ✅ USAR NUEVO SISTEMA TEMPORAL si tenemos viajeId y montoTotal
      if (viajeId && montoTotal !== undefined) {
        console.log('🔄 Usando sistema de reserva TEMPORAL');
        
        const reservaTemporalPayload = {
          viaje_id: viajeId,
          asientos_ids: asientosIds,
          monto_total: montoTotal
        };

        console.log('📤 Payload para reserva temporal:', reservaTemporalPayload);

        const response = await fetch('http://localhost:8000/api/reservas/crear-temporal/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reservaTemporalPayload),
        });

        const responseText = await response.text();
        console.log('📥 Respuesta reserva temporal:', responseText);

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
          const data = JSON.parse(responseText);
          console.log('✅ RESERVA TEMPORAL EXITOSA:', data);
          return {
            success: true,
            data: data.data,
            expiracion: data.expiracion,
            tiempo_restante: data.tiempo_restante,
            message: data.message
          };
        } catch (e) {
          console.error('❌ Error parseando respuesta exitosa:', e);
          return { success: false, error: 'Error procesando respuesta del servidor' };
        }
      }

      // ✅ MANTENER compatibilidad con endpoint antiguo
      console.log('🔄 Usando sistema de reserva antiguo (compatibilidad)');
      
      const payload = {
        asientos_ids: asientosIds,
        pagado: false,
      };

      console.log('📤 Payload para reserva múltiple (antiguo):', payload);

      const response = await fetch('http://localhost:8000/api/reservas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
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
            error: errorData.asientos_ids?.[0] || errorData.error || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      try {
        const data = JSON.parse(responseText) as Reserva;
        console.log('✅ RESERVA MÚLTIPLE EXITOSA:', data);
        return { success: true, data };
      } catch (e) {
        console.error('❌ Error parseando respuesta exitosa:', e);
        return { success: true, data: null as any };
      }
      
    } catch (error) {
      console.error('❌ Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * ⚠️ MANTENIDO: Reserva simple (para compatibilidad)
   * Usa el endpoint /api/reservas/simple/
   */
  async reservarSimple(asientoId: number): Promise<ApiResponse<any>> {
    try {
      console.log(`🪑 RESERVANDO ASIENTO SIMPLE: ${asientoId}`);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const payload = {
        asiento_id: asientoId,
        pagado: false,
      };

      console.log('📤 Payload para reserva simple:', payload);

      const response = await fetch('http://localhost:8000/api/reservas/simple/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📥 Respuesta reserva simple:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            error: errorData.asiento_id?.[0] || errorData.error || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      try {
        const data = JSON.parse(responseText);
        console.log('✅ RESERVA SIMPLE EXITOSA:', data);
        return { success: true, data };
      } catch (e) {
        return { success: true, data: null };
      }
      
    } catch (error) {
      console.error('❌ Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * ✅ NUEVO: Confirmar pago de reserva temporal
   */
  async confirmarPagoReserva(reservaId: number): Promise<ApiResponse<Reserva>> {
    try {
      console.log(`💰 Confirmando pago para reserva: ${reservaId}`);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(`http://localhost:8000/api/reservas/${reservaId}/confirmar-pago/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const responseText = await response.text();
      console.log('📥 Respuesta confirmación pago:', responseText);

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
        const data = JSON.parse(responseText);
        console.log('✅ PAGO CONFIRMADO EXITOSAMENTE:', data);
        return { success: true, data: data.data };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('❌ Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * ✅ NUEVO: Cancelar reserva temporal
   */
  async cancelarReservaTemporal(reservaId: number): Promise<ApiResponse<null>> {
    try {
      console.log(`❌ Cancelando reserva temporal: ${reservaId}`);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(`http://localhost:8000/api/reservas/${reservaId}/cancelar-temporal/`, {
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

      try {
        const data = JSON.parse(responseText);
        console.log('✅ RESERVA TEMPORAL CANCELADA:', data);
        return { success: true, data: null };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('❌ Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Obtiene las reservas del usuario autenticado (ACTUALIZADO)
   */
  async getMisReservas(): Promise<ApiResponse<Reserva[]>> {
    try {
      const response = await apiRequest(`/api/reservas/`);
      
      if (response.success) {
        return {
          success: true,
          data: response.data as Reserva[] || []
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cargar reservas',
        data: []
      };

    } catch (error) {
      console.error('❌ Error al obtener reservas:', error);
      return {
        success: false,
        error: 'Error al cargar las reservas',
        data: []
      };
    }
  },

  /**
   * Obtiene el detalle completo de una reserva
   */
  async getDetalleReserva(reservaId: number): Promise<ApiResponse<Reserva>> {
    try {
      const response = await apiRequest(`/api/reservas/${reservaId}/detalle-completo/`);
      
      if (response.success) {
        return {
          success: true,
          data: response.data as Reserva
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cargar detalle de reserva'
      };

    } catch (error) {
      console.error('❌ Error al obtener detalle de reserva:', error);
      return {
        success: false,
        error: 'Error al cargar el detalle de la reserva'
      };
    }
  },

  /**
   * Cancela una reserva del usuario autenticado
   */
  async cancelarReserva(reservaId: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiRequest(`/api/reservas/${reservaId}/`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: false,
        error: response.error || 'Error al cancelar reserva'
      };

    } catch (error) {
      console.error('❌ Error al cancelar reserva:', error);
      return {
        success: false,
        error: 'Error al cancelar la reserva'
      };
    }
  },

  /**
   * ✅ NUEVO: Agrega asientos a una reserva existente
   */
  async agregarAsientosReserva(reservaId: number, asientosIds: number[]): Promise<ApiResponse<Reserva>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const payload = {
        asientos_ids: asientosIds
      };

      const response = await fetch(`http://localhost:8000/api/reservas/${reservaId}/agregar-asientos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            error: errorData.error || JSON.stringify(errorData)
          };
        } catch (e) {
          return { 
            success: false, 
            error: `Error ${response.status}: ${responseText}` 
          };
        }
      }

      const data = JSON.parse(responseText);
      return { success: true, data: data.reserva };

    } catch (error) {
      console.error('❌ Error al agregar asientos:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },
};