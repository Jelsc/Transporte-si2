// Tipos para el módulo de ubicaciones

export enum TipoUbicacion {
  TERMINAL = 'TERMINAL',
  AGENCIA = 'AGENCIA',
  PRIVADO = 'PRIVADO'
}

export enum SourceUbicacion {
  MANUAL = 'MANUAL',
  GEOCODED_NOMINATIM = 'GEOCODED_NOMINATIM'
}

export interface Ubicacion {
  id: number;
  tipo: TipoUbicacion;
  nombre: string;
  direccion_texto?: string;
  descripcion?: string;
  lat: number | string;
  lng: number | string;
  service_min: number;
  source: SourceUbicacion;
  place_id?: string;
  osm_id?: string;
  geohash?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Campos calculados
  coordenadas?: [number, number]; // [lat, lng]
  geohash_cercano?: string;
}

export interface UbicacionCreate {
  tipo: TipoUbicacion;
  nombre: string;
  direccion_texto?: string;
  descripcion?: string;
  lat: number | string;
  lng: number | string;
  service_min: number;
  source: SourceUbicacion;
  place_id?: string;
  osm_id?: string;
  activo: boolean;
}

export interface UbicacionUpdate {
  tipo?: TipoUbicacion;
  nombre?: string;
  direccion_texto?: string;
  descripcion?: string;
  lat?: number | string;
  lng?: number | string;
  service_min?: number;
  source?: SourceUbicacion;
  place_id?: string;
  osm_id?: string;
  activo?: boolean;
}

export interface GeocodeRequest {
  direccion_texto: string;
}

export interface GeocodeResponse {
  lat: number;
  lng: number;
  osm_id?: string;
  place_id?: string;
  source: SourceUbicacion;
  direccion_encontrada: string;
  confianza: number;
}

export interface UbicacionFilters {
  tipo?: TipoUbicacion;
  activo?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface UbicacionListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Ubicacion[];
}

// Opciones para los selects
export const TIPO_UBICACION_OPTIONS = [
  { value: TipoUbicacion.TERMINAL, label: 'Terminal' },
  { value: TipoUbicacion.AGENCIA, label: 'Agencia' },
  { value: TipoUbicacion.PRIVADO, label: 'Privado' }
];

export const SOURCE_UBICACION_OPTIONS = [
  { value: SourceUbicacion.MANUAL, label: 'Manual' },
  { value: SourceUbicacion.GEOCODED_NOMINATIM, label: 'Geocodificado' }
];

// Configuración del mapa
export interface MapaConfig {
  center: [number, number]; // [lng, lat]
  zoom: number;
  bounds?: [[number, number], [number, number]]; // [[min_lng, min_lat], [max_lng, max_lat]]
}

// Configuración por defecto para Bolivia/Santa Cruz
export const DEFAULT_MAPA_CONFIG: MapaConfig = {
  center: [-63.1806, -17.7849], // Santa Cruz, Bolivia
  zoom: 10,
  bounds: [
    [-69.5, -23.0], // Suroeste
    [-57.5, -9.5]   // Noreste
  ]
};

// Configuración de estilos del mapa
export const MAPA_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

// Configuración de marcadores
export interface MarcadorConfig {
  color: string;
  size: number;
  icon?: string;
}

export const MARCADOR_CONFIGS: Record<TipoUbicacion, MarcadorConfig> = {
  [TipoUbicacion.TERMINAL]: {
    color: '#3B82F6', // Azul
    size: 20,
    icon: '🚌'
  },
  [TipoUbicacion.AGENCIA]: {
    color: '#10B981', // Verde
    size: 16,
    icon: '🏢'
  },
  [TipoUbicacion.PRIVADO]: {
    color: '#F59E0B', // Amarillo
    size: 14,
    icon: '🏠'
  }
};
