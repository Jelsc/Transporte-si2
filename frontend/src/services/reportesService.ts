import { api } from "@/lib/api";

export interface ReporteGenerado {
  id: number;
  titulo: string;
  tipo: 'pdf' | 'excel' | 'imagen';
  tipo_display: string;
  categoria: string;
  categoria_display: string;
  archivo: string | null;
  archivo_url: string | null;
  parametros: Record<string, any>;
  usuario: number;
  usuario_nombre: string;
  fecha_generacion: string;
  tamaño_archivo: number | null;
  tiempo_generacion: number | null;
}

export interface GenerarReporteRequest {
  tipo: 'pdf' | 'excel' | 'imagen';
  categoria: 'viajes' | 'encomiendas' | 'conductores' | 'vehiculos' | 'financiero' | 'general';
  titulo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  filtros?: Record<string, any>;
}

export interface TipoReporte {
  value: string;
  label: string;
}

export interface TiposDisponibles {
  categorias: TipoReporte[];
  formatos: TipoReporte[];
}

export interface EstadisticasReportes {
  total_reportes: number;
  reportes_mes: number;
  por_tipo: {
    pdf: number;
    excel: number;
    imagen: number;
  };
  por_categoria: {
    viajes: number;
    encomiendas: number;
    conductores: number;
    vehiculos: number;
    financiero: number;
    general: number;
  };
}

class ReportesService {
  private baseUrl = '/api/reportes';

  /**
   * Listar todos los reportes generados
   */
  async listar(params?: {
    categoria?: string;
    tipo?: string;
    fecha_desde?: string;
  }): Promise<ReporteGenerado[]> {
    const queryParams = new URLSearchParams();
    if (params?.categoria) queryParams.append('categoria', params.categoria);
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);

    const url = queryParams.toString() 
      ? `${this.baseUrl}/?${queryParams.toString()}`
      : `${this.baseUrl}/`;

    const response = await api.get<ReporteGenerado[]>(url);
    return response.data;
  }

  /**
   * Obtener tipos de reportes disponibles
   */
  async obtenerTiposDisponibles(): Promise<TiposDisponibles> {
    const response = await api.get<TiposDisponibles>(`${this.baseUrl}/tipos_disponibles/`);
    return response.data;
  }

  /**
   * Obtener estadísticas de reportes
   */
  async obtenerEstadisticas(): Promise<EstadisticasReportes> {
    const response = await api.get<EstadisticasReportes>(`${this.baseUrl}/estadisticas/`);
    return response.data;
  }

  /**
   * Generar un nuevo reporte y descargarlo
   */
  async generar(data: GenerarReporteRequest): Promise<Blob> {
    const response = await api.post(`${this.baseUrl}/generar/`, data, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Descargar un reporte generado
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Obtener el nombre de archivo según el tipo y categoría
   */
  getNombreArchivo(tipo: string, categoria: string, titulo?: string): string {
    const fecha = new Date().toISOString().split('T')[0];
    const nombre = titulo || `reporte_${categoria}`;
    const extension = tipo === 'pdf' ? 'pdf' : tipo === 'excel' ? 'xlsx' : 'png';
    return `${nombre}_${fecha}.${extension}`;
  }
}

export const reportesService = new ReportesService();
export default reportesService;
