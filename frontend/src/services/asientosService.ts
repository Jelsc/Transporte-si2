
import type { Asiento } from '@/types/asiento';
import type { ApiResponse } from '@/types';
import { apiRequest } from './authService';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

interface ReservaTemporalResponse {
  success: boolean;
  message?: string;
  data?: Reserva;
  expiracion?: string;
  tiempo_restante?: number;
  error?: string;
}

export const asientosApi = {
  async list(viajeId: number): Promise<ApiResponse<Asiento[]>> {
    try {
      const response = await apiRequest(`/api/asientos/?viaje=${viajeId}`);

      if (response.success && response.data) {
        let asientosData: Asiento[] = [];

        const data = response.data as PaginatedResponse<Asiento> | Asiento[] | any;
        
        if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          asientosData = data.results;
        } else if (Array.isArray(data)) {
          asientosData = data;
        }

        asientosData.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
        
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
      console.error('Error al cargar asientos:', error);
      return {
        success: false,
        error: 'Error de conexión',
        data: []
      };
    }
  },

  async reservarMultiple(
    asientosIds: number[], 
    viajeId?: number, 
    montoTotal?: number
  ): Promise<ReservaTemporalResponse> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      if (viajeId && montoTotal !== undefined) {
        const reservaTemporalPayload = {
          viaje_id: viajeId,
          asientos_ids: asientosIds,
          monto_total: montoTotal
        };

        const response = await fetch('http://localhost:8000/api/reservas/crear-temporal/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reservaTemporalPayload),
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
      }

      const payload = {
        asientos_ids: asientosIds,
        pagado: false,
      };

      const response = await fetch('http://localhost:8000/api/reservas/', {
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
        return { success: true, data };
      } catch (e) {
        return { success: true, data: null as any };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async reservarSimple(asientoId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'No autenticado' };
      }

      const payload = {
        asiento_id: asientoId,
        pagado: false,
      };

      const response = await fetch('http://localhost:8000/api/reservas/simple/', {
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
        return { success: true, data };
      } catch (e) {
        return { success: true, data: null };
      }
      
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async confirmarPagoReserva(reservaId: number): Promise<ApiResponse<Reserva>> {
    try {
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

      const response = await fetch(`http://localhost:8000/api/reservas/${reservaId}/cancelar-temporal/`, {
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
      console.error('Error al cancelar reserva:', error);
      return {
        success: false,
        error: 'Error al cancelar la reserva'
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
      console.error('Error al agregar asientos:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },
};