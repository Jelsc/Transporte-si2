import { apiRequest } from "@/services/api";
import type { ApiResponse } from "@/services/api";

export interface Vehiculo {
   id?: number;
  placa: string;
  modelo: string;
  anio: number;
  capacidad_pasajeros: number;
  capacidad_carga: number;
  vin: string;
  seguro_vigente: boolean;
  estado: "Disponible" | "En mantenimiento" | "Fuera de servicio";
  }
  
 export const vehiculoService = {
  getVehiculos: (): Promise<ApiResponse<Vehiculo[]>> =>
    apiRequest<Vehiculo[]>("/api/flotas/vehiculos/"),

  createVehiculo: (data: Vehiculo): Promise<ApiResponse<Vehiculo>> =>
    apiRequest<Vehiculo>("/api/flotas/vehiculos/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateVehiculo: (id: number, data: Vehiculo): Promise<ApiResponse<Vehiculo>> =>
    apiRequest<Vehiculo>(`/api/flotas/vehiculos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteVehiculo: (id: number): Promise<ApiResponse<void>> =>
    apiRequest<void>(`/api/flotas/vehiculos/${id}/`, { method: "DELETE" }),
};
