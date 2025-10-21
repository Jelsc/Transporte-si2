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
import { Search, Filter, X, Package, MapPin, Calendar, Truck, CreditCard } from 'lucide-react';

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
  loading?: boolean;
  conductoresDisponibles?: any[];
}

export function EncomiendaFiltersComponent({ 
  search,
  estadoFilter,
  ciudadFilter,
  fechaDesdeFilter,
  fechaHastaFilter,
  conductorFilter = "all",
  metodoPagoFilter = "all",
  onSearchChange,
  onEstadoFilterChange,
  onCiudadFilterChange,
  onFechaDesdeFilterChange,
  onFechaHastaFilterChange,
  onConductorFilterChange,
  onMetodoPagoFilterChange,
  onClearFilters,
  loading = false,
  conductoresDisponibles = []
}: EncomiendaFiltersProps) {
  const estados = [
    { value: "pendiente", label: "Pendiente" },
    { value: "en_ruta", label: "En Ruta" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" }
  ];

  const ciudades = ["La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosi", "Tarija", "Beni", "Pando"];
  
  const metodosPago = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "stripe", label: "Tarjeta" }
  ];

  const hasActiveFilters = 
    search || 
    estadoFilter !== "all" || 
    ciudadFilter !== "all" || 
    fechaDesdeFilter || 
    fechaHastaFilter ||
    conductorFilter !== "all" ||
    metodoPagoFilter !== "all";

  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case 'estado':
        return estados.find(e => e.value === value)?.label || value;
      case 'ciudad':
        return value;
      case 'metodo_pago':
        return metodosPago.find(m => m.value === value)?.label || value;
      case 'conductor':
        const conductor = conductoresDisponibles.find(c => c.id.toString() === value);
        return conductor ? conductor.nombre : value;
      default:
        return value;
    }
  };

  const removeFilter = (type: string) => {
    switch (type) {
      case 'search':
        onSearchChange('');
        break;
      case 'estado':
        onEstadoFilterChange('all');
        break;
      case 'ciudad':
        onCiudadFilterChange('all');
        break;
      case 'fecha_desde':
        onFechaDesdeFilterChange('');
        break;
      case 'fecha_hasta':
        onFechaHastaFilterChange('');
        break;
      case 'conductor':
        onConductorFilterChange('all');
        break;
      case 'metodo_pago':
        onMetodoPagoFilterChange('all');
        break;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
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
              Limpiar todo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda por código */}
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

          {/* Filtro por estado */}
          <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por ciudad */}
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

          {/* Filtro por método de pago */}
          <Select value={metodoPagoFilter} onValueChange={onMetodoPagoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              {metodosPago.map((metodo) => (
                <SelectItem key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por conductor */}
          <Select value={conductorFilter} onValueChange={onConductorFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Conductor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los conductores</SelectItem>
              <SelectItem value="sin_asignar">Sin conductor asignado</SelectItem>
              {conductoresDisponibles.map((conductor) => (
                <SelectItem key={conductor.id} value={conductor.id.toString()}>
                  {conductor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por fecha desde */}
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

          {/* Filtro por fecha hasta */}
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
                    onClick={() => removeFilter('search')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {estadoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                  <Package className="h-3 w-3" />
                  Estado: {getFilterLabel('estado', estadoFilter)}
                  <button
                    onClick={() => removeFilter('estado')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {ciudadFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                  <MapPin className="h-3 w-3" />
                  Ciudad: {getFilterLabel('ciudad', ciudadFilter)}
                  <button
                    onClick={() => removeFilter('ciudad')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {metodoPagoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                  <CreditCard className="h-3 w-3" />
                  Pago: {getFilterLabel('metodo_pago', metodoPagoFilter)}
                  <button
                    onClick={() => removeFilter('metodo_pago')}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {conductorFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm">
                  <Truck className="h-3 w-3" />
                  Conductor: {getFilterLabel('conductor', conductorFilter)}
                  <button
                    onClick={() => removeFilter('conductor')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {fechaDesdeFilter && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  Desde: {fechaDesdeFilter}
                  <button
                    onClick={() => removeFilter('fecha_desde')}
                    className="ml-1 hover:bg-amber-200 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {fechaHastaFilter && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  Hasta: {fechaHastaFilter}
                  <button
                    onClick={() => removeFilter('fecha_hasta')}
                    className="ml-1 hover:bg-amber-200 rounded-full p-0.5"
                    disabled={loading}
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