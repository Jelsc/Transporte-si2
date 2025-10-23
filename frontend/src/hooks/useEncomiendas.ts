import { useState, useCallback } from 'react';
import { encomiendaService } from '@/services/encomiendaService';
import { conductoresApi } from '@/services/conductoresService';
import type { Encomienda, EncomiendaFilters, CreateEncomiendaRequest } from '@/types/encomienda';
import type { ConductorOption } from '@/types/conductor';

export function useEncomiendas() {
  const [data, setData] = useState<{ results: Encomienda[]; count: number }>({ results: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Encomienda | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conductoresDisponibles, setConductoresDisponibles] = useState<ConductorOption[]>([]);
  const handleStoreSubmit = async (formData: any): Promise<boolean> => {
    try {
      // ✅ CORREGIDO: Manejar correctamente el conductor_asignado
      const encomiendaData = {
        ...formData,
        metodo_pago: formData.metodo_pago || 'efectivo',
        conductor_asignado: formData.conductor_asignado === 0 ? null : formData.conductor_asignado,
        // Si es nueva encomienda, calcular el precio automáticamente
        ...(!selectedItem && {
          precio: calcularPrecio(formData.peso, formData.destino_ciudad)
        })
      };

      if (selectedItem) {
        await updateItem(selectedItem.id, encomiendaData);
        toast.success('Encomienda actualizada correctamente');
      } else {
        await createItem(encomiendaData);
        toast.success('Encomienda creada correctamente');
      }
      
      // Recargar datos después de modificar
      await fetchEncomiendas();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar encomienda');
      return false;
    }
  };


  /** 🔹 Cargar todas las encomiendas (para Admin) */
  const loadData = useCallback(async (filters?: EncomiendaFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.list(filters);
      if (response.success && response.data) {
        setData({
          results: response.data.results || [],
          count: response.data.count || 0,
        });
      } else {
        setError(response.error ?? 'Error al cargar encomiendas');
      }
    } catch (err: any) {
      setError(err.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Cargar solo las encomiendas del cliente autenticado */
  const loadMyEncomiendas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.getMyEncomiendas();
      if (response.success && response.data) {
        setData({
          results: response.data || [],
          count: response.data.length || 0,
        });
      } else {
        setError(response.error ?? 'Error al cargar mis encomiendas');
      }
    } catch (err: any) {
      setError(err.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Crear una encomienda nueva - ACTUALIZADO */
  const createItem = useCallback(async (item: CreateEncomiendaRequest) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Creando encomienda', item);
      
      const response = await encomiendaService.create(item);
      
      if (response.success && response.data) {
        setData(prev => ({
          results: [response.data!, ...(prev?.results || [])],
          count: (prev?.count ?? 0) + 1,
        }));
        setIsStoreModalOpen(false);
        return { success: true, data: response.data, message: response.message };
      } else {
        const errorMsg = response.error ?? 'Error al crear encomienda';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Actualizar una encomienda existente - ACTUALIZADO */
  const updateItem = useCallback(async (id: number, item: Partial<Encomienda>) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Actualizando encomienda', id, item);
      
      const response = await encomiendaService.update(id, item);
      
      if (response.success && response.data) {
        setData(prev => {
          if (!prev) return prev;
          const updated = prev.results.map(r => (r.id === id ? response.data! : r));
          return { ...prev, results: updated };
        });
        setIsStoreModalOpen(false);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error ?? 'Error al actualizar encomienda';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Eliminar una encomienda - ACTUALIZADO */
  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Eliminando encomienda', id);
      
      const response = await encomiendaService.remove(id);
      
      if (response.success) {
        setData(prev => {
          const filtered = prev.results.filter(r => r.id !== id);
          return { results: filtered, count: Math.max(0, prev.count - 1) };
        });
        setIsDeleteModalOpen(false);
        return { success: true };
      } else {
        const errorMsg = response.error ?? 'Error al eliminar encomienda';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Buscar encomienda por código - ACTUALIZADO */
  const buscarPorCodigo = useCallback(async (codigo: string) => {
    if (!codigo.trim()) {
      setError('Debes ingresar un código de seguimiento');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Buscando encomienda por código', codigo);
      
      const response = await encomiendaService.getByTrackingCode(codigo);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        const errorMsg = response.error ?? 'Encomienda no encontrada';
        setError(errorMsg);
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error al buscar encomienda';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Calcular precio estimado - ACTUALIZADO */
  const calcularPrecio = useCallback((peso: number, destino: string): number => {
    return encomiendaService.calcularPrecio(peso, destino);
  }, []);

  /** 🔹 Asignar conductor a encomienda - NUEVO */
  const asignarConductor = useCallback(async (encomiendaId: number, conductorId: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Asignando conductor', encomiendaId, conductorId);
      
      const response = await encomiendaService.asignarConductor(encomiendaId, conductorId);
      
      if (response.success && response.data) {
        setData(prev => {
          if (!prev) return prev;
          const updated = prev.results.map(r => 
            r.id === encomiendaId ? response.data! : r
          );
          return { ...prev, results: updated };
        });
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error ?? 'Error al asignar conductor';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Actualizar estado de entrega - NUEVO */
  const actualizarEstadoEntrega = useCallback(async (encomiendaId: number, estado: string, notas?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📦 Hook: Actualizando estado', encomiendaId, estado);
      
      const response = await encomiendaService.actualizarEstadoEntrega(encomiendaId, estado, notas);
      
      if (response.success && response.data) {
        setData(prev => {
          if (!prev) return prev;
          const updated = prev.results.map(r => 
            r.id === encomiendaId ? response.data! : r
          );
          return { ...prev, results: updated };
        });
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error ?? 'Error al actualizar estado';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Obtener estadísticas - NUEVO */
  const getEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.getStats();
      
      if (response.success && response.data) {
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error ?? 'Error al cargar estadísticas';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Obtener encomiendas asignadas (para conductores) - NUEVO */
  const getEncomiendasAsignadas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.getAssignedEncomiendas();
      
      if (response.success && response.data) {
        setData({
          results: response.data || [],
          count: response.data.length || 0,
        });
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error ?? 'Error al cargar encomiendas asignadas';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message ?? 'Error de conexión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /** 🔹 Modales */
  const openStoreModal = useCallback((item?: Encomienda) => {
    setSelectedItem(item ?? null);
    setIsStoreModalOpen(true);
  }, []);

  const closeStoreModal = useCallback(() => {
    setSelectedItem(null);
    setIsStoreModalOpen(false);
  }, []);

  const openDeleteModal = useCallback((item: Encomienda) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  }, []);

  /** 🔹 Limpiar error */
  const clearError = useCallback(() => setError(null), []);

  /** 🔹 Cargar conductores disponibles (para admin) */
  const loadConductoresDisponibles = useCallback(async () => {
    try {
      const response = await conductoresApi.getAvailable();
      if (response.success && response.data) {
        setConductoresDisponibles(response.data);
      }
    } catch (err) {
      console.error('Error cargando conductores disponibles:', err);
    }
  }, []);

  return {
    // Estado
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    conductoresDisponibles,
    
    // Métodos CRUD
    loadData,
    loadMyEncomiendas,
    createItem,
    updateItem,
    deleteItem,
    
    // Métodos de búsqueda y cálculo
    buscarPorCodigo,
    calcularPrecio,
    
    // Nuevos métodos
    asignarConductor,
    actualizarEstadoEntrega,
    getEstadisticas,
    getEncomiendasAsignadas,
    
    // Manejo de modales
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    
    // Utilidades
    clearError,
    loadConductoresDisponibles,
  };
}