// src/types/reservas.ts - VERSIÓN ACTUALIZADA
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

export interface ViajeOption {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: string;
  vehiculo?: {
    id: number;
    nombre: string;
    placa: string;
  };
}

export interface Asiento {
  id: number;
  numero: string;
  estado: string;
  viaje: ViajeOption | number;
}

// ✅ NUEVA INTERFACE PARA ITEM_RESERVA
export interface ItemReserva {
  id: number;
  asiento: Asiento;
  precio: number;
}

// ✅ INTERFACE DE RESERVA ACTUALIZADA
export interface Reserva {
  id: number;
  codigo_reserva: string;
  cliente: Cliente | number;
  fecha_reserva: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'pagada';
  total: number;
  pagado: boolean;
  items: ItemReserva[];  // ✅ Múltiples asientos
}

// ✅ NUEVA INTERFACE PARA CREAR RESERVA
export interface ReservaFormData {
  cliente: number | null;
  asientos_ids: number[];  // ✅ Ahora es un array de IDs de asientos
  pagado: boolean;
}

// ✅ INTERFACE PARA ACTUALIZAR RESERVA
export interface ReservaUpdateData {
  estado?: string;
  pagado?: boolean;
}

// ✅ NUEVA INTERFACE PARA FILTROS ACTUALIZADA
export interface ReservaFilters {
  search?: string;
  cliente?: string;
  pagado?: boolean;
  viaje?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;  // ✅ Nuevo filtro por estado
  codigo_reserva?: string;  // ✅ Nuevo filtro por código
}

// ✅ INTERFACE PARA RESPUESTA PAGINADA
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ✅ TIPOS PARA ESTADÍSTICAS MEJORADAS
export interface ReservaStats {
  total_reservas: number;
  total_asientos_reservados: number;
  ingresos_totales: number;
  reservas_pagadas: number;
  reservas_pendientes: number;
  reservas_confirmadas: number;
  reservas_canceladas: number;
}