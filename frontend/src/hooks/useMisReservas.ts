// hooks/useMisReservas.ts
import { useState, useCallback } from 'react';
import type { Reserva, ReservaStats } from '@/types/reservas';

// 👇 Mantenemos los mismos tipos
interface ViajeEnItem {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
}

interface AsientoConViaje {
  id: number;
  numero: string;
  estado: string;
  viaje: ViajeEnItem;
}

interface ItemReservaConDetalle {
  id: number;
  precio: number;
  asiento: AsientoConViaje;
}

interface ReservaConDetalle extends Omit<Reserva, 'items'> {
  items: ItemReservaConDetalle[];
}

interface UseMisReservasReturn {
  reservas: ReservaConDetalle[];
  loading: boolean;
  error: string;
  stats: ReservaStats | null;
  selectedReserva: ReservaConDetalle | null;
  loadMisReservas: (filters?: any) => Promise<void>;
  cancelarReserva: (id: number) => Promise<boolean>;
  marcarComoPagada: (id: number) => Promise<boolean>;
  clearError: () => void;
  setSelectedReserva: (reserva: ReservaConDetalle | null) => void;
}

// 👇 FUNCIÓN authFetch SIMPLIFICADA - ya no necesita verificar autenticación
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // 👈 ProtectedRoute garantiza que el token existe
    ...options.headers,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Solo manejar refresh token si es necesario, pero no redirecciones
  if (response.status === 401) {
    // ... tu lógica de refresh token si la tienes ...
    console.log('Token expirado, intentando refresh...');
  }

  return response;
};

export function useMisReservas(): UseMisReservasReturn {
  const [reservas, setReservas] = useState<ReservaConDetalle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<ReservaStats | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<ReservaConDetalle | null>(null);

  // ✅ Cargar las reservas del usuario actual - SIN VERIFICACIONES REDUNDANTES
  const loadMisReservas = useCallback(async (filters: any = {}) => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await authFetch(`http://localhost:8000/api/mis-reservas/?${queryParams}`);
      
      // 👇 Manejo de errores simplificado
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada');
        }
        throw new Error('Error al cargar mis reservas');
      }
      
      const result = await response.json();
      
      setReservas((result.results || result || []) as ReservaConDetalle[]);

      // Calcular estadísticas
      const reservasData = result.results || result || [];
      const newStats: ReservaStats = {
        total_reservas: reservasData.length,
        total_asientos_reservados: reservasData.reduce((total: number, reserva: any) => 
          total + (reserva.items?.length || 0), 0
        ),
        ingresos_totales: reservasData.reduce((total: number, reserva: any) => 
          total + (reserva.pagado ? reserva.total : 0), 0
        ),
        reservas_pagadas: reservasData.filter((r: any) => r.pagado).length,
        reservas_pendientes: reservasData.filter((r: any) => !r.pagado && r.estado === 'pendiente').length,
        reservas_confirmadas: reservasData.filter((r: any) => r.estado === 'confirmada').length,
        reservas_canceladas: reservasData.filter((r: any) => r.estado === 'cancelada').length,
      };
      
      setStats(newStats);

    } catch (err: any) {
      setError(err.message || 'Error al cargar mis reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Cancelar reserva - SIMPLIFICADO
  const cancelarReserva = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/mis-reservas/${id}/cancelar/`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar la reserva');
      }

      await loadMisReservas();
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Marcar como pagada - SIMPLIFICADO
  const marcarComoPagada = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await authFetch(`http://localhost:8000/api/mis-reservas/${id}/marcar-pagada/`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar como pagada');
      }

      await loadMisReservas();
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al marcar como pagada');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return {
    reservas,
    loading,
    error,
    stats,
    selectedReserva,
    loadMisReservas,
    cancelarReserva,
    marcarComoPagada,
    clearError,
    setSelectedReserva,
  };
}