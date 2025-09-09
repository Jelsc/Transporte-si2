export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telefono?: string;
  direccion?: string;
  rol?: {
    id: number;
    nombre: string;
    es_administrativo: boolean;
    permisos: string[];
  };
  es_activo: boolean;
  fecha_creacion: string;
  fecha_ultimo_acceso?: string;
  fecha_nacimiento?: string;
  codigo_empleado?: string;
  departamento?: string;
};
