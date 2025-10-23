import axios from 'axios';
import type {
  Ubicacion,
  UbicacionCreate,
  UbicacionUpdate,
  UbicacionListResponse,
  UbicacionFilters,
  GeocodeRequest,
  GeocodeResponse
} from '../types';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configurar axios con interceptores para autenticación
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/ubicaciones`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export class UbicacionesService {
  /**
   * Listar ubicaciones con filtros y paginación
   */
  static async listarUbicaciones(filters: UbicacionFilters = {}): Promise<UbicacionListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.activo !== undefined) params.append('activo', filters.activo.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const response = await apiClient.get<UbicacionListResponse>('/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al listar ubicaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener una ubicación por ID
   */
  static async obtenerUbicacion(id: number): Promise<Ubicacion> {
    try {
      const response = await apiClient.get<Ubicacion>(`/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener ubicación ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva ubicación
   */
  static async crearUbicacion(ubicacion: UbicacionCreate): Promise<Ubicacion> {
    try {
      console.log('🚀 Enviando ubicación al backend:', ubicacion);
      const response = await apiClient.post<Ubicacion>('/', ubicacion);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al crear ubicación:', error);
      if (error.response) {
        console.error('📋 Detalles del error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }

  /**
   * Actualizar una ubicación (PUT - actualización completa)
   */
  static async actualizarUbicacion(id: number, ubicacion: UbicacionCreate): Promise<Ubicacion> {
    try {
      const response = await apiClient.put<Ubicacion>(`/${id}/`, ubicacion);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar ubicación ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar una ubicación (PATCH - actualización parcial)
   */
  static async actualizarUbicacionParcial(id: number, ubicacion: UbicacionUpdate): Promise<Ubicacion> {
    try {
      const response = await apiClient.patch<Ubicacion>(`/${id}/`, ubicacion);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar ubicación ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una ubicación
   */
  static async eliminarUbicacion(id: number): Promise<void> {
    try {
      await apiClient.delete(`/${id}/`);
    } catch (error) {
      console.error(`Error al eliminar ubicación ${id}:`, error);
      throw error;
    }
  }

  /**
   * Geocodificar una dirección
   */
  static async geocodificar(direccion: GeocodeRequest): Promise<GeocodeResponse> {
    try {
      const response = await apiClient.post<GeocodeResponse>('/geocode/', direccion);
      return response.data;
    } catch (error) {
      console.error('Error al geocodificar dirección:', error);
      throw error;
    }
  }

  /**
   * Buscar ubicaciones cercanas a unas coordenadas
   * (Función auxiliar que filtra en el frontend)
   */
  static async buscarUbicacionesCercanas(
    lat: number, 
    lng: number, 
    radioKm: number = 10
  ): Promise<Ubicacion[]> {
    try {
      // Obtener todas las ubicaciones activas
      const response = await this.listarUbicaciones({ activo: true });
      
      // Filtrar por distancia (aproximada)
      const ubicacionesCercanas = response.results.filter(ubicacion => {
        const distancia = this.calcularDistancia(
          lat, lng, 
          Number(ubicacion.lat), Number(ubicacion.lng)
        );
        return distancia <= radioKm;
      });

      return ubicacionesCercanas;
    } catch (error) {
      console.error('Error al buscar ubicaciones cercanas:', error);
      throw error;
    }
  }

  /**
   * Calcular distancia entre dos puntos geográficos (fórmula de Haversine)
   */
  private static calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLng = this.gradosARadianes(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.gradosARadianes(lat1)) * Math.cos(this.gradosARadianes(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    
    return distancia;
  }

  /**
   * Convertir grados a radianes
   */
  private static gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }

  /**
   * Validar coordenadas
   */
  static validarCoordenadas(lat: number, lng: number): boolean {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  /**
   * Formatear coordenadas para mostrar
   */
  static formatearCoordenadas(lat: number | string, lng: number | string, precision: number = 6): string {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    return `${latNum.toFixed(precision)}, ${lngNum.toFixed(precision)}`;
  }

  /**
   * Obtener URL de mapa estático
   */
  static obtenerURLMapaEstatico(lat: number, lng: number, zoom: number = 15): string {
    // Usar OpenStreetMap para mapa estático
    return `https://tile.openstreetmap.org/${zoom}/${Math.floor((lng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;
  }
}

export default UbicacionesService;
