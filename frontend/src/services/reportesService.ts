import { api } from "@/lib/api";
import { apiRequest } from "./authService";
import { getApiBaseUrl } from "@/lib/api";

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

// Interfaces para reportes inteligentes
export interface ParametrosReporte {
  tipo: string;
  formato: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  agrupacion: string[];
  filtros: Record<string, any>;
  campos: string[];
  raw_prompt: string;
}

export interface DatosReporte {
  datos: Record<string, any>[];
  columnas: string[];
  titulo: string;
  subtitulo: string;
  total_registros: number;
  parametros: ParametrosReporte;
}

export interface RespuestaMultiReporte {
  reportes: DatosReporte[];
  cantidad_reportes: number;
}

export interface InterpretacionReporte {
  parametros: ParametrosReporte;
  interpretacion: string[];
  prompt_original: string;
}

export interface ArchivoDescarga {
  blob: Blob;
  filename: string;
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

  /**
   * Generar un reporte desde un prompt de texto (REPORTES INTELIGENTES)
   */
  async generarReporte(prompt: string, formato?: 'pantalla' | 'pdf' | 'excel'): Promise<DatosReporte | RespuestaMultiReporte | ArchivoDescarga> {
    const body: any = { prompt };
    if (formato) {
      body.formato = formato;
    }

    // Si es PDF o Excel, retornar Blob con metadata
    if (formato === 'pdf' || formato === 'excel') {
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/reportes/generar-inteligente/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMsg = 'Error al generar reporte';
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      // Extraer nombre de archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `reporte_${new Date().getTime()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      return { blob, filename };
    }

    // Si es pantalla, retornar JSON usando apiRequest
    const response = await apiRequest<{ reporte?: DatosReporte; reportes?: DatosReporte[]; cantidad_reportes?: number }>(
      '/api/reportes/generar-inteligente/',
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    // Si hay múltiples reportes, retornar la estructura completa
    if (response.data!.reportes && response.data!.cantidad_reportes) {
      return {
        reportes: response.data!.reportes,
        cantidad_reportes: response.data!.cantidad_reportes
      };
    }

    // Si es un solo reporte, retornarlo directamente
    return response.data!.reporte!;
  }

  /**
   * Interpretar un prompt sin generar el reporte
   */
  async interpretarPrompt(prompt: string): Promise<InterpretacionReporte> {
    const response = await apiRequest<InterpretacionReporte>(
      '/api/reportes/interpretar/',
      {
        method: 'POST',
        body: JSON.stringify({ prompt })
      }
    );

    return response.data!;
  }
}

export const reportesService = new ReportesService();
export default reportesService;
