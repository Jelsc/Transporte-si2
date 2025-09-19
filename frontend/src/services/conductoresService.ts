import { apiRequest } from './api';
import type { 
  Conductor, 
  ConductorFormData, 
  ConductorFilters, 
  PaginatedResponse, 
  ApiResponse,
  ConductorOption 
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: ConductorFormData) => ({
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.toISOString().split('T')[0] : undefined,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  nro_licencia: data.nro_licencia,
  tipo_licencia: data.tipo_licencia,
  fecha_venc_licencia: data.fecha_venc_licencia ? data.fecha_venc_licencia.toISOString().split('T')[0] : undefined,
  experiencia_anios: Number.isFinite(data.experiencia_anios) ? data.experiencia_anios : 0,
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  es_activo: data.es_activo ?? true,
});

const fromDTO = (data: any): Conductor => ({
  id: data.id,
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  created_at: data.created_at || data.fecha_creacion,
  updated_at: data.updated_at || data.fecha_actualizacion,
  estado: data.estado,
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  es_activo: data.es_activo,
  nombre_completo: data.nombre_completo,
  fecha_creacion: data.fecha_creacion,
  fecha_actualizacion: data.fecha_actualizacion,
  usuario: data.usuario,
  username: data.username,
  
  // Campos específicos de Conductor
  nro_licencia: data.nro_licencia,
  fecha_venc_licencia: data.fecha_venc_licencia,
  experiencia_anios: data.experiencia_anios,
  personal: data.personal,
  tipo_licencia: data.tipo_licencia,
  licencia_vencida: data.licencia_vencida || false,
  dias_para_vencer_licencia: data.dias_para_vencer_licencia || 0,
  puede_conducir: data.puede_conducir || false,
  ultima_ubicacion_lat: data.ultima_ubicacion_lat,
  ultima_ubicacion_lng: data.ultima_ubicacion_lng,
  ultima_actualizacion_ubicacion: data.ultima_actualizacion_ubicacion,
});

export const conductoresApi = {
  // Listar conductores con filtros y paginación
  async list(filters?: ConductorFilters): Promise<ApiResponse<PaginatedResponse<Conductor>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
  if (filters?.licencia_vencida !== undefined) params.append('licencia_vencida', filters.licencia_vencida.toString());
    if (filters?.tipo_licencia) params.append('tipo_licencia', filters.tipo_licencia);
    if (filters?.es_activo !== undefined) params.append('es_activo', filters.es_activo.toString());
    
    const query = params.toString();
    const response = await apiRequest(`/api/conductores/${query ? `?${query}` : ''}`);
    
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
    
    return response as ApiResponse<PaginatedResponse<Conductor>>;
  },

  // Obtener conductor por ID
  async get(id: number): Promise<ApiResponse<Conductor>> {
    const response = await apiRequest(`/api/conductores/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Conductor>;
  },

  // Crear nuevo conductor
  async create(data: ConductorFormData): Promise<ApiResponse<Conductor>> {
    const response = await apiRequest('/api/conductores/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Conductor>;
  },

  // Actualizar conductor
  async update(id: number, data: ConductorFormData): Promise<ApiResponse<Conductor>> {
    const response = await apiRequest(`/api/conductores/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Conductor>;
  },

  // Eliminar conductor
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/conductores/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener conductores disponibles para autocompletado
  async getAvailable(): Promise<ApiResponse<ConductorOption[]>> {
    const response = await apiRequest('/api/conductores/disponibles_para_usuario/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map((item: any) => ({
          id: item.id,
          personal__nombre: item.personal__nombre,
          personal__apellido: item.personal__apellido,
          personal__email: item.personal__email,
          personal__ci: item.personal__ci,
          personal__telefono: item.personal__telefono,
          nro_licencia: item.nro_licencia,
        })),
      };
    }
    
    return response as ApiResponse<ConductorOption[]>;
  },

  // Obtener conductores con licencias próximas a vencer
  async getLicenciasPorVencer(): Promise<ApiResponse<Conductor[]>> {
    const response = await apiRequest('/api/conductores/licencias_por_vencer/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map(fromDTO),
      };
    }
    
    return response as ApiResponse<Conductor[]>;
  },

  // Obtener conductores con licencias vencidas
  async getLicenciasVencidas(): Promise<ApiResponse<Conductor[]>> {
    const response = await apiRequest('/api/conductores/licencias_vencidas/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map(fromDTO),
      };
    }
    
    return response as ApiResponse<Conductor[]>;
  },

  // Obtener estadísticas
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    por_estado: Record<string, number>;
    por_tipo_licencia: Record<string, number>;
    licencias_vencidas: number;
    licencias_por_vencer: number;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/conductores/estadisticas/');
  },
};
