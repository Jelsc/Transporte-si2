// Tipos base para el sistema de transporte
export type Personal = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  ci: string;
  // Campos actualizados según refactorización del backend
  codigo_empleado: string;
  fecha_ingreso: string;
  estado: boolean; // Cambiado a boolean
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: number; // FK a CustomUser (nullable)
  // Campos calculados/derivados
  nombre_completo: string;
  anos_antiguedad: number;
  puede_acceder_sistema: boolean;
};

export type Conductor = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  ci: string;
  // Campos específicos de Conductor
  nro_licencia: string;
  tipo_licencia: string;
  fecha_venc_licencia: string;
  experiencia_anios: number;
  estado: 'disponible' | 'ocupado' | 'descanso' | 'inactivo'; // Nuevo campo operacional
  telefono_emergencia?: string;
  contacto_emergencia?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: number; // FK a CustomUser (nullable)
  // Campos calculados/derivados
  nombre_completo: string;
  licencia_vencida: boolean;
  dias_para_vencer_licencia: number;
  puede_conducir: boolean;
  estado_usuario: 'activo' | 'inactivo' | 'sin_usuario'; // Estado del usuario vinculado
};

export type Usuario = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  ci?: string;
  fecha_nacimiento?: string;
  rol?: {
    id: number;
    nombre: string;
    descripcion: string;
    es_administrativo: boolean;
    permisos: string[];
    fecha_creacion: string;
    fecha_actualizacion: string;
  }; // Objeto completo del rol
  is_superuser: boolean;
  is_active: boolean; // Unificado con es_activo
  fecha_creacion: string;
  fecha_ultimo_acceso?: string;
  // Relaciones opcionales
  personal?: number; // FK a Personal
  conductor?: number; // FK a Conductor
  // Campos derivados
  puede_acceder_admin: boolean;
  es_administrativo: boolean;
  es_cliente: boolean;
  rol_nombre?: string;
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
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
  estado?: boolean | undefined; // Cambiado de es_activo a estado
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
  estado: 'disponible' | 'ocupado' | 'descanso' | 'inactivo'; // Nuevo campo operacional
  telefono_emergencia?: string | undefined;
  contacto_emergencia?: string | undefined;
};

export type UsuarioFormData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string | undefined;
  direccion?: string | undefined;
  ci?: string | undefined;
  fecha_nacimiento?: Date | null | undefined;
  // Identificador del rol (FK), obtenido desde /api/admin/roles
  rol_id?: number | undefined;
  is_superuser: boolean;
  is_active: boolean; // Unificado con es_activo
  // Relaciones opcionales
  personal?: number | undefined;
  conductor?: number | undefined;
  password?: string | undefined;
  password_confirm?: string | undefined;
};

// Tipos para filtros
export type PersonalFilters = {
  search?: string;
  estado?: boolean; // Cambiado de string a boolean
};

export type ConductorFilters = {
  search?: string;
  estado?: 'disponible' | 'ocupado' | 'descanso' | 'inactivo';
  tipo_licencia?: string;
};

export type UsuarioFilters = {
  search?: string;
  rol?: string;
  is_staff?: boolean; // Cambiado de is_admin_portal
  is_active?: boolean; // Cambiado de es_activo
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
  nombre: string; // Cambiado de personal__nombre
  apellido: string; // Cambiado de personal__apellido
  email: string; // Cambiado de personal__email
  ci: string; // Cambiado de personal__ci
  telefono: string; // Cambiado de personal__telefono
  nro_licencia: string;
};
