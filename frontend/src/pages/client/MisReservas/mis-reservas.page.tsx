// src/pages/client/MisReservas/mis-reservas.page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  DollarSign,
  MapPin,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useMisReservas } from '@/hooks/useMisReservas';
import { MisReservasFilters } from './components/MisReservasFilters';
import { MisReservasTable } from './components/MisReservasTable';
import { DetalleReservaModal } from './components/DetalleReservaModal';
import { CancelarReservaModal } from './components/CancelarReservaModal';
import type { Reserva } from '@/types/reservas';

// 👇 Mismos tipos que en los componentes hijos
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

export default function MisReservasPage() {
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [pagoFilter, setPagoFilter] = useState<string>('all');
  const [reservaDetalle, setReservaDetalle] = useState<ReservaConDetalle | null>(null);
  const [reservaCancelar, setReservaCancelar] = useState<ReservaConDetalle | null>(null);

  const {
    reservas,
    loading,
    error,
    stats,
    loadMisReservas,
    cancelarReserva,
    marcarComoPagada,
    clearError,
  } = useMisReservas();

  // Cargar reservas al iniciar y cuando cambien los filtros
  useEffect(() => {
    const filters: any = {};
    if (estadoFilter !== 'all') filters.estado = estadoFilter;
    if (pagoFilter !== 'all') filters.pagado = pagoFilter === 'pagado';
    
    loadMisReservas(filters);
  }, [estadoFilter, pagoFilter, loadMisReservas]);

  // 👇 Actualizado con tipo correcto
  const handleCancelarReserva = async (reserva: ReservaConDetalle) => {
    setReservaCancelar(reserva);
  };

  const handleConfirmarCancelacion = async () => {
    if (reservaCancelar) {
      const success = await cancelarReserva(reservaCancelar.id);
      if (success) {
        setReservaCancelar(null);
      }
    }
  };

  const handleMarcarComoPagada = async (id: number) => {
    await marcarComoPagada(id);
  };

  // 👇 Actualizado con tipo correcto
  const handleVerDetalle = (reserva: ReservaConDetalle) => {
    setReservaDetalle(reserva);
  };

  const totalReservas = stats?.total_reservas || 0;
  const totalAsientos = stats?.total_asientos_reservados || 0;
  const ingresosTotales = stats?.ingresos_totales || 0;
  const reservasPagadas = stats?.reservas_pagadas || 0;
  const reservasPendientes = stats?.reservas_pendientes || 0;
  const reservasConfirmadas = stats?.reservas_confirmadas || 0;
  const reservasCanceladas = stats?.reservas_canceladas || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Reservas</h1>
          <p className="text-muted-foreground">
            Gestiona y revisa el estado de tus reservas de pasajes
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservas}</div>
            <p className="text-xs text-muted-foreground">Reservas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asientos Reservados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalAsientos}</div>
            <p className="text-xs text-muted-foreground">Total de asientos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reservasPagadas}</div>
            <p className="text-xs text-muted-foreground">Reservas confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('es-BO', {
                style: 'currency',
                currency: 'BOB'
              }).format(ingresosTotales)}
            </div>
            <p className="text-xs text-muted-foreground">Total pagado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <MisReservasFilters
        estadoFilter={estadoFilter}
        pagoFilter={pagoFilter}
        onEstadoFilterChange={setEstadoFilter}
        onPagoFilterChange={setPagoFilter}
        loading={loading}
      />

      {/* Tabla de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Mis Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearError}
                className="mt-2"
              >
                Cerrar
              </Button>
            </div>
          )}
          
          <MisReservasTable
            reservas={reservas} 
            loading={loading}
            onVerDetalle={handleVerDetalle}
            onCancelar={handleCancelarReserva}
            onMarcarPagada={handleMarcarComoPagada}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <DetalleReservaModal
        reserva={reservaDetalle}
        isOpen={!!reservaDetalle}
        onClose={() => setReservaDetalle(null)}
      />

      <CancelarReservaModal
        reserva={reservaCancelar}
        isOpen={!!reservaCancelar}
        onClose={() => setReservaCancelar(null)}
        onConfirm={handleConfirmarCancelacion}
        loading={loading}
      />
    </div>
  );
}