import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, MapPin } from 'lucide-react';
import { TIPO_UBICACION_OPTIONS } from '../../../../types';

interface UbicacionFiltersComponentProps {
  search: string;
  tipoFilter: string;
  activoFilter: string;
  onSearchChange: (value: string) => void;
  onTipoFilterChange: (value: string) => void;
  onActivoFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function UbicacionFiltersComponent({ 
  search,
  tipoFilter,
  activoFilter,
  onSearchChange,
  onTipoFilterChange,
  onActivoFilterChange,
  onClearFilters,
  loading = false 
}: UbicacionFiltersComponentProps) {
  const hasActiveFilters = search || tipoFilter !== "all" || activoFilter !== "all";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={loading}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre o dirección..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <Select value={tipoFilter} onValueChange={onTipoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPO_UBICACION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activoFilter} onValueChange={onActivoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="true">Activas</SelectItem>
              <SelectItem value="false">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}