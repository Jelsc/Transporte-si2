import { apiRequest } from './api';
import type { 
  Personal, 
  PersonalFormData, 
  PersonalFilters, 
  PaginatedResponse, 
  ApiResponse,
  PersonalOption 
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: PersonalFormData) => ({
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.toISOString().split('T')[0] : undefined,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  codigo_empleado: data.codigo_empleado,
  fecha_ingreso: data.fecha_ingreso ? data.fecha_ingreso.toISOString().split('T')[0] : undefined,
  departamento: data.departamento,
  horario_trabajo: data.horario_trabajo,
  supervisor: data.supervisor,
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  es_activo: data.es_activo ?? true,
});

const fromDTO = (data: any): Personal => ({
  id: data.id,
  nombre: data.nombre,
  apellido: data.apellido,
  fecha_nacimiento: data.fecha_nacimiento,
  telefono: data.telefono,
  email: data.email,
  ci: data.ci,
  codigo_empleado: data.codigo_empleado,
  departamento: data.departamento,
  created_at: data.created_at || data.fecha_creacion,
  updated_at: data.updated_at || data.fecha_actualizacion,
  fecha_ingreso: data.fecha_ingreso,
  horario_trabajo: data.horario_trabajo,
  estado: data.estado,
  supervisor: data.supervisor,
  supervisor_nombre: data.supervisor_nombre,
  supervisor_codigo: data.supervisor_codigo,
  telefono_emergencia: data.telefono_emergencia,
  contacto_emergencia: data.contacto_emergencia,
  es_activo: data.es_activo,
  nombre_completo: data.nombre_completo,
  anos_antiguedad: data.anos_antiguedad,
  puede_acceder_sistema: data.puede_acceder_sistema,
  ultimo_acceso: data.ultimo_acceso,
  fecha_creacion: data.fecha_creacion,
  fecha_actualizacion: data.fecha_actualizacion,
  usuario: data.usuario,
  username: data.username,
});

export const personalApi = {
  // Listar personal con filtros y paginación
  async list(filters?: PersonalFilters): Promise<ApiResponse<PaginatedResponse<Personal>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
  if (filters?.departamento) params.append('departamento', filters.departamento);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.es_activo !== undefined) params.append('es_activo', filters.es_activo.toString());
    
    const query = params.toString();
    const response = await apiRequest(`/api/personal/${query ? `?${query}` : ''}`);
    
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
    
    return response as ApiResponse<PaginatedResponse<Personal>>;
  },

  // Obtener personal por ID
  async get(id: number): Promise<ApiResponse<Personal>> {
    const response = await apiRequest(`/api/personal/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Personal>;
  },

  // Crear nuevo personal
  async create(data: PersonalFormData): Promise<ApiResponse<Personal>> {
    const response = await apiRequest('/api/personal/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Personal>;
  },

  // Actualizar personal
  async update(id: number, data: PersonalFormData): Promise<ApiResponse<Personal>> {
    const response = await apiRequest(`/api/personal/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Personal>;
  },

  // Eliminar personal
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/personal/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener personal disponible para autocompletado
  async getAvailable(): Promise<ApiResponse<PersonalOption[]>> {
    const response = await apiRequest('/api/personal/disponibles_para_usuario/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          apellido: item.apellido,
          email: item.email,
          ci: item.ci,
          telefono: item.telefono,
        })),
      };
    }
    
    return response as ApiResponse<PersonalOption[]>;
  },

  // Obtener estadísticas
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    por_estado: Record<string, number>;
    por_departamento: Record<string, number>;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/personal/estadisticas/');
  },
};
