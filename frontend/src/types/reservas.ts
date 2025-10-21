// types/reservas.ts - VERSIÓN ACTUALIZADA CON SISTEMA TEMPORAL
import type { Asiento } from './asiento';

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

// ✅ NUEVA INTERFACE PARA ITEM_RESERVA ACTUALIZADA
export interface ItemReserva {
  id: number;
  asiento: Asiento; // ✅ Usa la interfaz de asiento.ts
  precio: number;
}

// ✅ INTERFACE DE RESERVA ACTUALIZADA CON SISTEMA TEMPORAL
export interface Reserva {
  id: number;
  codigo_reserva: string;
  cliente: Cliente | number;
  viaje?: number | ViajeOption; // ✅ NUEVO: Relación con viaje
  fecha_reserva: string;
  fecha_expiracion?: string; // ✅ NUEVO: Para reservas temporales
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada' | 'expirada' | 'pagada'; // ✅ ACTUALIZADO
  total: number;
  pagado: boolean;
  items: ItemReserva[];
  tiempo_restante?: number; // ✅ NUEVO: Para el timer frontend
  esta_expirada?: boolean; // ✅ NUEVO: Computado frontend
}

// ✅ NUEVA INTERFACE PARA CREAR RESERVA TEMPORAL
export interface ReservaTemporalPayload {
  viaje_id: number;
  asientos_ids: number[];
  monto_total: number;
}

// ✅ INTERFACE PARA CREAR RESERVA (mantener compatibilidad)
export interface ReservaFormData {
  cliente: number | null;
  asientos_ids: number[];
  pagado: boolean;
  viaje_id?: number; // ✅ NUEVO: Opcional para compatibilidad
}

// ✅ INTERFACE PARA ACTUALIZAR RESERVA
export interface ReservaUpdateData {
  estado?: string;
  pagado?: boolean;
}

// ✅ NUEVA INTERFACE PARA RESPUESTA DE RESERVA TEMPORAL
export interface ReservaTemporalResponse {
  success: boolean;
  data?: Reserva;
  expiracion?: string;
  tiempo_restante?: number;
  error?: string;
  message?: string;
}

// ✅ INTERFACE PARA FILTROS ACTUALIZADA
export interface ReservaFilters {
  search?: string;
  cliente?: string;
  pagado?: boolean;
  viaje?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  codigo_reserva?: string;
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
  reservas_expiradas?: number; // ✅ NUEVO
}