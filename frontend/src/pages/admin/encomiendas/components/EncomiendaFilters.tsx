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
import { Search, Filter, X, Package, MapPin, Calendar } from 'lucide-react';

interface EncomiendaFiltersProps {
  search: string;
  estadoFilter: string;
  ciudadFilter: string;
  fechaDesdeFilter: string;
  fechaHastaFilter: string;
  onSearchChange: (value: string) => void;
  onEstadoFilterChange: (value: string) => void;
  onCiudadFilterChange: (value: string) => void;
  onFechaDesdeFilterChange: (value: string) => void;
  onFechaHastaFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function EncomiendaFiltersComponent({ 
  search,
  estadoFilter,
  ciudadFilter,
  fechaDesdeFilter,
  fechaHastaFilter,
  onSearchChange,
  onEstadoFilterChange,
  onCiudadFilterChange,
  onFechaDesdeFilterChange,
  onFechaHastaFilterChange,
  onClearFilters,
  loading = false 
}: EncomiendaFiltersProps) {
  const estados = ["pendiente", "en_ruta", "entregado", "cancelado"];
  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosi", "Tarija", "Beni", "Pando"];

  const hasActiveFilters = search || estadoFilter !== "all" || ciudadFilter !== "all" || fechaDesdeFilter || fechaHastaFilter;

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por código..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ciudadFilter} onValueChange={onCiudadFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Ciudad destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {ciudades.map((ciudad) => (
                <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="Fecha desde"
              value={fechaDesdeFilter}
              onChange={(e) => onFechaDesdeFilterChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="Fecha hasta"
              value={fechaHastaFilter}
              onChange={(e) => onFechaHastaFilterChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>
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
              
              {estadoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                  <Package className="h-3 w-3" />
                  Estado: {estadoFilter}
                  <button
                    onClick={() => onEstadoFilterChange('all')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {ciudadFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                  <MapPin className="h-3 w-3" />
                  Ciudad: {ciudadFilter}
                  <button
                    onClick={() => onCiudadFilterChange('all')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {fechaDesdeFilter && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  Desde: {fechaDesdeFilter}
                  <button
                    onClick={() => onFechaDesdeFilterChange('')}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {fechaHastaFilter && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  Hasta: {fechaHastaFilter}
                  <button
                    onClick={() => onFechaHastaFilterChange('')}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
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