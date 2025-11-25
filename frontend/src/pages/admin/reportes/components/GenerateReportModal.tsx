import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import reportesService from "@/services/reportesService";
import type { GenerarReporteRequest } from "@/services/reportesService";

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  categoria: string;
}

export default function GenerateReportModal({
  open,
  onClose,
  categoria,
}: GenerateReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState<'pdf' | 'excel' | 'imagen'>('pdf');
  const [titulo, setTitulo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleGenerate = async () => {
    if (!formato) {
      toast.error("Por favor selecciona un formato");
      return;
    }

    setLoading(true);
    try {
      const request: GenerarReporteRequest = {
        tipo: formato,
        categoria: categoria as any,
        ...(titulo && { titulo }),
        ...(fechaInicio && { fecha_inicio: fechaInicio }),
        ...(fechaFin && { fecha_fin: fechaFin }),
      };

      const blob = await reportesService.generar(request);
      const nombreArchivo = reportesService.getNombreArchivo(
        formato,
        categoria,
        titulo
      );

      reportesService.descargarArchivo(blob, nombreArchivo);
      toast.success("Reporte generado exitosamente");
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error al generar reporte:", error);
      toast.error(error.response?.data?.error || "Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormato('pdf');
    setTitulo("");
    setFechaInicio("");
    setFechaFin("");
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generar Reporte de {categoria}</DialogTitle>
          <DialogDescription>
            Configura los parámetros para generar tu reporte
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Formato */}
          <div className="grid gap-2">
            <Label htmlFor="formato">Formato del Reporte *</Label>
            <Select value={formato} onValueChange={(value: any) => setFormato(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="imagen">Imagen (PNG)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título (opcional) */}
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título del Reporte (opcional)</Label>
            <Input
              id="titulo"
              placeholder="Ej: Reporte Mensual"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Fecha Inicio */}
          <div className="grid gap-2">
            <Label htmlFor="fecha_inicio">Fecha de Inicio (opcional)</Label>
            <Input
              id="fecha_inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Fecha Fin */}
          <div className="grid gap-2">
            <Label htmlFor="fecha_fin">Fecha de Fin (opcional)</Label>
            <Input
              id="fecha_fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generar Reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
