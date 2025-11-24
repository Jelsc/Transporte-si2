import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonDataPoint {
  label: string;
  value1: number;
  value2: number;
  label1?: string;
  label2?: string;
}

interface RechartsComparisonChartProps {
  title: string;
  data: ComparisonDataPoint[];
  color1?: string;
  color2?: string;
  height?: number;
}

export const RechartsComparisonChart: React.FC<RechartsComparisonChartProps> = ({
  title,
  data,
  color1 = "#3b82f6",
  color2 = "#f59e0b",
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    name: point.label,
    [point.label1 || "Serie 1"]: point.value1,
    [point.label2 || "Serie 2"]: point.value2,
  }));

  const series1Name = data[0]?.label1 || "Serie 1";
  const series2Name = data[0]?.label2 || "Serie 2";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar
              dataKey={series1Name}
              fill={color1}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={series2Name}
              fill={color2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

