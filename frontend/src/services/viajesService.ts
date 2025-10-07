import { apiRequest } from './authService';
import type { 
  Viaje, 
  ViajeFormData, 
  ViajeFilters, 
  PaginatedResponse, 
  ApiResponse 
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: ViajeFormData) => ({
  origen: data.origen,
  destino: data.destino,
  fecha: data.fecha,
  hora: data.hora,
  vehiculo_id: data.vehiculo_id,
  precio: data.precio,
  estado: data.estado || 'programado',
  asientos_disponibles: data.asientos_disponibles || 0,
  asientos_ocupados: data.asientos_ocupados || 0,
});

const fromDTO = (data: any): Viaje => ({
  id: data.id,
  origen: data.origen,
  destino: data.destino,
  fecha: data.fecha,
  hora: data.hora,
  vehiculo_id: data.vehiculo_id,
  vehiculo: data.vehiculo,
  precio: data.precio,
  estado: data.estado,
  asientos_disponibles: data.asientos_disponibles,
  asientos_ocupados: data.asientos_ocupados,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

export const viajesApi = {
  // Listar viajes con filtros y paginación
  async list(filters?: ViajeFilters): Promise<ApiResponse<PaginatedResponse<Viaje>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.origen) params.append('origen', filters.origen);
    if (filters?.destino) params.append('destino', filters.destino);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.vehiculo_id) params.append('vehiculo_id', filters.vehiculo_id.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    
    const query = params.toString();
    const response = await apiRequest(`/api/viajes/${query ? `?${query}` : ''}`);
    
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
    
    return response as ApiResponse<PaginatedResponse<Viaje>>;
  },

  // Obtener viaje por ID
  async get(id: number): Promise<ApiResponse<Viaje>> {
    const response = await apiRequest(`/api/viajes/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Viaje>;
  },

  // Crear nuevo viaje
  async create(data: ViajeFormData): Promise<ApiResponse<Viaje>> {
    const response = await apiRequest('/api/viajes/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Viaje>;
  },

  // Actualizar viaje
  async update(id: number, data: ViajeFormData): Promise<ApiResponse<Viaje>> {
    const response = await apiRequest(`/api/viajes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Viaje>;
  },

  // Eliminar viaje
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/viajes/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener estadísticas de viajes
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    programados: number;
    en_curso: number;
    completados: number;
    cancelados: number;
    por_ruta: Record<string, number>;
    ingresos_totales: number;
    ingresos_este_mes: number;
  }>> {
    return apiRequest('/api/viajes/estadisticas/');
  },
};

// Funciones legacy para compatibilidad (deprecated)
export async function getViajes(): Promise<Viaje[]> {
  const response = await viajesApi.list();
  if (response.success && response.data) {
    return response.data.results;
  }
  throw new Error(response.error || 'Error al obtener viajes');
}

export async function createViaje(data: {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo_id: number;
  precio: number;
}): Promise<void> {
  const formData: ViajeFormData = {
    origen: data.origen,
    destino: data.destino,
    fecha: data.fecha,
    hora: data.hora,
    vehiculo_id: data.vehiculo_id,
    precio: data.precio,
  };
  
  const response = await viajesApi.create(formData);
  if (!response.success) {
    throw new Error(response.error || 'Error al crear el viaje');
  }
}

export async function updateViaje(id: number, data: any): Promise<void> {
  const formData: ViajeFormData = {
    origen: data.origen,
    destino: data.destino,
    fecha: data.fecha,
    hora: data.hora,
    vehiculo_id: typeof data.vehiculo_id === 'string' ? parseInt(data.vehiculo_id) : data.vehiculo_id,
    precio: typeof data.precio === 'string' ? parseFloat(data.precio) : data.precio,
  };
  
  const response = await viajesApi.update(id, formData);
  if (!response.success) {
    throw new Error(response.error || 'Error al actualizar el viaje');
  }
}

export async function deleteViaje(id: number): Promise<void> {
  const response = await viajesApi.remove(id);
  if (!response.success) {
    throw new Error(response.error || 'Error al eliminar el viaje');
  }
}
