
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Car, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { useVehiculos } from '@/hooks/useVehiculos';
import { VehiculoTable } from './components/table';
import { VehiculoFiltersComponent } from './components/filters';
import { VehiculoStore } from './components/store';
import { VehiculoDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 10;

export default function VehiculosPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [tipoVehiculoFilter, setTipoVehiculoFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [marcaFilter, setMarcaFilter] = useState<string>("all");

  const {
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
  } = useVehiculos();

  // Función para cargar datos con filtros y paginación
  const fetchVehiculos = async (pageNumber = 1, searchQuery = "", tipo = "all", estado = "all", marca = "all") => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(tipo !== "all" && { tipo_vehiculo: tipo }),
      ...(estado !== "all" && { estado }),
      ...(marca !== "all" && { marca }),
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
    fetchVehiculos(page, searchDebounced, tipoVehiculoFilter, estadoFilter, marcaFilter);
    loadConductoresDisponibles();
  }, [page, searchDebounced, tipoVehiculoFilter, estadoFilter, marcaFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (vehiculo: any) => {
    openStoreModal(vehiculo);
  };

  const handleDelete = (vehiculo: any) => {
    openDeleteModal(vehiculo);
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
    setTipoVehiculoFilter('all');
    setEstadoFilter('all');
    setMarcaFilter('all');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const totalVehiculos = data?.count || 0;
  const vehiculosActivos = data?.results?.filter(v => v.estado === 'activo').length || 0;
  const vehiculosEnMantenimiento = data?.results?.filter(v => v.estado === 'mantenimiento').length || 0;
  const vehiculosDeBaja = data?.results?.filter(v => v.estado === 'baja').length || 0;


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Vehículos</h1>
            <p className="text-muted-foreground">
              Administra la información de los vehículos y su asignación a conductores
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Vehículo
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehículos</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalVehiculos}
              </div>
              <p className="text-xs text-muted-foreground">
                Vehículos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehículos Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {vehiculosActivos}
              </div>
              <p className="text-xs text-muted-foreground">
                En operación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
              <Wrench className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {vehiculosEnMantenimiento}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dados de Baja</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {vehiculosDeBaja}
              </div>
              <p className="text-xs text-muted-foreground">
                Fuera de servicio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <VehiculoFiltersComponent
          search={search}
          tipoVehiculoFilter={tipoVehiculoFilter}
          estadoFilter={estadoFilter}
          marcaFilter={marcaFilter}
          onSearchChange={setSearch}
          onTipoVehiculoFilterChange={setTipoVehiculoFilter}
          onEstadoFilterChange={setEstadoFilter}
          onMarcaFilterChange={setMarcaFilter}
          onClearFilters={handleClearFilters}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Vehículos</CardTitle>
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
            
            <VehiculoTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchVehiculos(newPage, searchDebounced, tipoVehiculoFilter, estadoFilter, marcaFilter);
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <VehiculoStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
          conductoresDisponibles={conductoresDisponibles}
        />

        <VehiculoDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          vehiculo={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
