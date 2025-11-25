// services/reclamosService.ts
import { api } from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { 
  ReclamoType, 
  ReclamoDetalleType, 
  ReclamoAdjuntoType, 
  ReclamoCategoriaType, 
  ReclamoCreateData 
} from '../types/reclamos';

// Interfaces para filtros y operaciones específicas
export interface ReclamoFilters {
  estado?: string;
 categoria?: number|string;
  prioridad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  usuario?: number;
}

export interface ReclamoUpdateData {
  estado?: string;
  prioridad?: string;
  agente?: number;
}

// Servicio principal de reclamos usando tu instancia de api
export const reclamosService = {
  // ========================================
  // OPERACIONES CRUD BÁSICAS
  // ========================================

  /**
   * Obtener todos los reclamos con filtros opcionales
   */
  async getReclamos(filters?: ReclamoFilters): Promise<AxiosResponse<ReclamoType[]>> {
    // 
    return api.get<ReclamoType[]>('/api/reclamos/reclamos/', { params: filters });
  },

  /**
   * Obtener un reclamo específico por ID
   */
  async getReclamo(id: number): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.get<ReclamoType>(`/api/reclamos/reclamos/${id}/`);
  },

  /**
   * Crear un nuevo reclamo
   */
  async createReclamo(data: ReclamoCreateData): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.post<ReclamoType>('/api/reclamos/reclamos/', data);
  },

  /**
   * Crear reclamo con archivos adjuntos
   */
  async createReclamoWithFiles(formData: FormData): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.post<ReclamoType>('/api/reclamos/reclamos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Actualizar reclamo existente
   */
  async updateReclamo(id: number, data: ReclamoUpdateData): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.patch<ReclamoType>(`/api/reclamos/reclamos/${id}/`, data);
  },

  // ========================================
  // GESTIÓN DE ESTADOS Y ASIGNACIONES
  // ========================================

  /**
   * Cambiar estado de un reclamo
   */
  async cambiarEstado(id: number, estado: string): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.post<ReclamoType>(`/api/reclamos/reclamos/${id}/cambiar_estado/`, { estado });
  },

  /**
   * Asignar agente a un reclamo
   */
  async asignarAgente(id: number, agente_id: number): Promise<AxiosResponse<ReclamoType>> {
    // 
    return api.post<ReclamoType>(`/api/reclamos/reclamos/${id}/asignar_agente/`, { agente_id });
  },

  // ========================================
  // GESTIÓN DE COMENTARIOS E HISTORIAL
  // ========================================

  /**
   * Agregar comentario a un reclamo
   */
  async agregarComentario(id: number, mensaje: string): Promise<AxiosResponse<ReclamoDetalleType>> {
    // 
    return api.post<ReclamoDetalleType>(`/api/reclamos/reclamos/${id}/agregar_comentario/`, { mensaje });
  },

  /**
   * Obtener historial de un reclamo
   */
  async getHistorial(reclamoId: number): Promise<AxiosResponse<ReclamoDetalleType[]>> {
    // 
    return api.get<ReclamoDetalleType[]>(`/api/reclamos/reclamos/${reclamoId}/detalles/`);
  },

  // ========================================
  // GESTIÓN DE ARCHIVOS ADJUNTOS
  // ========================================

  /**
   * Subir archivos adjuntos a un reclamo existente
   */
  async subirAdjuntos(reclamoId: number, formData: FormData): Promise<AxiosResponse<ReclamoAdjuntoType[]>> {
    //
    return api.post<ReclamoAdjuntoType[]>(`/api/reclamos/reclamos/${reclamoId}/subir_adjuntos/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Eliminar archivo adjunto
   */
  async eliminarAdjunto(reclamoId: number, adjuntoId: number): Promise<AxiosResponse<void>> {
    // 
    return api.delete(`/api/reclamos/reclamos/${reclamoId}/eliminar_adjunto/`, {
      data: { adjunto_id: adjuntoId }
    });
  },

  // ========================================
  // CATEGORÍAS Y DATOS MAESTROS
  // ========================================

  /**
   * Obtener todas las categorías de reclamos
   */
  async getCategorias(): Promise<AxiosResponse<ReclamoCategoriaType[]>> {
    // 
    return api.get<ReclamoCategoriaType[]>('/api/reclamos/categorias/');
  },

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Validar número de guía
   */
  validarNumeroGuia(numeroGuia: string): boolean {
    const regex = /^(BOL|GUI|ENC)-\d{4,8}$/i;
    return regex.test(numeroGuia);
  },

  /**
   * Formatear número de reclamo
   */
  formatearNumeroReclamo(id: number): string {
    return `REC-${id.toString().padStart(4, '0')}`;
  },

  /**
   * Obtener color para estado (para clases CSS de Tailwind)
   */
  getColorEstado(estado: string): { bg: string; text: string; border: string } {
    const colores = {
      abierto: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      en_proceso: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      cerrado: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };
    return colores[estado as keyof typeof colores] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  },

  /**
   * Obtener color para prioridad (para clases CSS de Tailwind)
   */
  getColorPrioridad(prioridad: string): string {
    const colores: Record<string, string> = {
      baja: 'text-gray-600',
      media: 'text-blue-600',
      alta: 'text-orange-600',
      urgente: 'text-red-600'
    };
    return colores[prioridad] || 'text-gray-600';
  },

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: string, incluirHora: boolean = false): string {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    if (incluirHora) {
      opciones.hour = '2-digit';
      opciones.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-ES', opciones);
  }
};