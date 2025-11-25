import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BackupConfig,
  type CreateBackupConfigRequest,
} from "@/services/backupService";
import { Loader2 } from "lucide-react";

interface BackupConfigFormProps {
  config: BackupConfig | null;
  onSave: (data: CreateBackupConfigRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const BackupConfigForm: React.FC<BackupConfigFormProps> = ({
  config,
  onSave,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBackupConfigRequest>({
    defaultValues: config
      ? {
          nombre: config.nombre,
          activo: config.activo,
          frecuencia: config.frecuencia,
          hora_ejecucion: config.hora_ejecucion || "00:00",
          dia_semana: config.dia_semana || undefined,
          dia_mes: config.dia_mes || undefined,
          max_backups: config.max_backups,
          incluir_media: config.incluir_media,
        }
      : {
          nombre: "",
          activo: true,
          frecuencia: "daily" as const,
          hora_ejecucion: "02:00",
          max_backups: 7,
          incluir_media: false,
        },
  });

  const frecuencia = watch("frecuencia");

  const onSubmit = (data: CreateBackupConfigRequest) => {
    // Limpiar campos no necesarios según la frecuencia
    const cleanedData = { ...data };

    if (
      cleanedData.frecuencia === "manual" ||
      cleanedData.frecuencia === "daily"
    ) {
      delete cleanedData.dia_semana;
      delete cleanedData.dia_mes;
    } else if (cleanedData.frecuencia === "weekly") {
      delete cleanedData.dia_mes;
    } else if (cleanedData.frecuencia === "monthly") {
      delete cleanedData.dia_semana;
    }

    onSave(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de la Configuración</Label>
        <Input
          id="nombre"
          {...register("nombre", { required: "El nombre es requerido" })}
          placeholder="Ej: Backup Diario"
        />
        {errors.nombre && (
          <p className="text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      {/* Estado activo */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="activo">Configuración Activa</Label>
          <p className="text-sm text-muted-foreground">
            Los backups se ejecutarán automáticamente según la frecuencia
            configurada
          </p>
        </div>
        <Switch
          id="activo"
          checked={watch("activo") || false}
          onCheckedChange={(checked) => setValue("activo", checked)}
        />
      </div>

      {/* Frecuencia */}
      <div className="space-y-2">
        <Label htmlFor="frecuencia">Frecuencia</Label>
        <Select
          value={watch("frecuencia")}
          onValueChange={(value: any) => setValue("frecuencia", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="daily">Diario</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hora de ejecución (solo si no es manual) */}
      {frecuencia !== "manual" && (
        <div className="space-y-2">
          <Label htmlFor="hora_ejecucion">Hora de Ejecución</Label>
          <Input
            id="hora_ejecucion"
            type="time"
            {...register("hora_ejecucion")}
          />
          <p className="text-sm text-muted-foreground">
            Hora del día en que se ejecutará el backup (formato 24 horas)
          </p>
        </div>
      )}

      {/* Día de la semana (solo para semanal) */}
      {frecuencia === "weekly" && (
        <div className="space-y-2">
          <Label htmlFor="dia_semana">Día de la Semana</Label>
          <Select
            value={watch("dia_semana")?.toString() || "1"}
            onValueChange={(value) => setValue("dia_semana", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Lunes</SelectItem>
              <SelectItem value="2">Martes</SelectItem>
              <SelectItem value="3">Miércoles</SelectItem>
              <SelectItem value="4">Jueves</SelectItem>
              <SelectItem value="5">Viernes</SelectItem>
              <SelectItem value="6">Sábado</SelectItem>
              <SelectItem value="0">Domingo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Día del mes (solo para mensual) */}
      {frecuencia === "monthly" && (
        <div className="space-y-2">
          <Label htmlFor="dia_mes">Día del Mes</Label>
          <Input
            id="dia_mes"
            type="number"
            min="1"
            max="31"
            {...register("dia_mes", {
              valueAsNumber: true,
              min: { value: 1, message: "Mínimo día 1" },
              max: { value: 31, message: "Máximo día 31" },
            })}
            placeholder="1-31"
          />
          {errors.dia_mes && (
            <p className="text-sm text-red-600">{errors.dia_mes.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Día del mes en que se ejecutará el backup (1-31)
          </p>
        </div>
      )}

      {/* Máximo de backups */}
      <div className="space-y-2">
        <Label htmlFor="max_backups">Retención (Máximo de Backups)</Label>
        <Input
          id="max_backups"
          type="number"
          min="1"
          {...register("max_backups", {
            valueAsNumber: true,
            required: "La retención es requerida",
            min: { value: 1, message: "Mínimo 1 backup" },
          })}
          placeholder="7"
        />
        {errors.max_backups && (
          <p className="text-sm text-red-600">{errors.max_backups.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Número máximo de backups a mantener. Los más antiguos se eliminarán
          automáticamente.
        </p>
      </div>

      {/* Incluir archivos media */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="incluir_media">Incluir Archivos Media</Label>
          <p className="text-sm text-muted-foreground">
            Incluye archivos subidos por usuarios (imágenes, documentos, etc.)
          </p>
        </div>
        <Switch
          id="incluir_media"
          checked={watch("incluir_media") || false}
          onCheckedChange={(checked) => setValue("incluir_media", checked)}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
};
