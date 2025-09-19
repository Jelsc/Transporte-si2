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
import { Search, Filter, X, AlertTriangle } from 'lucide-react';
import type { ConductorFilters } from '@/types';

interface ConductorFiltersProps {
  filters: ConductorFilters;
  onFiltersChange: (filters: ConductorFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function ConductorFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  loading = false 
}: ConductorFiltersProps) {
  const handleSearchChange = (value: string) => {
    const next = { ...filters };
    if (!value) {
      delete (next as any).search;
    } else {
      next.search = value;
    }
    onFiltersChange(next);
  };

  const handleLicenciaVencidaChange = (value: string) => {
    const next = { ...filters };
    if (value === 'all') {
      delete (next as any).licencia_vencida;
    } else {
      next.licencia_vencida = value === 'true';
    }
    onFiltersChange(next);
  };

  const handleTipoLicenciaChange = (value: string) => {
    const next = { ...filters };
    if (value === 'all') {
      delete (next as any).tipo_licencia;
    } else {
      next.tipo_licencia = value;
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
                placeholder="Nombre, apellido, email, licencia..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Estado de Licencia */}
          <div className="space-y-2">
            <Label htmlFor="licencia">Estado de Licencia</Label>
            <Select
              value={filters.licencia_vencida === undefined ? 'all' : filters.licencia_vencida.toString()}
              onValueChange={handleLicenciaVencidaChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Licencias Vigentes
                  </div>
                </SelectItem>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Licencias Vencidas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Licencia */}
          <div className="space-y-2">
            <Label htmlFor="tipo_licencia">Tipo de Licencia</Label>
            <Select
              value={filters.tipo_licencia || 'all'}
              onValueChange={handleTipoLicenciaChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="A">Tipo A - Motocicletas</SelectItem>
                <SelectItem value="B">Tipo B - Vehículos particulares</SelectItem>
                <SelectItem value="C">Tipo C - Vehículos de carga liviana</SelectItem>
                <SelectItem value="D">Tipo D - Vehículos de carga pesada</SelectItem>
                <SelectItem value="E">Tipo E - Vehículos de transporte público</SelectItem>
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
            onClick={() => onFiltersChange({ ...filters, licencia_vencida: true })}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Licencias Vencidas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, licencia_vencida: false })}
            disabled={loading}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <div className="mr-2 w-2 h-2 bg-green-500 rounded-full"></div>
            Licencias Vigentes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({ ...filters, es_activo: true })}
            disabled={loading}
          >
            Conductores Activos
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
