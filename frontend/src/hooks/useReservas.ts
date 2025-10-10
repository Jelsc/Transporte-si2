import { useState, useCallback } from 'react';
import type { 
  Reserva, 
  ReservaFormData, 
  ReservaUpdateData,
  ViajeOption, 
  Cliente,
  PaginatedResponse,
  ReservaStats
} from '@/types/reservas';

interface UseReservasReturn {
  data: PaginatedResponse<Reserva> | null;
  loading: boolean;
  error: string;
  selectedItem: Reserva | null;
  isStoreModalOpen: boolean;
  isDeleteModalOpen: boolean;
  viajesDisponibles: ViajeOption[];
  clientesDisponibles: Cliente[];
  stats: ReservaStats | null;
  loadData: (filters?: any) => Promise<void>;
  createItem: (data: ReservaFormData) => Promise<boolean>;
  updateItem: (id: number, data: ReservaUpdateData) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  openStoreModal: (item?: Reserva) => void;
  closeStoreModal: () => void;
  openDeleteModal: (item: Reserva) => void;
  closeDeleteModal: () => void;
  clearError: () => void;
  loadViajesDisponibles: () => Promise<void>;
  loadClientesDisponibles: () => Promise<void>;
  loadStats: () => Promise<void>;
}

// Función para obtener headers con autenticación
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función para refresh token
const refreshToken = async (): Promise<boolean> => {
  try {
    const refresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    if (!refresh) return false;

    const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return false;
};

// Función para hacer fetch con manejo de autenticación
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // Si hay error 401, intentar refresh token y reintentar
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });
    } else {
      // Redirigir al login si el refresh falla
      window.location.href = '/login';
    }
  }

  return response;
};

export function useReservas(): UseReservasReturn {
  const [data, setData] = useState<PaginatedResponse<Reserva> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Reserva | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [viajesDisponibles, setViajesDisponibles] = useState<ViajeOption[]>([]);
  const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([]);
  const [stats, setStats] = useState<ReservaStats | null>(null);

  // ✅ CORREGIDO: loadStats optimizado con useCallback
  const loadStats = useCallback(async (reservasData?: Reserva[]): Promise<void> => {
    try {
      const targetData = reservasData || data?.results;
      if (targetData) {
        const newStats: ReservaStats = {
          total_reservas: data?.count || targetData.length,
          total_asientos_reservados: targetData.reduce((total, reserva) => 
            total + (reserva.items?.length || 0), 0
          ),
          ingresos_totales: targetData.reduce((total, reserva) => 
            total + (reserva.pagado ? reserva.total : 0), 0
          ),
          reservas_pagadas: targetData.filter(r => r.pagado).length,
          reservas_pendientes: targetData.filter(r => !r.pagado && r.estado === 'pendiente').length,
          reservas_confirmadas: targetData.filter(r => r.estado === 'confirmada').length,
          reservas_canceladas: targetData.filter(r => r.estado === 'cancelada').length,
        };
        
        // ✅ Solo actualizar si los stats realmente cambiaron
        setStats(prevStats => {
          if (JSON.stringify(prevStats) === JSON.stringify(newStats)) {
            return prevStats;
          }
          return newStats;
        });
      }
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, [data]);

  // ✅ ACTUALIZADO: loadData ahora también carga stats automáticamente
  const loadData = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Mapear filtros para la nueva API
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const apiKey = key === 'search' ? 'search' : key;
          queryParams.append(apiKey, value.toString());
        }
      });

      const response = await authFetch(`http://localhost:8000/api/reservas/?${queryParams}`);
      
      if (!response.ok) throw new Error('Error al cargar reservas');
      
      const result = await response.json();
      setData(result);
      
      // ✅ Cargar stats automáticamente después de cargar datos
      await loadStats(result.results);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [loadStats]); // ✅ Agregar loadStats como dependencia

  // ✅ ACTUALIZADO: Crear reserva con múltiples asientos
  const createItem = async (formData: ReservaFormData): Promise<boolean> => {
    setLoading(true);
    try {
      // Validar que se hayan seleccionado asientos
      if (!formData.asientos_ids || formData.asientos_ids.length === 0) {
        throw new Error('Debe seleccionar al menos un asiento');
      }

      const response = await authFetch('http://localhost:8000/api/reservas/', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          asientos_ids: formData.asientos_ids
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.asientos_ids?.[0] || errorData.error || 'Error al crear reserva');
      }
      
      await loadData(); // ✅ Esto ya carga stats automáticamente
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZADO: Actualizar solo campos específicos
  const updateItem = async (id: number, formData: ReservaUpdateData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/reservas/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar reserva');
      }
      
      await loadData(); // ✅ Esto ya carga stats automáticamente
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZADO: deleteItem también actualiza stats
  const deleteItem = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/reservas/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar reserva');
      
      await loadData(); // ✅ Esto ya carga stats automáticamente
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openStoreModal = (item?: Reserva) => {
    setSelectedItem(item || null);
    setIsStoreModalOpen(true);
  };

  const closeStoreModal = () => {
    setSelectedItem(null);
    setIsStoreModalOpen(false);
  };

  const openDeleteModal = (item: Reserva) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedItem(null);
    setIsDeleteModalOpen(false);
  };

  const clearError = () => {
    setError('');
  };

  const loadViajesDisponibles = async () => {
    try {
      const response = await authFetch('http://localhost:8000/api/viajes/?estado=programado');
      if (!response.ok) throw new Error('Error al cargar viajes');
      
      const result = await response.json();
      setViajesDisponibles(result.results || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar viajes disponibles');
    }
  };

  const loadClientesDisponibles = async () => {
    try {
      const response = await authFetch('http://localhost:8000/api/users/?role=cliente');
      if (!response.ok) throw new Error('Error al cargar clientes');
      
      const result = await response.json();
      setClientesDisponibles(result.results || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes disponibles');
    }
  };

  // ✅ MANTENIDO: loadStats por compatibilidad (pero ya no es necesario llamarlo manualmente)
  const loadStatsForCompatibility = async (): Promise<void> => {
    // Esta función ahora es básicamente un wrapper para mantener la compatibilidad
    await loadStats();
  };

  return {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    viajesDisponibles,
    clientesDisponibles,
    stats,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
    loadViajesDisponibles,
    loadClientesDisponibles,
    loadStats: loadStatsForCompatibility, // ✅ Mantenemos la compatibilidad
  };
}