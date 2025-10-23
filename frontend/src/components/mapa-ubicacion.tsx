import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Ubicacion, TipoUbicacion, MapaConfig } from '../types';
import { MARCADOR_CONFIGS, DEFAULT_MAPA_CONFIG } from '../types';
import { MapPin, LocateFixed, Layers } from 'lucide-react';

interface MapaUbicacionesProps {
  // Configuración del mapa
  config?: MapaConfig;
  
  // Ubicaciones a mostrar
  ubicaciones?: Ubicacion[];
  
  // Modo de selección
  modoSeleccion?: boolean;
  onCoordenadasSeleccionadas?: (lat: number, lng: number) => void;
  onUbicacionActualObtenida?: (lat: number, lng: number) => void;
  
  // Ubicación seleccionada para edición
  ubicacionSeleccionada?: Ubicacion | null;
  
  // Callbacks
  onUbicacionClick?: (ubicacion: Ubicacion) => void;
  onUbicacionDrag?: (ubicacion: Ubicacion, nuevaLat: number, nuevaLng: number) => void;
  
  // Opciones
  mostrarControles?: boolean;
  mostrarUbicacionActual?: boolean;
  altura?: string;
  className?: string;
}

export const MapaUbicaciones: React.FC<MapaUbicacionesProps> = ({
  config = DEFAULT_MAPA_CONFIG,
  ubicaciones = [],
  modoSeleccion = false,
  onCoordenadasSeleccionadas,
  onUbicacionActualObtenida,
  ubicacionSeleccionada = null,
  onUbicacionClick,
  onUbicacionDrag,
  mostrarControles = true,
  mostrarUbicacionActual = false,
  altura = '400px',
  className = ''
}) => {
  const mapaRef = useRef<HTMLDivElement>(null);
  const mapaInstance = useRef<maplibregl.Map | null>(null);
  const marcadoresRef = useRef<Map<number, maplibregl.Marker>>(new Map());
  const marcadorSeleccionRef = useRef<maplibregl.Marker | null>(null);
  const [mapaCargado, setMapaCargado] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState<{ lat: number; lng: number } | null>(null);
  const [tipoMapa, setTipoMapa] = useState<'streets' | 'satellite'>('streets');
  const [mostrarSelectorCapas, setMostrarSelectorCapas] = useState(false);
  const [mostrarMensajeInicial, setMostrarMensajeInicial] = useState(true);

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
          },
          'satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [
          {
            id: 'streets-layer',
            type: 'raster',
            source: 'streets',
            layout: { visibility: 'visible' }
          },
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            layout: { visibility: 'none' }
          }
        ]
      },
      center: config.center,
      zoom: config.zoom,
      ...(config.bounds && { maxBounds: config.bounds }),
      attributionControl: false
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
      console.log('🗺️ Mapa cargado correctamente');
    });

    // Manejar clicks en el mapa (modo selección)
    if (modoSeleccion && onCoordenadasSeleccionadas) {
      mapa.on('click', (e: any) => {
        const { lng, lat } = e.lngLat;
        onCoordenadasSeleccionadas(lat, lng);
        // Ocultar mensaje inicial al hacer clic
        setMostrarMensajeInicial(false);
      });
    }

    // No obtener ubicación automáticamente al montar el componente
    // Solo se obtiene cuando el usuario hace clic en "Mi ubicación"

    mapaInstance.current = mapa;

    return () => {
      if (marcadorSeleccionRef.current) {
        marcadorSeleccionRef.current.remove();
        marcadorSeleccionRef.current = null;
      }
      if (mapaInstance.current) {
        mapaInstance.current.remove();
        mapaInstance.current = null;
      }
    };
  }, []);

  // Obtener ubicación actual del usuario
  const obtenerUbicacionActual = useCallback((showErrors: boolean = false) => {
    if (!navigator.geolocation) {
      if (showErrors) {
        console.warn('Geolocalización no soportada en este navegador');
      }
      return Promise.reject(new Error('Geolocalización no soportada'));
    }

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const ubicacion = { lat: latitude, lng: longitude };
          
          // En modo selección, solo actualizamos el formulario, no el estado ubicacionActual
          if (modoSeleccion && onUbicacionActualObtenida) {
            onUbicacionActualObtenida(latitude, longitude);
          } else {
            // Solo en modo no-selección, actualizamos el estado ubicacionActual
            setUbicacionActual(ubicacion);
          }
          
          // Centrar mapa en ubicación actual
          if (mapaInstance.current) {
            mapaInstance.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 1000
            });
          }
          
          resolve(ubicacion);
        },
        (error) => {
          // Solo mostrar errores si se solicita explícitamente
          if (showErrors) {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                console.warn('Permisos de geolocalización denegados por el usuario');
                break;
              case error.POSITION_UNAVAILABLE:
                console.warn('Información de ubicación no disponible');
                break;
              case error.TIMEOUT:
                console.warn('Tiempo de espera agotado para obtener ubicación');
                break;
              default:
                // Verificar si es un error de permisos denegados con mensaje diferente
                if (error.message && error.message.includes('denied')) {
                  console.warn('Permisos de geolocalización denegados por el usuario');
                } else {
                  console.warn('Error desconocido al obtener ubicación:', error.message);
                }
                break;
            }
          }
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }, [modoSeleccion, onUbicacionActualObtenida]);

  // Función para cambiar tipo de mapa
  const cambiarTipoMapa = useCallback((nuevoTipo: 'streets' | 'satellite') => {
    if (!mapaInstance.current || nuevoTipo === tipoMapa) return;

    // Ocultar capa actual
    mapaInstance.current.setLayoutProperty(`${tipoMapa}-layer`, 'visibility', 'none');
    
    // Mostrar nueva capa
    mapaInstance.current.setLayoutProperty(`${nuevoTipo}-layer`, 'visibility', 'visible');
    
    setTipoMapa(nuevoTipo);
    setMostrarSelectorCapas(false);
  }, [tipoMapa]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mostrarSelectorCapas) {
        const target = event.target as HTMLElement;
        if (!target.closest('.selector-capas-container')) {
          setMostrarSelectorCapas(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mostrarSelectorCapas]);

  // Ocultar mensaje inicial después de 5 segundos
  useEffect(() => {
    if (mostrarMensajeInicial && modoSeleccion) {
      const timer = setTimeout(() => {
        setMostrarMensajeInicial(false);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    }
  }, [mostrarMensajeInicial, modoSeleccion]);

  // Actualizar marcadores cuando cambien las ubicaciones
  useEffect(() => {
    if (!mapaCargado || !mapaInstance.current) return;

    // Limpiar marcadores existentes
    marcadoresRef.current.forEach(marker => marker.remove());
    marcadoresRef.current.clear();

    // Agregar marcadores para cada ubicación
    ubicaciones.forEach(ubicacion => {
      const config = MARCADOR_CONFIGS[ubicacion.tipo];
      const markerElement = crearElementoMarcador(ubicacion, config);
      
      const marker = new maplibregl.Marker({
        element: markerElement,
        draggable: modoSeleccion && ubicacionSeleccionada?.id === ubicacion.id
      })
        .setLngLat([Number(ubicacion.lng), Number(ubicacion.lat)])
        .addTo(mapaInstance.current!);

      // Eventos del marcador
      markerElement.addEventListener('click', () => {
        if (onUbicacionClick) {
          onUbicacionClick(ubicacion);
        }
      });

      if (modoSeleccion && ubicacionSeleccionada?.id === ubicacion.id) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          if (onUbicacionDrag) {
            onUbicacionDrag(ubicacion, lngLat.lat, lngLat.lng);
          }
        });
      }

      marcadoresRef.current.set(ubicacion.id, marker);
    });

    // Agregar marcador de ubicación actual solo si no estamos en modo selección
    // En modo selección, la ubicación actual se maneja con el marcador de selección
    if (ubicacionActual && !modoSeleccion) {
      const markerActual = new maplibregl.Marker({
        element: crearElementoUbicacionActual(),
        draggable: false
      })
        .setLngLat([ubicacionActual.lng, ubicacionActual.lat])
        .addTo(mapaInstance.current);
    }

  }, [ubicaciones, mapaCargado, ubicacionSeleccionada, ubicacionActual, modoSeleccion]);

  // Mostrar marcador de selección cuando hay coordenadas
  useEffect(() => {
    if (!mapaCargado || !mapaInstance.current) return;

    // Limpiar marcador de selección anterior
    if (marcadorSeleccionRef.current) {
      marcadorSeleccionRef.current.remove();
      marcadorSeleccionRef.current = null;
    }

    // Agregar marcador de selección si hay coordenadas válidas
    if (ubicacionSeleccionada && ubicacionSeleccionada.lat && ubicacionSeleccionada.lng) {
      const lat = Number(ubicacionSeleccionada.lat);
      const lng = Number(ubicacionSeleccionada.lng);
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const markerElement = document.createElement('div');
        markerElement.style.cssText = `
          width: 20px;
          height: 20px;
          background-color: #EF4444;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        marcadorSeleccionRef.current = new maplibregl.Marker({
          element: markerElement,
          draggable: modoSeleccion
        })
          .setLngLat([lng, lat])
          .addTo(mapaInstance.current!);

        // Centrar mapa en la ubicación seleccionada
        mapaInstance.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        });
      }
    }
  }, [ubicacionSeleccionada, mapaCargado, modoSeleccion]);

  // Crear elemento HTML para marcador
  const crearElementoMarcador = (ubicacion: Ubicacion, config: any): HTMLElement => {
    const elemento = document.createElement('div');
    elemento.className = 'marcador-ubicacion';
    elemento.style.cssText = `
      width: ${config.size}px;
      height: ${config.size}px;
      background-color: ${config.color};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    `;

    // Agregar icono si está disponible
    if (config.icon) {
      elemento.innerHTML = `<span style="font-size: 10px;">${config.icon}</span>`;
    } else {
      elemento.innerHTML = '<span style="color: white; font-weight: bold;">📍</span>';
    }

    // Efectos hover
    elemento.addEventListener('mouseenter', () => {
      elemento.style.transform = 'scale(1.2)';
    });

    elemento.addEventListener('mouseleave', () => {
      elemento.style.transform = 'scale(1)';
    });

    // Tooltip
    elemento.title = `${ubicacion.nombre} (${ubicacion.tipo})`;

    return elemento;
  };

  // Crear elemento para ubicación actual
  const crearElementoUbicacionActual = (): HTMLElement => {
    const elemento = document.createElement('div');
    elemento.className = 'marcador-ubicacion-actual';
    elemento.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: #EF4444;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    `;

    elemento.innerHTML = '<Navigation size={12} color="white" />';

    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    return elemento;
  };

  // Centrar mapa en ubicación específica
  const centrarEnUbicacion = useCallback((ubicacion: Ubicacion) => {
    if (mapaInstance.current) {
      mapaInstance.current.flyTo({
        center: [Number(ubicacion.lng), Number(ubicacion.lat)],
        zoom: 15,
        duration: 1000
      });
    }
  }, []);

  // Exponer función para uso externo
  useEffect(() => {
    if (mapaInstance.current) {
      (mapaInstance.current as any).centrarEnUbicacion = centrarEnUbicacion;
    }
  }, [centrarEnUbicacion]);

  return (
    <div className={`mapa-ubicaciones relative ${className}`} style={{ height: altura }}>
      <div
        ref={mapaRef}
        className="w-full h-full rounded-lg border border-gray-300"
        style={{ minHeight: '300px' }}
      />
      
      {!mapaCargado && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Cargando mapa...</span>
          </div>
        </div>
      )}

      {modoSeleccion && mostrarMensajeInicial && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md animate-fade-in">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>Haz clic en el mapa para seleccionar ubicación</span>
          </div>
        </div>
      )}

      {/* Selector de capas */}
      <div className="absolute top-30 right-2 selector-capas-container">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMostrarSelectorCapas(!mostrarSelectorCapas);
            }}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Cambiar capa del mapa"
          >
            <Layers className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dropdown */}
          {mostrarSelectorCapas && (
            <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg overflow-hidden z-10 min-w-[140px]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cambiarTipoMapa('streets');
                }}
                className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                  tipoMapa === 'streets' ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-lg">🗺️</span>
                <span className={`text-sm font-medium ${tipoMapa === 'streets' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Calles
                </span>
                {tipoMapa === 'streets' && (
                  <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cambiarTipoMapa('satellite');
                }}
                className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                  tipoMapa === 'satellite' ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-lg">🛰️</span>
                <span className={`text-sm font-medium ${tipoMapa === 'satellite' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Satélite
                </span>
                {tipoMapa === 'satellite' && (
                  <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {mostrarUbicacionActual && !ubicacionActual && (
        <div className="absolute bottom-1 left-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              obtenerUbicacionActual(true).catch((error) => {
                // Mostrar mensaje específico para permisos bloqueados
                if (error.message && (error.message.includes('denied') || error.code === 1)) {
                  console.warn('💡 Para habilitar la ubicación: Haz clic en el icono de candado 🔒 junto a la URL y permite la ubicación');
                }
              });
            }}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Obtener mi ubicación actual"
          >
            <LocateFixed className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MapaUbicaciones;
