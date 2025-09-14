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
    apiRequest<Vehiculo[]>("/vehiculos/"),

  createVehiculo: (data: Vehiculo): Promise<ApiResponse<Vehiculo>> =>
    apiRequest<Vehiculo>("/vehiculos/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateVehiculo: (id: number, data: Vehiculo): Promise<ApiResponse<Vehiculo>> =>
    apiRequest<Vehiculo>(`/vehiculos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteVehiculo: (id: number): Promise<ApiResponse<void>> =>
    apiRequest<void>(`/vehiculos/${id}/`, { method: "DELETE" }),
};
