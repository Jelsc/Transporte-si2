// services/reservasService.ts - VERSIÓN COMPLETA Y CORREGIDA
import type { 
  Reserva, 
  ReservaTemporalPayload, 
  ReservaTemporalResponse 
} from '@/types/reservas';
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';

// Interface para estado de reserva temporal (específica del servicio)
interface EstadoReservaTemporal {
  id: number;
  codigo_reserva: string;
  estado: string;
  esta_expirada: boolean;
  tiempo_restante: number;
  fecha_expiracion: string | null;
  asientos: string[];
  viaje: {
    origen: string;
    destino: string;
    fecha: string;
    hora: string;
  } | null;
}

export const reservasApi = {
  /**
   * ✅ NUEVO: Crear reserva temporal con expiración
   */
  async crearReservaTemporal(payload: ReservaTemporalPayload): Promise<ReservaTemporalResponse> {
    try {
      console.log('🔄 Creando reserva temporal:', payload);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch('http://localhost:8000/api/reservas/crear-temporal/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
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
      
    } catch (error) {
      console.error('❌ Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * ✅ NUEVO: Confirmar pago de reserva temporal
   */
  async confirmarPago(reservaId: number): Promise<ApiResponse<Reserva>> {
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
   * ✅ NUEVO: Obtener estado de reserva temporal
   */
  async obtenerEstadoReservaTemporal(reservaId: number): Promise<ApiResponse<EstadoReservaTemporal>> {
    try {
      console.log(`📊 Obteniendo estado de reserva temporal: ${reservaId}`);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const response = await fetch(`http://localhost:8000/api/reservas/${reservaId}/estado-temporal/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const responseText = await response.text();
      console.log('📥 Respuesta estado reserva:', responseText);

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

      try {
        const data = JSON.parse(responseText);
        console.log('✅ ESTADO DE RESERVA OBTENIDO:', data);
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
   * ✅ NUEVO: Verificar si una reserva sigue activa (para polling)
   */
  async verificarReservaActiva(reservaId: number): Promise<boolean> {
    try {
      const estado = await this.obtenerEstadoReservaTemporal(reservaId);
      
      if (estado.success && estado.data) {
        return estado.data.estado === 'pendiente_pago' && !estado.data.esta_expirada;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error verificando reserva activa:', error);
      return false;
    }
  },

  /**
   * Obtener todas las reservas del usuario (compatibilidad)
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
   * Obtener detalle de reserva (compatibilidad)
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
   * ✅ NUEVO: Agregar asientos a una reserva existente
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
  }
};