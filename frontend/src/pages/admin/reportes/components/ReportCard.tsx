import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import type { ReportCard } from "../types/report.types";

interface ReportCardProps {
  report: ReportCard;
  onGenerate: (categoria: string) => void;
}

export default function ReportCardComponent({ report, onGenerate }: ReportCardProps) {
  const Icon = Icons[report.icon as keyof typeof Icons] as React.FC<{ className?: string }>;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[report.color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{report.titulo}</h3>
      <p className="text-sm text-gray-600 mb-4">{report.descripcion}</p>
      <Button
        onClick={() => onGenerate(report.categoria)}
        className="w-full"
        variant="outline"
      >
        Generar Reporte
      </Button>
    </Card>
  );
}
