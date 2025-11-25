export interface ReportCard {
  id: string;
  categoria: 'viajes' | 'encomiendas' | 'conductores' | 'vehiculos' | 'financiero' | 'general';
  titulo: string;
  descripcion: string;
  icon: string;
  color: string;
}

export const REPORT_CATEGORIES: ReportCard[] = [
  {
    id: 'viajes',
    categoria: 'viajes',
    titulo: 'Reportes de Viajes',
    descripcion: 'Estadísticas y análisis de viajes realizados',
    icon: 'Bus',
    color: 'blue',
  },
  {
    id: 'encomiendas',
    categoria: 'encomiendas',
    titulo: 'Reportes de Encomiendas',
    descripcion: 'Seguimiento y estadísticas de encomiendas',
    icon: 'Package',
    color: 'green',
  },
  {
    id: 'conductores',
    categoria: 'conductores',
    titulo: 'Reportes de Conductores',
    descripcion: 'Desempeño y asistencia de conductores',
    icon: 'UserCheck',
    color: 'purple',
  },
  {
    id: 'vehiculos',
    categoria: 'vehiculos',
    titulo: 'Reportes de Vehículos',
    descripcion: 'Mantenimiento y utilización de vehículos',
    icon: 'Truck',
    color: 'orange',
  },
  {
    id: 'financiero',
    categoria: 'financiero',
    titulo: 'Reportes Financieros',
    descripcion: 'Ingresos, gastos y estadísticas financieras',
    icon: 'DollarSign',
    color: 'red',
  },
  // {
  //   id: 'general',
  //   categoria: 'general',
  //   titulo: 'Dashboard Ejecutivo',
  //   descripcion: 'Vista general del sistema y métricas clave',
  //   icon: 'BarChart3',
  //   color: 'indigo',
  // },
];
