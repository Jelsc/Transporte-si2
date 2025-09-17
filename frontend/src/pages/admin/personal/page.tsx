"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePersonal } from "@/hooks/usePersonal";
import PersonalModal from "./components/PersonalModal";
import AdminLayout from "@/app/layout/admin-layout";
import type { Personal } from "@/types";

export default function PersonalPage() {
  const { data, loading, error, refetch } = usePersonal();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);

  const personal = data?.results || [];
  
  const filteredPersonal = personal.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ci.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (personal: Personal) => {
    setEditingPersonal(personal);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPersonal(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPersonal(null);
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      activo: "default",
      inactivo: "secondary",
      suspendido: "destructive",
      vacaciones: "outline",
    } as const;
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] || "secondary"}>
        {estado}
      </Badge>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando personal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar el personal</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
          <p className="text-muted-foreground">
            Gestiona el personal de la empresa
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Personal</CardTitle>
          <CardDescription>
            {personal.length} empleados registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o CI..."
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
                  <TableHead>CI</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonal.map((personal) => (
                  <TableRow key={personal.id}>
                    <TableCell className="font-medium">
                      {personal.nombre_completo}
                    </TableCell>
                    <TableCell>{personal.email}</TableCell>
                    <TableCell>{personal.ci}</TableCell>
                    <TableCell>
                      {personal.estado && getEstadoBadge(personal.estado)}
                    </TableCell>
                    <TableCell>{personal.departamento || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(personal)}>
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

          {filteredPersonal.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron empleados" : "No hay empleados registrados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PersonalModal
        personal={editingPersonal}
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
