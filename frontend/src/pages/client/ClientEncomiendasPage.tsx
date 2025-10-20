import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Search, 
  Plus, 
  Truck,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { encomiendaService } from '@/services/encomiendaService';
import type { Encomienda, CreateEncomiendaRequest } from '@/types/encomienda';
import { toast } from 'sonner';

// CAMBIO: Exportación nombrada en lugar de default
export function EncomiendasPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'nueva' | 'seguimiento' | 'historial'>('nueva');
  const [loading, setLoading] = useState(false);
  const [encomiendas, setEncomiendas] = useState<Encomienda[]>([]);
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [encomiendaSeguimiento, setEncomiendaSeguimiento] = useState<Encomienda | null>(null);

  // Estado para nueva encomienda
  const [nuevaEncomienda, setNuevaEncomienda] = useState<CreateEncomiendaRequest>({
    remitente_nombre: user?.first_name + ' ' + user?.last_name || '',
    remitente_telefono: user?.telefono || '',
    remitente_direccion: '',
    destinatario_nombre: '',
    destinatario_telefono: '',
    destino_ciudad: '',
    destino_direccion: '',
    descripcion: '',
    peso: 0,
    notas: ''
  });

  const ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  const estados = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    en_ruta: { label: 'En Ruta', color: 'bg-blue-100 text-blue-800' },
    entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'historial') {
      cargarHistorialEncomiendas();
    }
  }, [isAuthenticated, activeTab]);

  const cargarHistorialEncomiendas = async () => {
    setLoading(true);
    try {
      const response = await encomiendaService.getMyEncomiendas();
      if (response.success && response.data) {
        setEncomiendas(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar historial de encomiendas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevaEncomienda(prev => ({
      ...prev,
      [name]: name === 'peso' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNuevaEncomienda(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularPrecio = (peso: number, destino: string): number => {
    const preciosBase: Record<string, number> = {
      'La Paz': 20, 'Santa Cruz': 25, 'Cochabamba': 22, 'Oruro': 18,
      'Potosi': 20, 'Tarija': 23, 'Beni': 30, 'Pando': 35
    };
    
    const base = preciosBase[destino] || 25;
    const adicionalPeso = peso > 1 ? (peso - 1) * 5 : 0;
    
    return base + adicionalPeso;
  };

  const handleSubmitEncomienda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para registrar una encomienda');
      return;
    }

    setLoading(true);
    try {
      const precioCalculado = calcularPrecio(nuevaEncomienda.peso, nuevaEncomienda.destino_ciudad);
      
      const response = await encomiendaService.create(nuevaEncomienda);
      
      if (response.success && response.data) {
        toast.success(`¡Encomienda registrada exitosamente! Código de seguimiento: ${response.data.codigo_seguimiento}`);
        
        // Reset form
        setNuevaEncomienda({
          remitente_nombre: user?.first_name + ' ' + user?.last_name || '',
          remitente_telefono: user?.telefono || '',
          remitente_direccion: '',
          destinatario_nombre: '',
          destinatario_telefono: '',
          destino_ciudad: '',
          destino_direccion: '',
          descripcion: '',
          peso: 0,
          notas: ''
        });

        setActiveTab('historial');
        cargarHistorialEncomiendas();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar encomienda');
    } finally {
      setLoading(false);
    }
  };

  const handleSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoSeguimiento.trim()) {
      toast.error('Por favor ingresa un código de seguimiento');
      return;
    }

    setLoading(true);
    try {
      const response = await encomiendaService.getByTrackingCode(codigoSeguimiento);
      if (response.success && response.data) {
        setEncomiendaSeguimiento(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Encomienda no encontrada');
      setEncomiendaSeguimiento(null);
    } finally {
      setLoading(false);
    }
  };

  const precioCalculado = calcularPrecio(nuevaEncomienda.peso, nuevaEncomienda.destino_ciudad);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Servicio de Encomiendas
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Envía y recibe paquetes de forma segura y confiable por todo Bolivia
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="nueva" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Encomienda
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Seguimiento
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Mi Historial
            </TabsTrigger>
          </TabsList>

          {/* Nueva Encomienda */}
          <TabsContent value="nueva">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Registrar Nueva Encomienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEncomienda} className="space-y-6">
                  {/* Información del Remitente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Información del Remitente
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Nombre Completo *
                          </label>
                          <Input
                            name="remitente_nombre"
                            value={nuevaEncomienda.remitente_nombre}
                            onChange={handleInputChange}
                            required
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Teléfono *
                          </label>
                          <Input
                            name="remitente_telefono"
                            value={nuevaEncomienda.remitente_telefono}
                            onChange={handleInputChange}
                            required
                            placeholder="Número de teléfono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Información del Destinatario */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-green-600" />
                        Información del Destinatario
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Nombre Completo *
                          </label>
                          <Input
                            name="destinatario_nombre"
                            value={nuevaEncomienda.destinatario_nombre}
                            onChange={handleInputChange}
                            required
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Teléfono *
                          </label>
                          <Input
                            name="destinatario_telefono"
                            value={nuevaEncomienda.destinatario_telefono}
                            onChange={handleInputChange}
                            required
                            placeholder="Número de teléfono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Destino */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Información de Destino
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Ciudad de Destino *
                        </label>
                        <Select 
                          value={nuevaEncomienda.destino_ciudad} 
                          onValueChange={(value) => handleSelectChange('destino_ciudad', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona ciudad destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {ciudades.map((ciudad) => (
                              <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Dirección de Destino *
                        </label>
                        <Input
                          name="destino_direccion"
                          value={nuevaEncomienda.destino_direccion}
                          onChange={handleInputChange}
                          required
                          placeholder="Dirección completa"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detalles de la Encomienda */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      Detalles de la Encomienda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Peso (kg) *
                        </label>
                        <Input
                          name="peso"
                          type="number"
                          step="0.1"
                          min="0"
                          value={nuevaEncomienda.peso}
                          onChange={handleInputChange}
                          required
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Precio Estimado
                        </label>
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-xl font-bold text-green-700">
                            {precioCalculado.toFixed(2)} BOB
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Descripción del Contenido *
                      </label>
                      <textarea
                        name="descripcion"
                        value={nuevaEncomienda.descripcion}
                        onChange={handleInputChange}
                        required
                        placeholder="Describe el contenido del paquete..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Registrar Encomienda
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seguimiento */}
          <TabsContent value="seguimiento">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Seguimiento de Encomiendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSeguimiento} className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Ingresa el código de seguimiento..."
                        value={codigoSeguimiento}
                        onChange={(e) => setCodigoSeguimiento(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Buscar
                    </Button>
                  </div>

                  {encomiendaSeguimiento && (
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">Información General</h4>
                            <div className="space-y-2">
                              <p><strong>Código:</strong> {encomiendaSeguimiento.codigo_seguimiento}</p>
                              <p><strong>Estado:</strong> 
                                <Badge className={`ml-2 ${estados[encomiendaSeguimiento.estado].color}`}>
                                  {estados[encomiendaSeguimiento.estado].label}
                                </Badge>
                              </p>
                              <p><strong>Fecha de Registro:</strong> {formatDate(encomiendaSeguimiento.fecha_creacion)}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Destino</h4>
                            <div className="space-y-2">
                              <p><strong>Ciudad:</strong> {encomiendaSeguimiento.destino_ciudad}</p>
                              <p><strong>Dirección:</strong> {encomiendaSeguimiento.destino_direccion}</p>
                              {encomiendaSeguimiento.conductor_nombre && (
                                <p><strong>Conductor:</strong> {encomiendaSeguimiento.conductor_nombre}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historial */}
          <TabsContent value="historial">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Mi Historial de Encomiendas
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={cargarHistorialEncomiendas}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Cargando encomiendas...</p>
                  </div>
                ) : encomiendas.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes encomiendas registradas</h3>
                    <p className="text-gray-600 mb-4">
                      Registra tu primera encomienda para comenzar
                    </p>
                    <Button onClick={() => setActiveTab('nueva')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Encomienda
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {encomiendas.map((encomienda) => (
                      <Card key={encomienda.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-mono font-semibold text-lg">
                                  {encomienda.codigo_seguimiento}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {encomienda.destinatario_nombre} - {encomienda.destino_ciudad}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={estados[encomienda.estado].color}>
                                {estados[encomienda.estado].label}
                              </Badge>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {encomienda.precio.toFixed(2)} BOB
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(encomienda.fecha_creacion)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// CAMBIO: Exportación por defecto también para compatibilidad
export default EncomiendasPage;