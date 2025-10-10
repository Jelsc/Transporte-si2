// src/pages/client/MisReservas/components/MisReservasFilters.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface MisReservasFiltersProps {
  estadoFilter: string;
  pagoFilter: string;
  onEstadoFilterChange: (value: string) => void;
  onPagoFilterChange: (value: string) => void;
  loading: boolean;
}

export function MisReservasFilters({
  estadoFilter,
  pagoFilter,
  onEstadoFilterChange,
  onPagoFilterChange,
  loading,
}: MisReservasFiltersProps) {
  const handleClearFilters = () => {
    onEstadoFilterChange('all');
    onPagoFilterChange('all');
  };

  const hasActiveFilters = estadoFilter !== 'all' || pagoFilter !== 'all';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {/* Filtro por Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado-filter">Estado de Reserva</Label>
              <Select value={estadoFilter} onValueChange={onEstadoFilterChange} disabled={loading}>
                <SelectTrigger id="estado-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Pago */}
            <div className="space-y-2">
              <Label htmlFor="pago-filter">Estado de Pago</Label>
              <Select value={pagoFilter} onValueChange={onPagoFilterChange} disabled={loading}>
                <SelectTrigger id="pago-filter">
                  <SelectValue placeholder="Todos los pagos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="pendiente">Pendiente de pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón Limpiar Filtros */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
              className="sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {estadoFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Estado: {estadoFilter}
                <button
                  onClick={() => onEstadoFilterChange('all')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {pagoFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Pago: {pagoFilter}
                <button
                  onClick={() => onPagoFilterChange('all')}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}