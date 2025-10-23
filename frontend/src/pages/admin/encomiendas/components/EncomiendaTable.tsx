import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Encomienda } from '@/types/encomienda';

interface EncomiendaTableProps {
  data: Encomienda[];
  loading: boolean;
  onEdit: (encomienda: Encomienda) => void;
  onDelete: (encomienda: Encomienda) => void;
  onView: (encomienda: Encomienda) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const estadosConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_ruta: { label: 'En Ruta', color: 'bg-blue-100 text-blue-800', icon: Truck },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const estadosPagoConfig = {
  pendiente: { label: 'Pago Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  completado: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  fallido: { label: 'Pago Fallido', color: 'bg-red-100 text-red-800' },
  procesando: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
};

export function EncomiendaTable({
  data,
  loading,
  onEdit,
  onDelete,
  onView,
  page,
  totalPages,
  onPageChange,
}: EncomiendaTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEstadoPago = (encomienda: Encomienda) => {
    return encomienda.estado_pago || 'pendiente';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando encomiendas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay encomiendas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron encomiendas con los filtros actuales.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((encomienda) => {
              const estadoConfig = estadosConfig[encomienda.estado as keyof typeof estadosConfig] || estadosConfig.pendiente;
              const EstadoIcon = estadoConfig.icon;
              const estadoPago = getEstadoPago(encomienda);
              const pagoConfig = estadosPagoConfig[estadoPago as keyof typeof estadosPagoConfig] || estadosPagoConfig.pendiente;

              return (
                <TableRow key={encomienda.id}>
                  <TableCell className="font-mono font-medium">
                    {encomienda.codigo_seguimiento}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{encomienda.destinatario_nombre}</div>
                      <div className="text-sm text-gray-500">{encomienda.destinatario_telefono}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{encomienda.destino_ciudad}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {encomienda.destino_direccion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${estadoConfig.color} flex items-center gap-1 w-fit`}>
                      <EstadoIcon className="h-3 w-3" />
                      {estadoConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pagoConfig.color}>
                      {pagoConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    Bs. {encomienda.precio?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {formatDate(encomienda.fecha_creacion)}
                  </TableCell>
                  <TableCell>
                    {encomienda.conductor_nombre ? (
                      <span className="text-sm">{encomienda.conductor_nombre}</span>
                    ) : (
                      <span className="text-sm text-gray-400">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(encomienda)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(encomienda)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(encomienda)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}