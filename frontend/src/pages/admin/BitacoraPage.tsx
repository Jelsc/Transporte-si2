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
import { getBitacora } from "@/services/bitacoraService";
import type { BitacoraLog } from "@/types/bitacora";

const ITEMS_PER_PAGE = 10;

const BitacoraPage: React.FC = () => {
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [rol, setRol] = useState<string>(""); // filtro de rol

  const fetchLogs = async (pageNumber = 1, searchQuery = "", rolFilter = "") => {
    setLoading(true);
    try {
      const data = await getBitacora(pageNumber, searchQuery, rolFilter);
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
            <input
              type="text"
              placeholder="Buscar por usuario, acción, rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded p-2 w-full md:w-2/3"
            />

            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="border rounded p-2 w-full md:w-1/3"
            >
              <option value="">Todos los roles</option>
              <option value="Cliente">Cliente</option>
              <option value="Administrador">Administrador</option>
              <option value="Operador">Operador</option>
              <option value="Conductor">Conductor</option>
            </select>
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
                <button
                  onClick={() => fetchLogs(page - 1, search, rol)}
                  disabled={page === 1}
                  className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => fetchLogs(i + 1, search, rol)}
                    className={`px-2 py-1 text-sm border rounded ${
                      i + 1 === page ? "bg-blue-500 text-white" : ""
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => fetchLogs(page + 1, search, rol)}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default BitacoraPage;