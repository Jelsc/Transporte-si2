// components/AsientosModal.tsx - VERSIÓN CORREGIDA PARA COORDINACIÓN CON CHECKOUT
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  X,
  Check,
  DollarSign,
  LogIn,
  Car,
  DoorOpen,
  Sofa,
  Armchair,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { asientosApi } from '@/services/asientosService';
import { reservasApi } from '@/services/reservasService';
import type { Asiento } from '@/types/asiento';
import type { Viaje } from '@/types';
import type { Reserva } from '@/types/reservas';
import CheckoutModal from '@/components/CheckoutModal';
import { toast } from 'sonner';

interface AsientosModalProps {
  viajeId: number;
  open: boolean;
  onClose: () => void;
  onReservaExitosa: () => void;
  viajeInfo?: Viaje;
  onLoginRequired?: () => void;
  usuarioAutenticado?: boolean;
}

interface AsientoConEstado extends Asiento {
  seleccionado: boolean;
}

// Función para verificar autenticación
const verificarAutenticacion = (): boolean => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  } catch {
    return false;
  }
};

export default function AsientosModal({ 
  viajeId, 
  open, 
  onClose, 
  onReservaExitosa,
  viajeInfo,
  onLoginRequired,
  usuarioAutenticado: usuarioAutenticadoProp
}: AsientosModalProps) {
  const [asientos, setAsientos] = useState<AsientoConEstado[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<AsientoConEstado[]>([]);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(usuarioAutenticadoProp || false);
  const [verificandoReserva, setVerificandoReserva] = useState(false);
  
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number>(0);
  const [timerActivo, setTimerActivo] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [mostrandoReservaExistente, setMostrandoReservaExistente] = useState(false);

  useEffect(() => {
    if (open && viajeId) {
      const estaAutenticado = usuarioAutenticadoProp !== undefined ? 
        usuarioAutenticadoProp : verificarAutenticacion();
      
      setUsuarioAutenticado(estaAutenticado);
      
      if (!estaAutenticado) {
        onLoginRequired?.();
        onClose();
        return;
      }
      
      verificarReservaTemporalExistente();
    } else {
      resetEstado();
    }
  }, [open, viajeId, onLoginRequired, onClose, usuarioAutenticadoProp]);

  // ✅ CORREGIDO: Verificar reserva temporal existente
  const verificarReservaTemporalExistente = async () => {
    setVerificandoReserva(true);
    try {
      console.log('🔍 Verificando reserva temporal existente...');
      const response = await reservasApi.getMisReservas();
      
      if (response.success && response.data) {
        let reservasArray: Reserva[] = [];
        
        if (Array.isArray(response.data)) {
          reservasArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if ('results' in response.data && Array.isArray((response.data as any).results)) {
            reservasArray = (response.data as any).results;
          } else if ('data' in response.data && Array.isArray((response.data as any).data)) {
            reservasArray = (response.data as any).data;
          }
        }
        
        console.log(`📊 Encontradas ${reservasArray.length} reservas para analizar`);
        
        const reservaActiva = reservasArray.find((reserva: Reserva) => {
          let viajeIdReserva: number | undefined;
          
          if (typeof reserva.viaje === 'object' && reserva.viaje) {
            viajeIdReserva = (reserva.viaje as any).id;
          } else {
            viajeIdReserva = reserva.viaje as number;
          }
          
          const esMismoViaje = viajeIdReserva === viajeId;
          const estaPendiente = reserva.estado === 'pendiente_pago';
          const noExpirada = !reserva.esta_expirada;
          
          return esMismoViaje && estaPendiente && noExpirada;
        });
        
        if (reservaActiva) {
          console.log('🔄 Reserva temporal existente encontrada:', reservaActiva);
          await cargarAsientosConReserva(reservaActiva);
          setMostrandoReservaExistente(true);
        } else {
          console.log('✅ No hay reserva temporal existente');
          setMostrandoReservaExistente(false);
          fetchAsientos();
        }
      } else {
        console.log('ℹ️ No se pudieron obtener las reservas, cargando asientos normales');
        fetchAsientos();
      }
    } catch (error) {
      console.error('❌ Error verificando reserva temporal:', error);
      fetchAsientos();
    } finally {
      setVerificandoReserva(false);
    }
  };

  // ✅ Cargar asientos con una reserva existente
  const cargarAsientosConReserva = async (reserva: Reserva) => {
    setLoading(true);
    try {
      const response = await asientosApi.list(viajeId);
      
      if (response.success && response.data) {
        const asientosIdsReservados = reserva.items.map(item => item.asiento.id);
        
        const asientosConEstado = response.data.map((asiento: Asiento) => ({
          ...asiento,
          seleccionado: asientosIdsReservados.includes(asiento.id)
        }));
        
        setAsientos(asientosConEstado);
        setReservaCreada(reserva);
        
        // Configurar timer de expiración
        if (reserva.fecha_expiracion) {
          const expiracion = new Date(reserva.fecha_expiracion).getTime();
          const ahora = new Date().getTime();
          const restante = Math.max(0, Math.floor((expiracion - ahora) / 1000));
          setTiempoRestante(restante);
          setTimerActivo(true);
        }
        
        toast.info('Tienes una reserva pendiente. Continúa con el pago.');
      }
    } catch (err) {
      console.error('Error cargando asientos con reserva:', err);
      setError('Error al cargar los asientos');
    } finally {
      setLoading(false);
    }
  };

  const resetEstado = useCallback(() => {
    setAsientos([]);
    setAsientosSeleccionados([]);
    setReservaCreada(null);
    setCheckoutOpen(false);
    setError(null);
    setReservando(false);
    setTiempoRestante(0);
    setTimerActivo(false);
    setVerificandoReserva(false);
    setPagoExitoso(false);
    setMostrandoReservaExistente(false);
  }, []);

  const fetchAsientos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await asientosApi.list(viajeId);
      
      if (response.success && response.data) {
        const asientosConEstado = response.data.map((asiento: Asiento) => ({
          ...asiento,
          seleccionado: false
        }));
        setAsientos(asientosConEstado);
      } else {
        throw new Error(response.error || 'Error al cargar asientos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      console.error('Error cargando asientos:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ACTUALIZADO: Toggle de asientos que permite manejar reservas propias
  const toggleAsiento = useCallback((asiento: AsientoConEstado) => {
    if (asiento.estado === 'ocupado') return;

    if (asiento.estado === 'reservado') {
      if (reservaCreada && asiento.reserva_temporal === reservaCreada.id) {
        setAsientos(prev => prev.map(a => 
          a.id === asiento.id ? { ...a, seleccionado: !a.seleccionado } : a
        ));
      }
      return;
    }

    if (asiento.estado === 'libre') {
      setAsientos(prev => prev.map(a => 
        a.id === asiento.id ? { ...a, seleccionado: !a.seleccionado } : a
      ));
    }
  }, [reservaCreada]);

  useEffect(() => {
    const seleccionados = asientos.filter(a => a.seleccionado);
    setAsientosSeleccionados(seleccionados);
  }, [asientos]);

  // ✅ CORREGIDO: Manejar reserva con mejor manejo de errores
  const handleReservar = async () => {
    if (asientosSeleccionados.length === 0) {
      toast.error('Selecciona al menos un asiento');
      return;
    }

    const autenticado = usuarioAutenticadoProp !== undefined ? 
      usuarioAutenticadoProp : verificarAutenticacion();
    
    if (!autenticado) {
      toast.error('Debes iniciar sesión para realizar una reserva');
      onLoginRequired?.();
      onClose();
      return;
    }

    // ✅ SI YA HAY RESERVA CREADA: Ir directo al checkout
    if (reservaCreada) {
      console.log('🔄 Continuando con reserva existente:', reservaCreada.id);
      setCheckoutOpen(true);
      return;
    }

    // ✅ CREAR NUEVA RESERVA TEMPORAL
    setReservando(true);
    setError(null);
    
    try {
      const asientosIds = asientosSeleccionados.map(asiento => asiento.id);
      const montoTotal = viajeInfo ? viajeInfo.precio * asientosSeleccionados.length : 0;
      
      console.log('🔄 Creando NUEVA reserva TEMPORAL para asientos:', asientosIds);
      
      const result = await reservasApi.crearReservaTemporal({
        viaje_id: viajeId,
        asientos_ids: asientosIds,
        monto_total: montoTotal
      });

      if (result.success && result.data) {
        console.log('✅ NUEVA Reserva TEMPORAL creada:', result.data);
        
        // Configurar timer de expiración
        if (result.expiracion) {
          const expiracion = new Date(result.expiracion).getTime();
          const ahora = new Date().getTime();
          const restante = Math.max(0, Math.floor((expiracion - ahora) / 1000));
          setTiempoRestante(restante);
          setTimerActivo(true);
        }
        
        setReservaCreada(result.data);
        setMostrandoReservaExistente(true);
        setTimeout(() => setCheckoutOpen(true), 100);
        
        toast.success('Reserva temporal creada. Tienes 15 minutos para completar el pago.');
        
      } else {
        throw new Error(result.error || 'Error desconocido al crear reserva');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMessage);
      
      // ✅ CORRECCIÓN MEJORADA: Manejo específico de errores
      if (errorMessage.includes('Ya tienes una reserva temporal activa')) {
        // ✅ NUEVO: Manejar error de reserva existente
        toast.error('Ya tienes una reserva pendiente para este viaje');
        // Forzar verificación de reserva existente
        await verificarReservaTemporalExistente();
        return;
      }
      else if (errorMessage.includes('no están disponibles') || 
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('ya no están disponibles') ||
          errorMessage.includes('disponibles')) {
        
        toast.error('Algunos asientos ya no están disponibles. Actualizando lista...');
        
        // Recargar asientos para mostrar estado actual
        await fetchAsientos();
        
        // ✅ CORRECCIÓN: Desseleccionar asientos que ya no están disponibles
        setAsientos(prev => prev.map(a => ({
          ...a,
          seleccionado: a.seleccionado && a.estado === 'libre'
        })));
        
        // Mostrar mensaje informativo
        setTimeout(() => {
          const nuevosSeleccionados = asientos.filter(a => a.seleccionado);
          if (nuevosSeleccionados.length === 0) {
            toast.info('Todos los asientos seleccionados ya no están disponibles. Por favor, selecciona otros asientos.');
          } else if (nuevosSeleccionados.length < asientosSeleccionados.length) {
            toast.info(`Algunos asientos se liberaron. ${nuevosSeleccionados.length} asientos siguen disponibles.`);
          }
        }, 1000);
        
      } else if (errorMessage.includes('No hay suficientes asientos disponibles') ||
                 errorMessage.includes('No hay asientos disponibles')) {
        
        toast.error('No hay suficientes asientos disponibles. Actualizando información...');
        await fetchAsientos();
        
      } else if (errorMessage.includes('El viaje no está disponible')) {
        
        toast.error('Este viaje ya no está disponible para reservas');
        onClose();
        
      } else {
        toast.error(`Error al crear reserva: ${errorMessage}`);
      }
      
      console.error('❌ Error en reserva:', err);
    } finally {
      setReservando(false);
    }
  };

  // ✅ Cancelar reserva temporal existente
  const handleCancelarReserva = async () => {
    if (!reservaCreada) return;
    
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu reserva temporal? Los asientos se liberarán inmediatamente.')) {
      return;
    }

    try {
      setReservando(true);
      await reservasApi.cancelarReservaTemporal(reservaCreada.id);
      
      toast.success('Reserva temporal cancelada. Los asientos se han liberado.');
      resetEstado();
      fetchAsientos();
      setMostrandoReservaExistente(false);
      
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      toast.error('Error al cancelar la reserva');
    } finally {
      setReservando(false);
    }
  };

  // ✅ Timer de expiración
  useEffect(() => {
    let interval: number | undefined;
    
    if (timerActivo && tiempoRestante > 0) {
      interval = window.setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            handleExpiracionReserva();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActivo, tiempoRestante]);

  // ✅ Manejar expiración de reserva
  const handleExpiracionReserva = async () => {
    console.log('⏰ Reserva expirada');
    setTimerActivo(false);
    
    if (reservaCreada) {
      try {
        await reservasApi.cancelarReservaTemporal(reservaCreada.id);
      } catch (error) {
        console.error('Error cancelando reserva expirada:', error);
      }
    }
    
    toast.error('⏰ Tiempo agotado. La reserva ha expirado y los asientos se han liberado.');
    setCheckoutOpen(false);
    resetEstado();
    fetchAsientos();
    setMostrandoReservaExistente(false);
  };

  // ✅ CORREGIDO: Manejo de pago exitoso - NO cerrar automáticamente
  const handlePagoExitoso = useCallback(() => {
    console.log('✅ Pago exitoso - CheckoutModal manejará el cierre');
    setPagoExitoso(true);
    
    // ✅ SOLO actualizar el estado, NO cerrar modales aquí
    setTimerActivo(false);
    setMostrandoReservaExistente(false);
    
    // ✅ Mostrar mensaje de éxito pero NO cerrar
    toast.success('¡Pago completado! Tu reserva ha sido confirmada.');
    
    // ❌ ELIMINAR el cierre automático que estaba aquí
    // El CheckoutModal ahora se encargará del cierre cuando el usuario haga clic en "Continuar"
  }, []);

  // ✅ CORREGIDO: Función de cierre mejorada para CheckoutModal
  const handleCheckoutClose = () => {
    // ✅ SI EL PAGO FUE EXITOSO: Cerrar todo
    if (pagoExitoso) {
      console.log('✅ Pago exitoso - cerrando modales desde AsientosModal');
      setCheckoutOpen(false);
      resetEstado();
      onReservaExitosa();
      onClose();
      return;
    }
    
    // ✅ SI NO HAY PAGO EXITOSO: Mostrar confirmación
    setCheckoutOpen(false);
    
    if (tiempoRestante > 0 && !pagoExitoso) {
      if (window.confirm('¿Estás seguro de que quieres cancelar el pago? La reserva expirará en 15 minutos.')) {
        setTimerActivo(true);
      }
    }
  };

  const handleClose = () => {
    if (reservando || timerActivo) {
      if (!window.confirm('Hay una reserva en proceso. ¿Estás seguro de que quieres salir?')) {
        return;
      }
    }
    resetEstado();
    onClose();
  };

  const handleIniciarSesion = () => {
    resetEstado();
    onClose();
    onLoginRequired?.();
  };

  // ✅ ACTUALIZADO: Funciones de renderizado con soporte para reservas propias
  const getEstadoAsiento = (asiento: AsientoConEstado) => {
    if (asiento.estado === 'ocupado') return 'ocupado';
    
    if (asiento.estado === 'reservado' && reservaCreada && asiento.reserva_temporal === reservaCreada.id) {
      return asiento.seleccionado ? 'seleccionado' : 'reservado_propio';
    }
    
    if (asiento.estado === 'reservado') return 'ocupado';
    
    if (asiento.seleccionado) return 'seleccionado';
    
    return 'libre';
  };

  const getColorAsiento = (estado: string) => {
    const colores = {
      'libre': 'bg-green-500 hover:bg-green-600 border-green-600 text-white shadow-sm hover:shadow-md',
      'ocupado': 'bg-red-500 cursor-not-allowed border-red-600 text-white opacity-80',
      'reservado_propio': 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-white shadow-sm hover:shadow-md cursor-pointer',
      'seleccionado': 'bg-blue-500 border-blue-600 text-white shadow-md ring-2 ring-blue-300'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-300 border-gray-400 text-gray-700';
  };

  const getIconoAsiento = (estado: string, numero: string) => {
    if (estado === 'seleccionado') return <Check className="h-4 w-4" />;
    if (estado === 'ocupado') return <X className="h-4 w-4" />;
    if (estado === 'reservado_propio') return <RefreshCw className="h-4 w-4" />;
    return numero;
  };

  const getTituloAsiento = (asiento: AsientoConEstado) => {
    const estado = getEstadoAsiento(asiento);
    const base = `Asiento ${asiento.numero}`;
    
    switch (estado) {
      case 'libre': return `${base} - Disponible`;
      case 'ocupado': return `${base} - Ocupado`;
      case 'reservado_propio': return `${base} - Tu reserva temporal (haz clic para quitar)`;
      case 'seleccionado': return `${base} - Seleccionado`;
      default: return base;
    }
  };

  const renderAsiento = (asiento: AsientoConEstado) => {
    const estado = getEstadoAsiento(asiento);
    const color = getColorAsiento(estado);

    return (
      <button
        key={asiento.id}
        className={`
          w-12 h-12 rounded-lg border-2 flex items-center justify-center
          font-semibold text-sm transition-all duration-200
          ${color}
          ${estado === 'libre' || estado === 'reservado_propio' ? 'cursor-pointer hover:scale-110 transform' : 'cursor-default'}
          relative
        `}
        onClick={() => toggleAsiento(asiento)}
        disabled={estado === 'ocupado'}
        title={getTituloAsiento(asiento)}
      >
        {getIconoAsiento(estado, asiento.numero)}
        
        {estado === 'seleccionado' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
        )}
        
        {estado === 'reservado_propio' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
        )}
      </button>
    );
  };

  // Organizar asientos en filas
  const organizarAsientosEnFilas = () => {
    const asientosOrdenados = [...asientos].sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    const filas = [];
    for (let i = 0; i < asientosOrdenados.length; i += 4) {
      filas.push(asientosOrdenados.slice(i, i + 4));
    }
    return filas;
  };

  const filasDeAsientos = organizarAsientosEnFilas();
  const totalPrecio = viajeInfo ? viajeInfo.precio * asientosSeleccionados.length : 0;
  const asientosLibres = asientos.filter(a => a.estado === 'libre').length;
  const asientosOcupados = asientos.filter(a => a.estado === 'ocupado' || a.estado === 'reservado').length;

  // Formatear tiempo para display
  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Seleccionar Asientos - {viajeInfo?.origen} → {viajeInfo?.destino}
              {reservaCreada && (
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Reserva Pendiente
                </Badge>
              )}
              {pagoExitoso && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  ¡Pago Completado!
                </Badge>
              )}
              {!usuarioAutenticado && (
                <Badge variant="destructive" className="ml-2">Inicia sesión para reservar</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* ✅ TIMER DE EXPIRACIÓN */}
          {timerActivo && tiempoRestante > 0 && !pagoExitoso && (
            <div className={`
              border rounded-lg p-4 mb-4 transition-all duration-300
              ${tiempoRestante < 300 
                ? 'bg-red-50 border-red-300 text-red-800' 
                : 'bg-orange-50 border-orange-300 text-orange-800'
              }
            `}>
              <div className="flex items-center gap-3">
                {tiempoRestante < 300 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    Tiempo restante para pagar:
                    <span className={`
                      text-lg font-bold
                      ${tiempoRestante < 300 ? 'text-red-700' : 'text-orange-700'}
                    `}>
                      {formatearTiempo(tiempoRestante)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {tiempoRestante < 300 
                      ? '¡Últimos minutos! Completa el pago o los asientos se liberarán.'
                      : reservaCreada 
                        ? 'Continúa con el pago para confirmar tu reserva.'
                        : 'Pasado este tiempo, los asientos se liberarán automáticamente.'
                    }
                  </p>
                </div>
                {reservaCreada && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelarReserva}
                    disabled={reservando}
                  >
                    {reservando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar Reserva'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ✅ NUEVO: Banner de pago exitoso */}
          {pagoExitoso && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium">
                    ¡Pago completado exitosamente!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Tu reserva ha sido confirmada. Cerrando automáticamente...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ NUEVO: Banner de reserva existente */}
          {mostrandoReservaExistente && reservaCreada && !pagoExitoso && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium">
                    Tienes una reserva temporal activa
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Código: <strong>{reservaCreada.codigo_reserva}</strong> • 
                    {reservaCreada.items?.length || 0} asiento(s) • 
                    Tiempo restante: <strong>{formatearTiempo(tiempoRestante)}</strong>
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCheckoutOpen(true)}
                  className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Continuar al Pago
                </Button>
              </div>
            </div>
          )}

          {/* Mostrar errores */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAsientos}
                className="mt-2"
              >
                Reintentar
              </Button>
            </div>
          )}

          {viajeInfo && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span><strong>{viajeInfo.origen}</strong> → <strong>{viajeInfo.destino}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{new Date(viajeInfo.fecha).toLocaleDateString('es-BO')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{viajeInfo.hora?.substring(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'BOB'
                      }).format(viajeInfo.precio)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Asientos disponibles: <strong>{viajeInfo.asientos_disponibles}</strong> • 
                  Asientos ocupados: <strong>{viajeInfo.asientos_ocupados}</strong>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ✅ ACTUALIZADO: Leyenda con reservas propias */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border border-green-600 shadow-sm"></div>
              <span className="text-sm font-medium">Disponible ({asientosLibres})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600 shadow-sm ring-1 ring-blue-300"></div>
              <span className="text-sm font-medium">Seleccionado ({asientosSeleccionados.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-600 shadow-sm"></div>
              <span className="text-sm font-medium">Tu Reserva Temporal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded border border-red-600 shadow-sm opacity-80"></div>
              <span className="text-sm font-medium">Ocupado ({asientosOcupados})</span>
            </div>
          </div>

          {(loading || verificandoReserva) ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4">
                {verificandoReserva ? 'Verificando reservas existentes...' : 'Cargando distribución del bus...'}
              </span>
            </div>
          ) : asientos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p>No hay asientos configurados para este viaje</p>
            </div>
          ) : (
            <>
              {/* Representación del bus */}
              <div className="mb-8 border-4 border-gray-800 rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-2xl overflow-hidden">
                {/* Cabina del conductor */}
                <div className="bg-yellow-500 text-gray-900 text-center py-3 relative">
                  <div className="flex items-center justify-center gap-2 font-bold">
                    <Car className="h-5 w-5" />
                    <span>CONDUCTOR - FRENTE DEL BUS</span>
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                </div>
                
                {/* Cuerpo del bus con asientos */}
                <div className="p-6 bg-gradient-to-b from-gray-100 to-gray-200 min-h-[400px]">
                  {filasDeAsientos.map((fila, filaIndex) => (
                    <div key={filaIndex} className="flex justify-center gap-8 mb-6 items-center relative">
                      {/* Número de fila */}
                      <div className="w-6 text-center text-xs font-bold text-gray-600 bg-gray-300 py-1 rounded absolute left-2">
                        {filaIndex + 1}
                      </div>
                      
                      {/* Lado izquierdo - 2 asientos */}
                      <div className="flex gap-4">
                        {fila.slice(0, 2).map(renderAsiento)}
                      </div>
                      
                      {/* Pasillo con diseño realista */}
                      <div className="w-12 flex items-center justify-center">
                        <div className="h-8 w-full bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg border border-yellow-700 shadow-inner"></div>
                      </div>
                      
                      {/* Lado derecho - 2 asientos */}
                      <div className="flex gap-4">
                        {fila.slice(2, 4).map(renderAsiento)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Parte trasera del bus */}
                  <div className="text-center mt-8 py-4 border-t border-gray-300 relative">
                    <div className="bg-gray-800 text-white text-xs py-1 px-3 rounded-full inline-block">
                      <span>PARTE TRASERA DEL BUS</span>
                    </div>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <DoorOpen className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <DoorOpen className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de selección mejorado */}
              {asientosSeleccionados.length > 0 && (
                <Card className="mb-4 border-blue-200 bg-blue-50 shadow-lg">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
                      <Armchair className="h-5 w-5" />
                      {reservaCreada ? 'Tu reserva actual:' : 'Resumen de tu selección:'}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {asientosSeleccionados.map(asiento => (
                        <Badge key={asiento.id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-sm py-1 px-3">
                          <Sofa className="h-3 w-3 mr-1" />
                          Asiento {asiento.numero}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-800 font-medium">
                        {asientosSeleccionados.length} asiento(s) {reservaCreada ? 'reservado(s)' : 'seleccionado(s)'}
                      </span>
                      <span className="text-lg font-bold text-blue-900">
                        Total: {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(totalPrecio)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <DialogFooter className="flex justify-between items-center gap-4 sticky bottom-0 bg-white pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleClose} disabled={reservando}>
                {pagoExitoso ? 'Cerrar' : reservaCreada ? 'Salir' : 'Cancelar'}
              </Button>
              
              {reservaCreada && !pagoExitoso && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelarReserva}
                  disabled={reservando}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {reservando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar Reserva'}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {asientosSeleccionados.length > 0 && (
                <span className="text-sm text-gray-600 hidden md:inline font-medium">
                  {asientosSeleccionados.length} asiento(s) {reservaCreada ? 'reservado(s)' : 'seleccionado(s)'}
                </span>
              )}
              
              {usuarioAutenticado ? (
                <Button 
                  onClick={handleReservar}
                  disabled={asientosSeleccionados.length === 0 || reservando || mostrandoReservaExistente || pagoExitoso}
                  className={`min-w-32 shadow-lg ${
                    pagoExitoso 
                      ? 'bg-green-600 hover:bg-green-700 cursor-default' 
                      : reservaCreada 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  size="lg"
                >
                  {reservando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {reservaCreada ? 'Procesando...' : 'Creando reserva...'}
                    </>
                  ) : pagoExitoso ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      ¡Éxito!
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {reservaCreada ? 'Continuar al Pago' : 'Reservar'} ({asientosSeleccionados.length})
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleIniciarSesion}
                  className="min-w-32 bg-blue-600 hover:bg-blue-700 shadow-lg"
                  size="lg"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ CHECKOUT MODAL MEJORADO */}
      {reservaCreada && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={handleCheckoutClose}
          reserva={reservaCreada}
          onPagoExitoso={handlePagoExitoso}
          tiempoRestante={tiempoRestante}
          onExpiracion={handleExpiracionReserva}
        />
      )}
    </>
  );
}