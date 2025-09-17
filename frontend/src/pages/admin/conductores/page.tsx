"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConductores } from "@/hooks/useConductores";
import ConductorModal from "./components/ConductorModal";
import AdminLayout from "@/app/layout/admin-layout";
import type { Conductor } from "@/types";

export default function ConductoresPage() {
  const { data, loading, error, refetch } = useConductores();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);

  const conductores = data?.results || [];
  
  const filteredConductores = conductores.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nro_licencia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (conductor: Conductor) => {
    setEditingConductor(conductor);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingConductor(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConductor(null);
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      disponible: "default",
      ocupado: "secondary",
      descanso: "outline",
      inactivo: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] || "secondary"}>
        {estado}
      </Badge>
    );
  };

  const getTipoLicenciaBadge = (tipo: string) => {
    const variants = {
      A: "default",
      B: "secondary",
      C: "outline",
      D: "destructive",
      E: "default",
    } as const;
    
    return (
      <Badge variant={variants[tipo as keyof typeof variants] || "secondary"}>
        Tipo {tipo}
      </Badge>
    );
  };

  const getLicenciaStatus = (conductor: Conductor) => {
    if (conductor.licencia_vencida) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencida
        </Badge>
      );
    }
    
    if (conductor.dias_para_vencer_licencia <= 30) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Por vencer ({conductor.dias_para_vencer_licencia} días)
        </Badge>
      );
    }
    
    return (
      <Badge variant="default">
        Válida
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando conductores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar los conductores</p>
          <Button onClick={refetch}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conductores</h1>
          <p className="text-muted-foreground">
            Gestiona los conductores del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Conductor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Conductores</CardTitle>
          <CardDescription>
            {conductores.length} conductores registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o número de licencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConductores.map((conductor) => (
                  <TableRow key={conductor.id}>
                    <TableCell className="font-medium">
                      {conductor.nombre_completo}
                    </TableCell>
                    <TableCell>{conductor.email}</TableCell>
                    <TableCell>{conductor.nro_licencia}</TableCell>
                    <TableCell>
                      {getTipoLicenciaBadge(conductor.tipo_licencia)}
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(conductor.estado)}
                    </TableCell>
                    <TableCell>
                      {getLicenciaStatus(conductor)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(conductor)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredConductores.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron conductores" : "No hay conductores registrados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConductorModal
        conductor={editingConductor}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm();
          refetch();
        }}
      />
      </div>
    </AdminLayout>
  );
}
