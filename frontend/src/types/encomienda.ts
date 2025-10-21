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
  estado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  fecha_creacion: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  conductor_asignado?: number;
  conductor_nombre?: string;
  notas?: string;
  creado_por?: number;
  
  // NUEVOS CAMPOS PARA PAGOS
  pago_info?: {
    id: number;
    monto: string;
    estado: string;
    metodo_pago: string;
    fecha_creacion: string;
    stripe_payment_intent_id?: string;
  };
  estado_pago?: string;
  metodo_pago?: string;
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
  notas?: string;
  metodo_pago: 'stripe' | 'efectivo' | 'transferencia'; // NUEVO CAMPO
}

export interface UpdateEncomiendaRequest {
  estado?: string;
  conductor_asignado?: number;
  fecha_entrega_real?: string;
  notas?: string;
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
  encomienda_id: number;
  evento: string;
  descripcion: string;
  fecha: string;
  ubicacion?: string;
  usuario?: string;
}

// NUEVAS INTERFACES PARA PAGOS
export interface StripePaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  monto: number;
  encomienda_id: number;
}

export interface ConfirmPaymentRequest {
  payment_intent_id: string;
}