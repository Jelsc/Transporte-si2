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
import { Search, Filter, X, Car } from 'lucide-react';
import type { VehiculoFilters } from '@/types';

interface VehiculoFiltersProps {
  search: string;
  tipoVehiculoFilter: string;
  estadoFilter: string;
  marcaFilter: string;
  onSearchChange: (value: string) => void;
  onTipoVehiculoFilterChange: (value: string) => void;
  onEstadoFilterChange: (value: string) => void;
  onMarcaFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function VehiculoFiltersComponent({ 
  search,
  tipoVehiculoFilter,
  estadoFilter,
  marcaFilter,
  onSearchChange,
  onTipoVehiculoFilterChange,
  onEstadoFilterChange,
  onMarcaFilterChange,
  onClearFilters,
  loading = false 
}: VehiculoFiltersProps) {
  const tiposVehiculo = ["Bus", "Bus Cama", "Minibús", "Camión", "Van"];
  const estados = ["activo", "mantenimiento", "baja"];
  const marcas = ["Mercedes-Benz", "Volvo", "Scania", "MAN", "Iveco", "Renault", "Ford", "Chevrolet", "Toyota", "Nissan"];

  const hasActiveFilters = search || tipoVehiculoFilter !== "all" || estadoFilter !== "all" || marcaFilter !== "all";

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, placa, marca..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <Select value={tipoVehiculoFilter} onValueChange={onTipoVehiculoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de vehículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {tiposVehiculo.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={marcaFilter} onValueChange={onMarcaFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {marcas.map((marca) => (
                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mostrar filtros activos */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Filtros activos:</span>
              
              {search && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  <Search className="h-3 w-3" />
                  "{search}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {tipoVehiculoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                  <Car className="h-3 w-3" />
                  Tipo: {tipoVehiculoFilter}
                  <button
                    onClick={() => onTipoVehiculoFilterChange('all')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {estadoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                  <Filter className="h-3 w-3" />
                  Estado: {estadoFilter}
                  <button
                    onClick={() => onEstadoFilterChange('all')}
                    className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {marcaFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                  <Car className="h-3 w-3" />
                  Marca: {marcaFilter}
                  <button
                    onClick={() => onMarcaFilterChange('all')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
