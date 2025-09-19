// Tipos base para el sistema de transporte
export type Personal = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  ci: string;
  created_at: string;
  updated_at: string;
  // Campos adicionales del backend
  codigo_empleado: string;
  departamento?: string;
  fecha_ingreso?: string;
  horario_trabajo?: string;
  estado?: string;
  supervisor?: number;
  supervisor_nombre?: string;
  supervisor_codigo?: string;
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  es_activo: boolean;
  nombre_completo: string;
  anos_antiguedad: number;
  puede_acceder_sistema: boolean;
  ultimo_acceso?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: number;
  username?: string;
};

export type Conductor = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  telefono: string;
  email: string;
  ci: string;
  // Campos específicos de Conductor
  nro_licencia: string;
  tipo_licencia: string;
  fecha_venc_licencia: string;
  experiencia_anios: number;
  estado?: string;
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  es_activo: boolean;
  // Calculados
  nombre_completo: string;
  licencia_vencida: boolean;
  dias_para_vencer_licencia: number;
  puede_conducir: boolean;
  // Relacionales y tracking
  personal?: number;
  usuario?: number;
  username?: string;
  ultima_ubicacion_lat?: number;
  ultima_ubicacion_lng?: number;
  ultima_actualizacion_ubicacion?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  created_at?: string;
  updated_at?: string;
};

export type Usuario = {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: "Administrador" | "Cliente" | "Supervisor" | "Conductor" | "Operador";
  is_admin_portal: boolean;
  personal_id?: number;
  conductor_id?: number;
  created_at: string;
  updated_at: string;
  // Campos adicionales del backend
  first_name: string;
  last_name: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
  puede_acceder_admin: boolean;
  es_activo: boolean;
  fecha_creacion: string;
  fecha_ultimo_acceso?: string;
  rol_obj?: {
    id: number;
    nombre: string;
    es_administrativo: boolean;
    permisos: string[];
  };
};

export type Role = {
  id: number;
  nombre: string;
  descripcion: string;
  es_administrativo: boolean;
  permisos: string[];
  fecha_creacion: string;
  fecha_actualizacion: string;
};

// Tipos para formularios
export type PersonalFormData = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date | null;
  telefono: string;
  email: string;
  ci: string;
  // Requeridos por el backend (PersonalCreateSerializer)
  codigo_empleado: string;
  fecha_ingreso: Date | null;
  // Opcionales
  departamento?: string | undefined;
  horario_trabajo?: string | undefined;
  supervisor?: number | undefined;
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
  es_activo?: boolean | undefined;
};

// Conductor no incluye campos laborales de Personal (codigo_empleado, etc.)
export type ConductorFormData = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date | null;
  telefono: string;
  email: string;
  ci: string;
  nro_licencia: string;
  fecha_venc_licencia: Date | null;
  experiencia_anios: number;
  tipo_licencia: string;
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
  es_activo?: boolean | undefined;
};

export type UsuarioFormData = {
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  // Identificador del rol (FK), obtenido desde /api/admin/roles
  rol_id?: number | undefined;
  is_admin_portal: boolean;
  personal_id?: number | undefined;
  conductor_id?: number | undefined;
  password?: string | undefined;
  password_confirm?: string | undefined;
};

// Tipos para filtros
export type PersonalFilters = {
  search?: string;
  departamento?: string;
  estado?: string;
  es_activo?: boolean;
};

export type ConductorFilters = {
  search?: string;
  licencia_vencida?: boolean;
  tipo_licencia?: string;
  es_activo?: boolean;
};

export type UsuarioFilters = {
  search?: string;
  rol?: string;
  is_admin_portal?: boolean;
  es_activo?: boolean;
};

// Tipos para respuestas de API
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T | null;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Tipos para autocompletado
export type PersonalOption = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ci: string;
  telefono: string;
};

export type ConductorOption = {
  id: number;
  personal__nombre: string;
  personal__apellido: string;
  personal__email: string;
  personal__ci: string;
  personal__telefono: string;
  nro_licencia: string;
};
