// components/AsientosModal.tsx - VERSIÓN MEJORADA VISUALMENTE
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  X,
  Check,
  User,
  DollarSign,
  LogIn,
  Car,
  DoorOpen,
  Sofa,
  Armchair
} from 'lucide-react';
import { asientosApi } from '@/services/asientosService';
import type { Asiento } from '@/types/asiento';
import type { Viaje } from '@/types';

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

// Función simple para verificar autenticación
const verificarAutenticacion = (): boolean => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
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

  useEffect(() => {
    if (open && viajeId) {
      // Verificar autenticación
      if (usuarioAutenticadoProp === undefined) {
        setUsuarioAutenticado(verificarAutenticacion());
      } else {
        setUsuarioAutenticado(usuarioAutenticadoProp);
      }
      
      if (!usuarioAutenticado && onLoginRequired) {
        onLoginRequired();
        onClose();
        return;
      }
      
      fetchAsientos();
    } else {
      // Reset al cerrar
      setAsientos([]);
      setAsientosSeleccionados([]);
    }
  }, [open, viajeId, onLoginRequired, onClose, usuarioAutenticadoProp]);

  const fetchAsientos = async () => {
    setLoading(true);
    try {
      const response = await asientosApi.list(viajeId);
      
      if (response.success && response.data) {
        setAsientos(response.data.map((asiento: Asiento) => ({
          ...asiento,
          seleccionado: false
        })));
      } else {
        setAsientos([]);
        alert(response.error || 'Error al cargar asientos');
      }
    } catch (error) {
      setAsientos([]);
      alert('Error de conexión al cargar los asientos');
    } finally {
      setLoading(false);
    }
  };

  const toggleAsiento = (asiento: AsientoConEstado) => {
    if (asiento.estado !== 'libre') return;

    const nuevosAsientos = asientos.map(a => 
      a.id === asiento.id ? { ...a, seleccionado: !a.seleccionado } : a
    );

    setAsientos(nuevosAsientos);
    setAsientosSeleccionados(nuevosAsientos.filter(a => a.seleccionado));
  };

  const getEstadoAsiento = (asiento: AsientoConEstado) => {
    if (asiento.estado === 'ocupado' || asiento.estado === 'reservado') return 'ocupado';
    if (asiento.seleccionado) return 'seleccionado';
    return 'libre';
  };

  const getColorAsiento = (estado: string) => {
    const colores = {
      'libre': 'bg-green-500 hover:bg-green-600 border-green-600 text-white shadow-sm hover:shadow-md',
      'ocupado': 'bg-red-500 cursor-not-allowed border-red-600 text-white opacity-80',
      'seleccionado': 'bg-blue-500 border-blue-600 text-white shadow-md ring-2 ring-blue-300'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-300 border-gray-400 text-gray-700';
  };

  const getIconoAsiento = (estado: string, numero: string) => {
    if (estado === 'seleccionado') return <Check className="h-4 w-4" />;
    if (estado === 'ocupado') return <X className="h-4 w-4" />;
    return numero;
  };

  // ✅ ACTUALIZADO: Nueva función de reserva múltiple
  const handleReservar = async () => {
    if (asientosSeleccionados.length === 0) return;

    const autenticado = usuarioAutenticadoProp !== undefined ? 
      usuarioAutenticadoProp : verificarAutenticacion();
    
    if (!autenticado) {
      alert('Debes iniciar sesión para realizar una reserva');
      onLoginRequired?.();
      onClose();
      return;
    }

    setReservando(true);
    try {
      const asientosIds = asientosSeleccionados.map(asiento => asiento.id);
      
      console.log('🔄 Iniciando reserva múltiple para asientos:', asientosIds);
      
      const result = await asientosApi.reservarMultiple(asientosIds);

      if (result.success) {
        console.log('✅ Reserva múltiple exitosa:', result.data);
        
        onReservaExitosa();
        onClose();
        setAsientosSeleccionados([]);
        
        const codigoReserva = result.data?.codigo_reserva;
        const mensaje = codigoReserva 
          ? `¡Reserva exitosa! Código: ${codigoReserva}. Has reservado ${asientosSeleccionados.length} asiento(s).`
          : `¡Reserva exitosa! Has reservado ${asientosSeleccionados.length} asiento(s).`;
        
        alert(mensaje);
      } else {
        console.error('❌ Error en reserva múltiple:', result.error);
        alert(`Error al realizar la reserva: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('Error inesperado al realizar la reserva. Intente nuevamente.');
    } finally {
      setReservando(false);
    }
  };

  const handleIniciarSesion = () => {
    onClose();
    onLoginRequired?.();
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
          ${estado === 'libre' ? 'cursor-pointer hover:scale-110 transform' : 'cursor-default'}
          relative
        `}
        onClick={() => toggleAsiento(asiento)}
        disabled={estado === 'ocupado'}
        title={`Asiento ${asiento.numero} - ${estado}`}
      >
        {getIconoAsiento(estado, asiento.numero)}
        
        {/* Indicador de selección */}
        {estado === 'seleccionado' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
        )}
      </button>
    );
  };

  // Organizar asientos en filas más realistas
  const organizarAsientosEnFilas = () => {
    const asientosOrdenados = [...asientos].sort((a, b) => parseInt(a.numero) - parseInt(b.numero));
    const filas = [];
    
    // Bus típico: 2 asientos + pasillo + 2 asientos
    for (let i = 0; i < asientosOrdenados.length; i += 4) {
      filas.push(asientosOrdenados.slice(i, i + 4));
    }
    
    return filas;
  };

  const filasDeAsientos = organizarAsientosEnFilas();
  const totalPrecio = viajeInfo ? viajeInfo.precio * asientosSeleccionados.length : 0;
  const asientosLibres = asientos.filter(a => a.estado === 'libre').length;
  const asientosOcupados = asientos.filter(a => a.estado === 'ocupado' || a.estado === 'reservado').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Seleccionar Asientos - {viajeInfo?.origen} → {viajeInfo?.destino}
            {!usuarioAutenticado && (
              <Badge variant="destructive" className="ml-2">Inicia sesión para reservar</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {usuarioAutenticado 
              ? `Selecciona los asientos que deseas reservar. Total: ${asientos.length} | Disponibles: ${asientosLibres} | Ocupados: ${asientosOcupados}`
              : 'Debes iniciar sesión para poder realizar reservas.'
            }
          </DialogDescription>
        </DialogHeader>

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
            </CardContent>
          </Card>
        )}

        {/* Leyenda mejorada */}
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
            <div className="w-4 h-4 bg-red-500 rounded border border-red-600 shadow-sm opacity-80"></div>
            <span className="text-sm font-medium">Ocupado ({asientosOcupados})</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4">Cargando distribución del bus...</span>
          </div>
        ) : asientos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Car className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>No hay asientos configurados para este viaje</p>
          </div>
        ) : (
          <>
            {/* Representación REALISTA del bus */}
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
              
              {/* Ventanas laterales decorativas */}
              <div className="absolute left-2 top-16 bottom-16 w-1 bg-blue-300 opacity-20 rounded-full"></div>
              <div className="absolute right-2 top-16 bottom-16 w-1 bg-blue-300 opacity-20 rounded-full"></div>
              
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
                    Resumen de tu selección:
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
                      {asientosSeleccionados.length} asiento(s) seleccionado(s)
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
          <Button variant="outline" onClick={onClose} disabled={reservando}>
            Cancelar
          </Button>
          
          <div className="flex items-center gap-4">
            {asientosSeleccionados.length > 0 && (
              <span className="text-sm text-gray-600 hidden md:inline font-medium">
                {asientosSeleccionados.length} asiento(s) seleccionado(s)
              </span>
            )}
            
            {usuarioAutenticado ? (
              <Button 
                onClick={handleReservar}
                disabled={asientosSeleccionados.length === 0 || reservando}
                className="min-w-32 bg-green-600 hover:bg-green-700 shadow-lg"
                size="lg"
              >
                {reservando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reservando...
                  </>
                ) : (
                  <>
                    <Sofa className="h-4 w-4 mr-2" />
                    Reservar ({asientosSeleccionados.length})
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
  );
}