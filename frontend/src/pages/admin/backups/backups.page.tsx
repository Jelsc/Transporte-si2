import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import backupService, {
  type Backup,
  type BackupConfig,
  type BackupStatistics,
} from "@/services/backupService";
import {
  Database,
  Download,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Settings,
  Play,
  AlertTriangle,
} from "lucide-react";
import { BackupConfigForm } from "./components/BackupConfigForm";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const BackupsPage: React.FC = () => {
  // Estados
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Diálogos
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BackupConfig | null>(null);
  const [restoreDialog, setRestoreDialog] = useState<Backup | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "backup" | "config";
    id: number;
  } | null>(null);
  const [createBackupDialog, setCreateBackupDialog] = useState(false);

  // Cargar datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsData, backupsData, statsData] = await Promise.all([
        backupService.listBackupConfigs(),
        backupService.listBackups(),
        backupService.getStatistics(),
      ]);
      setConfigs(configsData);
      setBackups(backupsData);
      setStatistics(statsData.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("No se pudieron cargar los datos de backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear backup manual
  const handleCreateManualBackup = async () => {
    setActionLoading("create-backup");
    try {
      const result = await backupService.createManualBackup({
        tipo: "database",
        incluir_media: false,
      });

      toast.success(result.mensaje || "Backup creado exitosamente");

      setCreateBackupDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear backup");
    } finally {
      setActionLoading(null);
    }
  };

  // Descargar backup
  const handleDownload = async (backup: Backup) => {
    setActionLoading(`download-${backup.id}`);
    try {
      const blob = await backupService.downloadBackup(backup.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Descargando ${backup.nombre_archivo}`);
    } catch (error) {
      toast.error("No se pudo descargar el backup");
    } finally {
      setActionLoading(null);
    }
  };

  // Restaurar backup
  const handleRestore = async () => {
    if (!restoreDialog) return;

    setActionLoading(`restore-${restoreDialog.id}`);
    try {
      const result = await backupService.restoreBackup(restoreDialog.id, true);

      if (result.success) {
        toast.success(result.mensaje || "Backup restaurado exitosamente");
      } else {
        throw new Error(result.error);
      }

      setRestoreDialog(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "No se pudo restaurar el backup");
    } finally {
      setActionLoading(null);
    }
  };

  // Eliminar backup
  const handleDelete = async () => {
    if (!deleteDialog) return;

    setActionLoading(`delete-${deleteDialog.id}`);
    try {
      if (deleteDialog.type === "backup") {
        await backupService.deleteBackup(deleteDialog.id);
        toast.success("El backup ha sido eliminado correctamente");
      } else {
        await backupService.deleteBackupConfig(deleteDialog.id);
        toast.success("La configuración ha sido eliminada correctamente");
      }

      setDeleteDialog(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar");
    } finally {
      setActionLoading(null);
    }
  };

  // Guardar configuración
  const handleSaveConfig = async (data: any) => {
    setActionLoading("save-config");
    try {
      if (editingConfig) {
        await backupService.updateBackupConfig(editingConfig.id, data);
        toast.success("La configuración ha sido actualizada correctamente");
      } else {
        await backupService.createBackupConfig(data);
        toast.success("La configuración ha sido creada correctamente");
      }

      setShowConfigDialog(false);
      setEditingConfig(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar");
    } finally {
      setActionLoading(null);
    }
  };

  // Renderizado de badges
  const renderEstadoBadge = (estado: Backup["estado"]) => {
    const variants: Record<
      Backup["estado"],
      { variant: any; icon: React.ReactNode; label: string }
    > = {
      completed: {
        variant: "default",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Completado",
      },
      failed: {
        variant: "destructive",
        icon: <XCircle className="w-3 h-3" />,
        label: "Fallido",
      },
      processing: {
        variant: "secondary",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        label: "Procesando",
      },
      pending: {
        variant: "outline",
        icon: <Clock className="w-3 h-3" />,
        label: "Pendiente",
      },
    };

    const config = variants[estado];
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Backups
            </h1>
            <p className="text-muted-foreground">
              Administra los backups automáticos y manuales de la base de datos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchData()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setCreateBackupDialog(true)} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Crear Backup Ahora
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Backups
                    </p>
                    <p className="text-2xl font-bold">
                      {statistics.total_backups}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completados
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.completados}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fallidos
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {statistics.fallidos}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tamaño Total
                    </p>
                    <p className="text-2xl font-bold">
                      {backupService.formatBytes(statistics.tamanio_total)}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="backups" className="w-full">
          <TabsList>
            <TabsTrigger value="backups">Backups Realizados</TabsTrigger>
            <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          </TabsList>

          {/* Tab: Backups */}
          <TabsContent value="backups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Backups</CardTitle>
                <CardDescription>
                  Lista de todos los backups realizados del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No hay backups registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium">
                            {backup.nombre_archivo}
                          </TableCell>
                          <TableCell>
                            {renderEstadoBadge(backup.estado)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{backup.tipo}</Badge>
                          </TableCell>
                          <TableCell>{backup.tamanio_legible}</TableCell>
                          <TableCell>
                            {format(
                              new Date(backup.inicio),
                              "dd/MM/yyyy HH:mm",
                              { locale: es }
                            )}
                          </TableCell>
                          <TableCell>
                            {backupService.formatDuration(backup.duracion)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {backup.estado === "completed" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDownload(backup)}
                                    disabled={
                                      actionLoading === `download-${backup.id}`
                                    }
                                  >
                                    {actionLoading ===
                                    `download-${backup.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRestoreDialog(backup)}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setDeleteDialog({
                                    type: "backup",
                                    id: backup.id,
                                  })
                                }
                                disabled={
                                  actionLoading === `delete-${backup.id}`
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configuraciones */}
          <TabsContent value="configs" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Configuraciones de Backup</CardTitle>
                  <CardDescription>
                    Administra las configuraciones de backups automáticos
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingConfig(null);
                    setShowConfigDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Configuración
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Retención</TableHead>
                      <TableHead>Último Backup</TableHead>
                      <TableHead>Próximo Backup</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No hay configuraciones registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      configs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">
                            {config.nombre}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={config.activo ? "default" : "secondary"}
                            >
                              {config.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {backupService.getFrecuenciaLabel(
                              config.frecuencia
                            )}
                          </TableCell>
                          <TableCell>{config.hora_ejecucion || "-"}</TableCell>
                          <TableCell>{config.max_backups} backups</TableCell>
                          <TableCell>
                            {config.ultima_ejecucion
                              ? format(
                                  new Date(config.ultima_ejecucion),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: es }
                                )
                              : "Nunca"}
                          </TableCell>
                          <TableCell>
                            {config.proximo_backup
                              ? format(
                                  new Date(config.proximo_backup),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: es }
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingConfig(config);
                                  setShowConfigDialog(true);
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setDeleteDialog({
                                    type: "config",
                                    id: config.id,
                                  })
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Crear backup manual */}
        <AlertDialog
          open={createBackupDialog}
          onOpenChange={setCreateBackupDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Crear Backup Manual</AlertDialogTitle>
              <AlertDialogDescription>
                Se creará un backup inmediato de la base de datos. Este proceso
                puede tardar varios minutos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading === "create-backup"}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateManualBackup}
                disabled={actionLoading === "create-backup"}
              >
                {actionLoading === "create-backup" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Backup"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog: Restaurar backup */}
        <AlertDialog
          open={!!restoreDialog}
          onOpenChange={() => setRestoreDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Restaurar Backup
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>¡ADVERTENCIA!</strong> Esta acción restaurará la base de
                datos al estado del backup seleccionado.{" "}
                <strong>Todos los datos actuales serán reemplazados</strong> y
                no se podrán recuperar a menos que exista otro backup más
                reciente.
                <br />
                <br />
                <strong>Archivo:</strong> {restoreDialog?.nombre_archivo}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!actionLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestore}
                disabled={!!actionLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  "Confirmar Restauración"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog: Eliminar */}
        <AlertDialog
          open={!!deleteDialog}
          onOpenChange={() => setDeleteDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas eliminar este{" "}
                {deleteDialog?.type === "backup" ? "backup" : "configuración"}?
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!actionLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!!actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog: Formulario de configuración */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Editar Configuración" : "Nueva Configuración"}
              </DialogTitle>
              <DialogDescription>
                Configura los parámetros para backups automáticos
              </DialogDescription>
            </DialogHeader>
            <BackupConfigForm
              config={editingConfig}
              onSave={handleSaveConfig}
              onCancel={() => {
                setShowConfigDialog(false);
                setEditingConfig(null);
              }}
              loading={actionLoading === "save-config"}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default BackupsPage;
