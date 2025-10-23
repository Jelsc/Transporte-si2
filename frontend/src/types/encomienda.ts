  export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface Encomienda {
  id: number;
  codigo_seguimiento: string;
  remitente_nombre: string;
  remitente_telefono: string;
  remitente_direccion?: string;
  destinatario_nombre: string;
  destinatario_telefono: string;
  destino_ciudad: string;
  destino_direccion: string;
  descripcion: string;
  peso: number;
  precio: number;
  notas?: string;
  estado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  fecha_creacion: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  conductor_asignado?: number;
  conductor_nombre?: string;
  creado_por?: number;
  metodo_pago: 'efectivo' | 'tarjeta';
  estado_pago: 'pendiente' | 'procesando' | 'completado' | 'fallido';
  pago_info?: any;
  

  seguimientos?: EncomiendaSeguimiento[];
  pago?: number;
  puede_ser_asignada?: boolean;
  puede_ser_entregada?: boolean;
  creado_por_nombre?: string;
  conductor_info?: {
    id?: number;
    nombre_completo?: string;
    telefono?: string;
    tipo_licencia?: string;
    nro_licencia?: string;
    estado?: string;
  };
  pago_detalle?: {
    id?: number;
    monto?: string;
    estado?: string;
    metodo_pago?: string;
    fecha_creacion?: string;
  };
}

export interface EncomiendaFilters {
  estado?: string;
  destino_ciudad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  conductor_asignado?: number;
  codigo_seguimiento?: string;
}

export interface CreateEncomiendaRequest {
  remitente_nombre: string;
  remitente_telefono: string;
  remitente_direccion?: string;
  destinatario_nombre: string;
  destinatario_telefono: string;
  destino_ciudad: string;
  destino_direccion: string;
  descripcion: string;
  peso: number;
  precio?: number; 
  notas?: string;
  metodo_pago: 'efectivo' | 'tarjeta'; 
}

export interface UpdateEncomiendaRequest {
  remitente_nombre?: string;
  remitente_telefono?: string;
  remitente_direccion?: string;
  destinatario_nombre?: string;
  destinatario_telefono?: string;
  destino_ciudad?: string;
  destino_direccion?: string;
  descripcion?: string;
  peso?: number;
  precio?: number;
  notas?: string;
  estado?: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  conductor_asignado?: number;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  metodo_pago?: 'efectivo' | 'tarjeta';
  estado_pago?: 'pendiente' | 'procesando' | 'completado' | 'fallido';
}

export interface EncomiendaStats {
  total: number;
  pendientes: number;
  en_ruta: number;
  entregados: number;
  cancelados: number;
  ingresos_totales: number;
}

export interface EncomiendaSeguimiento {
  id: number;
  encomienda: number;
  evento: string;
  descripcion: string;
  ubicacion?: string;
  fecha: string;
}

// ✅ INTERFACES PARA PAGOS ACTUALIZADAS
export interface StripePaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  monto: number;
  estado: string;
  success?: boolean;
  message?: string;
  pago_id?: number;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
}

// ✅ INTERFACES PARA ASIGNACIÓN Y ESTADOS
export interface AsignarConductorRequest {
  conductor_id: number;
}

export interface ActualizarEstadoRequest {
  estado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  notas?: string;
  ubicacion?: string;
  fecha_entrega_real?: string;
}

// ✅ INTERFACE PARA CONDUCTORES 
export interface ConductorOption {
  id: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  nro_licencia: string;
  tipo_licencia: string;
  estado: 'disponible' | 'ocupado' | 'descanso' | 'inactivo';
}