import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { viajesApi } from '@/services/viajesService';
import { vehiculosApi } from '@/services/vehiculosService';
import type { 
  Viaje, 
  ViajeFormData, 
  ViajeFilters, 
  PaginatedResponse, 
  ConductorOption,
  VehiculoOption 
} from '@/types';

interface UseViajesState {
  data: PaginatedResponse<Viaje> | null;
  loading: boolean;
  error: string | null;
  selectedItem: Viaje | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  filters: ViajeFilters;
  vehiculosDisponibles: VehiculoOption[];
}

interface UseViajesActions {
  // Data operations
  loadData: (filters?: ViajeFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: ViajeFormData) => Promise<boolean>;
  updateItem: (id: number, data: ViajeFormData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: Viaje) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Viaje) => void;
  closeDeleteModal: () => void;
  setFilters: (filters: ViajeFilters) => void;
  clearError: () => void;
  
  // Utility functions
  loadVehiculosDisponibles: () => Promise<void>;
}

export function useViajes(): UseViajesState & UseViajesActions {
  const [state, setState] = useState<UseViajesState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    filters: {},
    vehiculosDisponibles: [],
  });

  const loadData = useCallback(async (filters?: ViajeFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await viajesApi.list(filters);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          data: response.data!, 
          loading: false,
          filters: filters || prev.filters 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar los viajes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
    }
  }, []);

  const loadItem = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await viajesApi.get(id);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          selectedItem: response.data!, 
          loading: false 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el viaje');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
    }
  }, []);

  const createItem = useCallback(async (data: ViajeFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await viajesApi.create(data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Viaje creado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al crear el viaje');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el viaje';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const updateItem = useCallback(async (id: number, data: ViajeFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await viajesApi.update(id, data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Viaje actualizado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al actualizar el viaje');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el viaje';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await viajesApi.remove(id);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isDeleteModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Viaje eliminado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al eliminar el viaje');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el viaje';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const loadVehiculosDisponibles = useCallback(async () => {
    try {
      const response = await vehiculosApi.list({ estado: 'activo' });
      
      if (response.success && response.data) {
        const vehiculos = response.data.results.map(v => ({
          id: v.id,
          nombre: v.nombre,
          placa: v.placa,
          tipo_vehiculo: v.tipo_vehiculo,
          estado: v.estado,
        }));
        
        setState(prev => ({ 
          ...prev, 
          vehiculosDisponibles: vehiculos 
        }));
      }
    } catch (error) {
      console.error('Error al cargar vehículos disponibles:', error);
    }
  }, []);

  const openStoreModal = useCallback(async (item?: Viaje) => {
    // Cargar vehículos disponibles antes de abrir el modal
    await loadVehiculosDisponibles();
    
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: true, 
      selectedItem: item || null 
    }));
  }, [loadVehiculosDisponibles]);

  const closeStoreModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: false, 
      selectedItem: null 
    }));
  }, []);

  const openDeleteModal = useCallback((item: Viaje) => {
    setState(prev => ({ 
      ...prev, 
      isDeleteModalOpen: true, 
      selectedItem: item 
    }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isDeleteModalOpen: false, 
      selectedItem: null 
    }));
  }, []);

  const setFilters = useCallback((filters: ViajeFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadData,
    loadItem,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    setFilters,
    clearError,
    loadVehiculosDisponibles,
  };
}
