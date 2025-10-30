import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, CheckCircle } from 'lucide-react';
import type { Ubicacion, UbicacionCreate, TipoUbicacion, SourceUbicacion } from '@/types';
import { TIPO_UBICACION_OPTIONS } from '@/types';
import { UbicacionesService } from '@/services/ubicacionesService';
import { MapaUbicaciones } from '@/components/mapa-ubicacion';
import toast from 'react-hot-toast';

interface UbicacionStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UbicacionCreate) => Promise<boolean>;
  initialData?: Ubicacion | null;
  loading?: boolean;
}

export function UbicacionStore({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false
}: UbicacionStoreProps) {
  const isEdit = !!initialData;
  const title = isEdit ? 'Editar Ubicación' : 'Crear Ubicación';
  const description = isEdit 
    ? 'Modifica la información de la ubicación seleccionada' 
    : 'Agrega una nueva ubicación al sistema';

  const [formData, setFormData] = useState<UbicacionCreate>({
    tipo: 'TERMINAL' as TipoUbicacion,
    nombre: '',
    direccion_texto: '',
    descripcion: '',
    lat: -17.7849,
    lng: -63.1806,
    service_min: 5,
    source: 'MANUAL' as SourceUbicacion,
    activo: true
  });

  const [geocodificando, setGeocodificando] = useState(false);
  const [coordenadasValidas, setCoordenadasValidas] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resetear formulario cuando se abre/cierra o cambia initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          tipo: initialData.tipo,
          nombre: initialData.nombre,
          direccion_texto: initialData.direccion_texto || '',
          descripcion: initialData.descripcion || '',
          lat: typeof initialData.lat === 'string' ? parseFloat(initialData.lat) : initialData.lat,
          lng: typeof initialData.lng === 'string' ? parseFloat(initialData.lng) : initialData.lng,
          service_min: initialData.service_min,
          source: initialData.source,
          activo: initialData.activo
        });
      } else {
        setFormData({
          tipo: 'TERMINAL' as TipoUbicacion,
          nombre: '',
          direccion_texto: '',
          descripcion: '',
          lat: -17.7849,
          lng: -63.1806,
          service_min: 5,
          source: 'MANUAL' as SourceUbicacion,
          activo: true
        });
      }
    }
  }, [isOpen, initialData]);

  // Validar coordenadas
  useEffect(() => {
    const lat = typeof formData.lat === 'string' ? parseFloat(formData.lat) : formData.lat;
    const lng = typeof formData.lng === 'string' ? parseFloat(formData.lng) : formData.lng;
    
    setCoordenadasValidas(
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }, [formData.lat, formData.lng]);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof UbicacionCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar selección de ubicación en el mapa
  const handleSelectLocation = useCallback((lat: number, lng: number) => {
    // Redondear a 6 decimales para cumplir con DecimalField(max_digits=9, decimal_places=6)
    const roundedLat = Number(lat.toFixed(6));
    const roundedLng = Number(lng.toFixed(6));
    
    setFormData(prev => ({
      ...prev,
      lat: roundedLat,
      lng: roundedLng
    }));
    toast.success(`Coordenadas seleccionadas: Lat ${roundedLat.toFixed(4)}, Lng ${roundedLng.toFixed(4)}`);
  }, []);

  // Manejar geocodificación
  const handleGeocode = async () => {
    if (!formData.direccion_texto) {
      toast.error('Por favor, ingrese una dirección para geocodificar.');
      return;
    }

    setGeocodificando(true);
    try {
      const result = await UbicacionesService.geocodificar({ direccion_texto: formData.direccion_texto });
      // Redondear a 6 decimales para cumplir con DecimalField(max_digits=9, decimal_places=6)
      const roundedLat = Number(result.lat.toFixed(6));
      const roundedLng = Number(result.lng.toFixed(6));
      
      setFormData(prev => ({
        ...prev,
        lat: roundedLat,
        lng: roundedLng,
        source: result.source as SourceUbicacion
      }));
      toast.success('Dirección geocodificada exitosamente.');
    } catch (error) {
      toast.error('Error al geocodificar la dirección.');
      console.error('Error geocoding:', error);
    } finally {
      setGeocodificando(false);
    }
  };


  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!coordenadasValidas) {
      toast.error('Por favor, selecciona coordenadas válidas');
      return;
    }

    setSubmitting(true);
    try {
      // Redondear coordenadas a 6 decimales antes de enviar
      const lat = typeof formData.lat === 'string' ? parseFloat(formData.lat) : formData.lat;
      const lng = typeof formData.lng === 'string' ? parseFloat(formData.lng) : formData.lng;
      
      const dataToSubmit = {
        ...formData,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6))
      };
      
      const success = await onSubmit(dataToSubmit);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre de la ubicación"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleInputChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_UBICACION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="direccion"
                      value={formData.direccion_texto}
                      onChange={(e) => handleInputChange('direccion_texto', e.target.value)}
                      placeholder="Dirección de la ubicación"
                    />
                    <Button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geocodificando || !formData.direccion_texto}
                      variant="outline"
                      size="sm"
                    >
                      {geocodificando ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      Geocodificar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción adicional"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_min">Tiempo de Servicio Mínimo (minutos)</Label>
                  <Input
                    id="service_min"
                    type="number"
                    min="0"
                    value={formData.service_min}
                    onChange={(e) => handleInputChange('service_min', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Coordenadas y Mapa */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitud *</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={formData.lat}
                      onChange={(e) => handleInputChange('lat', parseFloat(e.target.value))}
                      placeholder="-17.7849"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitud *</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.000001"
                      value={formData.lng}
                      onChange={(e) => handleInputChange('lng', parseFloat(e.target.value))}
                      placeholder="-63.1806"
                    />
                  </div>
                </div>

                <div className="relative space-y-2">
                  <Label>Ubicación en el mapa</Label>
                  <MapaUbicaciones
                    modoSeleccion={true}
                    onCoordenadasSeleccionadas={handleSelectLocation}
                    onUbicacionActualObtenida={handleSelectLocation}
                    ubicacionSeleccionada={{ 
                      id: initialData?.id || 0, 
                      lat: formData.lat, 
                      lng: formData.lng, 
                      tipo: formData.tipo, 
                      nombre: formData.nombre, 
                      activo: formData.activo, 
                      created_at: initialData?.created_at || '', 
                      updated_at: initialData?.updated_at || '', 
                      source: formData.source, 
                      service_min: formData.service_min, 
                      direccion_texto: formData.direccion_texto || '' 
                    }}
                    mostrarControles={true}
                    mostrarUbicacionActual={true}
                    altura="250px"
                  />
                  {!coordenadasValidas && (
                    <p className="text-red-500 text-sm mt-2">
                      Por favor, selecciona coordenadas válidas en el mapa o ingrésalas manualmente.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange('activo', checked)}
              />
              <Label htmlFor="activo">Ubicación activa</Label>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting || loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || loading || !coordenadasValidas}
          >
            {submitting || loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Actualizar' : 'Crear'} Ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}