// ========================================
// TIPOS DE VIAJES
// ========================================

export interface Viaje {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo_id: number;
  vehiculo?: any; // Puede ser un objeto Vehiculo o solo el ID
  precio: number;
  estado?: string;
  asientos_disponibles?: number;
  asientos_ocupados?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ViajeFormData {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  vehiculo_id: number;
  precio: number;
  estado?: string;
  asientos_disponibles?: number;
  asientos_ocupados?: number;
}

export interface ViajeFilters {
  search?: string;
  origen?: string;
  destino?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  vehiculo_id?: number;
  estado?: string;
}

export interface ViajeOption {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: string;
}
