// frontend/src/services/backupService.ts
import { api } from "@/lib/api";

export interface BackupConfig {
  id: number;
  nombre: string;
  activo: boolean;
  frecuencia: "manual" | "daily" | "weekly" | "monthly";
  hora_ejecucion: string;
  dia_semana: number | null;
  dia_mes: number | null;
  max_backups: number;
  incluir_media: boolean;
  creado_por_nombre?: string;
  creado_en: string;
  actualizado_en: string;
  ultima_ejecucion: string | null;
  proximo_backup: string | null;
  modificado_por: number | null;
}

export interface Backup {
  id: number;
  config: number | null;
  config_nombre?: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tamanio: number;
  tamanio_legible: string;
  estado: "pending" | "processing" | "completed" | "failed";
  tipo: "database" | "full" | "media";
  inicio: string;
  fin: string | null;
  duracion: number | null;
  creado_por: number;
  mensaje_error: string | null;
}

export interface BackupStatistics {
  total_backups: number;
  completados: number;
  fallidos: number;
  tamanio_total: number;
  ultimo_backup: Backup | null;
}

export interface CreateBackupRequest {
  incluir_media?: boolean;
  tipo?: "database" | "full" | "media";
  descripcion?: string;
}

export interface CreateBackupConfigRequest {
  nombre: string;
  activo?: boolean;
  frecuencia: "manual" | "daily" | "weekly" | "monthly";
  hora_ejecucion?: string;
  dia_semana?: number | undefined;
  dia_mes?: number | undefined;
  max_backups?: number;
  incluir_media?: boolean;
}

class BackupService {
  // ========== Configuraciones de Backup ==========

  async listBackupConfigs(): Promise<BackupConfig[]> {
    const response = await api.get("/api/backups/configs/");
    // DRF puede retornar respuestas paginadas con format: { count, next, previous, results }
    return response.data.results || response.data;
  }

  async getBackupConfig(id: number): Promise<BackupConfig> {
    const response = await api.get(`/api/backups/configs/${id}/`);
    return response.data;
  }

  async createBackupConfig(
    data: CreateBackupConfigRequest
  ): Promise<BackupConfig> {
    const response = await api.post("/api/backups/configs/", data);
    return response.data;
  }

  async updateBackupConfig(
    id: number,
    data: Partial<CreateBackupConfigRequest>
  ): Promise<BackupConfig> {
    const response = await api.patch(`/api/backups/configs/${id}/`, data);
    return response.data;
  }

  async deleteBackupConfig(id: number): Promise<void> {
    await api.delete(`/api/backups/configs/${id}/`);
  }

  // ========== Backups ==========

  async listBackups(filters?: {
    estado?: string;
    tipo?: string;
    config_id?: number;
  }): Promise<Backup[]> {
    const response = await api.get("/api/backups/backups/", {
      params: filters,
    });
    // DRF puede retornar respuestas paginadas con format: { count, next, previous, results }
    return response.data.results || response.data;
  }

  async getBackup(id: number): Promise<Backup> {
    const response = await api.get(`/api/backups/backups/${id}/`);
    return response.data;
  }

  async createManualBackup(data?: CreateBackupRequest): Promise<{
    success: boolean;
    mensaje: string;
    backup: Backup;
  }> {
    const response = await api.post(
      "/api/backups/backups/crear_backup/",
      data || {}
    );
    return response.data;
  }

  async restoreBackup(
    id: number,
    confirmacion: boolean = true
  ): Promise<{
    success: boolean;
    mensaje?: string;
    error?: string;
  }> {
    const response = await api.post(`/api/backups/backups/${id}/restaurar/`, {
      confirmacion,
    });
    return response.data;
  }

  async downloadBackup(id: number): Promise<Blob> {
    const response = await api.get(`/api/backups/backups/${id}/descargar/`, {
      responseType: "blob",
    });
    return response.data;
  }

  async deleteBackup(id: number): Promise<{
    success: boolean;
    mensaje?: string;
    error?: string;
  }> {
    const response = await api.delete(
      `/api/backups/backups/${id}/eliminar_backup/`
    );
    return response.data;
  }

  async getStatistics(): Promise<{
    success: boolean;
    data: BackupStatistics;
  }> {
    const response = await api.get("/api/backups/backups/estadisticas/");
    return response.data;
  }

  // ========== Utilidades ==========

  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  getEstadoBadgeColor(estado: Backup["estado"]): string {
    const colors = {
      pending: "gray",
      processing: "blue",
      completed: "green",
      failed: "red",
    };
    return colors[estado] || "gray";
  }

  getEstadoLabel(estado: Backup["estado"]): string {
    const labels = {
      pending: "Pendiente",
      processing: "Procesando",
      completed: "Completado",
      failed: "Fallido",
    };
    return labels[estado] || estado;
  }

  getFrecuenciaLabel(frecuencia: BackupConfig["frecuencia"]): string {
    const labels = {
      manual: "Manual",
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
    };
    return labels[frecuencia] || frecuencia;
  }
}

export default new BackupService();
