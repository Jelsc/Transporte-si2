
import { apiRequest } from './authService';
import type { 
  Vehiculo, 
  VehiculoFormData, 
  VehiculoFilters, 
  PaginatedResponse, 
  ApiResponse 
} from '@/types';

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: VehiculoFormData) => ({
  nombre: data.nombre,
  tipo_vehiculo: data.tipo_vehiculo,
  placa: data.placa,
  marca: data.marca,
  modelo: data.modelo || '',
  año_fabricacion: data.año_fabricacion || null,
  capacidad_pasajeros: data.capacidad_pasajeros,
  capacidad_carga: data.capacidad_carga,
  estado: data.estado,
  conductor_id: data.conductor || null,
  kilometraje: data.kilometraje || null,
});

const fromDTO = (data: any): Vehiculo => ({
  id: data.id,
  nombre: data.nombre,
  tipo_vehiculo: data.tipo_vehiculo,
  placa: data.placa,
  marca: data.marca,
  modelo: data.modelo,
  año_fabricacion: data.año_fabricacion,
  conductor: data.conductor,
  capacidad_pasajeros: data.capacidad_pasajeros,
  capacidad_carga: data.capacidad_carga,
  estado: data.estado,
  kilometraje: data.kilometraje,
  ultimo_mantenimiento: data.ultimo_mantenimiento,
  proximo_mantenimiento: data.proximo_mantenimiento,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

export const vehiculosApi = {
  // Listar vehículos con filtros y paginación
  async list(filters?: VehiculoFilters): Promise<ApiResponse<PaginatedResponse<Vehiculo>>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tipo_vehiculo) params.append('tipo_vehiculo', filters.tipo_vehiculo);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.marca) params.append('marca', filters.marca);
    if (filters?.conductor_id) params.append('conductor_id', filters.conductor_id.toString());
    
    const query = params.toString();
    const response = await apiRequest(`/api/vehiculos/${query ? `?${query}` : ''}`);
    
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
    
    return response as ApiResponse<PaginatedResponse<Vehiculo>>;
  },

  // Obtener vehículo por ID
  async get(id: number): Promise<ApiResponse<Vehiculo>> {
    const response = await apiRequest(`/api/vehiculos/${id}/`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Vehiculo>;
  },

  // Crear nuevo vehículo
  async create(data: VehiculoFormData): Promise<ApiResponse<Vehiculo>> {
    const response = await apiRequest('/api/vehiculos/', {
      method: 'POST',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Vehiculo>;
  },

  // Actualizar vehículo
  async update(id: number, data: VehiculoFormData): Promise<ApiResponse<Vehiculo>> {
    const response = await apiRequest(`/api/vehiculos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(toDTO(data)),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: fromDTO(response.data),
      };
    }
    
    return response as ApiResponse<Vehiculo>;
  },

  // Eliminar vehículo
  async remove(id: number): Promise<ApiResponse> {
    return apiRequest(`/api/vehiculos/${id}/`, {
      method: 'DELETE',
    });
  },

  // Obtener estadísticas de vehículos
  async getStatistics(): Promise<ApiResponse<{
    total: number;
    activos: number;
    mantenimiento: number;
    baja: number;
    por_tipo: Record<string, number>;
    por_marca: Record<string, number>;
    con_conductor: number;
    sin_conductor: number;
  }>> {
    return apiRequest('/api/vehiculos/estadisticas/');
  },
};

// Funciones legacy para compatibilidad (deprecated)
export async function getVehiculos(): Promise<Vehiculo[]> {
  const response = await vehiculosApi.list();
  if (response.success && response.data) {
    return response.data.results;
  }
  throw new Error(response.error || 'Error al obtener vehículos');
}

export async function createVehiculo(data: Partial<Vehiculo>): Promise<void> {
  // Convertir datos legacy al formato nuevo
  const formData: VehiculoFormData = {
    nombre: data.nombre || '',
    tipo_vehiculo: data.tipo_vehiculo || '',
    placa: data.placa || '',
    marca: data.marca || '',
    modelo: data.modelo || '',
    año_fabricacion: data.año_fabricacion || null,
    capacidad_pasajeros: data.capacidad_pasajeros || 0,
    capacidad_carga: data.capacidad_carga || 0,
    estado: (data.estado as any) || 'activo',
    conductor: typeof data.conductor === 'number' ? data.conductor : null,
    kilometraje: data.kilometraje || undefined,
  };
  
  const response = await vehiculosApi.create(formData);
  if (!response.success) {
    throw new Error(response.error || 'Error al crear vehículo');
  }
}

export async function updateVehiculo(id: number, data: Partial<Vehiculo>): Promise<void> {
  // Convertir datos legacy al formato nuevo
  const formData: VehiculoFormData = {
    nombre: data.nombre || '',
    tipo_vehiculo: data.tipo_vehiculo || '',
    placa: data.placa || '',
    marca: data.marca || '',
    modelo: data.modelo || '',
    año_fabricacion: data.año_fabricacion || null,
    capacidad_pasajeros: data.capacidad_pasajeros || 0,
    capacidad_carga: data.capacidad_carga || 0,
    estado: (data.estado as any) || 'activo',
    conductor: typeof data.conductor === 'number' ? data.conductor : null,
    kilometraje: data.kilometraje || undefined,
  };
  
  const response = await vehiculosApi.update(id, formData);
  if (!response.success) {
    throw new Error(response.error || 'Error al actualizar vehículo');
  }
}

export async function deleteVehiculo(id: number): Promise<void> {
  const response = await vehiculosApi.remove(id);
  if (!response.success) {
    throw new Error(response.error || 'Error al eliminar vehículo');
  }
}
