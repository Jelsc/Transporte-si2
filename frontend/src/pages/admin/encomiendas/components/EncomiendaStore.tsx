import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, User, MapPin, Weight } from 'lucide-react';
import type { Encomienda, CreateEncomiendaRequest } from '@/types/encomienda';
import type { ConductorOption } from '@/types/conductor';

// Tipo combinado para el formulario que incluye todos los campos posibles
interface EncomiendaFormData extends CreateEncomiendaRequest {
  // Campos adicionales para edición
  estado?: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  conductor_asignado?: number | undefined;
  fecha_entrega_real?: string | undefined;
}

interface EncomiendaStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  initialData?: Encomienda | null;
  loading: boolean;
  conductoresDisponibles: ConductorOption[];
  calcularPrecio?: (peso: number, destino: string) => number;
}

const ciudades = [
  'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
  'Potosi', 'Tarija', 'Beni', 'Pando'
];

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

export function EncomiendaStore({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  conductoresDisponibles,
  calcularPrecio,
}: EncomiendaStoreProps) {
  const [formData, setFormData] = useState({
    remitente_nombre: '',
    remitente_telefono: '',
    remitente_direccion: '',
    destinatario_nombre: '',
    destinatario_telefono: '',
    destino_ciudad: '',
    destino_direccion: '',
    descripcion: '',
    peso: 0,
    precio: 0,
    notas: '',
    conductor_asignado: '0', // ✅ CAMBIADO: usar "0" en lugar de string vacío
    metodo_pago: 'efectivo',
  });

  const [precioCalculado, setPrecioCalculado] = useState(0);

  // Reset form cuando se abre/cierra el modal o cambia initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Modo edición
        setFormData({
          remitente_nombre: initialData.remitente_nombre || '',
          remitente_telefono: initialData.remitente_telefono || '',
          remitente_direccion: initialData.remitente_direccion || '',
          destinatario_nombre: initialData.destinatario_nombre || '',
          destinatario_telefono: initialData.destinatario_telefono || '',
          destino_ciudad: initialData.destino_ciudad || '',
          destino_direccion: initialData.destino_direccion || '',
          descripcion: initialData.descripcion || '',
          peso: initialData.peso || 0,
          precio: initialData.precio || 0,
          notas: initialData.notas || '',
          conductor_asignado: initialData.conductor_asignado?.toString() || '0', // ✅ CAMBIADO
          metodo_pago: initialData.metodo_pago || 'efectivo',
        });
        setPrecioCalculado(initialData.precio || 0);
      } else {
        // Modo creación
        setFormData({
          remitente_nombre: '',
          remitente_telefono: '',
          remitente_direccion: '',
          destinatario_nombre: '',
          destinatario_telefono: '',
          destino_ciudad: '',
          destino_direccion: '',
          descripcion: '',
          peso: 0,
          precio: 0,
          notas: '',
          conductor_asignado: '0', // ✅ CAMBIADO
          metodo_pago: 'efectivo',
        });
        setPrecioCalculado(0);
      }
    }
  }, [isOpen, initialData]);

  // Calcular precio cuando cambian peso o destino
  useEffect(() => {
    if (calcularPrecio && formData.peso > 0 && formData.destino_ciudad) {
      const precio = calcularPrecio(formData.peso, formData.destino_ciudad);
      setPrecioCalculado(precio);
      setFormData(prev => ({ ...prev, precio }));
    }
  }, [formData.peso, formData.destino_ciudad, calcularPrecio]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peso' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: value === '0' ? '' : value // ✅ CONVERTIR "0" a string vacío para el backend
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.destinatario_nombre.trim()) {
      alert('El nombre del destinatario es requerido');
      return;
    }

    if (!formData.destino_ciudad) {
      alert('La ciudad de destino es requerida');
      return;
    }

    if (formData.peso <= 0) {
      alert('El peso debe ser mayor a 0');
      return;
    }

    // Preparar datos para enviar (convertir "0" a null/undefined)
    const submitData = {
      ...formData,
      conductor_asignado: formData.conductor_asignado === '0' ? null : parseInt(formData.conductor_asignado)
    };

    const success = await onSubmit(submitData);
    if (success) {
      onClose();
    }
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Encomienda' : 'Nueva Encomienda'}
          </DialogTitle>
          {/* ✅ DESCRIPCIÓN AGREGADA */}
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información de la encomienda existente' 
              : 'Completa el formulario para registrar una nueva encomienda'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Remitente y Destinatario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Remitente
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="remitente_nombre">Nombre Completo *</Label>
                    <Input
                      id="remitente_nombre"
                      name="remitente_nombre"
                      value={formData.remitente_nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="remitente_telefono">Teléfono *</Label>
                    <Input
                      id="remitente_telefono"
                      name="remitente_telefono"
                      value={formData.remitente_telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="remitente_direccion">Dirección</Label>
                    <Input
                      id="remitente_direccion"
                      name="remitente_direccion"
                      value={formData.remitente_direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Destinatario
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="destinatario_nombre">Nombre Completo *</Label>
                    <Input
                      id="destinatario_nombre"
                      name="destinatario_nombre"
                      value={formData.destinatario_nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinatario_telefono">Teléfono *</Label>
                    <Input
                      id="destinatario_telefono"
                      name="destinatario_telefono"
                      value={formData.destinatario_telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información de Destino */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Información de Destino
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destino_ciudad">Ciudad de Destino *</Label>
                  <Select 
                    value={formData.destino_ciudad} 
                    onValueChange={(value) => handleSelectChange('destino_ciudad', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona ciudad destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {ciudades.map((ciudad) => (
                        <SelectItem key={ciudad} value={ciudad}>
                          {ciudad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="destino_direccion">Dirección de Destino *</Label>
                  <Input
                    id="destino_direccion"
                    name="destino_direccion"
                    value={formData.destino_direccion}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la Encomienda */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Detalles de la Encomienda
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="peso">Peso (kg) *</Label>
                  <Input
                    id="peso"
                    name="peso"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.peso}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="precio">Precio (Bs.)</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-700">
                      {precioCalculado.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <Select 
                    value={formData.metodo_pago} 
                    onValueChange={(value) => handleSelectChange('metodo_pago', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosPago.map((metodo) => (
                        <SelectItem key={metodo.value} value={metodo.value}>
                          {metodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="descripcion">Descripción del Contenido *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe el contenido del paquete..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="mt-4">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  placeholder="Instrucciones especiales, observaciones..."
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Asignación de Conductor (solo para admin) */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Asignación de Conductor</h3>
              <Select 
                value={formData.conductor_asignado} 
                onValueChange={(value) => handleSelectChange('conductor_asignado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {/* ✅ USAR "0" EN LUGAR DE STRING VACÍO */}
                  <SelectItem value="0">Sin asignar</SelectItem>
                  {conductoresDisponibles.map((conductor) => (
                    <SelectItem key={conductor.id} value={conductor.id.toString()}>
                      {conductor.nombre} {conductor.apellido} - Lic: {conductor.nro_licencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Encomienda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}