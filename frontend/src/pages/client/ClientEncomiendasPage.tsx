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
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useEncomiendas } from '@/hooks/useEncomiendas';
import type { Encomienda, CreateEncomiendaRequest } from '@/types/encomienda';
import { toast } from 'sonner';
import { PagoModal } from '../admin/encomiendas/components/PagoModal';

export function ClienteEncomienda() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'nueva' | 'seguimiento' | 'historial'>('nueva');
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [encomiendaSeguimiento, setEncomiendaSeguimiento] = useState<Encomienda | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [encomiendaParaPagar, setEncomiendaParaPagar] = useState<Encomienda | null>(null);

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
    notas: '',
    metodo_pago: 'efectivo'
  });

  // Usar el hook de encomiendas
  const {
    data,
    loading,
    error,
    loadMyEncomiendas,
    createItem,
    buscarPorCodigo,
    calcularPrecio,
    clearError,
    crearPagoStripe,
    marcarPagoEfectivo,
  } = useEncomiendas();

  const ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  // Estados
  const estados = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    en_ruta: { label: 'En Ruta', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' }
  };

  const estadosPago = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', puedePagar: true },
    completado: { label: 'Completado', color: 'bg-green-100 text-green-800', puedePagar: false },
    fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800', puedePagar: true },
    procesando: { label: 'Procesando', color: 'bg-blue-100 text-blue-800', puedePagar: false }
  };

  // Función segura para obtener estado
  const getEstadoConfig = (estado: string) => {
    return estados[estado as keyof typeof estados] || { 
      label: estado, 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    };
  };

  // Función segura para obtener estado de pago
  const getEstadoPagoConfig = (estadoPago: string) => {
    return estadosPago[estadoPago as keyof typeof estadosPago] || { 
      label: estadoPago, 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  // Cargar encomiendas del usuario cuando cambie la pestaña
  useEffect(() => {
    if (isAuthenticated && activeTab === 'historial') {
      loadMyEncomiendas();
    }
  }, [isAuthenticated, activeTab]);

  // Limpiar errores cuando cambien las pestañas
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [activeTab]);

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const handleSubmitEncomienda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para registrar una encomienda');
      return;
    }

    // Validaciones
    if (!nuevaEncomienda.destinatario_nombre?.trim()) {
      toast.error('El nombre del destinatario es requerido');
      return;
    }

    if (!nuevaEncomienda.destinatario_telefono?.trim()) {
      toast.error('El teléfono del destinatario es requerido');
      return;
    }

    if (!nuevaEncomienda.destino_ciudad) {
      toast.error('La ciudad de destino es requerida');
      return;
    }

    if (!nuevaEncomienda.destino_direccion?.trim()) {
      toast.error('La dirección de destino es requerida');
      return;
    }

    if (!nuevaEncomienda.descripcion?.trim()) {
      toast.error('La descripción del paquete es requerida');
      return;
    }

    if (nuevaEncomienda.peso <= 0) {
      toast.error('El peso debe ser mayor a 0');
      return;
    }

    try {
      // Calcular precio automáticamente
      const precioCalculado = calcularPrecio(nuevaEncomienda.peso, nuevaEncomienda.destino_ciudad);
      
      const encomiendaConPrecio = {
        ...nuevaEncomienda,
        precio: precioCalculado,
      };

      console.log('📦 Creando encomienda:', encomiendaConPrecio);

      const result = await createItem(encomiendaConPrecio);
      
      if (result.success) {
        toast.success('¡Encomienda registrada exitosamente! Lleva tu paquete a nuestras instalaciones para completar el proceso.');
        
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
          notas: '',
          metodo_pago: 'efectivo'
        });

        setActiveTab('historial');
      } else {
        console.error('Error al crear encomienda:', result.error);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado al crear encomienda');
    }
  };

  const handleSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoSeguimiento.trim()) {
      toast.error('Por favor ingresa un código de seguimiento');
      return;
    }

    try {
      const encomienda = await buscarPorCodigo(codigoSeguimiento);
      if (encomienda) {
        setEncomiendaSeguimiento(encomienda);
        toast.success('Encomienda encontrada');
      }
    } catch {
      // El error ya se maneja en el hook
    }
  };

  // Función para manejar pagos
  const handleProcesarPago = async (metodoPago: 'efectivo' | 'tarjeta') => {
    if (!encomiendaParaPagar) return;

    try {
      if (metodoPago === 'efectivo') {
        // Para pago en efectivo, mostrar mensaje informativo
        toast.info('Has seleccionado pago en efectivo. Puedes pagar al momento de entregar o recibir el paquete en nuestras instalaciones.');
        setShowPagoModal(false);
      } else if (metodoPago === 'tarjeta') {
        // Para pago con tarjeta, procesar con Stripe
        toast.info('Iniciando proceso de pago con tarjeta...');
        const result = await crearPagoStripe(encomiendaParaPagar.id);
        
        if (result.success) {
          toast.success('Pago procesado exitosamente');
          setShowPagoModal(false);
          await loadMyEncomiendas(); // Recargar datos
        } else {
          toast.error(result.error || 'Error al procesar pago');
        }
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error('Error al procesar el pago');
    }
  };

  const handlePagarEncomienda = (encomienda: Encomienda) => {
    setEncomiendaParaPagar(encomienda);
    setShowPagoModal(true);
  };

  const precioCalculado = calcularPrecio(nuevaEncomienda.peso, nuevaEncomienda.destino_ciudad);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const getEstadoPago = (encomienda: Encomienda) => {
    return encomienda.estado_pago || 'pendiente';
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
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Dirección (Opcional)
                          </label>
                          <Input
                            name="remitente_direccion"
                            value={nuevaEncomienda.remitente_direccion}
                            onChange={handleInputChange}
                            placeholder="Dirección completa"
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
                      <Package className="w-5 text-purple-600" />
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
                      <Textarea
                        name="descripcion"
                        value={nuevaEncomienda.descripcion}
                        onChange={handleInputChange}
                        required
                        placeholder="Describe el contenido del paquete..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Notas Adicionales (Opcional)
                      </label>
                      <Textarea
                        name="notas"
                        value={nuevaEncomienda.notas}
                        onChange={handleInputChange}
                        placeholder="Instrucciones especiales, observaciones..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20"
                      />
                    </div>
                  </div>

                  {/* Información de Pago Mejorada */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Proceso de Pago</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p><strong>Precio calculado: {precioCalculado.toFixed(2)} BOB</strong></p>
                      <p>Después de registrar la encomienda:</p>
                      <ol className="list-decimal list-inside ml-2 space-y-1">
                        <li>Lleva tu paquete a nuestras instalaciones</li>
                        <li>Puedes pagar en efectivo al entregar el paquete</li>
                        <li>O el destinatario puede pagar al recibirlo</li>
                        <li>También puedes pagar online desde tu historial</li>
                      </ol>
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

          {/* Seguimiento - SIN BOTÓN DE PAGO */}
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
                        className="text-lg font-mono"
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
                    <div className="space-y-6">
                      <Card className="bg-gray-50">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-4 text-lg">Información General</h4>
                              <div className="space-y-3">
                                <div>
                                  <strong>Código:</strong> 
                                  <span className="font-mono ml-2 bg-gray-200 px-2 py-1 rounded">
                                    {encomiendaSeguimiento.codigo_seguimiento}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <strong>Estado:</strong> 
                                  <Badge className={`${getEstadoConfig(encomiendaSeguimiento.estado).color} border`}>
                                    {getEstadoConfig(encomiendaSeguimiento.estado).label}
                                  </Badge>
                                </div>
                                <div>
                                  <strong>Fecha de Registro:</strong> 
                                  <div className="text-sm text-gray-600">
                                    {formatDate(encomiendaSeguimiento.fecha_creacion)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <strong>Estado Pago:</strong>
                                  <Badge className={getEstadoPagoConfig(getEstadoPago(encomiendaSeguimiento)).color}>
                                    {getEstadoPagoConfig(getEstadoPago(encomiendaSeguimiento)).label}
                                  </Badge>
                                </div>
                                {/* ✅ BOTÓN DE PAGO ELIMINADO DEL SEGUIMIENTO */}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-4 text-lg">Información de Destino</h4>
                              <div className="space-y-3">
                                <div>
                                  <strong>Destinatario:</strong> 
                                  <div>{encomiendaSeguimiento.destinatario_nombre}</div>
                                  <div className="text-sm text-gray-600">{encomiendaSeguimiento.destinatario_telefono}</div>
                                </div>
                                <div>
                                  <strong>Ciudad:</strong> {encomiendaSeguimiento.destino_ciudad}
                                </div>
                                <div>
                                  <strong>Dirección:</strong> 
                                  <div className="text-sm text-gray-600">{encomiendaSeguimiento.destino_direccion}</div>
                                </div>
                                {encomiendaSeguimiento.conductor_nombre && (
                                  <div>
                                    <strong>Conductor:</strong> {encomiendaSeguimiento.conductor_nombre}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Historial de Seguimiento */}
                      {encomiendaSeguimiento.seguimientos && encomiendaSeguimiento.seguimientos.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Historial de Seguimiento
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {encomiendaSeguimiento.seguimientos.map((seguimiento: any, index: number) => (
                                <div key={seguimiento.id || index} className="flex gap-4 border-l-2 border-blue-200 pl-4">
                                  <div className="shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <h5 className="font-semibold">{seguimiento.evento}</h5>
                                      <span className="text-sm text-gray-500">
                                        {formatDate(seguimiento.fecha)}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 mt-1">{seguimiento.descripcion}</p>
                                    {seguimiento.ubicacion && (
                                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                        <MapPin className="h-3 w-3" />
                                        {seguimiento.ubicacion}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historial - CON BOTÓN DE PAGO */}
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
                  onClick={loadMyEncomiendas}
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
                ) : data.results.length === 0 ? (
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
                    {data.results.map((encomienda) => {
                      const estadoConfig = getEstadoConfig(encomienda.estado);
                      const estadoPagoConfig = getEstadoPagoConfig(getEstadoPago(encomienda));
                      const puedePagar = estadoPagoConfig.puedePagar;
                      
                      return (
                        <Card key={encomienda.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Package className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-mono font-semibold text-lg">
                                    {encomienda.codigo_seguimiento}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {encomienda.destinatario_nombre} - {encomienda.destino_ciudad}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={estadoConfig.color}>
                                      {estadoConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className={estadoPagoConfig.color}>
                                      Pago: {estadoPagoConfig.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600 text-lg">
                                  {encomienda.precio?.toFixed(2)} BOB
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(encomienda.fecha_creacion)}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setCodigoSeguimiento(encomienda.codigo_seguimiento);
                                      setActiveTab('seguimiento');
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Detalles
                                  </Button>
                                  {/* ✅ BOTÓN DE PAGO SOLO EN HISTORIAL */}
                                  {puedePagar && (
                                    <Button 
                                      size="sm"
                                      onClick={() => handlePagarEncomienda(encomienda)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CreditCard className="w-4 h-4 mr-1" />
                                      Pagar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Pago */}
        <PagoModal
          isOpen={showPagoModal}
          onClose={() => setShowPagoModal(false)}
          encomienda={encomiendaParaPagar}
          onProcesarPago={handleProcesarPago}
          loading={loading}
          esAdmin={false}
        />
      </div>
    </div>
  );
}

export default ClienteEncomienda;