import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin, CheckCircle, AlertTriangle, Building, Home } from 'lucide-react';
import { useUbicaciones } from '@/hooks/useUbicaciones';
import { UbicacionTable } from './components/table';
import { UbicacionFiltersComponent } from './components/filters';
import { UbicacionStore } from './components/store';
import { UbicacionDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

const ITEMS_PER_PAGE = 20;

export default function UbicacionesPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [activoFilter, setActivoFilter] = useState<string>("all");

  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    setFilters,
    clearError,
  } = useUbicaciones();

  // Función para cargar datos con filtros y paginación
  const fetchUbicaciones = async (pageNumber = 1, searchQuery = "", tipo = "all", activo = "all") => {
    const filters: any = {
      ...(searchQuery && { search: searchQuery }),
      ...(tipo !== "all" && { tipo }),
      ...(activo !== "all" && { activo: activo === "true" }),
      page: pageNumber,
      page_size: ITEMS_PER_PAGE
    };
    
    setFilters(filters);
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
    fetchUbicaciones(page, searchDebounced, tipoFilter, activoFilter);
  }, [page, searchDebounced, tipoFilter, activoFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (ubicacion: any) => {
    openStoreModal(ubicacion);
  };

  const handleDelete = (ubicacion: any) => {
    openDeleteModal(ubicacion);
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
    setTipoFilter('all');
    setActivoFilter('all');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const totalUbicaciones = data?.count || 0;
  const ubicacionesActivas = data?.results?.filter(u => u.activo).length || 0;
  const terminales = data?.results?.filter(u => u.tipo === 'TERMINAL').length || 0;
  const agencias = data?.results?.filter(u => u.tipo === 'AGENCIA').length || 0;
  const privadas = data?.results?.filter(u => u.tipo === 'PRIVADO').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Ubicaciones</h1>
            <p className="text-muted-foreground">
              Administra el catálogo de ubicaciones para viajes y encomiendas
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Ubicación
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ubicaciones</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUbicaciones}
              </div>
              <p className="text-xs text-muted-foreground">
                Ubicaciones registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ubicaciones Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {ubicacionesActivas}
              </div>
              <p className="text-xs text-muted-foreground">
                En operación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminales</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {terminales}
              </div>
              <p className="text-xs text-muted-foreground">
                Puntos principales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agencias</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {agencias}
              </div>
              <p className="text-xs text-muted-foreground">
                Puntos de servicio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <UbicacionFiltersComponent
          search={search}
          tipoFilter={tipoFilter}
          activoFilter={activoFilter}
          onSearchChange={setSearch}
          onTipoFilterChange={setTipoFilter}
          onActivoFilterChange={setActivoFilter}
          onClearFilters={handleClearFilters}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ubicaciones</CardTitle>
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
            
            <UbicacionTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchUbicaciones(newPage, searchDebounced, tipoFilter, activoFilter);
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <UbicacionStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
        />

        <UbicacionDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          ubicacion={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}