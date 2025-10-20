// src/services/encomiendaService.ts
import { apiRequest } from './authService';
import type { 
  Encomienda, 
  EncomiendaFilters, 
  CreateEncomiendaRequest, 
  UpdateEncomiendaRequest,
  EncomiendaStats,
  PaginatedResponse,
  ApiResponse 
} from '../types/encomienda'; // ruta relativa corregida

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
  peso: data.peso,
  precio: data.precio,
  estado: data.estado,
  fecha_creacion: data.fecha_creacion,
  fecha_entrega_estimada: data.fecha_entrega_estimada,
  fecha_entrega_real: data.fecha_entrega_real,
  conductor_asignado: data.conductor_asignado,
  conductor_nombre: data.conductor_nombre,
  vehiculo_asignado: data.vehiculo_asignado,
  viaje_asociado: data.viaje_asociado,
  notas: data.notas,
  creado_por: data.creado_por,
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
    const response = await apiRequest(url);
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: {
          count: data.count,
          next: data.next,
          previous: data.previous,
          results: data.results.map(fromDTO),
        },
      };
    }
    
    return response as ApiResponse<PaginatedResponse<Encomienda>>;
  },

  // Obtener encomienda por ID
  async getById(id: number): Promise<ApiResponse<Encomienda>> {
    const response = await apiRequest(`/api/encomiendas/${id}/`);
    
    if (response.success && response.data) {
      return { success: true, data: fromDTO(response.data) };
    }
    
    return response as ApiResponse<Encomienda>;
  },

  // Obtener encomienda por código de seguimiento
  async getByTrackingCode(codigo: string): Promise<ApiResponse<Encomienda>> {
    const response = await apiRequest(`/api/encomiendas/seguimiento/${codigo}/`);
    
    if (response.success && response.data) {
      return { success: true, data: fromDTO(response.data) };
    }
    
    return response as ApiResponse<Encomienda>;
  },

  // Crear nueva encomienda
  async create(data: CreateEncomiendaRequest): Promise<ApiResponse<Encomienda>> {
    const response = await apiRequest('/api/encomiendas/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return { success: true, data: fromDTO(response.data) };
    }
    
    return response as ApiResponse<Encomienda>;
  },

  // Actualizar encomienda
  async update(id: number, data: UpdateEncomiendaRequest): Promise<ApiResponse<Encomienda>> {
    const response = await apiRequest(`/api/encomiendas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.data) {
      return { success: true, data: fromDTO(response.data) };
    }
    
    return response as ApiResponse<Encomienda>;
  },

  // Eliminar encomienda
  async delete(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/encomiendas/${id}/`, { method: 'DELETE' });
  },

  // Obtener estadísticas de encomiendas
  async getStats(): Promise<ApiResponse<EncomiendaStats>> {
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
  },

  // Obtener encomiendas asignadas al conductor autenticado
  async getAssignedEncomiendas(): Promise<ApiResponse<Encomienda[]>> {
    const response = await apiRequest('/api/encomiendas/asignadas/');
    if (response.success && response.data) {
      const data = response.data as any;
      const lista = Array.isArray(data) ? data : data.results ?? [];
      return { success: true, data: lista.map(fromDTO) };
    }
    return response as ApiResponse<Encomienda[]>;
  },

  // Asignar conductor a encomienda
  async asignarConductor(encomiendaId: number, conductorId: number): Promise<ApiResponse<Encomienda>> {
    const response = await apiRequest(`/api/encomiendas/${encomiendaId}/asignar_conductor/`, {
      method: 'POST',
      body: JSON.stringify({ conductor_id: conductorId }),
    });
    if (response.success && response.data) {
      return { success: true, data: fromDTO(response.data) };
    }
    return response as ApiResponse<Encomienda>;
  },

  // Actualizar estado de entrega
  async actualizarEstadoEntrega(encomiendaId: number, estado: string, notas?: string): Promise<ApiResponse<Encomienda>> {
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
  },

  // Generar reporte de encomiendas
  async generarReporte(filters?: EncomiendaFilters): Promise<ApiResponse<{ url: string }>> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.destino_ciudad) params.append('destino_ciudad', filters.destino_ciudad);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    
    const query = params.toString();
    const url = `/api/encomiendas/generar_reporte/${query ? `?${query}` : ''}`;
    const response = await apiRequest(url);
    
    return response as ApiResponse<{ url: string }>;
  },
};
