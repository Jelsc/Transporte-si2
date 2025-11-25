import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getBitacora } from "@/services/bitacoraService";
import type { BitacoraLog } from "@/types/bitacora";
import { FileText, DollarSign, Users, Settings, Truck, Calendar, CreditCard, Sparkles, Receipt, Shield, Database, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ITEMS_PER_PAGE = 10;

const BitacoraPage: React.FC = () => {
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [rol, setRol] = useState<string>("all");
  const [modulo, setModulo] = useState<string>("all");

  const fetchLogs = async (pageNumber = 1, searchQuery = "", rolFilter = "all", moduloFilter = "all") => {
    setLoading(true);
    try {
      // Convertir "all" a cadena vacía para el backend
      const actualRolFilter = rolFilter === "all" ? "" : rolFilter;
      const actualModuloFilter = moduloFilter === "all" ? "" : moduloFilter;
      const data = await getBitacora(pageNumber, searchQuery, actualRolFilter, actualModuloFilter);
      setLogs(data.results);
      setTotal(data.count);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error al cargar la bitácora:", error);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search, rol, modulo);
  }, [page, search, rol, modulo]);

  const getModuloIcon = (modulo?: string) => {
    switch (modulo) {
      case 'REPORTES':
        return <FileText className="w-4 h-4" />;
      case 'FACTURACION':
        return <Receipt className="w-4 h-4" />;
      case 'PAGOS':
        return <CreditCard className="w-4 h-4" />;
      case 'USUARIOS':
        return <Users className="w-4 h-4" />;
      case 'ADMINISTRACION':
        return <Settings className="w-4 h-4" />;
      case 'TRANSPORTE':
        return <Truck className="w-4 h-4" />;
      case 'RESERVAS':
        return <Calendar className="w-4 h-4" />;
      case 'AUTENTICACION':
        return <Lock className="w-4 h-4" />;
      case 'BACKUPS':
        return <Database className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getModuloColor = (modulo?: string) => {
    switch (modulo) {
      case 'REPORTES':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FACTURACION':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAGOS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'USUARIOS':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ADMINISTRACION':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'TRANSPORTE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RESERVAS':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'AUTENTICACION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BACKUPS':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModuloLabel = (modulo?: string) => {
    switch (modulo) {
      case 'REPORTES':
        return 'Reportes';
      case 'FACTURACION':
        return 'Facturación';
      case 'PAGOS':
        return 'Pagos';
      case 'USUARIOS':
        return 'Usuarios';
      case 'ADMINISTRACION':
        return 'Administración';
      case 'TRANSPORTE':
        return 'Transporte';
      case 'RESERVAS':
        return 'Reservas';
      case 'AUTENTICACION':
        return 'Autenticación';
      case 'BACKUPS':
        return 'Backups';
      case 'GENERAL':
        return 'General';
      default:
        return 'Todos los módulos';
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bitácora del Sistema</h1>
            <p className="text-muted-foreground">
              Visualiza la bitácora del sistema y auditoría de reportes y facturación
            </p>
          </div>
        </div>
      
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Bitácora del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador + Filtros */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="w-full">
                <Input
                  type="text"
                  placeholder="Buscar por usuario, acción, descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <Select
                    value={modulo}
                    onValueChange={(value: string) => setModulo(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por módulo">
                        {modulo === "all" ? "Todos los módulos" : getModuloLabel(modulo)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los módulos</SelectItem>
                      <SelectItem value="REPORTES">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Reportes
                        </div>
                      </SelectItem>
                      <SelectItem value="FACTURACION">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Facturación
                        </div>
                      </SelectItem>
                      <SelectItem value="PAGOS">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Pagos
                        </div>
                      </SelectItem>
                      <SelectItem value="AUTENTICACION">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Autenticación
                        </div>
                      </SelectItem>
                      <SelectItem value="BACKUPS">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Backups
                        </div>
                      </SelectItem>
                      <SelectItem value="USUARIOS">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Usuarios
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMINISTRACION">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Administración
                        </div>
                      </SelectItem>
                      <SelectItem value="TRANSPORTE">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Transporte
                        </div>
                      </SelectItem>
                      <SelectItem value="RESERVAS">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Reservas
                        </div>
                      </SelectItem>
                      <SelectItem value="GENERAL">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          General
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/2">
                  <Select
                    value={rol}
                    onValueChange={(value: string) => setRol(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Operador">Operador</SelectItem>
                      <SelectItem value="Conductor">Conductor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loading ? (
              <p>Cargando registros...</p>
            ) : logs.length === 0 ? (
              <p>No hay registros de actividad.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>Fecha/Hora</TableCell>
                        <TableCell>Módulo</TableCell>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Rol</TableCell>
                        <TableCell>Acción</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell className="hidden md:table-cell">IP</TableCell>
                        <TableCell className="hidden lg:table-cell">User Agent</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {log.fecha_hora
                              ? new Date(log.fecha_hora).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {log.modulo ? (
                              <Badge 
                                variant="outline" 
                                className={`${getModuloColor(log.modulo)} flex items-center gap-1 w-fit`}
                              >
                                {getModuloIcon(log.modulo)}
                                {log.modulo}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                General
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.usuario
                              ? `${log.usuario.first_name ?? ""} ${
                                  log.usuario.last_name ?? ""
                                }`.trim() || log.usuario.username
                              : "Sistema"}
                          </TableCell>
                          <TableCell>{log.usuario?.rol ?? "N/A"}</TableCell>
                          <TableCell className="font-medium">{log.accion ?? "-"}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={log.descripcion ?? "-"}>
                              {log.descripcion ?? "-"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <code className="text-xs bg-gray-100 px-1 rounded">
                              {log.ip ?? "-"}
                            </code>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="max-w-xs truncate text-xs text-gray-500" title={log.user_agent ?? "-"}>
                              {log.user_agent ?? "-"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => page > 1 && fetchLogs(page - 1, search, rol, modulo)}
                          size="default"
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNumber = i + 1;
                        const isActive = pageNumber === page;
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => fetchLogs(pageNumber, search, rol, modulo)}
                              isActive={isActive}
                              size="icon"
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => fetchLogs(totalPages, search, rol, modulo)}
                              isActive={page === totalPages}
                              size="icon"
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => page < totalPages && fetchLogs(page + 1, search, rol, modulo)}
                          size="default"
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BitacoraPage;