import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Bus, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign,
  Users,
  ArrowRight,
  Snowflake,
  Coffee,
  Wifi,
  LogIn,
  UserPlus,
  Shield,
  Star,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { viajesApi } from '@/services/viajesService';
import { reservasApi } from '@/services/reservasService';
import type { Viaje, ViajeFilters } from '@/types';
import type { Reserva } from '@/types/reservas';
import AsientosModal from '@/pages/client/AsientosModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 6;

// Función para verificar autenticación
const verificarAutenticacion = (): boolean => {
  try {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return !!token;
  } catch {
    return false;
  }
};

export default function ViajesPage() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [origenFilter, setOrigenFilter] = useState('all');
  const [destinoFilter, setDestinoFilter] = useState('all');
  const [fechaFilter, setFechaFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedViaje, setSelectedViaje] = useState<Viaje | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Estado para reservas pendientes
  const [reservasPendientes, setReservasPendientes] = useState<Reserva[]>([]);
  const [verificandoReservas, setVerificandoReservas] = useState(false);

  // ✅ NUEVO: useRef para prevenir ejecuciones duplicadas
  const verificacionEjecutada = useRef(false);

  const ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // ✅ CORREGIDO: Verificar reservas pendientes al cargar la página
  useEffect(() => {
    // ✅ PREVENIR EJECUCIÓN DUPLICADA
    if (verificacionEjecutada.current) {
      console.log('⏩ Verificación de reservas ya ejecutada, omitiendo...');
      return;
    }

    verificacionEjecutada.current = true;
    verificarReservasPendientes();

    // ✅ Cleanup function para resetear el flag
    return () => {
      console.log('🧹 Cleanup: resetear flag de verificación');
      verificacionEjecutada.current = false;
    };
  }, []);

  // ✅ CORREGIDO: Verificar reservas pendientes
  const verificarReservasPendientes = async () => {
    const autenticado = verificarAutenticacion();
    if (!autenticado) {
      console.log('🔐 Usuario no autenticado, saltando verificación de reservas');
      return;
    }

    setVerificandoReservas(true);
    try {
      console.log('🔍 Verificando reservas pendientes...');
      const response = await reservasApi.getMisReservas();
      
      console.log('📥 Respuesta completa:', response);
      
      if (!response.success) {
        console.warn('⚠️ Respuesta no exitosa:', response.error);
        return;
      }

      if (!response.data) {
        console.warn('⚠️ No hay data en la respuesta');
        return;
      }

      // ✅ CORREGIDO: Extraer array de forma segura sin función problemática
      let reservasData: Reserva[] = [];
      const data = response.data;

      // Verificar diferentes estructuras posibles
      if (Array.isArray(data)) {
        reservasData = data;
      } else if (data && typeof data === 'object') {
        // Verificar si tiene propiedad 'results'
        if ('results' in data && Array.isArray((data as any).results)) {
          reservasData = (data as any).results;
        } 
        // Verificar si tiene propiedad 'data'  
        else if ('data' in data && Array.isArray((data as any).data)) {
          reservasData = (data as any).data;
        }
        // Verificar si tiene propiedad 'reservas'
        else if ('reservas' in data && Array.isArray((data as any).reservas)) {
          reservasData = (data as any).reservas;
        }
        // Si es un objeto pero no tiene las propiedades esperadas, tratar como array vacío
        else {
          console.warn('❌ Estructura de respuesta no reconocida:', data);
          reservasData = [];
        }
      }

      console.log('📋 Reservas extraídas:', reservasData);

      const pendientes = reservasData.filter((reserva: Reserva) => {
        if (!reserva) return false;
        if (!reserva.estado) return false;
        
        return reserva.estado === 'pendiente_pago' && 
               !reserva.esta_expirada;
      });
      
      console.log('🔄 Reservas pendientes filtradas:', pendientes);
      setReservasPendientes(pendientes);
      
      if (pendientes.length > 0) {
        console.log(`✅ ${pendientes.length} reserva(s) pendiente(s) encontrada(s)`);
        toast.info(
          `Tienes ${pendientes.length} reserva(s) pendiente(s) de pago`, 
          {
            duration: 6000,
            action: {
              label: 'Ver reservas',
              onClick: () => {
                mostrarReservasPendientes();
              }
            }
          }
        );
      } else {
        console.log('✅ No hay reservas pendientes');
      }
    } catch (error) {
      console.error('❌ Error verificando reservas pendientes:', error);
      toast.error('Error al verificar reservas pendientes');
    } finally {
      setVerificandoReservas(false);
    }
  };

  // Función para mostrar reservas pendientes
  const mostrarReservasPendientes = () => {
    if (reservasPendientes.length === 0) {
      toast.info('No tienes reservas pendientes de pago');
      return;
    }
    
    const primeraReserva = reservasPendientes[0];
    if (!primeraReserva) {
      console.error('❌ Error: primeraReserva es undefined');
      toast.error('Error al cargar la reserva pendiente');
      return;
    }
    
    let viajeId: number | undefined;
    
    if (typeof primeraReserva.viaje === 'object') {
      viajeId = (primeraReserva.viaje as any)?.id;
    } else {
      viajeId = primeraReserva.viaje as number;
    }
    
    if (!viajeId) {
      console.error('❌ Error: No se pudo obtener el ID del viaje');
      toast.error('No se pudo encontrar la información del viaje');
      return;
    }
    
    console.log('🔍 Buscando viaje con ID:', viajeId);
    
    const viajeCorrespondiente = viajes.find(v => v.id === viajeId);
    
    if (viajeCorrespondiente) {
      console.log('✅ Viaje encontrado, abriendo modal...');
      setSelectedViaje(viajeCorrespondiente);
      setModalOpen(true);
    } else {
      console.log('❌ Viaje no encontrado en la lista actual');
      toast.info(
        'El viaje de tu reserva pendiente no está en la lista actual. ' +
        'Intenta buscar el viaje manualmente usando los filtros.'
      );
    }
  };

  // Cargar viajes cuando cambian filtros o página
  useEffect(() => {
    fetchViajes();
  }, [searchDebounced, origenFilter, destinoFilter, fechaFilter, page]);

  // ✅ CORREGIDO: Función fetchViajes
  const fetchViajes = async () => {
    setLoading(true);
    try {
      const filters: ViajeFilters = {
        estado: 'programado',
        ...(searchDebounced && { search: searchDebounced }),
        ...(origenFilter !== 'all' && { origen: origenFilter }),
        ...(destinoFilter !== 'all' && { destino: destinoFilter }),
        ...(fechaFilter && { fecha_desde: fechaFilter }),
      };

      const response = await viajesApi.list(filters);
      if (response.success && response.data) {
        // ✅ CORREGIDO: Manejo seguro de la estructura de respuesta
        let viajesData: Viaje[] = [];
        const data = response.data;

        if (Array.isArray(data)) {
          viajesData = data;
        } else if (data && typeof data === 'object') {
          // Verificar diferentes estructuras posibles
          if ('results' in data && Array.isArray((data as any).results)) {
            viajesData = (data as any).results;
          } else if ('data' in data && Array.isArray((data as any).data)) {
            viajesData = (data as any).data;
          } else if ('viajes' in data && Array.isArray((data as any).viajes)) {
            viajesData = (data as any).viajes;
          } else {
            console.warn('❌ Estructura de respuesta no reconocida:', data);
            viajesData = [];
          }
        }
        
        // Marcar viajes que tienen reservas pendientes
        if (reservasPendientes.length > 0) {
          viajesData = viajesData.map((viaje: Viaje) => ({
            ...viaje,
            tieneReservaPendiente: reservasPendientes.some(reserva => {
              if (!reserva) return false;
              const reservaViajeId = typeof reserva.viaje === 'object' 
                ? (reserva.viaje as any)?.id 
                : reserva.viaje;
              return reservaViajeId === viaje.id;
            })
          }));
        }
        
        setViajes(viajesData);
      } else {
        console.error('❌ Error en respuesta de viajes:', response.error);
      }
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      toast.error('Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  const getComodidades = (tipoVehiculo: string) => {
    const comodidades: Record<string, { icon: React.ReactNode; label: string }[]> = {
      'Bus Cama': [
        { icon: <Snowflake className="h-4 w-4" />, label: 'A/C' },
        { icon: <Coffee className="h-4 w-4" />, label: 'Snack' },
        { icon: <Wifi className="h-4 w-4" />, label: 'WiFi' }
      ],
      'Bus': [
        { icon: <Snowflake className="h-4 w-4" />, label: 'A/C' },
        { icon: <Coffee className="h-4 w-4" />, label: 'Snack' }
      ],
      'Minibús': [
        { icon: <Snowflake className="h-4 w-4" />, label: 'A/C' }
      ]
    };

    return comodidades[tipoVehiculo] || [];
  };

  const handleClearFilters = () => {
    setSearch('');
    setOrigenFilter('all');
    setDestinoFilter('all');
    setFechaFilter('');
    setPage(1);
  };

  const handleAbrirModal = (viaje: Viaje) => {
    const autenticado = verificarAutenticacion();
    
    if (!autenticado) {
      setSelectedViaje(viaje);
      setLoginDialogOpen(true);
      return;
    }

    setSelectedViaje(viaje);
    setModalOpen(true);
  };

  const handleIniciarSesion = () => {
    setLoginDialogOpen(false);
    window.location.href = '/login';
  };

  const handleRegistrarse = () => {
    setLoginDialogOpen(false);
    window.location.href = '/register';
  };

  // Manejar reserva exitosa
  const handleReservaExitosa = () => {
    fetchViajes();
    verificarReservasPendientes();
  };

  const hasActiveFilters = search || origenFilter !== 'all' || destinoFilter !== 'all' || fechaFilter;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 py-20 px-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Encuentra tu viaje perfecto
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Descubre las mejores opciones de transporte entre ciudades de Bolivia
            </p>
            
            {/* Notificación de reservas pendientes */}
            {reservasPendientes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-auto max-w-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-800 font-medium">
                      Tienes {reservasPendientes.length} reserva(s) pendiente(s) de pago
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Completa el pago para asegurar tus asientos
                    </p>
                  </div>
                  <Button 
                    onClick={mostrarReservasPendientes}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    Ver Reservas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Buscar Viajes
              </CardTitle>
              <div className="flex items-center gap-2">
                {verificandoReservas && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Verificando reservas...
                  </Badge>
                )}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  Búsqueda General
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por destino, origen o vehículo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Origen */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Ciudad Origen
                </label>
                <Select value={origenFilter} onValueChange={setOrigenFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {ciudades.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destino */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Ciudad Destino
                </label>
                <Select value={destinoFilter} onValueChange={setDestinoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ciudades</SelectItem>
                    {ciudades.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha */}
              <div className="md:col-span-2 lg:col-span-1 space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Viaje
                </label>
                <Input
                  type="date"
                  value={fechaFilter}
                  onChange={(e) => setFechaFilter(e.target.value)}
                  placeholder="Selecciona fecha"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Viajes Disponibles
          </h2>
          <p className="text-gray-600">
            {loading ? 'Buscando viajes...' : `${viajes.length} viajes encontrados`}
            {reservasPendientes.length > 0 && (
              <span className="text-yellow-600 font-medium ml-2">
                • Tienes {reservasPendientes.length} reserva(s) pendiente(s)
              </span>
            )}
          </p>
        </div>

        {/* Lista de viajes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viajes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron viajes
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta ajustar tus filtros de búsqueda
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viajes.map((viaje) => (
              <Card 
                key={viaje.id} 
                className={`hover:shadow-lg transition-shadow duration-200 ${
                  (viaje as any).tieneReservaPendiente ? 'border-yellow-300 border-2' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {viaje.origen} → {viaje.destino}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(viaje as any).tieneReservaPendiente && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Reserva Pendiente
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Disponible
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fecha y hora */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(viaje.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(viaje.hora)}</span>
                    </div>
                  </div>

                  {/* Vehículo */}
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {typeof viaje.vehiculo === 'object' && viaje.vehiculo 
                        ? viaje.vehiculo.nombre 
                        : `Vehículo ${viaje.vehiculo_id}`}
                    </span>
                  </div>

                  {/* Comodidades */}
                  {typeof viaje.vehiculo === 'object' && viaje.vehiculo && (
                    <div className="flex items-center gap-2">
                      {getComodidades(viaje.vehiculo.tipo_vehiculo).map((comodidad, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                          {comodidad.icon}
                          <span>{comodidad.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Asientos disponibles */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {viaje.asientos_disponibles || 0} asientos disponibles
                    </span>
                  </div>

                  {/* Precio y botón */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(viaje.precio)}
                      </span>
                    </div>
                    <Button
                      className={`flex items-center gap-2 ${
                        (viaje as any).tieneReservaPendiente 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      onClick={() => handleAbrirModal(viaje)}
                    >
                      {(viaje as any).tieneReservaPendiente ? (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Continuar Pago
                        </>
                      ) : (
                        <>
                          Reservar
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de asientos */}
      {selectedViaje && (
        <AsientosModal
          viajeId={selectedViaje.id}
          viajeInfo={selectedViaje}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onReservaExitosa={handleReservaExitosa}
          onLoginRequired={() => setLoginDialogOpen(true)}
        />
      )}

      {/* Diálogo de autenticación */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
              Inicia sesión para reservar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Necesitas una cuenta para realizar reservas. ¡Es rápido y fácil!
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Beneficios de tener cuenta */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Ventajas de tener cuenta:</h4>
                <ul className="text-xs text-blue-800 mt-1 space-y-1">
                  <li>• Gestiona tus reservas fácilmente</li>
                  <li>• Recibe notificaciones de tus viajes</li>
                  <li>• Acceso a promociones exclusivas</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
              Quizás después
            </AlertDialogCancel>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button 
                onClick={handleRegistrarse}
                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4" />
                Crear Cuenta
              </Button>
              <Button 
                onClick={handleIniciarSesion}
                className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}