// tipos/rutas-optimizadas.ts
// Generado automáticamente desde modelos Django
// Compatible con MapaRutasOptimizadas.tsx

import type { Ubicacion } from './ubicaciones';
import type { Vehiculo } from './vehiculo';

export interface Parada {
  id: number;
  orden: number;
  ubicacion: number | Ubicacion; // Puede ser ID o objeto completo
  ubicacion_detalle?: Ubicacion; // Objeto completo de ubicación
  entrega?: number; // ID de la entrega asociada
  entrega_detalle?: Entrega; // Objeto completo de la entrega
  es_depot: boolean;
  tiempo_llegada_estimado?: string;
  tiempo_salida_estimado?: string;
  tiempo_servicio_min?: number;
  distancia_desde_anterior_km?: number;
  completada?: boolean;
  hora_llegada_real?: string;
  hora_salida_real?: string;
  observaciones?: string;
}

export interface RutaOptimizada {
  id: number;
  vehiculo: number | Vehiculo; // Puede ser ID o objeto completo
  vehiculo_detalle?: Vehiculo; // Objeto completo del vehículo
  numero_ruta: number;
  distancia_total_km: number;
  tiempo_total_min: number;
  carga_total_kg?: number;
  numero_paradas: number;
  paradas: Parada[];
  hora_inicio?: string;
  hora_fin_estimada?: string;
  completada?: boolean;
  costo_estimado?: number;
  utilizacion_capacidad?: number;
  estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
}

export interface Entrega {
  id: number;
  ubicacion: Ubicacion;
  tipo: 'pickup' | 'delivery' | 'both';
  demanda_peso?: number;
  demanda_volumen?: number;
  tiempo_servicio_min?: number;
  prioridad?: number;
  ventana_tiempo_inicio?: string;
  ventana_tiempo_fin?: string;
}

export interface SolicitudRuta {
  id: number;
  fecha_viaje: string;
  hora_inicio: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'cancelado';
  depot?: Ubicacion;
  entregas: Entrega[];
  rutas_optimizadas: RutaOptimizada[];
  vehiculos_disponibles?: Vehiculo[];
  mensaje_resultado?: string;
  fecha_creacion: string;
}
