import React, { useEffect, useState } from 'react';
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
  Star,
  Wifi,
  Coffee,
  Snowflake
} from 'lucide-react';
import { viajesApi } from '@/services/viajesService';
import type { Viaje, ViajeFilters } from '@/types';

const ITEMS_PER_PAGE = 6;

export default function ViajesPage() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [origenFilter, setOrigenFilter] = useState('all');
  const [destinoFilter, setDestinoFilter] = useState('all');
  const [fechaFilter, setFechaFilter] = useState('');

  const ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar viajes disponibles
  useEffect(() => {
    fetchViajes();
  }, [searchDebounced, origenFilter, destinoFilter, fechaFilter, page]);

  const fetchViajes = async () => {
    setLoading(true);
    try {
      const filters: ViajeFilters = {
        estado: 'programado', // Solo viajes programados
        ...(searchDebounced && { search: searchDebounced }),
        ...(origenFilter !== 'all' && { origen: origenFilter }),
        ...(destinoFilter !== 'all' && { destino: destinoFilter }),
        ...(fechaFilter && { fecha_desde: fechaFilter }),
      };

      const response = await viajesApi.list(filters);
      
      if (response.success && response.data) {
        setViajes(response.data.results);
      }
    } catch (error) {
      console.error('Error al cargar viajes:', error);
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

  const hasActiveFilters = search || origenFilter !== 'all' || destinoFilter !== 'all' || fechaFilter;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 py-20 px-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Encuentra tu viaje perfecto
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Descubre las mejores opciones de transporte entre ciudades de Bolivia
            </p>
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
              <Card key={viaje.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {viaje.origen} → {viaje.destino}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Disponible
                    </Badge>
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
                    <Button className="flex items-center gap-2">
                      Reservar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
