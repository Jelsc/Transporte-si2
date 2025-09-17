import { useCrud } from './useCrud';
import { personalService } from '@/services/personalService';
import type { Personal } from '@/types';

export function usePersonal() {
  return useCrud<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Personal[];
  }>({
    fetchFn: personalService.getPersonal,
    createFn: personalService.createPersonal,
    updateFn: personalService.updatePersonal,
    deleteFn: personalService.deletePersonal,
  });
}

export function usePersonalById(id: number) {
  return useCrud<Personal>({
    fetchFn: () => personalService.getPersonalById(id),
    updateFn: personalService.updatePersonal,
    deleteFn: personalService.deletePersonal,
  });
}

export function usePersonalEstadisticas() {
  return useCrud<{
    total: number;
    activos: number;
    inactivos: number;
    por_tipo: Record<string, number>;
    por_estado: Record<string, number>;
    por_departamento: Record<string, number>;
    nuevos_este_mes: number;
  }>({
    fetchFn: personalService.getEstadisticas,
  });
}

export function usePersonalDisponible() {
  return useCrud<Array<{
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    ci: string;
    telefono: string;
  }>>({
    fetchFn: personalService.getPersonalDisponible,
  });
}
