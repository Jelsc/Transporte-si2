// ========================================
// TIPOS DE VEHÍCULOS
// ========================================

export interface Vehiculo {
  id: number;
  nombre: string;
  tipo_vehiculo: string;
  placa: string;
  marca: string;
  modelo: string;
  año_fabricacion: number | null;
  capacidad_pasajeros: number;
  capacidad_carga: number;
  estado: 'activo' | 'mantenimiento' | 'baja';
  conductor: number | any | null;
  kilometraje?: number;
  ultimo_mantenimiento?: string;
  proximo_mantenimiento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehiculoFormData {
  nombre: string;
  tipo_vehiculo: string;
  placa: string;
  marca: string;
  modelo?: string;
  año_fabricacion?: number | null;
  capacidad_pasajeros: number;
  capacidad_carga: number;
  estado: 'activo' | 'mantenimiento' | 'baja';
  conductor?: number | null;
  kilometraje?: number | undefined;
}

export interface VehiculoFilters {
  search?: string;
  tipo_vehiculo?: string;
  estado?: string;
  marca?: string;
  conductor_id?: number;
}

export interface VehiculoOption {
  id: number;
  nombre: string;
  placa: string;
  tipo_vehiculo: string;
  estado: string;
}

// Importar ConductorOption del módulo de conductores
export type { ConductorOption } from './conductor';
