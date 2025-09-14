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
import { Button } from "@/components/ui/button";
import { getBitacora } from "@/services/bitacoraService";
import type { BitacoraLog } from "@/types/bitacora";

const ITEMS_PER_PAGE = 10;

const BitacoraPage: React.FC = () => {
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [rol, setRol] = useState<string>("all");

  const fetchLogs = async (pageNumber = 1, searchQuery = "", rolFilter = "all") => {
    setLoading(true);
    try {
      // Convertir "all" a cadena vacía para el backend
      const actualRolFilter = rolFilter === "all" ? "" : rolFilter;
      const data = await getBitacora(pageNumber, searchQuery, actualRolFilter);
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
    fetchLogs(page, search, rol);
  }, [page, search, rol]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bitácora del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Buscador + Filtro */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-2/3">
              <Input
                type="text"
                placeholder="Buscar por usuario, acción, rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-1/3">
              <Select
                value={rol}
                onValueChange={(value: string) => setRol(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
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
                      <TableCell>Usuario</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Acción</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell>User Agent</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.fecha_hora
                            ? new Date(log.fecha_hora).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {log.usuario
                            ? `${log.usuario.first_name ?? ""} ${
                                log.usuario.last_name ?? ""
                              }`.trim()
                            : "Sistema"}
                        </TableCell>
                        <TableCell>{log.usuario?.rol ?? "N/A"}</TableCell>
                        <TableCell>{log.accion ?? "-"}</TableCell>
                        <TableCell>{log.descripcion ?? "-"}</TableCell>
                        <TableCell>
                          <div className="hidden md:block">{log.ip ?? "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="hidden lg:block">
                            {log.user_agent ?? "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex justify-center mt-4 gap-2 flex-wrap">
                <Button
                  onClick={() => fetchLogs(page - 1, search, rol)}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    onClick={() => fetchLogs(i + 1, search, rol)}
                    variant={i + 1 === page ? "default" : "outline"}
                    size="sm"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => fetchLogs(page + 1, search, rol)}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default BitacoraPage;