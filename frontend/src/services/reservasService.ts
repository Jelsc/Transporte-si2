
import type { 
  Reserva, 
  ReservaTemporalPayload, 
  ReservaTemporalResponse 
} from '@/types/reservas';
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';
import { getApiBaseUrl } from '@/lib/api';

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
  async crearReservaTemporal(payload: ReservaTemporalPayload): Promise<ReservaTemporalResponse> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/reservas/crear-temporal/`, {
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
        return {
          success: true,
          data: data.data,
          expiracion: data.expiracion,
          tiempo_restante: data.tiempo_restante,
          message: data.message
        };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async confirmarPago(reservaId: number): Promise<ApiResponse<Reserva>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/confirmar-pago/`, {
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

      try {
        const data = JSON.parse(responseText);
        return { success: true, data: data.data };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async cancelarReservaTemporal(reservaId: number): Promise<ApiResponse<null>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/cancelar-temporal/`, {
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

      try {
        const data = JSON.parse(responseText);
        return { success: true, data: null };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async obtenerEstadoReservaTemporal(reservaId: number): Promise<ApiResponse<EstadoReservaTemporal>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/estado-temporal/`, {
        method: 'GET',
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
        return { success: true, data: data.data };
      } catch (e) {
        return { success: false, error: 'Error procesando respuesta del servidor' };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async verificarReservaActiva(reservaId: number): Promise<boolean> {
    try {
      const estado = await this.obtenerEstadoReservaTemporal(reservaId);
      
      if (estado.success && estado.data) {
        return estado.data.estado === 'pendiente_pago' && !estado.data.esta_expirada;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando reserva activa:', error);
      return false;
    }
  },

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
      console.error('Error al obtener reservas:', error);
      return {
        success: false,
        error: 'Error al cargar las reservas',
        data: []
      };
    }
  },

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
      console.error('Error al obtener detalle de reserva:', error);
      return {
        success: false,
        error: 'Error al cargar el detalle de la reserva'
      };
    }
  },

  async agregarAsientosReserva(reservaId: number, asientosIds: number[]): Promise<ApiResponse<Reserva>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const payload = {
        asientos_ids: asientosIds
      };

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/reservas/${reservaId}/agregar-asientos/`, {
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
      console.error('Error al agregar asientos:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
};

