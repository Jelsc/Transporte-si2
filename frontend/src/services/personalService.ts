import { apiRequest, type ApiResponse } from './api';
import type { Personal } from '@/types';

// Servicios para gestión de personal
export const personalService = {
  // Obtener todos los empleados
  async getPersonal(params?: Record<string, any>): Promise<ApiResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Personal[];
  }>> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/api/personal/${query ? `?${query}` : ''}`);
  },

  // Obtener un empleado específico
  async getPersonalById(id: number): Promise<ApiResponse<Personal>> {
    return apiRequest(`/api/personal/${id}/`);
  },

  // Crear un nuevo empleado
  async createPersonal(data: {
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    telefono: string;
    email: string;
    ci: string;
    codigo_empleado?: string;
    departamento?: string;
    fecha_ingreso?: string;
    horario_trabajo?: string;
    supervisor?: number;
    telefono_emergencia?: string;
    contacto_emergencia?: string;
    es_activo?: boolean;
  }): Promise<ApiResponse<Personal>> {
    return apiRequest('/api/personal/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar un empleado
  async updatePersonal(id: number, data: Partial<Personal>): Promise<ApiResponse<Personal>> {
    return apiRequest(`/api/personal/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Actualizar parcialmente un empleado
  async patchPersonal(id: number, data: Partial<Personal>): Promise<ApiResponse<Personal>> {
    return apiRequest(`/api/personal/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Eliminar un empleado
  async deletePersonal(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/personal/${id}/`, {
      method: 'DELETE',
    });
  },

  // Cambiar estado del empleado
  async cambiarEstado(id: number, estado: string): Promise<ApiResponse<Personal>> {
    return apiRequest(`/api/personal/${id}/cambiar_estado/`, {
      method: 'POST',
      body: JSON.stringify({ estado }),
    });
  },

  // Obtener estadísticas de personal
  async getEstadisticas(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    por_estado: Record<string, number>;
    por_departamento: Record<string, number>;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/personal/estadisticas/');
  },

  // Obtener personal disponible para vincular con usuarios
  async getPersonalDisponible(): Promise<ApiResponse<Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>>> {
    return apiRequest('/api/personal/disponibles_para_usuario/');
  },
};
