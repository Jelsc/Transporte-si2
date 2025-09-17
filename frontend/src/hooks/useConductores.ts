import { useCrud } from './useCrud';
import { conductorService } from '@/services/conductorService';
import type { Conductor } from '@/types';

export function useConductores() {
  return useCrud<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Conductor[];
  }>({
    fetchFn: conductorService.getConductores,
    createFn: conductorService.createConductor,
    updateFn: conductorService.updateConductor,
    deleteFn: conductorService.deleteConductor,
  });
}

export function useConductorById(id: number) {
  return useCrud<Conductor>({
    fetchFn: () => conductorService.getConductorById(id),
    updateFn: conductorService.updateConductor,
    deleteFn: conductorService.deleteConductor,
  });
}

export function useConductoresEstadisticas() {
  return useCrud<{
    total: number;
    activos: number;
    inactivos: number;
    por_estado: Record<string, number>;
    por_tipo_licencia: Record<string, number>;
    licencias_vencidas: number;
    licencias_por_vencer: number;
    nuevos_este_mes: number;
  }>({
    fetchFn: conductorService.getEstadisticas,
  });
}

export function useConductoresDisponibles() {
  return useCrud<Array<{
    id: number;
    personal__nombre: string;
    personal__apellido: string;
    personal__email: string;
    personal__ci: string;
    personal__telefono: string;
    nro_licencia: string;
  }>>({
    fetchFn: conductorService.getConductoresDisponibles,
  });
}

export function useLicenciasPorVencer() {
  return useCrud<Conductor[]>({
    fetchFn: conductorService.getLicenciasPorVencer,
  });
}

export function useLicenciasVencidas() {
  return useCrud<Conductor[]>({
    fetchFn: conductorService.getLicenciasVencidas,
  });
}
