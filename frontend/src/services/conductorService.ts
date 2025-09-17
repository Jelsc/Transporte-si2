import { apiRequest, type ApiResponse } from './api';
import type { Conductor } from '@/types';

// Servicios para gestión de conductores
export const conductorService = {
  // Obtener todos los conductores
  async getConductores(): Promise<ApiResponse<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Conductor[];
  }>> {
    return apiRequest('/api/conductores/');
  },

  // Obtener un conductor específico
  async getConductorById(id: number): Promise<ApiResponse<Conductor>> {
    return apiRequest(`/api/conductores/${id}/`);
  },

  // Crear un nuevo conductor
  async createConductor(data: {
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    telefono: string;
    email: string;
    ci: string;
    nro_licencia: string;
    tipo_licencia: string;
    fecha_venc_licencia: string;
    experiencia_anios: number;
    telefono_emergencia?: string;
    contacto_emergencia?: string;
    es_activo?: boolean;
  }): Promise<ApiResponse<Conductor>> {
    return apiRequest('/api/conductores/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Actualizar un conductor
  async updateConductor(id: number, data: {
    nombre: string;
    apellido: string;
    fecha_nacimiento: string;
    telefono: string;
    email: string;
    ci: string;
    nro_licencia: string;
    tipo_licencia: string;
    fecha_venc_licencia: string;
    experiencia_anios: number;
    telefono_emergencia?: string;
    contacto_emergencia?: string;
    es_activo?: boolean;
  }): Promise<ApiResponse<Conductor>> {
    return apiRequest(`/api/conductores/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Actualizar parcialmente un conductor
  async patchConductor(id: number, data: Partial<Conductor>): Promise<ApiResponse<Conductor>> {
    return apiRequest(`/api/conductores/conductores/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Eliminar un conductor
  async deleteConductor(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/conductores/conductores/${id}/`, {
      method: 'DELETE',
    });
  },

  // Cambiar estado del conductor
  async cambiarEstado(id: number, estado: string): Promise<ApiResponse<Conductor>> {
    return apiRequest(`/api/conductores/conductores/${id}/cambiar_estado/`, {
      method: 'POST',
      body: JSON.stringify({ estado }),
    });
  },

  // Actualizar ubicación del conductor
  async actualizarUbicacion(id: number, latitud: number, longitud: number): Promise<ApiResponse<Conductor>> {
    return apiRequest(`/api/conductores/conductores/${id}/actualizar_ubicacion/`, {
      method: 'POST',
      body: JSON.stringify({
        ultima_ubicacion_lat: latitud,
        ultima_ubicacion_lng: longitud,
      }),
    });
  },

  // Obtener estadísticas de conductores
  async getEstadisticas(): Promise<ApiResponse<{
    total: number;
    activos: number;
    inactivos: number;
    por_estado: Record<string, number>;
    por_tipo_licencia: Record<string, number>;
    licencias_vencidas: number;
    licencias_por_vencer: number;
    nuevos_este_mes: number;
  }>> {
    return apiRequest('/api/conductores/conductores/estadisticas/');
  },

  // Obtener conductores disponibles para vincular con usuarios
  async getConductoresDisponibles(): Promise<ApiResponse<Array<{
    id: number;
    personal__nombre: string;
    personal__apellido: string;
    personal__email: string;
    personal__ci: string;
    personal__telefono: string;
    nro_licencia: string;
  }>>> {
    return apiRequest('/api/conductores/conductores/disponibles_para_usuario/');
  },

  // Obtener conductores con licencias próximas a vencer
  async getLicenciasPorVencer(): Promise<ApiResponse<Conductor[]>> {
    return apiRequest('/api/conductores/conductores/licencias_por_vencer/');
  },

  // Obtener conductores con licencias vencidas
  async getLicenciasVencidas(): Promise<ApiResponse<Conductor[]>> {
    return apiRequest('/api/conductores/conductores/licencias_vencidas/');
  },
};
