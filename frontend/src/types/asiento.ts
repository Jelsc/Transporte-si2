// types/asiento.ts
export interface Asiento {
  id: number;
  numero: string;
  estado: 'libre' | 'ocupado' | 'reservado'; // ✅ Estados específicos
  viaje: number; // ID del viaje (consistente con backend)
  reserva_temporal?: number | null; // ✅ NUEVO: Para reservas temporales
}

// ✅ Enums para mejor tipado
export enum EstadoAsiento {
  LIBRE = 'libre',
  OCUPADO = 'ocupado',
  RESERVADO = 'reservado'
}

// ✅ Interface para UI del modal de asientos
export interface AsientoConEstado extends Asiento {
  seleccionado?: boolean; // Para selección en el modal
}

// ✅ Interface para respuesta de API
export interface AsientoResponse {
  success: boolean;
  data?: Asiento[];
  error?: string;
}