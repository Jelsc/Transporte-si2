import { useState, useCallback } from "react";
import { conductoresApi } from "@/services/conductoresService";
import type { ConductorOption } from "@/types/conductor";
import { encomiendaService } from "@/services/encomiendaService";
import type { Encomienda, EncomiendaFilters } from "@/types/encomienda";

interface UseEncomiendasState {
  data: { results: Encomienda[]; count: number } | null;
  loading: boolean;
  error: string | null;
  selectedItem: Encomienda | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  conductoresDisponibles: ConductorOption[];
}

interface UseEncomiendasActions {
  loadData: (filters?: EncomiendaFilters) => Promise<void>;
  createItem: (data: any) => Promise<void>;
  updateItem: (id: number, data: any) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  openStoreModal: (item?: Encomienda) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Encomienda) => void;
  closeDeleteModal: () => void;
  clearError: () => void;
  loadConductoresDisponibles: () => Promise<void>;
}

export function useEncomiendas(): UseEncomiendasState & UseEncomiendasActions {
  const [data, setData] = useState<{ results: Encomienda[]; count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Encomienda | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conductoresDisponibles, setConductoresDisponibles] = useState<ConductorOption[]>([]);

  const loadData = useCallback(async (filters?: EncomiendaFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.list(filters);

      if (response.success && response.data) {
        setData({
          results: response.data.results || [],
          count: response.data.count || 0
        });
      } else {
        setError(response.error || "Error al cargar encomiendas");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (item: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.create(item);
      if (response.success) {
        await loadData();
        setIsStoreModalOpen(false);
      } else {
        setError(response.error || "Error al crear encomienda");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const updateItem = useCallback(async (id: number, item: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.update(id, item);
      if (response.success) {
        await loadData();
        setIsStoreModalOpen(false);
      } else {
        setError(response.error || "Error al actualizar encomienda");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await encomiendaService.delete(id);
      if (response.success) {
        await loadData();
        setIsDeleteModalOpen(false);
      } else {
        setError(response.error || "Error al eliminar encomienda");
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const openStoreModal = useCallback((item?: Encomienda) => {
    setSelectedItem(item || null);
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    conductoresDisponibles,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
    loadConductoresDisponibles,
  };
}