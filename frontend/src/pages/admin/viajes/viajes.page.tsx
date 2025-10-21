import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bus, Calendar, DollarSign, Users, Route } from 'lucide-react';
import { useViajes } from '@/hooks/useViajes';
import { ViajeTable } from './components/table';
import { ViajeFiltersComponent } from './components/filters';
import { ViajeStore } from './components/store';
import { ViajeDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function ViajesPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [origenFilter, setOrigenFilter] = useState<string>("all");
  const [destinoFilter, setDestinoFilter] = useState<string>("all");
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState<string>("");
  const [fechaHastaFilter, setFechaHastaFilter] = useState<string>("");
  const [vehiculoFilter, setVehiculoFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    vehiculosDisponibles,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    clearError,
    loadVehiculosDisponibles,
  } = useViajes();

  // Función para cargar datos con filtros y paginación
  const fetchViajes = async (pageNumber = 1, searchQuery = "", origen = "all", destino = "all", fechaDesde = "", fechaHasta = "", vehiculo = "all", estado = "all") => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(origen !== "all" && { origen }),
      ...(destino !== "all" && { destino }),
      ...(fechaDesde && { fecha_desde: fechaDesde }),
      ...(fechaHasta && { fecha_hasta: fechaHasta }),
      ...(vehiculo !== "all" && { vehiculo_id: parseInt(vehiculo) }),
      ...(estado !== "all" && { estado }),
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

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchViajes(page, searchDebounced, origenFilter, destinoFilter, fechaDesdeFilter, fechaHastaFilter, vehiculoFilter, estadoFilter);
    loadVehiculosDisponibles();
  }, [page, searchDebounced, origenFilter, destinoFilter, fechaDesdeFilter, fechaHastaFilter, vehiculoFilter, estadoFilter]);

  const handleCreate = async () => {
    await openStoreModal();
  };

  const handleEdit = async (viaje: any) => {
    await openStoreModal(viaje);
  };

  const handleDelete = (viaje: any) => {
    openDeleteModal(viaje);
  };

  const handleStoreSubmit = async (data: any) => {
    if (selectedItem) {
      return await updateItem(selectedItem.id, data);
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
    setOrigenFilter('all');
    setDestinoFilter('all');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
    setVehiculoFilter('all');
    setEstadoFilter('all');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const totalViajes = data?.count || 0;
  const viajesProgramados = data?.results?.filter(v => v.estado === 'programado').length || 0;
  const viajesEnCurso = data?.results?.filter(v => v.estado === 'en_curso').length || 0;
  const viajesCompletados = data?.results?.filter(v => v.estado === 'completado').length || 0;
  const ingresosEstimados = data?.results?.reduce((total, viaje) => {
    const asientosOcupados = viaje.asientos_ocupados || 0;
    return total + (viaje.precio * asientosOcupados);
  }, 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Viajes</h1>
            <p className="text-muted-foreground">
              Programa y administra los viajes de transporte
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Programar Viaje
                  </Button>
                </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Viajes</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalViajes}
              </div>
              <p className="text-xs text-muted-foreground">
                Viajes registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programados</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {viajesProgramados}
            </div>
              <p className="text-xs text-muted-foreground">
                Por realizar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Curso</CardTitle>
              <Route className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {viajesEnCurso}
                            </div>
              <p className="text-xs text-muted-foreground">
                En ejecución
              </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                Bs. {ingresosEstimados.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Por asientos ocupados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <ViajeFiltersComponent
          search={search}
          origenFilter={origenFilter}
          destinoFilter={destinoFilter}
          fechaDesdeFilter={fechaDesdeFilter}
          fechaHastaFilter={fechaHastaFilter}
          vehiculoFilter={vehiculoFilter}
          estadoFilter={estadoFilter}
          onSearchChange={setSearch}
          onOrigenFilterChange={setOrigenFilter}
          onDestinoFilterChange={setDestinoFilter}
          onFechaDesdeFilterChange={setFechaDesdeFilter}
          onFechaHastaFilterChange={setFechaHastaFilter}
          onVehiculoFilterChange={setVehiculoFilter}
          onEstadoFilterChange={setEstadoFilter}
          onClearFilters={handleClearFilters}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Viajes</CardTitle>
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
            
            <ViajeTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchViajes(newPage, searchDebounced, origenFilter, destinoFilter, fechaDesdeFilter, fechaHastaFilter, vehiculoFilter, estadoFilter);
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <ViajeStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
          vehiculosDisponibles={vehiculosDisponibles}
        />

        <ViajeDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          viaje={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}