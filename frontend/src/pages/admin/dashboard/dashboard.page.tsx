import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/app/layout/admin-layout";
import { StatCard } from "@/pages/admin/dashboard/components/StatCard";
import { RechartsLineChart } from "@/pages/admin/dashboard/components/RechartsLineChart";
import { RechartsBarChart } from "@/pages/admin/dashboard/components/RechartsBarChart";
import { RechartsAreaChart } from "@/pages/admin/dashboard/components/RechartsAreaChart";
import { RechartsComparisonChart } from "@/pages/admin/dashboard/components/RechartsComparisonChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usuariosApi } from "@/services/usuariosService";
import { vehiculosApi } from "@/services/vehiculosService";
import { conductoresApi } from "@/services/conductoresService";
import { viajesApi } from "@/services/viajesService";
import { analyticsService, type DashboardPredictions, type HistoricalDataPoint } from "@/services/analyticsService";
import { Bus, Users, UserCheck, Route, TrendingUp, Brain, RefreshCw, BarChart3, LineChart, AreaChart as AreaChartIcon, History, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Viaje } from "@/types";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    vehiculos: 0,
    conductores: 0,
    viajes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<DashboardPredictions | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [trainingModels, setTrainingModels] = useState(false);
  
  // Rangos de días para cada gráfico (7, 30, 60)
  const [demandaDays, setDemandaDays] = useState(7);
  const [ocupacionDays, setOcupacionDays] = useState(7);
  const [ingresosDays, setIngresosDays] = useState(7);
  const [comparacionDays, setComparacionDays] = useState(7);
  const [historicoDays, setHistoricoDays] = useState(7);
  
  // Predicciones por rango
  const [predictionsByRange, setPredictionsByRange] = useState<Record<number, DashboardPredictions | null>>({});
  
  // Datos históricos
  const [historicalData, setHistoricalData] = useState<Viaje[]>([]);
  const [historicalDataPoints, setHistoricalDataPoints] = useState<HistoricalDataPoint[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [historicalDataByRange, setHistoricalDataByRange] = useState<Record<number, HistoricalDataPoint[]>>({});
  
  // Loading por rango
  const [loadingByRange, setLoadingByRange] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  // Cargar estadísticas básicas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usuariosRes, vehiculosRes, conductoresRes, viajesRes] = await Promise.all([
          usuariosApi.list().catch(() => ({ data: { results: [] } })),
          vehiculosApi.list().catch(() => ({ data: { results: [] } })),
          conductoresApi.list().catch(() => ({ data: { results: [] } })),
          viajesApi.list().catch(() => ({ data: { results: [] } })),
        ]);

        setStats({
          usuarios: Array.isArray(usuariosRes?.data?.results)
            ? usuariosRes.data.results.length
            : Array.isArray(usuariosRes?.data)
            ? usuariosRes.data.length
            : 0,
          vehiculos: Array.isArray(vehiculosRes?.data?.results)
            ? vehiculosRes.data.results.length
            : Array.isArray(vehiculosRes?.data)
            ? vehiculosRes.data.length
            : 0,
          conductores: Array.isArray(conductoresRes?.data?.results)
            ? conductoresRes.data.results.length
            : Array.isArray(conductoresRes?.data)
            ? conductoresRes.data.length
            : 0,
          viajes: Array.isArray(viajesRes?.data?.results)
            ? viajesRes.data.results.length
            : Array.isArray(viajesRes?.data)
            ? viajesRes.data.length
            : 0,
        });
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Función para cargar predicciones con un rango específico
  const loadPredictionsForRange = async (days: number) => {
    try {
      // Si ya tenemos los datos en caché, usarlos
      if (predictionsByRange[days]) {
        return predictionsByRange[days];
      }

      // Mostrar loading
      setLoadingByRange(prev => ({ ...prev, [days]: true }));

      const response = await analyticsService.getDashboardPredictions(days);
      
      if (response.success && response.data) {
        setPredictionsByRange(prev => ({ ...prev, [days]: response.data || null }));
        return response.data;
      } else {
        console.warn("⚠️ Respuesta sin datos:", response);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Error cargando predicciones para ${days} días:`, error);
      return null;
    } finally {
      setLoadingByRange(prev => ({ ...prev, [days]: false }));
    }
  };

  // Función para cargar datos históricos desde la API de analytics
  const loadHistoricalData = async (days: number) => {
    // Si ya tenemos los datos en caché, usarlos
    if (historicalDataByRange[days]) {
      setHistoricalDataPoints(historicalDataByRange[days]);
      return;
    }

    setLoadingHistorical(true);
    try {
      const response = await analyticsService.getHistoricalData(days);
      
      if (response.success && response.data) {
        setHistoricalDataPoints(response.data);
        setHistoricalDataByRange(prev => ({ ...prev, [days]: response.data || [] }));
      }
    } catch (error) {
      console.error("Error cargando datos históricos:", error);
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Cargar predicciones iniciales (7 días)
  useEffect(() => {
    const loadPredictions = async () => {
      setLoadingPredictions(true);
      try {
        const data = await loadPredictionsForRange(7);
        if (data) {
          setPredictions(data);
        }
      } finally {
        setLoadingPredictions(false);
      }
    };

    loadPredictions();
    loadHistoricalData(7);
  }, []);

  const handleTrainModels = async () => {
    setTrainingModels(true);
    try {
      const response = await analyticsService.trainModels();
      if (response.success) {
        // Limpiar caché y recargar predicciones
        setPredictionsByRange({});
        const predictionsResponse = await analyticsService.getDashboardPredictions(7);
        if (predictionsResponse.success && predictionsResponse.data) {
          setPredictions(predictionsResponse.data);
          setPredictionsByRange({ 7: predictionsResponse.data });
        }
        alert("Modelos entrenados exitosamente");
      }
    } catch (error) {
      console.error("Error entrenando modelos:", error);
      alert("Error al entrenar los modelos. Verifique que haya suficientes datos históricos.");
    } finally {
      setTrainingModels(false);
    }
  };

  // Función helper para preparar datos de gráficos históricos
  const prepareHistoricalChartData = (historicalData: HistoricalDataPoint[], days: number) => {
    return historicalData.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.demanda_real,
      };
    });
  };

  const prepareHistoricalRevenueData = (historicalData: HistoricalDataPoint[], days: number) => {
    return historicalData.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.ingresos_reales,
      };
    });
  };

  const prepareHistoricalOccupancyData = (historicalData: HistoricalDataPoint[], days: number) => {
    return historicalData.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.ocupacion_promedio,
      };
    });
  };

  const prepareHistoricalComparisonData = (historicalData: HistoricalDataPoint[], days: number) => {
    return historicalData.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value1: p.demanda_real,
        value2: p.total_viajes,
        label1: "Demanda",
        label2: "Viajes",
      };
    });
  };

  // Funciones helper para preparar datos de predicciones (futuras)
  const preparePredictionChartData = (predData: DashboardPredictions | null, days: number) => {
    const data = predData?.predicciones_semana || [];
    return data.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.demanda_prevista,
      };
    });
  };

  const preparePredictionRevenueData = (predData: DashboardPredictions | null, days: number) => {
    const data = predData?.predicciones_semana || [];
    return data.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.ingresos_previstos,
      };
    });
  };

  const preparePredictionOccupancyData = (predData: DashboardPredictions | null, days: number) => {
    const data = predData?.predicciones_semana || [];
    return data.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value: p.ocupacion_promedio,
      };
    });
  };

  const preparePredictionComparisonData = (predData: DashboardPredictions | null, days: number) => {
    const data = predData?.predicciones_semana || [];
    return data.map((p) => {
      const fecha = new Date(p.fecha);
      const label = days <= 7 
        ? p.dia_semana.substring(0, 3) 
        : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        label,
        value1: p.demanda_prevista,
        value2: p.viajes_programados,
        label1: "Demanda",
        label2: "Viajes",
      };
    });
  };

  // Obtener datos históricos para tabs de Histórico y Demandas
  const demandaHistoricalData = historicalDataByRange[demandaDays] || historicalDataPoints;
  const historicoChartData = historicalDataByRange[historicoDays] || historicalDataPoints;

  // Obtener predicciones para tab de Predicciones
  const ocupacionPredictions = predictionsByRange[ocupacionDays] ?? predictions;
  const ingresosPredictions = predictionsByRange[ingresosDays] ?? predictions;
  const comparacionPredictions = predictionsByRange[comparacionDays] ?? predictions;

  // Preparar datos para gráficos históricos (tabs Histórico y Demandas)
  const chartData = prepareHistoricalChartData(demandaHistoricalData, demandaDays);

  // Preparar datos para gráficos de predicciones (tab Predicciones)
  const predictionOccupancyData = preparePredictionOccupancyData(ocupacionPredictions, ocupacionDays);
  const predictionRevenueData = preparePredictionRevenueData(ingresosPredictions, ingresosDays);
  const predictionComparisonData = preparePredictionComparisonData(comparacionPredictions, comparacionDays);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard Analítico</h1>
            <p className="text-muted-foreground">
              Panel de control con predicciones inteligentes usando Random Forest
            </p>
          </div>
          <Button
            onClick={handleTrainModels}
            disabled={trainingModels}
            className="flex items-center gap-2"
          >
            {trainingModels ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Entrenando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Entrenar Modelos
              </>
            )}
          </Button>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Buses"
                value={stats.vehiculos}
                subtitle="Vehículos activos"
                icon={<Bus className="h-5 w-5" />}
                color="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                onClick={() => navigate("/admin/vehiculos")}
                {...(predictions?.tendencias && {
                  trend: {
                    value: predictions.tendencias.crecimiento_viajes,
                    isPositive: predictions.tendencias.crecimiento_viajes > 0,
                  },
                })}
              />
              <StatCard
                title="Conductores"
                value={stats.conductores}
                subtitle="Conductores activos"
                icon={<UserCheck className="h-5 w-5" />}
                color="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                onClick={() => navigate("/admin/conductores")}
              />
              <StatCard
                title="Viajes"
                value={stats.viajes}
                subtitle="Total de viajes"
                icon={<Route className="h-5 w-5" />}
                color="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100"
                onClick={() => navigate("/admin/viajes")}
                {...(predictions?.tendencias && {
                  trend: {
                    value: predictions.tendencias.crecimiento_viajes,
                    isPositive: predictions.tendencias.crecimiento_viajes > 0,
                  },
                })}
              />
              <StatCard
                title="Usuarios"
                value={stats.usuarios}
                subtitle="Usuarios registrados"
                icon={<Users className="h-5 w-5" />}
                color="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100"
                onClick={() => navigate("/admin/usuarios")}
              />
            </>
          )}
        </div>

        {/* Sección de gráficos con tabs principales */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis y Predicciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="historico" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="historico" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="demanda" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Demandas
                </TabsTrigger>
                <TabsTrigger value="predicciones" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Predicciones
                </TabsTrigger>
                <TabsTrigger value="tendencias" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendencias y Análisis
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Histórico */}
              <TabsContent value="historico" className="mt-4">
                <Tabs 
                  value={historicoDays.toString()} 
                  onValueChange={async (value) => {
                    const days = parseInt(value);
                    setHistoricoDays(days);
                    await loadHistoricalData(days);
                  }}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="7">7 días</TabsTrigger>
                    <TabsTrigger value="30">30 días</TabsTrigger>
                    <TabsTrigger value="60">60 días</TabsTrigger>
                  </TabsList>
                  <TabsContent value="7">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        <RechartsLineChart
                          title="Viajes Históricos - 7 días"
                          data={historicoChartData.map(d => ({ label: d.dia_semana.substring(0, 3), value: d.total_viajes }))}
                          color="#3b82f6"
                          height={300}
                        />
                        <RechartsAreaChart
                          title="Ingresos Históricos - 7 días"
                          data={historicoChartData.map(d => ({ label: d.dia_semana.substring(0, 3), value: d.ingresos_reales }))}
                          color="#10b981"
                          height={300}
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="30">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        <RechartsLineChart
                          title="Viajes Históricos - 30 días"
                          data={historicoChartData.map(d => {
                            const fecha = new Date(d.fecha);
                            return { label: `${fecha.getDate()}/${fecha.getMonth() + 1}`, value: d.total_viajes };
                          })}
                          color="#3b82f6"
                          height={300}
                        />
                        <RechartsAreaChart
                          title="Ingresos Históricos - 30 días"
                          data={historicoChartData.map(d => {
                            const fecha = new Date(d.fecha);
                            return { label: `${fecha.getDate()}/${fecha.getMonth() + 1}`, value: d.ingresos_reales };
                          })}
                          color="#10b981"
                          height={300}
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="60">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        <RechartsLineChart
                          title="Viajes Históricos - 60 días"
                          data={historicoChartData.map(d => {
                            const fecha = new Date(d.fecha);
                            return { label: `${fecha.getDate()}/${fecha.getMonth() + 1}`, value: d.total_viajes };
                          })}
                          color="#3b82f6"
                          height={300}
                        />
                        <RechartsAreaChart
                          title="Ingresos Históricos - 60 días"
                          data={historicoChartData.map(d => {
                            const fecha = new Date(d.fecha);
                            return { label: `${fecha.getDate()}/${fecha.getMonth() + 1}`, value: d.ingresos_reales };
                          })}
                          color="#10b981"
                          height={300}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Tab Demandas */}
              <TabsContent value="demanda" className="mt-4">
                <Tabs 
                  value={demandaDays.toString()} 
                  onValueChange={async (value) => {
                    const days = parseInt(value);
                    setDemandaDays(days);
                    if (!historicalDataByRange[days]) {
                      await loadHistoricalData(days);
                    }
                  }}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="7">7 días</TabsTrigger>
                    <TabsTrigger value="30">30 días</TabsTrigger>
                    <TabsTrigger value="60">60 días</TabsTrigger>
                  </TabsList>
                  <TabsContent value="7">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <RechartsLineChart
                        title="Demanda Histórica - 7 días"
                        data={chartData}
                        color="#3b82f6"
                        height={300}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="30">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <RechartsLineChart
                        title="Demanda Histórica - 30 días"
                        data={chartData}
                        color="#3b82f6"
                        height={300}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="60">
                    {loadingHistorical ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-[300px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ) : (
                      <RechartsLineChart
                        title="Demanda Histórica - 60 días"
                        data={chartData}
                        color="#3b82f6"
                        height={300}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Tab Predicciones */}
              <TabsContent value="predicciones" className="mt-4">
                <div className="space-y-6">
                  {/* Ocupación */}
                  <Tabs 
                    value={ocupacionDays.toString()} 
                    onValueChange={async (value) => {
                      const days = parseInt(value);
                      setOcupacionDays(days);
                      if (!predictionsByRange[days]) {
                        await loadPredictionsForRange(days);
                      }
                    }}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="7">7 días</TabsTrigger>
                      <TabsTrigger value="30">30 días</TabsTrigger>
                      <TabsTrigger value="60">60 días</TabsTrigger>
                    </TabsList>
                    <TabsContent value="7">
                      {loadingByRange[7] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsBarChart
                          title="Ocupación Prevista (%) - 7 días"
                          data={preparePredictionOccupancyData(predictionsByRange[7] ?? predictions, 7)}
                          color="#8b5cf6"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="30">
                      {loadingByRange[30] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsBarChart
                          title="Ocupación Prevista (%) - 30 días"
                          data={preparePredictionOccupancyData(predictionsByRange[30] ?? predictions, 30)}
                          color="#8b5cf6"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="60">
                      {loadingByRange[60] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsBarChart
                          title="Ocupación Prevista (%) - 60 días"
                          data={preparePredictionOccupancyData(predictionsByRange[60] ?? predictions, 60)}
                          color="#8b5cf6"
                          height={300}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  {/* Ingresos */}
                  <Tabs 
                    value={ingresosDays.toString()} 
                    onValueChange={async (value) => {
                      const days = parseInt(value);
                      setIngresosDays(days);
                      if (!predictionsByRange[days]) {
                        await loadPredictionsForRange(days);
                      }
                    }}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="7">7 días</TabsTrigger>
                      <TabsTrigger value="30">30 días</TabsTrigger>
                      <TabsTrigger value="60">60 días</TabsTrigger>
                    </TabsList>
                    <TabsContent value="7">
                      {loadingByRange[7] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsAreaChart
                          title="Ingresos Previstos ($) - 7 días"
                          data={preparePredictionRevenueData(predictionsByRange[7] ?? predictions, 7)}
                          color="#10b981"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="30">
                      {loadingByRange[30] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsAreaChart
                          title="Ingresos Previstos ($) - 30 días"
                          data={preparePredictionRevenueData(predictionsByRange[30] ?? predictions, 30)}
                          color="#10b981"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="60">
                      {loadingByRange[60] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsAreaChart
                          title="Ingresos Previstos ($) - 60 días"
                          data={preparePredictionRevenueData(predictionsByRange[60] ?? predictions, 60)}
                          color="#10b981"
                          height={300}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  {/* Comparación */}
                  <Tabs 
                    value={comparacionDays.toString()} 
                    onValueChange={async (value) => {
                      const days = parseInt(value);
                      setComparacionDays(days);
                      if (!predictionsByRange[days]) {
                        await loadPredictionsForRange(days);
                      }
                    }}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="7">7 días</TabsTrigger>
                      <TabsTrigger value="30">30 días</TabsTrigger>
                      <TabsTrigger value="60">60 días</TabsTrigger>
                    </TabsList>
                    <TabsContent value="7">
                      {loadingByRange[7] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsComparisonChart
                          title="Demanda Prevista vs Viajes Programados - 7 días"
                          data={preparePredictionComparisonData(predictionsByRange[7] ?? predictions, 7)}
                          color1="#3b82f6"
                          color2="#f59e0b"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="30">
                      {loadingByRange[30] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsComparisonChart
                          title="Demanda Prevista vs Viajes Programados - 30 días"
                          data={preparePredictionComparisonData(predictionsByRange[30] ?? predictions, 30)}
                          color1="#3b82f6"
                          color2="#f59e0b"
                          height={300}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="60">
                      {loadingByRange[60] ? (
                        <Card>
                          <CardContent className="flex items-center justify-center h-[300px]">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ) : (
                        <RechartsComparisonChart
                          title="Demanda Prevista vs Viajes Programados - 60 días"
                          data={preparePredictionComparisonData(predictionsByRange[60] ?? predictions, 60)}
                          color1="#3b82f6"
                          color2="#f59e0b"
                          height={300}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
              
              {/* Tab Tendencias y Análisis */}
              <TabsContent value="tendencias" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Tendencias y Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {predictions?.tendencias ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Crecimiento de viajes</span>
                            <span
                              className={`text-lg font-semibold ${
                                predictions.tendencias.crecimiento_viajes > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {predictions.tendencias.crecimiento_viajes > 0 ? "+" : ""}
                              {predictions.tendencias.crecimiento_viajes.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                predictions.tendencias.crecimiento_viajes > 0
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.abs(predictions.tendencias.crecimiento_viajes))}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <div className="text-2xl font-bold">{predictions.tendencias.viajes_ultimo_mes}</div>
                            <div className="text-xs text-muted-foreground">Viajes último mes</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{predictions.tendencias.viajes_mes_anterior}</div>
                            <div className="text-xs text-muted-foreground">Viajes mes anterior</div>
                          </div>
                        </div>
                        {predictions?.modelo_entrenado && (
                          <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 text-green-600">
                              <Brain className="h-4 w-4" />
                              <span className="text-sm font-medium">Modelo entrenado y activo</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No hay datos de tendencias disponibles</p>
                        <p className="text-sm mt-2">
                          {predictions?.modelo_entrenado === false 
                            ? "Entrene los modelos para ver tendencias"
                            : "Los modelos aún no han sido entrenados o no hay datos suficientes"}
                        </p>
                        {!predictions?.modelo_entrenado && (
                          <Button
                            onClick={handleTrainModels}
                            disabled={trainingModels}
                            className="mt-4"
                            variant="outline"
                            size="sm"
                          >
                            {trainingModels ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Entrenando...
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                Entrenar Modelos
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
