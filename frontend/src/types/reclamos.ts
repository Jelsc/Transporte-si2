// types/reclamos.ts
export interface ReclamoType {
  id: number;
  numero_reclamo: string;
  titulo: string;
  descripcion: string;
  categoria: number;
  categoria_nombre: string;
  usuario: number;
  usuario_nombre: string;
  agente?: number;
  agente_nombre?: string;
  numero_guia?: string;
  servicio_relacionado?: string;
  estado: 'abierto' | 'en_proceso' | 'cerrado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fecha_creacion: string;
  fecha_cierre?: string;
  detalles: ReclamoDetalleType[];
  adjuntos: ReclamoAdjuntoType[];
}

export interface ReclamoDetalleType {
  id: number;
  autor: number;
  autor_nombre: string;
  mensaje: string;
  fecha: string;
}

export interface ReclamoAdjuntoType {
  id: number;
  nombre_archivo: string;
  archivo: string;
  tipo_archivo: string;
  url_archivo: string;
  fecha_subida: string;
}

export interface ReclamoCategoriaType {
  id: number;
  nombre: string;
}

export interface ReclamoCreateData {
  titulo: string;
  descripcion: string;
  categoria: number;
  numero_guia?: string;
  servicio_relacionado?: string;
}