import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, Users, Shield, User } from 'lucide-react';
import type { UsuarioFilters } from '@/types';

interface UsuarioFiltersProps {
  filters: UsuarioFilters;
  onFiltersChange: (filters: UsuarioFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function UsuarioFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  loading = false 
}: UsuarioFiltersProps) {
  const handleSearchChange = (value: string) => {
    const next = { ...filters };
    if (!value) {
      delete (next as any).search;
    } else {
      next.search = value;
    }
    onFiltersChange(next);
  };

  const handleRolChange = (value: string) => {
    const next = { ...filters };
    if (value === 'all') {
      delete (next as any).rol;
    } else {
      next.rol = value;
    }
    onFiltersChange(next);
  };

  const handleAdminPortalChange = (value: string) => {
    const next = { ...filters };
    if (value === 'all') {
      delete (next as any).is_admin_portal;
    } else {
      next.is_admin_portal = value === 'true';
    }
    onFiltersChange(next);
  };

  const handleActivoChange = (value: string) => {
    const next = { ...filters };
    if (value === 'all') {
      delete (next as any).es_activo;
    } else {
      next.es_activo = value === 'true';
    }
    onFiltersChange(next);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Username, nombre, email..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select
              value={filters.rol || 'all'}
              onValueChange={handleRolChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="Administrador">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="Supervisor">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Supervisor
                  </div>
                </SelectItem>
                <SelectItem value="Operador">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
                    Operador
                  </div>
                </SelectItem>
                <SelectItem value="Conductor">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" />
                    Conductor
                  </div>
                </SelectItem>
                <SelectItem value="Cliente">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portal de Acceso */}
          <div className="space-y-2">
            <Label htmlFor="portal">Portal de Acceso</Label>
            <Select
              value={filters.is_admin_portal === undefined ? 'all' : filters.is_admin_portal.toString()}
              onValueChange={handleAdminPortalChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los portales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los portales</SelectItem>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Portal Administrativo
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Portal Cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado del Sistema */}
          <div className="space-y-2">
            <Label htmlFor="activo">Estado del Sistema</Label>
            <Select
              value={filters.es_activo === undefined ? 'all' : filters.es_activo.toString()}
              onValueChange={handleActivoChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activo en Sistema</SelectItem>
                <SelectItem value="false">Inactivo en Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, rol: 'Administrador' })}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Shield className="mr-2 h-4 w-4" />
            Administradores
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, rol: 'Supervisor' })}
            disabled={loading}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Users className="mr-2 h-4 w-4" />
            Supervisores
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, rol: 'Conductor' })}
            disabled={loading}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <User className="mr-2 h-4 w-4" />
            Conductores
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, is_admin_portal: true })}
            disabled={loading}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Shield className="mr-2 h-4 w-4" />
            Portal Admin
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, es_activo: true })}
            disabled={loading}
          >
            Usuarios Activos
          </Button>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasActiveFilters ? 'Filtros activos' : 'Sin filtros aplicados'}
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
