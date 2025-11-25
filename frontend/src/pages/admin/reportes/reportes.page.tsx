import { useState, useEffect } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, Clock, Download, Sparkles, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import ReportCardComponent from "./components/ReportCard";
import GenerateReportModal from "./components/GenerateReportModal";
import { REPORT_CATEGORIES } from "./types/report.types";
import reportesService from "@/services/reportesService";
import type { EstadisticasReportes, DatosReporte, RespuestaMultiReporte } from "@/services/reportesService";
import VoiceInputButton from "@/components/voice/VoiceInputButton";

export default function ReportesPage() {
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReportes | null>(null);
  
  // Estados para reportes inteligentes
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportes, setReportes] = useState<DatosReporte[]>([]);

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

  // Funciones para reportes inteligentes
  const generarReporte = async (formato: 'pantalla' | 'pdf' | 'excel', promptOverride?: string) => {
    const promptToUse = typeof promptOverride === 'string' ? promptOverride : prompt;

    if (!promptToUse.trim()) {
      toast.error('Escribe un comando primero');
      return;
    }

    try {
      setLoading(true);
      toast.info(`Generando reporte en ${formato.toUpperCase()}...`);

      const resultado = await reportesService.generarReporte(promptToUse, formato);

      if (formato === 'pantalla') {
        // Verificar si es múltiple o único
        if ('reportes' in resultado && Array.isArray(resultado.reportes)) {
          setReportes(resultado.reportes);
          toast.success(`${resultado.cantidad_reportes} reporte(s) generado(s) exitosamente`);
        } else {
          setReportes([resultado as DatosReporte]);
          toast.success('Reporte generado exitosamente');
        }
      } else {
        const archivo = resultado as { blob: Blob; filename: string };

        try {
          reportesService.descargarArchivo(archivo.blob, archivo.filename);
          toast.success(`Reporte ${formato.toUpperCase()} descargado: ${archivo.filename}`);
        } catch (downloadError: any) {
          console.error('Error al descargar:', downloadError);
          toast.error('Error al descargar el archivo: ' + downloadError.message);
        }
      }
    } catch (error: any) {
      console.error('Error al generar reporte:', error);
      toast.error(error.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const ejemplos = [
    'Quiero un reporte de viajes del mes de noviembre, agrupado por origen, en PDF',
    'Quiero un reporte en Excel que muestre las encomiendas del periodo del 01/10/2024 al 01/01/2025 agrupado por ciudad',
    'Generar reporte de pagos de los últimos 30 días agrupado por método de pago',
    'Mostrar viajes del último mes por destino Y también mostrar encomiendas por estado',
    'Quiero ver 2 reportes: primero los viajes por vehículo del mes actual y segundo el reporte de conductores',
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Reportes
          </h1>
          <p className="text-gray-600 mt-2">
            Genera reportes en PDF, Excel o Imagen usando lenguaje natural o categorías predefinidas
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

        {/* Tabs para Reportes Inteligentes y Categorías */}
        <Tabs defaultValue="inteligente" className="w-full">
          <TabsList>
            <TabsTrigger value="inteligente">
              <Sparkles className="w-4 h-4 mr-2" />
              Reportes Inteligentes
            </TabsTrigger>
            <TabsTrigger value="categorias">
              <FileText className="w-4 h-4 mr-2" />
              Por Categorías
            </TabsTrigger>
          </TabsList>

          {/* Tab: Reportes Inteligentes */}
          <TabsContent value="inteligente" className="space-y-6">
            {/* Input de comando */}
            <Card>
              <CardHeader>
                <CardTitle>Comando para Reporte</CardTitle>
                <CardDescription>
                  Describe el reporte que deseas generar en lenguaje natural
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Ej: Quiero un reporte de viajes del mes de septiembre, agrupado por origen, en PDF"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="resize-none pr-12"
                  />
                  <div className="absolute bottom-3 right-3">
                    <VoiceInputButton
                      onTranscript={(text) => {
                        // Agregar el texto reconocido al prompt existente o reemplazarlo
                        const textoCompleto = prompt.trim() ? `${prompt.trim()} ${text}` : text;
                        setPrompt(textoCompleto);
                        
                        // Detectar formato en el texto completo
                        const textoLower = textoCompleto.toLowerCase();
                        let formatoDetectado: 'pantalla' | 'pdf' | 'excel' | null = null;
                        
                        // Detectar formato PDF
                        if (textoLower.includes(' en pdf') || 
                            textoLower.includes(' en formato pdf') || 
                            textoLower.includes(' formato pdf') ||
                            textoLower.endsWith(' pdf') ||
                            textoLower.includes(' generar pdf') ||
                            textoLower.includes(' descargar pdf')) {
                          formatoDetectado = 'pdf';
                        } 
                        // Detectar formato Excel
                        else if (textoLower.includes(' en excel') || 
                                 textoLower.includes(' en formato excel') || 
                                 textoLower.includes(' formato excel') ||
                                 textoLower.endsWith(' excel') ||
                                 textoLower.includes(' generar excel') ||
                                 textoLower.includes(' descargar excel')) {
                          formatoDetectado = 'excel';
                        }
                        
                        // Si se detectó un formato, generar y descargar automáticamente
                        if (formatoDetectado) {
                          toast.info(`Formato ${formatoDetectado.toUpperCase()} detectado. Generando reporte...`);
                          setTimeout(() => {
                            generarReporte(formatoDetectado!, textoCompleto);
                          }, 300); // Pequeño delay para asegurar que el prompt se actualizó
                        } else {
                          toast.success("Texto reconocido. Agrega 'en PDF' o 'en Excel' para descargar automáticamente.");
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex-1" />

                  <Button
                    onClick={() => generarReporte('pantalla')}
                    variant="outline"
                    disabled={loading || !prompt.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Vista Previa
                  </Button>

                  <Button
                    onClick={() => generarReporte('pdf')}
                    variant="default"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={loading || !prompt.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generar PDF
                  </Button>

                  <Button
                    onClick={() => generarReporte('excel')}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading || !prompt.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Generar Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ejemplos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ejemplos de Comandos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ejemplos.map((ejemplo, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(ejemplo)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                    >
                      💡 {ejemplo}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resultados - Solo para formato pantalla */}
            {reportes.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Vista Previa en Pantalla</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReportes([])}
                  >
                    Limpiar
                  </Button>
                </div>
                {reportes.map((reporte, reporteIndex) => (
                  <Card key={reporteIndex}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {reportes.length > 1 && (
                            <Badge className="mb-2">Reporte {reporteIndex + 1} de {reportes.length}</Badge>
                          )}
                          <CardTitle>{reporte.titulo}</CardTitle>
                          <CardDescription>{reporte.subtitulo}</CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {reporte.total_registros} registros
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reporte.datos && reporte.datos.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                {reporte.columnas.map((columna, index) => (
                                  <th key={index} className="border border-gray-300 px-4 py-2 text-left font-bold">
                                    {columna}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {reporte.datos.map((fila, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {reporte.columnas.map((columna, colIndex) => {
                                    // Normalizar la clave
                                    let key = columna.toLowerCase();
                                    key = key.replace(/ de /g, '_').replace(/ del /g, '_').replace(/ la /g, '_');
                                    key = key.replace(/ /g, '_');
                                    key = key.replace(/á/g, 'a').replace(/é/g, 'e')
                                      .replace(/í/g, 'i').replace(/ó/g, 'o')
                                      .replace(/ú/g, 'u');
                                    
                                    const valor = fila[key];
                                    
                                    return (
                                      <td key={colIndex} className="border border-gray-300 px-4 py-2">
                                        {typeof valor === 'number' && (key.includes('total') || key.includes('monto') || key.includes('precio') || key.includes('ingreso'))
                                          ? `Bs ${valor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          : valor ?? '-'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No hay datos para mostrar
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Por Categorías */}
          <TabsContent value="categorias" className="space-y-6">
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
          </TabsContent>
        </Tabs>

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
