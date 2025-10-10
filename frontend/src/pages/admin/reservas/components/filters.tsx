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
import { Search, Filter, X, User, Calendar, CreditCard, Ticket, Hash, DollarSign } from 'lucide-react';
import type { ViajeOption, Cliente } from '@/types/reservas';

interface ReservaFiltersProps {
  search: string;
  clienteFilter: string;
  estadoPagoFilter: string;
  viajeFilter: string;
  estadoReservaFilter: string;
  codigoFilter: string;
  onSearchChange: (value: string) => void;
  onClienteFilterChange: (value: string) => void;
  onEstadoPagoFilterChange: (value: string) => void;
  onViajeFilterChange: (value: string) => void;
  onEstadoReservaFilterChange: (value: string) => void;
  onCodigoFilterChange: (value: string) => void;
  onClearFilters: () => void;
  loading?: boolean;
  clientesDisponibles: Cliente[];
  viajesDisponibles: ViajeOption[];
}

export function ReservaFiltersComponent({ 
  search,
  clienteFilter,
  estadoPagoFilter,
  viajeFilter,
  estadoReservaFilter = "all",
  codigoFilter = "",
  onSearchChange,
  onClienteFilterChange,
  onEstadoPagoFilterChange,
  onViajeFilterChange,
  onEstadoReservaFilterChange,
  onCodigoFilterChange,
  onClearFilters,
  loading = false,
  clientesDisponibles,
  viajesDisponibles
}: ReservaFiltersProps) {
  const estadosPago = [
    { value: "all", label: "Todos los estados de pago" },
    { value: "pagado", label: "Pagado" },
    { value: "pendiente", label: "Pendiente" },
  ];

  // Estados de reserva
  const estadosReserva = [
    { value: "all", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "confirmada", label: "Confirmada" },
    { value: "pagada", label: "Pagada" },
    { value: "cancelada", label: "Cancelada" },
  ];

  // ✅ CORREGIDO: Función para obtener nombre completo del cliente
  const getNombreCliente = (cliente: Cliente) => {
    return `${cliente.nombre} ${cliente.apellido}`;
  };

  // ✅ NUEVO: Función para obtener texto del filtro de cliente
  const getClienteFilterText = () => {
    if (clienteFilter === "all") return "Todos los clientes";
    const cliente = clientesDisponibles.find(c => c.id.toString() === clienteFilter);
    return cliente ? getNombreCliente(cliente) : "Cliente no encontrado";
  };

  // ✅ NUEVO: Función para obtener texto del filtro de viaje
  const getViajeFilterText = () => {
    if (viajeFilter === "all") return "Todos los viajes";
    const viaje = viajesDisponibles.find(v => v.id.toString() === viajeFilter);
    return viaje ? `${viaje.origen} → ${viaje.destino}` : "Viaje no encontrado";
  };

  const hasActiveFilters = search || 
    clienteFilter !== "all" || 
    estadoPagoFilter !== "all" || 
    viajeFilter !== "all" || 
    estadoReservaFilter !== "all" || 
    codigoFilter;

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
        {/* NUEVA FILA: Búsqueda por código y búsqueda general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por código de reserva..."
              value={codigoFilter}
              onChange={(e) => onCodigoFilterChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por cliente, viaje, asientos..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={loading}
              className="pl-10"
            />
          </div>
        </div>

        {/* ACTUALIZADO: 4 columnas para filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ✅ CORREGIDO: Cliente */}
          <Select value={clienteFilter} onValueChange={onClienteFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Cliente">
                {getClienteFilterText()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clientesDisponibles.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id.toString()}>
                  {/* ✅ CORREGIDO: Usar nombre y apellido en lugar de first_name y last_name */}
                  {getNombreCliente(cliente)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ✅ CORREGIDO: Estado pago */}
          <Select value={estadoPagoFilter} onValueChange={onEstadoPagoFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado pago">
                {estadosPago.find(e => e.value === estadoPagoFilter)?.label || "Estado pago"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {estadosPago.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ✅ CORREGIDO: Estado reserva */}
          <Select value={estadoReservaFilter} onValueChange={onEstadoReservaFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Estado reserva">
                {estadosReserva.find(e => e.value === estadoReservaFilter)?.label || "Estado reserva"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {estadosReserva.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ✅ CORREGIDO: Viaje */}
          <Select value={viajeFilter} onValueChange={onViajeFilterChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Viaje">
                {getViajeFilterText()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los viajes</SelectItem>
              {viajesDisponibles.map((viaje) => (
                <SelectItem key={viaje.id} value={viaje.id.toString()}>
                  {viaje.origen} → {viaje.destino} ({new Date(viaje.fecha).toLocaleDateString('es-ES')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ACTUALIZADO: Mostrar filtros activos */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Filtros activos:</span>
              
              {codigoFilter && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  <Ticket className="h-3 w-3" />
                  Código: "{codigoFilter}"
                  <button
                    onClick={() => onCodigoFilterChange('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {search && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  <Search className="h-3 w-3" />
                  Búsqueda: "{search}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {clienteFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                  <User className="h-3 w-3" />
                  Cliente: {getClienteFilterText()}
                  <button
                    onClick={() => onClienteFilterChange('all')}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {estadoPagoFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                  <CreditCard className="h-3 w-3" />
                  Pago: {estadoPagoFilter === 'pagado' ? 'Pagado' : 'Pendiente'}
                  <button
                    onClick={() => onEstadoPagoFilterChange('all')}
                    className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {estadoReservaFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                  <Hash className="h-3 w-3" />
                  Estado: {estadosReserva.find(e => e.value === estadoReservaFilter)?.label || estadoReservaFilter}
                  <button
                    onClick={() => onEstadoReservaFilterChange('all')}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {viajeFilter !== "all" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  Viaje: {getViajeFilterText()}
                  <button
                    onClick={() => onViajeFilterChange('all')}
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