import { apiRequest } from './api';
import type {
  Usuario,
  UsuarioFormData,
  UsuarioFilters,
  PaginatedResponse,
  ApiResponse,
  Role,
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: UsuarioFormData) => ({
  username: data.username,
  first_name: data.nombre,
  last_name: data.apellido,
  email: data.email,
  telefono: data.telefono,
  rol_id: data.rol_id,
  is_admin_portal: data.is_admin_portal,
  personal_id: data.personal_id,
  conductor_id: data.conductor_id,
  password: data.password,
  password_confirm: data.password_confirm,
});

const fromDTO = (data: any): Usuario => ({
  id: data.id,
  username: data.username,
  nombre: data.first_name || data.nombre,
  apellido: data.last_name || data.apellido,
  email: data.email,
  telefono: data.telefono,
  rol: (data.rol?.nombre as Usuario['rol']) || 'Cliente',
  is_admin_portal: data.is_admin_portal,
  personal_id: data.personal,
  conductor_id: data.conductor,
  created_at: data.created_at || data.fecha_creacion,
  updated_at: data.updated_at || data.fecha_actualizacion,
  first_name: data.first_name,
  last_name: data.last_name,
  direccion: data.direccion,
  ci: data.ci,
  fecha_nacimiento: data.fecha_nacimiento,
  puede_acceder_admin: data.puede_acceder_admin,
  es_activo: data.es_activo,
  fecha_creacion: data.fecha_creacion,
  fecha_ultimo_acceso: data.fecha_ultimo_acceso,
  rol_obj: data.rol,
});

// Nota: las opciones de roles se obtienen desde la API. No hardcodear IDs.

export const usuariosApi = {
  // Listar usuarios con filtros y paginación
  async list(filters?: UsuarioFilters): Promise<ApiResponse<PaginatedResponse<Usuario>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
  // Filtrar por nombre de rol (requiere soporte BE: filterset_fields=['rol__nombre'])
  if (filters?.rol) params.append('rol__nombre', filters.rol);
    if (filters?.is_admin_portal !== undefined) params.append('is_admin_portal', filters.is_admin_portal.toString());
    if (filters?.es_activo !== undefined) params.append('es_activo', filters.es_activo.toString());
    
    const query = params.toString();
    const response = await apiRequest(`/api/admin/users/${query ? `?${query}` : ''}`);
    
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
    
    return response as ApiResponse<PaginatedResponse<Usuario>>;
  },

  // Obtener usuario por ID
  async get(id: number): Promise<ApiResponse<Usuario>> {
    const response = await apiRequest(`/api/admin/users/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Usuario>;
  },

  // Crear nuevo usuario
  async create(data: UsuarioFormData): Promise<ApiResponse<Usuario>> {
    const response = await apiRequest('/api/admin/users/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Usuario>;
  },

  // Actualizar usuario
  async update(id: number, data: UsuarioFormData): Promise<ApiResponse<Usuario>> {
    const response = await apiRequest(`/api/admin/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Usuario>;
  },

  // Eliminar usuario
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/admin/users/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener roles disponibles
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiRequest('/api/admin/roles/');
    
    if (response.success && response.data) {
      const data = response.data as any;
      return {
        success: true,
        data: data.results || data,
      };
    }
    
    return response as ApiResponse<Role[]>;
  },

  // Obtener personal disponible para autocompletado
  async getPersonalDisponible(): Promise<ApiResponse<Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>>> {
    return apiRequest('/api/admin/users/personal_disponible/');
  },

  // Obtener conductores disponibles para autocompletado
  async getConductoresDisponibles(): Promise<ApiResponse<Array<{
    id: number;
    personal__nombre: string;
    personal__apellido: string;
    personal__email: string;
    personal__ci: string;
    personal__telefono: string;
    nro_licencia: string;
  }>>> {
    return apiRequest('/api/admin/users/conductores_disponibles/');
  },

  // Activar/desactivar usuario
  async toggleStatus(id: number, es_activo: boolean): Promise<ApiResponse> {
    return apiRequest(`/api/admin/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ es_activo }),
    });
  },
};
