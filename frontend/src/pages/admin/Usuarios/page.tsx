"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUsuarios } from "@/hooks/useUsuarios";
import UsuarioModal from "./components/UsuarioModal";
import AdminLayout from "@/app/layout/admin-layout";
import type { User } from "@/services/api";

export default function UsuariosPage() {
  const { usuarios, loading, error, fetchUsuarios } = useUsuarios();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);

  // usuarios ya viene del hook
  
  const filteredUsuarios = usuarios.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (usuario: User) => {
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUsuario(null);
  };

  const getRolBadge = (rol: User['rol']) => {
    if (!rol) return <Badge variant="secondary">Sin rol</Badge>;
    
    const variants = {
      Administrador: "default",
      Supervisor: "secondary",
      Operador: "outline",
      Conductor: "outline",
      Cliente: "secondary",
    } as const;
    
    return (
      <Badge variant={variants[rol.nombre as keyof typeof variants] || "secondary"}>
        {rol.nombre}
      </Badge>
    );
  };

  const getAccesoAdminBadge = (usuario: User) => {
    if (usuario.is_admin_portal) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <UserIcon className="h-3 w-3" />
        Usuario
      </Badge>
    );
  };

  const getEstadoBadge = (activo: boolean) => {
    return (
      <Badge variant={activo ? "default" : "destructive"}>
        {activo ? "Activo" : "Inactivo"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar los usuarios</p>
          <Button onClick={fetchUsuarios}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {usuarios.length} usuarios registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o username..."
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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acceso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{usuario.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {usuario.first_name} {usuario.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      {getRolBadge(usuario.rol)}
                    </TableCell>
                    <TableCell>
                      {getAccesoAdminBadge(usuario)}
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(usuario.es_activo)}
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.fecha_creacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(usuario)}>
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

          {filteredUsuarios.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UsuarioModal
        usuario={editingUsuario || undefined}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm();
          fetchUsuarios();
        }}
      />
      </div>
    </AdminLayout>
  );
}