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

// ✅ INTERFACE PARA LA RESPUESTA DEL BACKEND
interface BackendEncomienda {
  id: number;
  codigo_seguimiento: string;
  remitente_nombre: string;
  remitente_telefono: string;
  remitente_direccion?: string;
  destinatario_nombre: string;
  destinatario_telefono: string;
  destino_ciudad: string;
  destino_direccion: string;
  descripcion: string;
  peso: number | string;
  precio: number | string;
  estado: string;
  fecha_creacion: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  conductor_asignado?: number;
  conductor_nombre?: string;
  notas?: string;
  creado_por?: number;
  pago_info?: any;
  estado_pago?: string;
  metodo_pago?: string;
  seguimientos?: any[];
  pago?: number;
  puede_ser_asignada?: boolean;
  puede_ser_entregada?: boolean;
  creado_por_nombre?: string;
  conductor_info?: any;
  pago_detalle?: any;
}

// ✅ FUNCIÓN PARA CALCULAR PRECIO AUTOMÁTICAMENTE
const calcularPrecioAutomatico = (peso: number, destino: string): number => {
  const preciosBase: Record<string, number> = {
    'La Paz': 20, 'Santa Cruz': 25, 'Cochabamba': 22, 'Oruro': 18,
    'Potosí': 20, 'Tarija': 23, 'Beni': 30, 'Pando': 35,
  };
  const base = preciosBase[destino] || 25;
  const adicionalPeso = peso > 1 ? (peso - 1) * 5 : 0;
  return base + adicionalPeso;
};

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
  // ✅ CORREGIDO: Incluir precio (calculado automáticamente si no viene)
  precio: data.precio || calcularPrecioAutomatico(data.peso, data.destino_ciudad),
  notas: data.notas || '',
  metodo_pago: data.metodo_pago,
});

const fromDTO = (data: BackendEncomienda): Encomienda => ({
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
  peso: typeof data.peso === 'string' ? parseFloat(data.peso) : data.peso,
  precio: typeof data.precio === 'string' ? parseFloat(data.precio) : data.precio,
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
  seguimientos: data.seguimientos || [],
  // ✅ NUEVOS CAMPOS DEL BACKEND ACTUALIZADO
  pago: data.pago,
  puede_ser_asignada: data.puede_ser_asignada,
  puede_ser_entregada: data.puede_ser_entregada,
  creado_por_nombre: data.creado_por_nombre,
  conductor_info: data.conductor_info,
  pago_detalle: data.pago_detalle,
});

export const encomiendaService = {
  // Listar encomiendas con filtros y paginación (para admin)
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
      const response = await apiRequest<PaginatedResponse<BackendEncomienda>>(url);
      
      if (response.success && response.data) {
        const data = response.data;
        // CORREGIDO: Manejar diferentes formatos de respuesta
        const results = Array.isArray(data.results) ? data.results : 
                       Array.isArray(data) ? data : [];
        const count = data.count || results.length;
        
        return {
          success: true,
          data: {
            count: count,
            next: data.next,
            previous: data.previous,
            results: results.map(fromDTO),
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
      const response = await apiRequest<BackendEncomienda>(`/api/encomiendas/${id}/`);
      
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
      const response = await apiRequest<BackendEncomienda>(`/api/encomiendas/seguimiento/${codigo}/`);
      
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

  // ✅ CORREGIDO: Crear nueva encomienda con mejor manejo de errores
  async create(data: CreateEncomiendaRequest): Promise<ApiResponse<Encomienda>> {
    try {
      const dto = toDTO(data);
      
      console.log('🔍 DEBUG - DTO a enviar:', dto);
      console.log('🔍 DEBUG - URL:', '/api/encomiendas/');

      const response = await apiRequest<BackendEncomienda>('/api/encomiendas/', {
        method: 'POST',
        body: JSON.stringify(dto),
      });

      console.log('🔍 DEBUG - Response status:', response);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          data: fromDTO(response.data),
          message: 'Encomienda creada exitosamente'
        };
      } else {
        // ✅ MEJOR MANEJO DE ERRORES DETALLADO
        console.error('🔍 DEBUG - Error response:', response);
        const errorData = response as any;
        const errorMessage = errorData.error || 
                           (response.data && (response.data.error || response.data.detail)) ||
                           'Error desconocido al crear encomienda';
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('🔍 DEBUG - Catch error:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión al crear encomienda'
      };
    }
  },

  // Actualizar encomienda
  async update(id: number, data: Partial<Encomienda>): Promise<ApiResponse<Encomienda>> {
    try {
      const response = await apiRequest<BackendEncomienda>(`/api/encomiendas/${id}/`, {
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
  async remove(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiRequest(`/api/encomiendas/${id}/`, { 
        method: 'DELETE' 
      });
      
      if (response.success) {
        return { success: true };
      }
      
      return response as ApiResponse<void>;
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
      const response = await apiRequest<EncomiendaStats>('/api/encomiendas/estadisticas/');
      if (response.success && response.data) {
        const stats = response.data;
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
      const response = await apiRequest<BackendEncomienda[] | { results: BackendEncomienda[] }>('/api/encomiendas/mis_encomiendas/');
      if (response.success && response.data) {
        const data = response.data;
        let lista: BackendEncomienda[] = [];
        
        if (Array.isArray(data)) {
          lista = data;
        } else if (data && 'results' in data && Array.isArray(data.results)) {
          lista = data.results;
        }
        
        return { 
          success: true, 
          data: lista.map(fromDTO) 
        };
      }
      
      if (response.success) {
        return { success: true, data: [] };
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
      const response = await apiRequest<BackendEncomienda[] | { results: BackendEncomienda[] }>('/api/encomiendas/asignadas/');
      if (response.success && response.data) {
        const data = response.data;
        const lista = Array.isArray(data) ? data : 
                     (data && 'results' in data ? data.results : []);
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
      const response = await apiRequest<BackendEncomienda>(`/api/encomiendas/${encomiendaId}/asignar_conductor/`, {
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
      const response = await apiRequest<BackendEncomienda>(`/api/encomiendas/${encomiendaId}/actualizar_estado/`, {
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
      const response = await apiRequest<StripePaymentIntent>(`/api/encomiendas/${encomiendaId}/crear_pago_stripe/`, {
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
      interface ConfirmPagoResponse {
        encomienda?: BackendEncomienda;
        success?: boolean;
        message?: string;
      }

      const response = await apiRequest<ConfirmPagoResponse>(`/api/encomiendas/${encomiendaId}/confirmar_pago/`, {
        method: 'POST',
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });
      
      if (response.success && response.data) {
        const responseData = response.data;
        // ✅ CORREGIDO: Manejar diferentes formatos de respuesta
        if (responseData.encomienda) {
          return { success: true, data: fromDTO(responseData.encomienda) };
        } else if (responseData.success) {
          // Si no viene la encomienda, obtenerla de nuevo
          return this.getById(encomiendaId);
        }
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
      interface PagoEfectivoResponse {
        encomienda?: BackendEncomienda;
        success?: boolean;
        message?: string;
      }

      const response = await apiRequest<PagoEfectivoResponse>(`/api/encomiendas/${encomiendaId}/marcar_pago_efectivo/`, {
        method: 'POST',
      });
      
      if (response.success && response.data) {
        const responseData = response.data;
        if (responseData.encomienda) {
          return { success: true, data: fromDTO(responseData.encomienda) };
        } else if (responseData.success) {
          return this.getById(encomiendaId);
        }
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
      const response = await apiRequest<{ url: string }>(url);
      
      return response as ApiResponse<{ url: string }>;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión al generar reporte'
      };
    }
  },

  // CORREGIDO: Alias para 'delete' para mantener compatibilidad
  async delete(id: number): Promise<ApiResponse<void>> {
    return this.remove(id);
  },

  // ✅ NUEVO: Función para calcular precio (para usar en el frontend)
  calcularPrecio(peso: number, destino: string): number {
    return calcularPrecioAutomatico(peso, destino);
  }
};