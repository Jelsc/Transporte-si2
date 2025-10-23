import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FilterX, Calendar } from 'lucide-react';

interface ConductorOption {
  id: number;
  nombre: string;
}

interface EncomiendaFiltersProps {
  search: string;
  estadoFilter: string;
  ciudadFilter: string;
  fechaDesdeFilter: string;
  fechaHastaFilter: string;
  conductorFilter: string;
  metodoPagoFilter: string;
  onSearchChange: (value: string) => void;
  onEstadoFilterChange: (value: string) => void;
  onCiudadFilterChange: (value: string) => void;
  onFechaDesdeFilterChange: (value: string) => void;
  onFechaHastaFilterChange: (value: string) => void;
  onConductorFilterChange: (value: string) => void;
  onMetodoPagoFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
  conductoresDisponibles: ConductorOption[];
}

const estados = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_ruta', label: 'En Ruta' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ciudades = [
  { value: 'all', label: 'Todas las ciudades' },
  { value: 'La Paz', label: 'La Paz' },
  { value: 'Santa Cruz', label: 'Santa Cruz' },
  { value: 'Cochabamba', label: 'Cochabamba' },
  { value: 'Oruro', label: 'Oruro' },
  { value: 'Potosi', label: 'Potosi' },
  { value: 'Tarija', label: 'Tarija' },
  { value: 'Beni', label: 'Beni' },
  { value: 'Pando', label: 'Pando' },
];

const metodosPago = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
];

export function EncomiendaFiltersComponent({
  search,
  estadoFilter,
  ciudadFilter,
  fechaDesdeFilter,
  fechaHastaFilter,
  conductorFilter,
  metodoPagoFilter,
  onSearchChange,
  onEstadoFilterChange,
  onCiudadFilterChange,
  onFechaDesdeFilterChange,
  onFechaHastaFilterChange,
  onConductorFilterChange,
  onMetodoPagoFilterChange,
  onClearFilters,
  loading,
  conductoresDisponibles,
}: EncomiendaFiltersProps) {
  const hasActiveFilters = 
    search !== '' || 
    estadoFilter !== 'all' || 
    ciudadFilter !== 'all' || 
    fechaDesdeFilter !== '' || 
    fechaHastaFilter !== '' ||
    conductorFilter !== 'all' ||
    metodoPagoFilter !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilterX className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda por código */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código de Seguimiento</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por código..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por ciudad */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ciudad Destino</label>
            <Select value={ciudadFilter} onValueChange={onCiudadFilterChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                {ciudades.map((ciudad) => (
                  <SelectItem key={ciudad.value} value={ciudad.value}>
                    {ciudad.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por conductor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Conductor</label>
            <Select value={conductorFilter} onValueChange={onConductorFilterChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar conductor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los conductores</SelectItem>
                {conductoresDisponibles.map((conductor) => (
                  <SelectItem key={conductor.id} value={conductor.id.toString()}>
                    {conductor.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por método de pago */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Método de Pago</label>
            <Select value={metodoPagoFilter} onValueChange={onMetodoPagoFilterChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {metodosPago.map((metodo) => (
                  <SelectItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por fecha desde */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={fechaDesdeFilter}
                onChange={(e) => onFechaDesdeFilterChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filtro por fecha hasta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="date"
                value={fechaHastaFilter}
                onChange={(e) => onFechaHastaFilterChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <FilterX className="h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}