import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Shield, User, Car, UserCheck, UserX } from 'lucide-react';
import { useUsuarios } from '@/hooks/useUsuarios';
import { UsuarioTable } from './components/table';
import { UsuarioFiltersComponent } from './components/filters';
import { UsuarioStore } from './components/store';
import { UsuarioDelete } from './components/delete';
import AdminLayout from '@/app/layout/admin-layout';

export default function UsuariosPage() {
  const {
    data,
    loading,
    error,
    selectedItem,
    isStoreModalOpen,
    isDeleteModalOpen,
    filters,
    roles,
    personalDisponible,
    conductoresDisponibles,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,
    openStoreModal,
    closeStoreModal,
    openDeleteModal,
    closeDeleteModal,
    setFilters,
    clearError,
    loadRoles,
    loadPersonalDisponible,
    loadConductoresDisponibles,
  } = useUsuarios();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
    loadRoles();
    loadPersonalDisponible();
    loadConductoresDisponibles();
  }, [loadData, loadRoles, loadPersonalDisponible, loadConductoresDisponibles]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleCreate = () => {
    openStoreModal();
  };

  const handleEdit = (usuario: any) => {
    openStoreModal(usuario);
  };

  const handleDelete = (usuario: any) => {
    openDeleteModal(usuario);
  };

  const handleToggleStatus = async (usuario: any) => {
    await toggleStatus(usuario.id, !usuario.es_activo);
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

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const totalUsuarios = data?.count || 0;
  const usuariosActivos = data?.results?.filter(u => u.es_activo).length || 0;
  const usuariosInactivos = totalUsuarios - usuariosActivos;
  const administradores = data?.results?.filter(u => u.rol === 'Administrador').length || 0;
  const conductores = data?.results?.filter(u => u.rol === 'Conductor').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Usuario
          </Button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsuarios}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usuariosActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {administradores}
            </div>
            <p className="text-xs text-muted-foreground">
              Con acceso admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conductores</CardTitle>
            <Car className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {conductores}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios conductores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {usuariosInactivos}
            </div>
            <p className="text-xs text-muted-foreground">
              Fuera del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <UsuarioFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
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
          
          <UsuarioTable
            data={data?.results || []}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <UsuarioStore
        isOpen={isStoreModalOpen}
        onClose={closeStoreModal}
        onSubmit={handleStoreSubmit}
        initialData={selectedItem}
        loading={loading}
        roles={roles}
        personalDisponible={personalDisponible}
        conductoresDisponibles={conductoresDisponibles}
      />

      <UsuarioDelete
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        usuario={selectedItem}
        loading={loading}
      />
      </div>
    </AdminLayout>
  );
}