import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:async';
import '../models/encomienda_model.dart';

const _distance = Distance();

/// Widget de mapa para tracking de encomiendas
/// Muestra destino, ubicación del conductor (si hay viaje) y ruta
/// Se actualiza automáticamente cuando cambia la ubicación del conductor
class MapaTrackingEncomienda extends StatefulWidget {
  final Encomienda encomienda;
  final double? latDestino;
  final double? lngDestino;
  final List<Map<String, dynamic>>? puntosSeguimiento;

  const MapaTrackingEncomienda({
    super.key,
    required this.encomienda,
    this.latDestino,
    this.lngDestino,
    this.puntosSeguimiento,
  });

  @override
  State<MapaTrackingEncomienda> createState() => _MapaTrackingEncomiendaState();
}

class _MapaTrackingEncomiendaState extends State<MapaTrackingEncomienda> {
  final MapController _mapController = MapController();
  LatLng? _ultimaUbicacionConductor;
  Timer? _updateTimer;

  @override
  void initState() {
    super.initState();
    _actualizarUbicacionConductor();
    // Actualizar vista cada vez que cambie la ubicación
    _updateTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _verificarYActualizarVista();
    });
  }

  @override
  void didUpdateWidget(MapaTrackingEncomienda oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Si cambió la encomienda, actualizar vista
    if (oldWidget.encomienda.trackingInfo != widget.encomienda.trackingInfo) {
      _actualizarUbicacionConductor();
      _ajustarVista();
    }
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  void _actualizarUbicacionConductor() {
    final conductorLoc = _conductorUbicacion;
    if (conductorLoc != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        final nuevaUbicacion = LatLng(lat, lng);
        // Si cambió la ubicación, actualizar (más de ~10 metros)
        if (_ultimaUbicacionConductor == null ||
            _distance(_ultimaUbicacionConductor!, nuevaUbicacion) > 10) {
          setState(() {
            _ultimaUbicacionConductor = nuevaUbicacion;
          });
          _ajustarVista();
        }
      }
    } else {
      setState(() {
        _ultimaUbicacionConductor = null;
      });
    }
  }

  void _verificarYActualizarVista() {
    final conductorLoc = _conductorUbicacion;
    if (conductorLoc != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        final nuevaUbicacion = LatLng(lat, lng);
        // Si cambió significativamente (más de ~10 metros), actualizar vista
        if (_ultimaUbicacionConductor == null ||
            _distance(_ultimaUbicacionConductor!, nuevaUbicacion) > 10) {
          _actualizarUbicacionConductor();
        }
      }
    }
  }

  void _ajustarVista() {
    if (!mounted) return;

    final conductorLoc = _conductorUbicacion;
    final origenViaje = _origenViaje;

    // Si hay conductor en curso, mostrar conductor y destino
    if (conductorLoc != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        // Calcular bounds para incluir conductor y destino
        final bounds = LatLngBounds(
          LatLng(
            lat < widget.latDestino! ? lat : widget.latDestino!,
            lng < widget.lngDestino! ? lng : widget.lngDestino!,
          ),
          LatLng(
            lat > widget.latDestino! ? lat : widget.latDestino!,
            lng > widget.lngDestino! ? lng : widget.lngDestino!,
          ),
        );

        // Ajustar vista con padding
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            try {
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: bounds,
                  padding: const EdgeInsets.all(50),
                ),
              );
            } catch (e) {
              // Si falla, intentar centrar manualmente
              _mapController.move(
                LatLng(
                  (lat + widget.latDestino!) / 2,
                  (lng + widget.lngDestino!) / 2,
                ),
                11.0,
              );
            }
          }
        });
        return;
      }
    }

    // Si hay viaje asignado pero no en curso, mostrar origen y destino del viaje
    if (origenViaje != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final latOrigen = origenViaje['lat'] as double?;
      final lngOrigen = origenViaje['lng'] as double?;
      if (latOrigen != null && lngOrigen != null) {
        final bounds = LatLngBounds(
          LatLng(
            latOrigen < widget.latDestino! ? latOrigen : widget.latDestino!,
            lngOrigen < widget.lngDestino! ? lngOrigen : widget.lngDestino!,
          ),
          LatLng(
            latOrigen > widget.latDestino! ? latOrigen : widget.latDestino!,
            lngOrigen > widget.lngDestino! ? lngOrigen : widget.lngDestino!,
          ),
        );

        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            try {
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: bounds,
                  padding: const EdgeInsets.all(50),
                ),
              );
            } catch (e) {
              _mapController.move(
                LatLng(
                  (latOrigen + widget.latDestino!) / 2,
                  (lngOrigen + widget.lngDestino!) / 2,
                ),
                11.0,
              );
            }
          }
        });
        return;
      }
    }

    // Solo destino, centrar ahí
    if (widget.latDestino != null && widget.lngDestino != null) {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          try {
            _mapController.move(
              LatLng(widget.latDestino!, widget.lngDestino!),
              13.0,
            );
          } catch (e) {
            // Ignorar error si el mapa no está listo
          }
        }
      });
    }
  }

  // Getters para información del viaje
  Map<String, dynamic>? get _trackingInfo => widget.encomienda.trackingInfo;

  // Ubicación del conductor
  Map<String, dynamic>? get _conductorUbicacion {
    if (_trackingInfo != null &&
        _trackingInfo!['conductor_ubicacion'] != null) {
      return _trackingInfo!['conductor_ubicacion'] as Map<String, dynamic>?;
    }
    return null;
  }

  // Origen del viaje (si está asignado pero no en curso)
  Map<String, dynamic>? get _origenViaje {
    if (_trackingInfo != null && _trackingInfo!['origen_viaje'] != null) {
      return _trackingInfo!['origen_viaje'] as Map<String, dynamic>?;
    }
    return null;
  }

  // ETA y ruta
  Map<String, dynamic>? get _etaInfo {
    if (_trackingInfo != null && _trackingInfo!['eta'] != null) {
      return _trackingInfo!['eta'] as Map<String, dynamic>?;
    }
    return null;
  }

  // Geometría de la ruta
  List<List<double>>? get _geometriaRuta {
    // Prioridad 1: Usar geometría del ETA si está disponible
    if (_etaInfo != null && _etaInfo!['geometria_ruta'] != null) {
      final geo = _etaInfo!['geometria_ruta'];
      if (geo is List && geo.isNotEmpty) {
        final coords = geo
            .map((coord) {
              if (coord is List && coord.length >= 2) {
                return [coord[0] as double, coord[1] as double];
              }
              return <double>[];
            })
            .where((coord) => coord.length == 2)
            .toList();
        if (coords.isNotEmpty) {
          return coords;
        }
      }
    }

    // Prioridad 2: Si hay conductor y destino, crear línea recta
    final conductorLoc = _conductorUbicacion;
    if (conductorLoc != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        return [
          [lng, lat], // Origen: conductor
          [widget.lngDestino!, widget.latDestino!], // Destino
        ];
      }
    }

    // Prioridad 3: Si hay origen del viaje y destino, crear línea recta
    final origenViaje = _origenViaje;
    if (origenViaje != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final latOrigen = origenViaje['lat'] as double?;
      final lngOrigen = origenViaje['lng'] as double?;
      if (latOrigen != null && lngOrigen != null) {
        return [
          [lngOrigen, latOrigen], // Origen: punto de partida del viaje
          [widget.lngDestino!, widget.latDestino!], // Destino
        ];
      }
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    // Si no hay coordenadas de destino, mostrar mensaje
    if (widget.latDestino == null || widget.lngDestino == null) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.map_outlined, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 8),
              Text(
                'Ubicación no disponible',
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 4),
              Text(
                'Geocodificando dirección...',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      height: 300,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _getInitialCenter(),
            initialZoom: _getInitialZoom(),
            minZoom: 5.0,
            maxZoom: 18.0,
            onMapReady: () {
              // Ajustar vista cuando el mapa esté listo
              _ajustarVista();
            },
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.transporte.mobile',
              maxZoom: 19,
            ),
            // Polyline de la ruta (si está disponible)
            if (_geometriaRuta != null && _geometriaRuta!.isNotEmpty)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _geometriaRuta!
                        .map((coord) {
                          // Coordenadas vienen como [lng, lat] desde el backend
                          // o las creamos como [lng, lat] en el getter
                          return LatLng(coord[1], coord[0]);
                        })
                        .toList(),
                    strokeWidth: 5.0,
                    color: Colors.blue.shade600,
                    borderStrokeWidth: 1.5,
                    borderColor: Colors.blue.shade900,
                  ),
                ],
              ),
            MarkerLayer(markers: _buildMarkers()),
          ],
        ),
      ),
    );
  }

  List<Marker> _buildMarkers() {
    final markers = <Marker>[];

    // Marcador de ubicación del conductor (azul) - si hay viaje en curso
    final conductorLoc = _conductorUbicacion;
    if (conductorLoc != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        markers.add(
          Marker(
            point: LatLng(lat, lng),
            width: 50,
            height: 50,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } else {
      // Si no hay ubicación del conductor pero hay viaje asignado, mostrar origen del viaje
      final origenViaje = _origenViaje;
      if (origenViaje != null) {
        final lat = origenViaje['lat'] as double?;
        final lng = origenViaje['lng'] as double?;
        if (lat != null && lng != null) {
          markers.add(
            Marker(
              point: LatLng(lat, lng),
              width: 50,
              height: 50,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.location_on,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade700,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Origen',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      }
    }

    // Marcador de destino (rojo)
    if (widget.latDestino != null && widget.lngDestino != null) {
      markers.add(
        Marker(
          point: LatLng(widget.latDestino!, widget.lngDestino!),
          width: 50,
          height: 50,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.location_on,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Marcadores de puntos de seguimiento históricos
    if (widget.puntosSeguimiento != null &&
        widget.puntosSeguimiento!.isNotEmpty) {
      for (var punto in widget.puntosSeguimiento!) {
        final lat = punto['lat'] as double?;
        final lng = punto['lng'] as double?;
        final evento = punto['evento'] as String? ?? 'Evento';

        if (lat != null && lng != null) {
          markers.add(
            Marker(
              point: LatLng(lat, lng),
              width: 40,
              height: 40,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: _getColorPorEvento(evento),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Icon(
                  _getIconPorEvento(evento),
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
          );
        }
      }
    }

    return markers;
  }

  Color _getColorPorEvento(String evento) {
    final eventoLower = evento.toLowerCase();
    if (eventoLower.contains('entreg')) return Colors.green;
    if (eventoLower.contains('ruta') || eventoLower.contains('transit')) {
      return Colors.blue;
    }
    if (eventoLower.contains('registr')) return Colors.orange;
    if (eventoLower.contains('cancel')) return Colors.red;
    return Colors.grey;
  }

  IconData _getIconPorEvento(String evento) {
    final eventoLower = evento.toLowerCase();
    if (eventoLower.contains('entreg')) return Icons.check_circle;
    if (eventoLower.contains('ruta') || eventoLower.contains('transit')) {
      return Icons.local_shipping;
    }
    if (eventoLower.contains('registr')) return Icons.assignment;
    if (eventoLower.contains('cancel')) return Icons.cancel;
    return Icons.info;
  }

  LatLng _getInitialCenter() {
    // Si hay ubicación del conductor, centrar entre conductor y destino
    final conductorLoc = _conductorUbicacion;
    if (conductorLoc != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final lat = conductorLoc['lat'] as double?;
      final lng = conductorLoc['lng'] as double?;
      if (lat != null && lng != null) {
        // Punto medio entre conductor y destino
        return LatLng(
          (lat + widget.latDestino!) / 2,
          (lng + widget.lngDestino!) / 2,
        );
      }
    }

    // Si hay viaje asignado pero no en curso, centrar entre origen y destino del viaje
    final origenViaje = _origenViaje;
    if (origenViaje != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      final latOrigen = origenViaje['lat'] as double?;
      final lngOrigen = origenViaje['lng'] as double?;
      if (latOrigen != null && lngOrigen != null) {
        // Punto medio entre origen y destino del viaje
        return LatLng(
          (latOrigen + widget.latDestino!) / 2,
          (lngOrigen + widget.lngDestino!) / 2,
        );
      }
    }

    // Si no, centrar en destino
    if (widget.latDestino != null && widget.lngDestino != null) {
      return LatLng(widget.latDestino!, widget.lngDestino!);
    }
    // Fallback
    return const LatLng(-16.5000, -68.1500); // La Paz por defecto
  }

  double _getInitialZoom() {
    // Si hay conductor, zoom más alejado para ver ambos puntos
    if (_conductorUbicacion != null &&
        widget.latDestino != null &&
        widget.lngDestino != null) {
      return 11.0;
    }
    return 13.0;
  }
}
