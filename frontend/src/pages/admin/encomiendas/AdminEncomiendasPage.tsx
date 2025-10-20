import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Clock, Truck, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useEncomiendas } from '@/hooks/useEncomiendas';
import { EncomiendaTable } from './components/EncomiendaTable';
import { EncomiendaFiltersComponent } from './components/EncomiendaFilters';
import { EncomiendaStore } from './components/EncomiendaStore';
import { EncomiendaDelete } from './components/EncomiendaDelete';
import AdminLayout from '@/app/layout/admin-layout';
import type { EncomiendaFilters } from '@/types/encomienda';
import type { Encomienda } from '@/types/encomienda';

const ITEMS_PER_PAGE = 10;

export default function EncomiendasPage() {
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchDebounced, setSearchDebounced] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [ciudadFilter, setCiudadFilter] = useState<string>("all");
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState<string>("");
  const [fechaHastaFilter, setFechaHastaFilter] = useState<string>("");

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
  } = useEncomiendas();

  // Función para cargar datos con filtros y paginación
  const fetchEncomiendas = async () => {
    const filters: EncomiendaFilters = {
      ...(searchDebounced && { codigo_seguimiento: searchDebounced }),
      ...(estadoFilter !== "all" && { estado: estadoFilter }),
      ...(ciudadFilter !== "all" && { destino_ciudad: ciudadFilter }),
      ...(fechaDesdeFilter && { fecha_desde: fechaDesdeFilter }),
      ...(fechaHastaFilter && { fecha_hasta: fechaHastaFilter }),
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
    fetchEncomiendas();
    loadConductoresDisponibles();
  }, [page, searchDebounced, estadoFilter, ciudadFilter, fechaDesdeFilter, fechaHastaFilter]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (encomienda: Encomienda) => {
    openStoreModal(encomienda);
  };

  const handleDelete = (encomienda: Encomienda) => {
    openDeleteModal(encomienda);
  };

  const handleStoreSubmit = async (data: any): Promise<boolean> => {
    try {
      if (selectedItem) {
        await updateItem(selectedItem.id, data);
      } else {
        await createItem(data);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteConfirm = async (): Promise<boolean> => {
    try {
      if (selectedItem) {
        await deleteItem(selectedItem.id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setEstadoFilter('all');
    setCiudadFilter('all');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  // Calcular estadísticas
  const totalEncomiendas = data?.count || 0;
  const encomiendasPendientes = data?.results?.filter(e => e.estado === 'pendiente').length || 0;
  const encomiendasEnRuta = data?.results?.filter(e => e.estado === 'en_ruta').length || 0;
  const encomiendasEntregadas = data?.results?.filter(e => e.estado === 'entregado').length || 0;
  const encomiendasCanceladas = data?.results?.filter(e => e.estado === 'cancelado').length || 0;
  const ingresosTotales = data?.results?.reduce((total, encomienda) => {
    return total + (encomienda.precio || 0);
  }, 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Encomiendas</h1>
            <p className="text-muted-foreground">
              Administra y monitorea todas las encomiendas del sistema
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nueva Encomienda
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalEncomiendas}
              </div>
              <p className="text-xs text-muted-foreground">
                Encomiendas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {encomiendasPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                Por procesar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Ruta</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {encomiendasEnRuta}
              </div>
              <p className="text-xs text-muted-foreground">
                En camino
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {encomiendasEntregadas}
              </div>
              <p className="text-xs text-muted-foreground">
                Completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                Bs. {ingresosTotales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <EncomiendaFiltersComponent
          search={search}
          estadoFilter={estadoFilter}
          ciudadFilter={ciudadFilter}
          fechaDesdeFilter={fechaDesdeFilter}
          fechaHastaFilter={fechaHastaFilter}
          onSearchChange={setSearch}
          onEstadoFilterChange={setEstadoFilter}
          onCiudadFilterChange={setCiudadFilter}
          onFechaDesdeFilterChange={setFechaDesdeFilter}
          onFechaHastaFilterChange={setFechaHastaFilter}
          onClearFilters={handleClearFilters}
          loading={loading}
        />

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Encomiendas</CardTitle>
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
            
            <EncomiendaTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
              }}
            />
          </CardContent>
        </Card>

        {/* Modales */}
        <EncomiendaStore
          isOpen={isStoreModalOpen}
          onClose={closeStoreModal}
          onSubmit={handleStoreSubmit}
          initialData={selectedItem}
          loading={loading}
          conductoresDisponibles={conductoresDisponibles}
        />

        <EncomiendaDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          encomienda={selectedItem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}