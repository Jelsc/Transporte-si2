import { useState, useEffect } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, Download } from "lucide-react";
import ReportCardComponent from "./components/ReportCard";
import GenerateReportModal from "./components/GenerateReportModal";
import { REPORT_CATEGORIES } from "./types/report.types";
import reportesService from "@/services/reportesService";
import type { EstadisticasReportes } from "@/services/reportesService";

export default function ReportesPage() {
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReportes | null>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const data = await reportesService.obtenerEstadisticas();
      setEstadisticas(data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const handleGenerate = (categoria: string) => {
    setSelectedCategoria(categoria);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCategoria(null);
    // Recargar estadísticas después de generar un reporte
    cargarEstadisticas();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-gray-600 mt-2">
            Genera reportes en PDF, Excel o Imagen de diferentes módulos del sistema
          </p>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reportes</p>
                  <p className="text-2xl font-bold">{estadisticas.total_reportes}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold">{estadisticas.reportes_mes}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">PDFs Generados</p>
                  <p className="text-2xl font-bold">{estadisticas.por_tipo.pdf}</p>
                </div>
                <Download className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Excel Generados</p>
                  <p className="text-2xl font-bold">{estadisticas.por_tipo.excel}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Grid de Reportes Disponibles */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tipos de Reportes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_CATEGORIES.map((report) => (
              <ReportCardComponent
                key={report.id}
                report={report}
                onGenerate={handleGenerate}
              />
            ))}
          </div>
        </div>

        {/* Modal de Generación */}
        {selectedCategoria && (
          <GenerateReportModal
            open={modalOpen}
            onClose={handleCloseModal}
            categoria={selectedCategoria}
          />
        )}
      </div>
    </AdminLayout>
  );
}
