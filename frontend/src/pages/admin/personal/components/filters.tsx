import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import type { PersonalFilters } from "@/types";

interface PersonalFiltersProps {
  filters: PersonalFilters;
  onFiltersChange: (filters: PersonalFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function PersonalFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}: PersonalFiltersProps) {
  const handleSearchChange = (value: string) => {
    const next = { ...filters };
    if (!value) {
      delete (next as any).search;
    } else {
      next.search = value;
    }
    onFiltersChange(next);
  };

  const handleDepartamentoChange = (value: string) => {
    const next = { ...filters };
    if (value === "all") {
      delete (next as any).departamento;
    } else {
      next.departamento = value;
    }
    onFiltersChange(next);
  };

  const handleEstadoChange = (value: string) => {
    const next = { ...filters };
    if (value === "all") {
      delete (next as any).estado;
    } else {
      next.estado = value;
    }
    onFiltersChange(next);
  };

  const handleActivoChange = (value: string) => {
    const next = { ...filters };
    if (value === "all") {
      delete (next as any).es_activo;
    } else {
      next.es_activo = value === "true";
    }
    onFiltersChange(next);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
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
                placeholder="Nombre, apellido, email..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Select
              value={filters.departamento || "all"}
              onValueChange={handleDepartamentoChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                <SelectItem value="Administración">Administración</SelectItem>
                <SelectItem value="Recursos Humanos">
                  Recursos Humanos
                </SelectItem>
                <SelectItem value="Operaciones">Operaciones</SelectItem>
                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="Ventas">Ventas</SelectItem>
                <SelectItem value="Atención al Cliente">
                  Atención al Cliente
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={filters.estado || "all"}
              onValueChange={handleEstadoChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activo/Inactivo */}
          <div className="space-y-2">
            <Label htmlFor="activo">Estado del Sistema</Label>
            <Select
              value={
                filters.es_activo === undefined
                  ? "all"
                  : filters.es_activo.toString()
              }
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

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasActiveFilters ? "Filtros activos" : "Sin filtros aplicados"}
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
