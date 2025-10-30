import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Route, Clock, Truck } from 'lucide-react';
import type { RutaOptimizada, Parada } from '../../../../types';

interface MapaRutasOptimizadasProps {
  rutas: RutaOptimizada[];
  altura?: string;
  className?: string;
  mostrarControles?: boolean;
  mostrarLeyenda?: boolean;
  onRutaClick?: (ruta: RutaOptimizada) => void;
  onParadaClick?: (parada: Parada) => void;
}

// Colores para diferentes vehículos
const COLORES_VEHICULOS = [
  '#3B82F6', // Azul
  '#EF4444', // Rojo
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#8B5CF6', // Púrpura
  '#F97316', // Naranja
  '#06B6D4', // Cian
  '#84CC16', // Lima
];

// Helper para convertir minutos a formato "Xh Ym"
const formatearTiempo = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  
  if (horas === 0) {
    return `${mins}m`;
  }
  
  return `${horas}h ${mins}m`;
};

export const MapaRutasOptimizadas: React.FC<MapaRutasOptimizadasProps> = ({
  rutas = [],
  altura = '500px',
  className = '',
  mostrarControles = true,
  mostrarLeyenda = true,
  onRutaClick,
  onParadaClick
}) => {
  const mapaRef = useRef<HTMLDivElement>(null);
  const mapaInstance = useRef<maplibregl.Map | null>(null);
  const marcadoresRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, maplibregl.GeoJSONSource>>(new Map());
  const [mapaCargado, setMapaCargado] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);

  // DEBUG: Log de rutas recibidas
  useEffect(() => {
    console.log('🗺️ MapaRutasOptimizadas - Rutas recibidas:', rutas);
    console.log('🗺️ MapaRutasOptimizadas - Número de rutas:', rutas.length);
    if (rutas.length > 0) {
      console.log('🗺️ MapaRutasOptimizadas - Primera ruta:', rutas[0]);
      if (rutas[0]) {
        console.log('🗺️ MapaRutasOptimizadas - Paradas de primera ruta:', rutas[0].paradas);
      }
    }
  }, [rutas]);

  // Helper para obtener nombre del vehículo con garantía de string
  const obtenerNombreVehiculo = useCallback((vehiculo: RutaOptimizada['vehiculo']) => {
    if (typeof vehiculo === 'number') return `Vehículo ${vehiculo}`;
    return (vehiculo.nombre ?? vehiculo.placa ?? `Vehículo ${vehiculo.id}`) as string;
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapaRef.current || mapaInstance.current) return;

    const mapa = new maplibregl.Map({
      container: mapaRef.current,
      style: {
        version: 8,
        sources: {
          'streets': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'streets-layer',
            type: 'raster',
            source: 'streets',
            layout: { visibility: 'visible' }
          }
        ]
      },
      center: [-63.1806, -17.7849], // Santa Cruz, Bolivia
      zoom: 10,
      attributionControl: false,
      // Limitar el mapa a las fronteras de Bolivia
      maxBounds: [
        [-69.6, -22.9], // Suroeste de Bolivia
        [-57.5, -9.7]   // Noreste de Bolivia
      ],
      minZoom: 5,  // Zoom mínimo para ver Bolivia completa
      maxZoom: 18  // Zoom máximo para detalles de calles
    });

    // Agregar controles
    if (mostrarControles) {
      mapa.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapa.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    }

    // Agregar control de atribución personalizado
    mapa.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right');

    // Eventos del mapa
    mapa.on('load', () => {
      setMapaCargado(true);
      console.log('🗺️ Mapa de rutas optimizadas cargado');
    });

    mapaInstance.current = mapa;

    return () => {
      if (mapaInstance.current) {
        mapaInstance.current.remove();
        mapaInstance.current = null;
      }
    };
  }, []);

  // Dibujar rutas y marcadores
  useEffect(() => {
    if (!mapaCargado || !mapaInstance.current) return;

    // Limpiar marcadores y polylines anteriores
    marcadoresRef.current.forEach(marker => marker.remove());
    marcadoresRef.current.clear();
    polylinesRef.current.clear();

    // Limpiar capas de rutas anteriores
    const rutasLayerIds = ['rutas-layer', 'rutas-selected-layer', 'rutas-alternativas-layer'];
    rutasLayerIds.forEach(layerId => {
      if (mapaInstance.current!.getLayer(layerId)) {
        mapaInstance.current!.removeLayer(layerId);
      }
      if (mapaInstance.current!.getSource(layerId)) {
        mapaInstance.current!.removeSource(layerId);
      }
    });

    if (rutas.length === 0) return;

    // Obtener geometrías de rutas desde OSRM
    const obtenerGeometriasRutas = async () => {
      const rutasConGeometria = await Promise.all(
        rutas.map(async (ruta, index) => {
          const paradas = ruta.paradas || [];
          
          // Extraer coordenadas válidas
          const coordenadas: [number, number][] = [];
          paradas.forEach(parada => {
            const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
            
            if (!ubicacion || typeof ubicacion !== 'object') {
              console.warn('Parada sin ubicación válida:', parada);
              return;
            }
            
            const lng = Number(ubicacion.lng);
            const lat = Number(ubicacion.lat);
            
            if (!isNaN(lng) && !isNaN(lat)) {
              coordenadas.push([lng, lat]);
            }
          });

          // Si hay menos de 2 coordenadas, usar línea recta
          if (coordenadas.length < 2) {
            console.warn(`Ruta ${index + 1} con menos de 2 coordenadas válidas`);
            return {
              ruta,
              index,
              coordenadas,
              esLineaRecta: true
            };
          }

          try {
            // Construir URL de OSRM para obtener la geometría de la ruta
            // Usar el servicio público de OSRM (compatible con el backend)
            const coordsStr = coordenadas.map(c => `${c[0]},${c[1]}`).join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
            
            console.log(`🌐 Consultando OSRM para ruta ${index + 1}:`, osrmUrl);
            
            const response = await fetch(osrmUrl);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes[0]) {
              // Usar la geometría calculada por OSRM
              console.log(`✅ Ruta ${index + 1} obtenida de OSRM con ${data.routes[0].geometry.coordinates.length} puntos`);
              return {
                ruta,
                index,
                coordenadas: data.routes[0].geometry.coordinates,
                esLineaRecta: false
              };
            } else {
              console.warn(`⚠️ OSRM no pudo calcular ruta ${index + 1}, usando línea recta`);
              return {
                ruta,
                index,
                coordenadas,
                esLineaRecta: true
              };
            }
          } catch (error) {
            console.warn(`⚠️ Error al obtener ruta ${index + 1} de OSRM, usando línea recta`);
            // En caso de error, usar línea recta entre paradas
            return {
              ruta,
              index,
              coordenadas,
              esLineaRecta: true
            };
          }
        })
      );

      return rutasConGeometria;
    };

    // Ejecutar la obtención de geometrías y luego dibujar
    obtenerGeometriasRutas().then(rutasConGeometria => {
      // Separar rutas en dos conjuntos: directas (líneas rectas) y optimizadas (OSRM)
      const rutasAlternativas = rutasConGeometria
        .filter(({ esLineaRecta }) => esLineaRecta)
        .map(({ ruta, index, coordenadas }) => {
          const vehiculo = ruta.vehiculo_detalle || ruta.vehiculo;
          const vehiculoId = typeof vehiculo === 'object' ? vehiculo.id : vehiculo;

          return {
            type: 'Feature' as const,
            properties: {
              rutaId: ruta.id,
              vehiculoId: vehiculoId,
              vehiculoNombre: obtenerNombreVehiculo(ruta.vehiculo),
              color: COLORES_VEHICULOS[index % COLORES_VEHICULOS.length],
              distancia: ruta.distancia_total_km,
              tiempo: ruta.tiempo_total_min,
              numeroParadas: ruta.numero_paradas,
              esAlternativa: true
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: coordenadas
            }
          };
        });

      const rutasOptimizadas = rutasConGeometria
        .filter(({ esLineaRecta }) => !esLineaRecta)
        .map(({ ruta, index, coordenadas }) => {
          const vehiculo = ruta.vehiculo_detalle || ruta.vehiculo;
          const vehiculoId = typeof vehiculo === 'object' ? vehiculo.id : vehiculo;

          return {
            type: 'Feature' as const,
            properties: {
              rutaId: ruta.id,
              vehiculoId: vehiculoId,
              vehiculoNombre: obtenerNombreVehiculo(ruta.vehiculo),
              color: COLORES_VEHICULOS[index % COLORES_VEHICULOS.length],
              distancia: ruta.distancia_total_km,
              tiempo: ruta.tiempo_total_min,
              numeroParadas: ruta.numero_paradas,
              esAlternativa: false
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: coordenadas
            }
          };
        });

      // Crear GeoJSON para rutas alternativas (líneas rectas - color suave)
      const rutasAlternativasGeoJSON = {
        type: 'FeatureCollection' as const,
        features: rutasAlternativas
      };

      // Crear GeoJSON para rutas optimizadas (principal - color vibrante)
      const rutasOptimizadasGeoJSON = {
        type: 'FeatureCollection' as const,
        features: rutasOptimizadas
      };

      // 1. Capa de rutas alternativas (líneas rectas - debajo, color suave)
      if (mapaInstance.current!.getSource('rutas-alternativas-layer')) {
        (mapaInstance.current!.getSource('rutas-alternativas-layer') as maplibregl.GeoJSONSource).setData(rutasAlternativasGeoJSON);
      } else {
        mapaInstance.current!.addSource('rutas-alternativas-layer', {
          type: 'geojson',
          data: rutasAlternativasGeoJSON
        });
      }

      if (!mapaInstance.current!.getLayer('rutas-alternativas-layer')) {
        mapaInstance.current!.addLayer({
          id: 'rutas-alternativas-layer',
          type: 'line',
          source: 'rutas-alternativas-layer',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.3,
            'line-dasharray': [4, 4] // Línea punteada
          }
        });
      }

      // 2. Capa de rutas optimizadas (principal - encima, color vibrante)
      if (mapaInstance.current!.getSource('rutas-layer')) {
        (mapaInstance.current!.getSource('rutas-layer') as maplibregl.GeoJSONSource).setData(rutasOptimizadasGeoJSON);
      } else {
        mapaInstance.current!.addSource('rutas-layer', {
          type: 'geojson',
          data: rutasOptimizadasGeoJSON
        });
      }

      // Agregar capa de rutas optimizadas
      if (!mapaInstance.current!.getLayer('rutas-layer')) {
        mapaInstance.current!.addLayer({
          id: 'rutas-layer',
          type: 'line',
          source: 'rutas-layer',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 5,
            'line-opacity': 0.9
          }
        });
      }

      // Agregar capa para rutas seleccionadas
      if (!mapaInstance.current!.getSource('rutas-selected-layer')) {
        mapaInstance.current!.addSource('rutas-selected-layer', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      if (!mapaInstance.current!.getLayer('rutas-selected-layer')) {
        mapaInstance.current!.addLayer({
          id: 'rutas-selected-layer',
          type: 'line',
          source: 'rutas-selected-layer',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 6,
            'line-opacity': 1.0
          }
        });
      }

      // Eventos de clic en rutas
      mapaInstance.current!.on('click', 'rutas-layer', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        if (!feature || !feature.properties) return;
        
        const rutaId = feature.properties.rutaId;
        
        if (rutaId && onRutaClick) {
          const ruta = rutas.find(r => r.id === rutaId);
          if (ruta) {
            onRutaClick(ruta);
            setRutaSeleccionada(rutaId.toString());
            
            // Resaltar ruta seleccionada
            if (feature.geometry) {
              const selectedFeature = {
                type: 'Feature' as const,
                properties: feature.properties,
                geometry: feature.geometry
              };
              
              (mapaInstance.current!.getSource('rutas-selected-layer') as maplibregl.GeoJSONSource)
                .setData({
                  type: 'FeatureCollection',
                  features: [selectedFeature]
                });
            }
          }
        }
      });

      // Cambiar cursor al pasar sobre rutas
      mapaInstance.current!.on('mouseenter', 'rutas-layer', () => {
        if (mapaInstance.current) {
          mapaInstance.current.getCanvas().style.cursor = 'pointer';
        }
      });

      mapaInstance.current!.on('mouseleave', 'rutas-layer', () => {
        if (mapaInstance.current) {
          mapaInstance.current.getCanvas().style.cursor = '';
        }
      });

      // Crear marcadores para paradas
      rutas.forEach((ruta, rutaIndex) => {
        const paradas = ruta.paradas || [];
        
        paradas.forEach((parada, paradaIndex) => {
          const color = COLORES_VEHICULOS[rutaIndex % COLORES_VEHICULOS.length] as string;
          const vehiculo = ruta.vehiculo_detalle || ruta.vehiculo;
          const vehiculoNombre = typeof vehiculo === 'object' ? vehiculo.placa || 'Vehículo' : 'Vehículo';
          
          // Obtener ubicación (priorizar ubicacion_detalle)
          const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
          
          if (!ubicacion || typeof ubicacion !== 'object') {
            console.error(`❌ No se encontró ubicación para parada ${parada.id}`);
            return;
          }
          
          // Obtener coordenadas
          const lng = Number(ubicacion.lng);
          const lat = Number(ubicacion.lat);
          
          if (isNaN(lng) || isNaN(lat)) {
            console.error(`❌ Coordenadas inválidas para ${ubicacion.nombre}:`, ubicacion);
            return; // Saltar esta parada si las coordenadas son inválidas
          }
          
          const markerElement = crearElementoMarcador(
            parada, 
            color, 
            paradaIndex, 
            vehiculoNombre
          );
          
          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: 'center',
            offset: [0, 0]
          })
            .setLngLat([lng, lat])
            .addTo(mapaInstance.current!);

          // Evento de clic en marcador
          markerElement.addEventListener('click', () => {
            if (onParadaClick) {
              onParadaClick(parada);
            }
          });

          marcadoresRef.current.set(`${ruta.id}-${parada.id}`, marker);
        });
      });

      // Ajustar vista para mostrar todas las rutas
      ajustarVistaARutas();
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas, mapaCargado]);

  // Ajustar vista del mapa para mostrar todas las rutas
  const ajustarVistaARutas = useCallback(() => {
    if (!mapaInstance.current || rutas.length === 0) return;

    const todasLasCoordenadas: [number, number][] = [];
    
    rutas.forEach(ruta => {
      const paradas = ruta.paradas || [];
      paradas.forEach(parada => {
        // Usar ubicacion_detalle en lugar de ubicacion
        const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
        
        if (!ubicacion || typeof ubicacion !== 'object') return;
        
        const lng = Number(ubicacion.lng);
        const lat = Number(ubicacion.lat);
        
        if (!isNaN(lng) && !isNaN(lat)) {
          todasLasCoordenadas.push([lng, lat]);
        }
      });
    });

    if (todasLasCoordenadas.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      todasLasCoordenadas.forEach(coord => bounds.extend(coord));
      
      mapaInstance.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    }
  }, [rutas]);

  // Crear elemento HTML para marcador
  const crearElementoMarcador = (
    parada: Parada, 
    color: string, 
    orden: number, 
    vehiculoNombre: string
  ): HTMLElement => {
    const contenedor = document.createElement('div');
    contenedor.className = 'marcador-parada-contenedor';
    contenedor.style.cssText = `
      position: relative;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
    `;
    
    const elemento = document.createElement('div');
    elemento.className = 'marcador-parada';
    
    const esDepot = parada.es_depot;
    const tamaño = esDepot ? 36 : 32;
    
    elemento.style.cssText = `
      width: ${tamaño}px;
      height: ${tamaño}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: absolute;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
      transform-origin: center center;
    `;

    // Usar números en círculos en lugar de emojis para mayor compatibilidad
    elemento.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        width: 100%; 
        height: 100%;
      ">
        ${esDepot 
          ? `<span style="font-size: 16px; line-height: 1; color: white; font-weight: bold;">D</span>`
          : `<span style="font-size: 14px; line-height: 1; color: white; font-weight: bold;">${orden + 1}</span>`
        }
      </div>
    `;

    // Efectos hover - usar transform: scale para que se agrande desde el centro
    elemento.addEventListener('mouseenter', () => {
      elemento.style.transform = 'translate(-50%, -50%) scale(1.3)';
      elemento.style.boxShadow = '0 4px 12px rgba(0,0,0,0.6)';
      elemento.style.zIndex = '1000';
    });

    elemento.addEventListener('mouseleave', () => {
      elemento.style.transform = 'translate(-50%, -50%) scale(1)';
      elemento.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
      elemento.style.zIndex = 'auto';
    });

    // Tooltip
    const ubicacion = parada.ubicacion_detalle || (typeof parada.ubicacion === 'object' ? parada.ubicacion : null);
    const nombreUbicacion = ubicacion && typeof ubicacion === 'object' ? ubicacion.nombre : 'Ubicación';
    const tooltip = esDepot ? 'Depot' : nombreUbicacion;
    elemento.title = `${tooltip} - ${vehiculoNombre} (Parada ${orden + 1})`;

    contenedor.appendChild(elemento);
    return contenedor;
  };

  return (
    <div className={`mapa-rutas-optimizadas relative ${className}`} style={{ height: altura }}>
      <div
        ref={mapaRef}
        className="w-full h-full rounded-lg border border-gray-300"
        style={{ minHeight: '300px' }}
      />
      
      {!mapaCargado && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Cargando mapa de rutas...</span>
          </div>
        </div>
      )}

      {mostrarLeyenda && rutas.length > 0 && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Route className="w-4 h-4 mr-2" />
            Rutas Optimizadas
          </h3>
          <div className="space-y-2">
            {rutas.map((ruta, index) => (
              <div 
                key={ruta.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  rutaSeleccionada === ruta.id.toString() ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (onRutaClick) {
                    onRutaClick(ruta);
                    setRutaSeleccionada(ruta.id.toString());
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORES_VEHICULOS[index % COLORES_VEHICULOS.length] }}
                  />
                  <div className="flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-gray-500" />
                    <span className="text-sm font-medium">
                      {obtenerNombreVehiculo(ruta.vehiculo)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Route className="w-3 h-3" />
                    <span>{ruta.distancia_total_km}km</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatearTiempo(Number(ruta.tiempo_total_min))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaRutasOptimizadas;
