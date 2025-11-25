import { apiRequest } from "./authService";
import type {
  Viaje,
  ViajeFormData,
  ViajeFilters,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// Mappers para convertir entre formatos del frontend y backend
const toDTO = (data: ViajeFormData) => ({
  origen_id: data.origen_id,
  destino_id: data.destino_id,
  fecha: data.fecha,
  hora: data.hora,
  vehiculo_id: data.vehiculo_id,
  precio: data.precio,
  estado: data.estado || "programado",
  asientos_disponibles: data.asientos_disponibles || 0,
  asientos_ocupados: data.asientos_ocupados || 0,
});

const fromDTO = (data: any): Viaje => ({
  id: data.id,
  // Mantener compatibilidad con código legacy
  origen: data.origen_detalle?.nombre || data.origen || "",
  destino: data.destino_detalle?.nombre || data.destino || "",
  // Datos detallados de ubicaciones
  origen_detalle: data.origen_detalle,
  destino_detalle: data.destino_detalle,
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
  async list(
    filters?: ViajeFilters
  ): Promise<ApiResponse<PaginatedResponse<Viaje>>> {
    const params = new URLSearchParams();

    // Construir términos de búsqueda combinando search, origen y destino
    // El backend busca por nombre en origen__nombre y destino__nombre usando search
    const searchTerms: string[] = [];

    if (filters?.search) {
      searchTerms.push(filters.search);
    }

    // Si origen/destino son números (IDs), usar filtro directo
    // Si son strings (nombres), agregar a search
    if (filters?.origen) {
      const origenIsId = /^\d+$/.test(filters.origen.toString());
      if (origenIsId) {
        params.append("origen", filters.origen.toString());
      } else {
        searchTerms.push(filters.origen.toString());
      }
    }

    if (filters?.destino) {
      const destinoIsId = /^\d+$/.test(filters.destino.toString());
      if (destinoIsId) {
        params.append("destino", filters.destino.toString());
      } else {
        searchTerms.push(filters.destino.toString());
      }
    }

    // Si hay términos de búsqueda, combinarlos
    if (searchTerms.length > 0) {
      params.append("search", searchTerms.join(" "));
    }

    // Otros filtros (usar nombres correctos según filterset_fields del backend)
    if (filters?.fecha_desde) params.append("fecha__gte", filters.fecha_desde);
    if (filters?.fecha_hasta) params.append("fecha__lte", filters.fecha_hasta);
    if (filters?.vehiculo_id)
      params.append("vehiculo", filters.vehiculo_id.toString());
    if (filters?.estado) params.append("estado", filters.estado);

    const query = params.toString();
    const response = await apiRequest(
      `/api/viajes/${query ? `?${query}` : ""}`
    );

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
    const dto = toDTO(data);
    console.log("📤 Enviando datos al backend:", dto);

    const response = await apiRequest("/api/viajes/", {
      method: "POST",
      body: JSON.stringify(dto),
    });

    console.log("📥 Respuesta del backend:", response);

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
      method: "PUT",
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
      method: "DELETE",
    });
  },

  // Obtener estadísticas de viajes
  async getStatistics(): Promise<
    ApiResponse<{
      total: number;
      programados: number;
      en_curso: number;
      completados: number;
      cancelados: number;
      por_ruta: Record<string, number>;
      ingresos_totales: number;
      ingresos_este_mes: number;
    }>
  > {
    return apiRequest("/api/viajes/estadisticas/");
  },
};

// Funciones legacy para compatibilidad (deprecated)
export async function getViajes(): Promise<Viaje[]> {
  const response = await viajesApi.list();
  if (response.success && response.data) {
    return response.data.results;
  }
  throw new Error(response.error || "Error al obtener viajes");
}

export async function createViaje(data: {
  origen_id: number;
  destino_id: number;
  fecha: string;
  hora: string;
  vehiculo_id: number;
  precio: number;
}): Promise<void> {
  const formData: ViajeFormData = {
    origen_id: data.origen_id,
    destino_id: data.destino_id,
    fecha: data.fecha,
    hora: data.hora,
    vehiculo_id: data.vehiculo_id,
    precio: data.precio,
  };

  const response = await viajesApi.create(formData);
  if (!response.success) {
    throw new Error(response.error || "Error al crear el viaje");
  }
}

export async function updateViaje(id: number, data: any): Promise<void> {
  const formData: ViajeFormData = {
    origen_id: data.origen_id,
    destino_id: data.destino_id,
    fecha: data.fecha,
    hora: data.hora,
    vehiculo_id:
      typeof data.vehiculo_id === "string"
        ? parseInt(data.vehiculo_id)
        : data.vehiculo_id,
    precio:
      typeof data.precio === "string" ? parseFloat(data.precio) : data.precio,
  };

  const response = await viajesApi.update(id, formData);
  if (!response.success) {
    throw new Error(response.error || "Error al actualizar el viaje");
  }
}

export async function deleteViaje(id: number): Promise<void> {
  const response = await viajesApi.remove(id);
  if (!response.success) {
    throw new Error(response.error || "Error al eliminar el viaje");
  }
}
