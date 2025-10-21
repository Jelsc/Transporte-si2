import { apiRequest } from './authService';
import type { 
  Encomienda, 
  EncomiendaFilters, 
  CreateEncomiendaRequest, 
  UpdateEncomiendaRequest,
  EncomiendaStats,
  PaginatedResponse,
  ApiResponse,
  StripePaymentIntent,
  ConfirmPaymentRequest
} from '../types/encomienda';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: CreateEncomiendaRequest) => ({
  remitente_nombre: data.remitente_nombre,
  remitente_telefono: data.remitente_telefono,
  remitente_direccion: data.remitente_direccion || '',
  destinatario_nombre: data.destinatario_nombre,
  destinatario_telefono: data.destinatario_telefono,
  destino_ciudad: data.destino_ciudad,
  destino_direccion: data.destino_direccion,
  descripcion: data.descripcion,
  peso: data.peso,
  notas: data.notas || '',
  metodo_pago: data.metodo_pago, // NUEVO CAMPO
});

const fromDTO = (data: any): Encomienda => ({
  id: data.id,
  codigo_seguimiento: data.codigo_seguimiento,
  remitente_nombre: data.remitente_nombre,
  remitente_telefono: data.remitente_telefono,
  remitente_direccion: data.remitente_direccion,
  destinatario_nombre: data.destinatario_nombre,
  destinatario_telefono: data.destinatario_telefono,
  destino_ciudad: data.destino_ciudad,
  destino_direccion: data.destino_direccion,
  descripcion: data.descripcion,
  peso: parseFloat(data.peso),
  precio: parseFloat(data.precio),
  estado: data.estado,
  fecha_creacion: data.fecha_creacion,
  fecha_entrega_estimada: data.fecha_entrega_estimada,
  fecha_entrega_real: data.fecha_entrega_real,
  conductor_asignado: data.conductor_asignado,
  conductor_nombre: data.conductor_nombre,
  notas: data.notas,
  creado_por: data.creado_por,
  
  // NUEVOS CAMPOS PARA PAGOS
  pago_info: data.pago_info,
  estado_pago: data.estado_pago,
  metodo_pago: data.metodo_pago,
});

export const encomiendaService = {
  // Listar encomiendas con filtros y paginación
  async list(filters?: EncomiendaFilters): Promise<ApiResponse<PaginatedResponse<Encomienda>>> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.destino_ciudad) params.append('destino_ciudad', filters.destino_ciudad);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.conductor_asignado) params.append('conductor_asignado', filters.conductor_asignado.toString());
    if (filters?.codigo_seguimiento) params.append('codigo_seguimiento', filters.codigo_seguimiento);
    
    const query = params.toString();
    const url = `/api/encomiendas/${query ? `?${query}` : ''}`;
    
    try {
      const response = await apiRequest(url);
      
      if (response.success && response.data) {
        const data = response.data as any;
        return {
          success: true,
          data: {
            count: data.count || data.results?.length || 0,
            next: data.next,
            previous: data.previous,
            results: Array.isArray(data.results) ? data.results.map(fromDTO) : 
                     Array.isArray(data) ? data.map(fromDTO) : [],
          },
        };
      }
      
      return response as ApiResponse<PaginatedResponse<Encomienda>>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al cargar encomiendas'
      };
    }
  },

  // Obtener encomienda por ID
  async getById(id: number): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${id}/`);
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al obtener encomienda'
      };
    }
  },

  // Obtener encomienda por código de seguimiento
  async getByTrackingCode(codigo: string): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/seguimiento/${codigo}/`);
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al buscar encomienda'
      };
    }
  },

  // Crear nueva encomienda
  async create(data: CreateEncomiendaRequest): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest('/api/encomiendas/', {
        method: 'POST',
        body: JSON.stringify(toDTO(data)),
      });
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al crear encomienda'
      };
    }
  },

  // Actualizar encomienda
  async update(id: number, data: UpdateEncomiendaRequest): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al actualizar encomienda'
      };
    }
  },

  // Eliminar encomienda
  async delete(id: number): Promise<ApiResponse> {
    try {
      return await apiRequest(`/api/encomiendas/${id}/`, { method: 'DELETE' });
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al eliminar encomienda'
      };
    }
  },

  // Obtener estadísticas de encomiendas
  async getStats(): Promise<ApiResponse<EncomiendaStats>> {
    try {
      const response = await apiRequest('/api/encomiendas/estadisticas/');
      if (response.success && response.data) {
        const stats = response.data as Partial<EncomiendaStats>;
        return {
          success: true,
          data: {
            total: stats.total ?? 0,
            pendientes: stats.pendientes ?? 0,
            en_ruta: stats.en_ruta ?? 0,
            entregados: stats.entregados ?? 0,
            cancelados: stats.cancelados ?? 0,
            ingresos_totales: stats.ingresos_totales ?? 0,
          },
        };
      }
      return response as ApiResponse<EncomiendaStats>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al cargar estadísticas'
      };
    }
  },

  // Obtener mis encomiendas (para usuarios normales)
  async getMyEncomiendas(): Promise<ApiResponse<Encomienda[]>> {
    try {
      const response = await apiRequest('/api/encomiendas/mis_encomiendas/');
      if (response.success && response.data) {
        const data = response.data as any;
        const lista = Array.isArray(data) ? data : data.results ?? [];
        return { success: true, data: lista.map(fromDTO) };
      }
      return response as ApiResponse<Encomienda[]>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al cargar mis encomiendas'
      };
    }
  },

  // Obtener encomiendas asignadas al conductor autenticado
  async getAssignedEncomiendas(): Promise<ApiResponse<Encomienda[]>> {
    try {
      const response = await apiRequest('/api/encomiendas/asignadas/');
      if (response.success && response.data) {
        const data = response.data as any;
        const lista = Array.isArray(data) ? data : data.results ?? [];
        return { success: true, data: lista.map(fromDTO) };
      }
      return response as ApiResponse<Encomienda[]>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al cargar encomiendas asignadas'
      };
    }
  },

  // Asignar conductor a encomienda
  async asignarConductor(encomiendaId: number, conductorId: number): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${encomiendaId}/asignar_conductor/`, {
        method: 'POST',
        body: JSON.stringify({ conductor_id: conductorId }),
      });
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al asignar conductor'
      };
    }
  },

  // Actualizar estado de entrega
  async actualizarEstadoEntrega(encomiendaId: number, estado: string, notas?: string): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${encomiendaId}/actualizar_estado/`, {
        method: 'POST',
        body: JSON.stringify({ 
          estado, 
          notas,
          fecha_entrega_real: estado === 'entregado' ? new Date().toISOString() : undefined
        }),
      });
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data) };
      }
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al actualizar estado'
      };
    }
  },

  // NUEVOS MÉTODOS PARA PAGOS

  // Crear pago en Stripe
  async crearPagoStripe(encomiendaId: number): Promise<ApiResponse<StripePaymentIntent>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${encomiendaId}/crear-pago-stripe/`, {
        method: 'POST',
      });
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return response as ApiResponse<StripePaymentIntent>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al crear pago Stripe'
      };
    }
  },

  // Confirmar pago de Stripe
  async confirmarPago(encomiendaId: number, paymentIntentId: string): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${encomiendaId}/confirmar-pago/`, {
        method: 'POST',
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data.encomienda || response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al confirmar pago'
      };
    }
  },

  // Marcar pago en efectivo como completado (solo administradores)
  async marcarPagoEfectivo(encomiendaId: number): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${encomiendaId}/marcar-pago-efectivo/`, {
        method: 'POST',
      });
      
      if (response.success && response.data) {
        return { success: true, data: fromDTO(response.data.encomienda || response.data) };
      }
      
      return response as ApiResponse<Encomienda>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al marcar pago en efectivo'
      };
    }
  },

  // Generar reporte de encomiendas
  async generarReporte(filters?: EncomiendaFilters): Promise<ApiResponse<{ url: string }>> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.destino_ciudad) params.append('destino_ciudad', filters.destino_ciudad);
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      
      const query = params.toString();
      const url = `/api/encomiendas/generar_reporte/${query ? `?${query}` : ''}`;
      const response = await apiRequest(url);
      
      return response as ApiResponse<{ url: string }>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al generar reporte'
      };
    }
  },
};