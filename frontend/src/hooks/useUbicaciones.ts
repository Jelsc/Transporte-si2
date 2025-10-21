import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UbicacionesService } from '@/services/ubicacionesService';
import type { 
  Ubicacion, 
  UbicacionCreate, 
  UbicacionFilters, 
  UbicacionListResponse
} from '@/types';

interface UseUbicacionesState {
  data: UbicacionListResponse | null;
  loading: boolean;
  error: string | null;
  selectedItem: Ubicacion | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isDetailsModalOpen: boolean;
  filters: UbicacionFilters;
}

interface UseUbicacionesActions {
  // Data operations
  loadData: (filters?: UbicacionFilters) => Promise<void>;
  loadItem: (id: number) => Promise<void>;
  createItem: (data: UbicacionCreate) => Promise<boolean>;
  updateItem: (id: number, data: UbicacionCreate) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  
  // UI state management
  openStoreModal: (item?: Ubicacion) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Ubicacion) => void;
  closeDeleteModal: () => void;
  openDetailsModal: (item: Ubicacion) => void;
  closeDetailsModal: () => void;
  setFilters: (filters: UbicacionFilters) => void;
  clearError: () => void;
  
  // Utility functions
  geocodificar: (direccion: string) => Promise<any>;
}

export function useUbicaciones(): UseUbicacionesState & UseUbicacionesActions {
  const [state, setState] = useState<UseUbicacionesState>({
    data: null,
    loading: false,
    error: null,
    selectedItem: null,
    isStoreModalOpen: false,
    isDeleteModalOpen: false,
    isDetailsModalOpen: false,
    filters: {
      activo: true,
      page_size: 20
    }
  });

  // Load data with filters
  const loadData = useCallback(async (customFilters?: UbicacionFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const filtersToUse = customFilters || state.filters;
      const response = await UbicacionesService.listarUbicaciones(filtersToUse);
      
      setState(prev => ({ 
        ...prev, 
        data: response, 
        loading: false,
        filters: filtersToUse // Guardar los filtros usados
      }));
    } catch (error: any) {
      console.error('Error loading ubicaciones:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar ubicaciones'
      }));
      toast.error('Error al cargar ubicaciones');
    }
  }, [state.filters]);

  // Load single item
  const loadItem = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const item = await UbicacionesService.obtenerUbicacion(id);
      
      setState(prev => ({ 
        ...prev, 
        selectedItem: item, 
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error loading ubicacion:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar ubicación'
      }));
      toast.error('Error al cargar ubicación');
    }
  }, []);

  // Create item
  const createItem = useCallback(async (data: UbicacionCreate): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await UbicacionesService.crearUbicacion(data);
      
      setState(prev => ({ ...prev, loading: false }));
      toast.success('Ubicación creada exitosamente');
      
      // Reload data
      await loadData();
      return true;
    } catch (error: any) {
      console.error('Error creating ubicacion:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al crear ubicación'
      }));
      
      // Handle validation errors
      if (error.response?.data) {
        const errores = error.response.data;
        if (typeof errores === 'object') {
          Object.keys(errores).forEach(key => {
            if (Array.isArray(errores[key])) {
              errores[key].forEach((mensaje: string) => {
                toast.error(`${key}: ${mensaje}`);
              });
            } else {
              toast.error(`${key}: ${errores[key]}`);
            }
          });
        } else {
          toast.error(errores);
        }
      } else {
        toast.error('Error al crear ubicación');
      }
      return false;
    }
  }, [loadData]);

  // Update item
  const updateItem = useCallback(async (id: number, data: UbicacionCreate): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await UbicacionesService.actualizarUbicacion(id, data);
      
      setState(prev => ({ ...prev, loading: false }));
      toast.success('Ubicación actualizada exitosamente');
      
      // Reload data
      await loadData();
      return true;
    } catch (error: any) {
      console.error('Error updating ubicacion:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al actualizar ubicación'
      }));
      
      // Handle validation errors
      if (error.response?.data) {
        const errores = error.response.data;
        if (typeof errores === 'object') {
          Object.keys(errores).forEach(key => {
            if (Array.isArray(errores[key])) {
              errores[key].forEach((mensaje: string) => {
                toast.error(`${key}: ${mensaje}`);
              });
            } else {
              toast.error(`${key}: ${errores[key]}`);
            }
          });
        } else {
          toast.error(errores);
        }
      } else {
        toast.error('Error al actualizar ubicación');
      }
      return false;
    }
  }, [loadData]);

  // Delete item
  const deleteItem = useCallback(async (id: number): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await UbicacionesService.eliminarUbicacion(id);
      
      setState(prev => ({ ...prev, loading: false }));
      toast.success('Ubicación eliminada exitosamente');
      
      // Reload data
      await loadData();
      return true;
    } catch (error: any) {
      console.error('Error deleting ubicacion:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al eliminar ubicación'
      }));
      toast.error('Error al eliminar ubicación');
      return false;
    }
  }, [loadData]);

  // Geocoding
  const geocodificar = useCallback(async (direccion: string) => {
    try {
      const result = await UbicacionesService.geocodificar({ direccion_texto: direccion });
      return result;
    } catch (error: any) {
      console.error('Error geocoding:', error);
      toast.error('Error al geocodificar la dirección');
      throw error;
    }
  }, []);

  // UI state management
  const openStoreModal = useCallback((item?: Ubicacion) => {
    setState(prev => ({ 
      ...prev, 
      selectedItem: item || null, 
      isStoreModalOpen: true,
      error: null 
    }));
  }, []);

  const closeStoreModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isStoreModalOpen: false, 
      selectedItem: null,
      error: null 
    }));
  }, []);

  const openDeleteModal = useCallback((item: Ubicacion) => {
    setState(prev => ({ 
      ...prev, 
      selectedItem: item, 
      isDeleteModalOpen: true,
      error: null 
    }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isDeleteModalOpen: false, 
      selectedItem: null,
      error: null 
    }));
  }, []);

  const openDetailsModal = useCallback((item: Ubicacion) => {
    setState(prev => ({ 
      ...prev, 
      selectedItem: item, 
      isDetailsModalOpen: true,
      error: null 
    }));
  }, []);

  const closeDetailsModal = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isDetailsModalOpen: false, 
      selectedItem: null,
      error: null 
    }));
  }, []);

  const setFilters = useCallback((filters: UbicacionFilters) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, ...filters } }));
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
    openDetailsModal,
    closeDetailsModal,
    setFilters,
    clearError,
    geocodificar
  };
}
