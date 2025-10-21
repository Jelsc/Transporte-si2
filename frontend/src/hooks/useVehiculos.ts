import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { vehiculosApi } from '@/services/vehiculosService';
import { conductoresApi } from '@/services/conductoresService';
import type { 
  Vehiculo, 
  VehiculoFormData, 
  VehiculoFilters, 
  PaginatedResponse,
  ConductorOption 
} from '@/types';

interface UseVehiculosState {
  data: PaginatedResponse<Vehiculo> | null;
  loading: boolean;
  error: string | null;
  selectedItem: Vehiculo | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  filters: VehiculoFilters;
  conductoresDisponibles: ConductorOption[];
}

interface UseVehiculosActions {
  // Data operations
  loadData: (filters?: VehiculoFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: VehiculoFormData) => Promise<boolean>;
  updateItem: (id: number, data: VehiculoFormData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: Vehiculo) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Vehiculo) => void;
  closeDeleteModal: () => void;
  setFilters: (filters: VehiculoFilters) => void;
  clearError: () => void;
  
  // Utility functions
  loadConductoresDisponibles: () => Promise<void>;
}


export function useVehiculos(): UseVehiculosState & UseVehiculosActions {
  const [state, setState] = useState<UseVehiculosState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    filters: {},
    conductoresDisponibles: [],
  });

  const loadData = useCallback(async (filters?: VehiculoFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await vehiculosApi.list(filters);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          data: response.data!, 
          loading: false,
          filters: filters || prev.filters 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar los vehículos');
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
      const response = await vehiculosApi.get(id);
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          selectedItem: response.data!, 
          loading: false 
        }));
      } else {
        throw new Error(response.error || 'Error al cargar el vehículo');
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

  const createItem = useCallback(async (data: VehiculoFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await vehiculosApi.create(data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Vehículo creado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al crear el vehículo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el vehículo';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const updateItem = useCallback(async (id: number, data: VehiculoFormData): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await vehiculosApi.update(id, data);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isStoreModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Vehículo actualizado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al actualizar el vehículo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el vehículo';
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
      const response = await vehiculosApi.remove(id);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          isDeleteModalOpen: false,
          selectedItem: null 
        }));
        toast.success('Vehículo eliminado exitosamente');
        await loadData(state.filters); // Recargar datos
        return true;
      } else {
        throw new Error(response.error || 'Error al eliminar el vehículo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el vehículo';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [loadData, state.filters]);

  const openStoreModal = useCallback((item?: Vehiculo) => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: true, 
      selectedItem: item || null 
    }));
  }, []);

  const closeStoreModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: false, 
      selectedItem: null 
    }));
  }, []);

  const openDeleteModal = useCallback((item: Vehiculo) => {
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

  const setFilters = useCallback((filters: VehiculoFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const loadConductoresDisponibles = useCallback(async () => {
    try {
      const response = await conductoresApi.getAvailable();
      
      if (response.success && response.data) {
        setState(prev => ({ 
          ...prev, 
          conductoresDisponibles: response.data! 
        }));
      }
    } catch (error) {
      console.error('Error al cargar conductores disponibles:', error);
    }
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
    loadConductoresDisponibles,
  };
}
