import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, CheckCircle, Clock, XCircle, Users, DollarSign, Hash } from 'lucide-react';
import { useReservas } from '@/hooks/useReservas';
import { ReservaTable } from './components/table';
import { ReservaFiltersComponent } from './components/filters';
import { ReservaStore } from './components/store';
import { ReservaDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';
import type { Reserva, ReservaFormData, ReservaUpdateData } from '@/types/reservas';

const ITEMS_PER_PAGE = 10;

export default function ReservasPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [clienteFilter, setClienteFilter] = useState<string>("all");
  const [estadoPagoFilter, setEstadoPagoFilter] = useState<string>("all");
  const [viajeFilter, setViajeFilter] = useState<string>("all");
  const [estadoReservaFilter, setEstadoReservaFilter] = useState<string>("all");
  const [codigoFilter, setCodigoFilter] = useState<string>("");

  const {
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
    // ❌ ELIMINAR: loadStats ya no es necesario llamarlo manualmente
  } = useReservas();

  // ✅ Función para cargar datos con filtros
  const fetchReservas = async (
    pageNumber = 1, 
    searchQuery = "", 
    cliente = "all", 
    estadoPago = "all", 
    viaje = "all",
    estadoReserva = "all",
    codigo = ""
  ) => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(cliente !== "all" && { cliente }),
      ...(estadoPago !== "all" && { pagado: estadoPago === "pagado" }),
      ...(viaje !== "all" && { viaje }),
      ...(estadoReserva !== "all" && { estado: estadoReserva }),
      ...(codigo && { codigo_reserva: codigo }),
    };
    
    await loadData(filters);
  };

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  // ✅ CORREGIDO: Unificar toda la carga de datos
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchReservas(
          page, 
          searchDebounced, 
          clienteFilter, 
          estadoPagoFilter, 
          viajeFilter,
          estadoReservaFilter,
          codigoFilter
        ),
        loadViajesDisponibles(),
        loadClientesDisponibles()
      ]);
    };

    loadAllData();
  }, [
    page, 
    searchDebounced, 
    clienteFilter, 
    estadoPagoFilter, 
    viajeFilter,
    estadoReservaFilter,
    codigoFilter
  ]);

  // ❌ ELIMINAR COMPLETAMENTE: Este useEffect causa el bucle infinito
  // useEffect(() => {
  //   if (data) {
  //     loadStats();
  //   }
  // }, [data, loadStats]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (reserva: Reserva) => {
    openStoreModal(reserva);
  };

  const handleDelete = (reserva: Reserva) => {
    openDeleteModal(reserva);
  };

  const handleStoreSubmit = async (data: ReservaFormData) => {
    if (selectedItem) {
      const updateData: ReservaUpdateData = {
        pagado: data.pagado,
      };
      return await updateItem(selectedItem.id, updateData);
    } else {
      return await createItem(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      return await deleteItem(selectedItem.id);
    }
    return false;
  };

  const handleClearFilters = () => {
    setSearch('');
    setClienteFilter('all');
    setEstadoPagoFilter('all');
    setViajeFilter('all');
    setEstadoReservaFilter('all');
    setCodigoFilter('');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  // ✅ Los stats ahora vienen automáticamente del hook
  const totalReservas = stats?.total_reservas || data?.count || 0;
  const totalAsientos = stats?.total_asientos_reservados || 0;
  const ingresosTotales = stats?.ingresos_totales || 0;
  const reservasPagadas = stats?.reservas_pagadas || 0;
  const reservasPendientes = stats?.reservas_pendientes || 0;
  const reservasConfirmadas = stats?.reservas_confirmadas || 0;
  const reservasCanceladas = stats?.reservas_canceladas || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Reservas</h1>
            <p className="text-muted-foreground">
              Administra las reservas de pasajes con múltiples asientos
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>

        {/* Estadísticas Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalReservas}
              </div>
              <p className="text-xs text-muted-foreground">
                Reservas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asientos Reservados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalAsientos}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de asientos ocupados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Pagadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reservasPagadas}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('es-BO', {
                  style: 'currency',
                  currency: 'BOB'
                }).format(ingresosTotales)}
              </div>
              <p className="text-xs text-muted-foreground">
                De reservas pagadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reservasPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                Esperando confirmación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reservasConfirmadas}
              </div>
              <p className="text-xs text-muted-foreground">
                Reservas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reservasCanceladas}
              </div>
              <p className="text-xs text-muted-foreground">
                Reservas anuladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros con nuevos campos */}
        <ReservaFiltersComponent
          search={search}
          clienteFilter={clienteFilter}
          estadoPagoFilter={estadoPagoFilter}
          viajeFilter={viajeFilter}
          estadoReservaFilter={estadoReservaFilter}
          codigoFilter={codigoFilter}
          onSearchChange={setSearch}
          onClienteFilterChange={setClienteFilter}
          onEstadoPagoFilterChange={setEstadoPagoFilter}
          onViajeFilterChange={setViajeFilter}
          onEstadoReservaFilterChange={setEstadoReservaFilter}
          onCodigoFilterChange={setCodigoFilter}
          onClearFilters={handleClearFilters}
          loading={loading}
          clientesDisponibles={clientesDisponibles}
          viajesDisponibles={viajesDisponibles}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
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
            
            <ReservaTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchReservas(
                  newPage, 
                  searchDebounced, 
                  clienteFilter, 
                  estadoPagoFilter, 
                  viajeFilter,
                  estadoReservaFilter,
                  codigoFilter
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <ReservaStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
          viajesDisponibles={viajesDisponibles}
          clientesDisponibles={clientesDisponibles}
        />

        <ReservaDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          reserva={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}