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
import { Search, Filter, X, Bus, MapPin, Calendar } from 'lucide-react';
import type { ViajeFilters } from '@/types';

interface ViajeFiltersProps {
  search: string;
  origenFilter: string;
  destinoFilter: string;
  fechaDesdeFilter: string;
  fechaHastaFilter: string;
  vehiculoFilter: string;
  estadoFilter: string;
  onSearchChange: (value: string) => void;
  onOrigenFilterChange: (value: string) => void;
  onDestinoFilterChange: (value: string) => void;
  onFechaDesdeFilterChange: (value: string) => void;
  onFechaHastaFilterChange: (value: string) => void;
  onVehiculoFilterChange: (value: string) => void;
  onEstadoFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function ViajeFiltersComponent({ 
  search,
  origenFilter,
  destinoFilter,
  fechaDesdeFilter,
  fechaHastaFilter,
  vehiculoFilter,
  estadoFilter,
  onSearchChange,
  onOrigenFilterChange,
  onDestinoFilterChange,
  onFechaDesdeFilterChange,
  onFechaHastaFilterChange,
  onVehiculoFilterChange,
  onEstadoFilterChange,
  onClearFilters,
  loading = false 
}: ViajeFiltersProps) {
  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosi", "Tarija", "Beni", "Pando"];
  const estados = ["programado", "en_curso", "completado", "cancelado"];

  const hasActiveFilters = 
    search || 
    origenFilter !== "all" || 
    destinoFilter !== "all" || 
    fechaDesdeFilter || 
    fechaHastaFilter || 
    vehiculoFilter !== "all" || 
    estadoFilter !== "all";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros de Búsqueda
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda general */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por origen, destino, vehículo..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        {/* Filtros específicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Origen */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Ciudad Origen
            </div>
            <Select 
              value={origenFilter} 
              onValueChange={onOrigenFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {ciudades.map((ciudad) => (
                  <SelectItem key={ciudad} value={ciudad}>
                    {ciudad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Ciudad Destino
            </div>
            <Select 
              value={destinoFilter} 
              onValueChange={onDestinoFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {ciudades.map((ciudad) => (
                  <SelectItem key={ciudad} value={ciudad}>
                    {ciudad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha Desde */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Fecha Desde
            </div>
            <Input
              type="date"
              value={fechaDesdeFilter}
              onChange={(e) => onFechaDesdeFilterChange(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Fecha Hasta */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Fecha Hasta
            </div>
            <Input
              type="date"
              value={fechaHastaFilter}
              onChange={(e) => onFechaHastaFilterChange(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehículo */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Bus className="h-4 w-4" />
              Vehículo
            </div>
            <Select 
              value={vehiculoFilter} 
              onValueChange={onVehiculoFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los vehículos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los vehículos</SelectItem>
                {/* Aquí se podrían cargar los vehículos disponibles */}
                <SelectItem value="1">Bus Interurbano 001</SelectItem>
                <SelectItem value="2">Bus Cama Premium</SelectItem>
                <SelectItem value="3">Minibús Ejecutivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Estado del Viaje
            </div>
            <Select 
              value={estadoFilter} 
              onValueChange={onEstadoFilterChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}