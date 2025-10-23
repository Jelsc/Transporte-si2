import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Truck, 
  Calendar, 
  AlertCircle, 
  Plus,
  Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Ubicacion, Vehiculo, Viaje } from '@/types';

interface CrearSolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SolicitudFormData {
  nombre: string;
  descripcion: string;
  tipo_optimizacion: 'vrp' | 'pdptw';
  vehiculos: number[];
  viajes: number[];
  ubicaciones: number[];
  fecha_entrega?: string;
  ventana_tiempo_inicio?: string;
  ventana_tiempo_fin?: string;
}

export default function CrearSolicitudModal({ isOpen, onClose, onSuccess }: CrearSolicitudModalProps) {
  const [formData, setFormData] = useState<SolicitudFormData>({
    nombre: '',
    descripcion: '',
    tipo_optimizacion: 'vrp',
    vehiculos: [],
    viajes: [],
    ubicaciones: [],
  });

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);
      const [ubicacionesRes, vehiculosRes, viajesRes] = await Promise.all([
        api.get('/api/ubicaciones/'),
        api.get('/api/vehiculos/'),
        api.get('/api/viajes/'),
      ]);

      setUbicaciones(ubicacionesRes.data.results || ubicacionesRes.data);
      setVehiculos(vehiculosRes.data.results || vehiculosRes.data);
      setViajes(viajesRes.data.results || viajesRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (formData.vehiculos.length === 0) {
      setError('Debes seleccionar al menos un vehículo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/rutas-optimizadas/solicitudes/', formData);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creando solicitud:', err);
      setError(err.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (
    field: 'vehiculos' | 'viajes' | 'ubicaciones',
    id: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((item) => item !== id)
        : [...prev[field], id],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Nueva Solicitud de Optimización
          </DialogTitle>
          <DialogDescription>
            Crea una nueva solicitud para optimizar rutas de transporte
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la solicitud *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Optimización rutas Mayo 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción opcional..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de optimización
                </label>
                <select
                  value={formData.tipo_optimizacion}
                  onChange={(e) => setFormData({ ...formData, tipo_optimizacion: e.target.value as 'vrp' | 'pdptw' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vrp">VRP (Vehicle Routing Problem)</option>
                  <option value="pdptw">PDPTW (Pickup and Delivery with Time Windows)</option>
                </select>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Vehículos * (Selecciona al menos uno)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {vehiculos.map((vehiculo) => (
                    <label
                      key={vehiculo.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.vehiculos.includes(vehiculo.id)}
                        onChange={() => toggleSelection('vehiculos', vehiculo.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{vehiculo.placa}</span>
                    </label>
                  ))}
                </div>
                {vehiculos.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No hay vehículos disponibles</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Viajes (Opcional)
                </h3>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {viajes.slice(0, 10).map((viaje) => (
                    <label
                      key={viaje.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.viajes.includes(viaje.id)}
                        onChange={() => toggleSelection('viajes', viaje.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Viaje #{viaje.id}
                      </span>
                    </label>
                  ))}
                </div>
                {viajes.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No hay viajes disponibles</p>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.vehiculos.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Solicitud
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
