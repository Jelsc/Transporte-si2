import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Clock, Truck, CheckCircle, XCircle, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useEncomiendas } from '@/hooks/useEncomiendas';
import { EncomiendaTable } from './components/EncomiendaTable';
import { EncomiendaFiltersComponent } from './components/EncomiendaFilters';
import { EncomiendaStore } from './components/EncomiendaStore';
import { EncomiendaDelete } from './components/EncomiendaDelete';
import { PagoModal } from './components/PagoModal';
import AdminLayout from '@/app/layout/admin-layout';
import type { EncomiendaFilters } from '@/types/encomienda';
import type { Encomienda } from '@/types/encomienda';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function AdminEncomiendaPage() {
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
    isPagoModalOpen,
    conductoresDisponibles,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    openPagoModal,
    closePagoModal,
    clearError,
    loadConductoresDisponibles,
    calcularPrecio,
     marcarPagoEfectivo,
    crearPagoStripe,
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
    }, 500); // Reducido a 500ms para mejor experiencia

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar datos al montar el componente y cuando cambien los filtros
  useEffect(() => {
    fetchEncomiendas();
    loadConductoresDisponibles();
  }, [page, searchDebounced, estadoFilter, ciudadFilter, fechaDesdeFilter, fechaHastaFilter]);

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (encomienda: Encomienda) => {
    openStoreModal(encomienda);
  };

  const handleDelete = (encomienda: Encomienda) => {
    openDeleteModal(encomienda);
  };

  const handleView = (encomienda: Encomienda) => {
    toast.info(`Vista detallada de ${encomienda.codigo_seguimiento}`);
    // Aquí puedes implementar la navegación a la vista detallada
  };

  const handleStoreSubmit = async (formData: any): Promise<boolean> => {
    try {
      // Asegurar que tenga método de pago y calcular precio si es nueva
      const encomiendaData = {
        ...formData,
        metodo_pago: formData.metodo_pago || 'efectivo',
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

  const handleDeleteConfirm = async (): Promise<boolean> => {
    try {
      if (selectedItem) {
        await deleteItem(selectedItem.id);
        toast.success('Encomienda eliminada correctamente');
        // Recargar datos después de eliminar
        await fetchEncomiendas();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar encomienda');
      return false;
    }
  };
   // ✅ NUEVA FUNCIÓN PARA MANEJAR PAGOS
  const handleProcesarPago = async (metodoPago: 'efectivo' | 'tarjeta') => {
    if (!selectedItem) return;

    try {
      if (metodoPago === 'efectivo') {
        // Para admin, marcar directamente como pago completado
        const result = await marcarPagoEfectivo(selectedItem.id);
        if (result.success) {
          toast.success('Pago en efectivo registrado correctamente');
          await fetchEncomiendas(); // Recargar datos
        } else {
          toast.error(result.error || 'Error al registrar pago');
        }
      } else if (metodoPago === 'tarjeta') {
        // Para admin, crear pago Stripe
        const result = await crearPagoStripe(selectedItem.id);
        if (result.success) {
          toast.success('Pago con tarjeta procesado correctamente');
          await fetchEncomiendas(); // Recargar datos
        } else {
          toast.error(result.error || 'Error al procesar pago con tarjeta');
        }
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setEstadoFilter('all');
    setCiudadFilter('all');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
    setPage(1); // Resetear a primera página
  };
  


  const handleRefresh = async () => {
    await fetchEncomiendas();
    await loadConductoresDisponibles();
    toast.success('Datos actualizados');
  };

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  // Calcular estadísticas desde los datos locales
  const totalEncomiendas = data?.count || 0;
  const encomiendasPendientes = data?.results?.filter(e => e.estado === 'pendiente').length || 0;
  const encomiendasEnRuta = data?.results?.filter(e => e.estado === 'en_ruta').length || 0;
  const encomiendasEntregadas = data?.results?.filter(e => e.estado === 'entregado').length || 0;
  const encomiendasCanceladas = data?.results?.filter(e => e.estado === 'cancelado').length || 0;
  const ingresosTotales = data?.results?.reduce((total, encomienda) => {
    return total + (encomienda.precio || 0);
  }, 0) || 0;
  
   const handlePagarEncomienda = (encomienda: Encomienda) => {
    openPagoModal(encomienda);
  };

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Encomienda
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Encomiendas</span>
              <span className="text-sm font-normal text-muted-foreground">
                Total: {totalEncomiendas} encomiendas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EncomiendaTable
              data={data?.results || []}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onPagar={handlePagarEncomienda}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
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
          calcularPrecio={calcularPrecio}
        />

        <EncomiendaDelete
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          encomienda={selectedItem}
          loading={loading}
        />
        <PagoModal
          isOpen={isPagoModalOpen}
          onClose={closePagoModal}
          encomienda={selectedItem}
          onProcesarPago={handleProcesarPago}
          loading={loading}
          esAdmin={true}
        />
      </div>
    </AdminLayout>
  );
  }