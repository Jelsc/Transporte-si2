import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';

class MapaInteractivo extends StatefulWidget {
  final double? latitudDestino;
  final double? longitudDestino;
  final String? nombreDestino;
  final int? destinoId; // Para calcular ETA
  final List<List<double>>? geometriaRuta; // Polyline desde OSRM
  final Function(double lat, double lng)?
  onLocationUpdate; // Callback para tracking

  const MapaInteractivo({
    Key? key,
    this.latitudDestino,
    this.longitudDestino,
    this.nombreDestino,
    this.destinoId,
    this.geometriaRuta,
    this.onLocationUpdate,
  }) : super(key: key);

  @override
  State<MapaInteractivo> createState() => _MapaInteractivoState();
}

class _MapaInteractivoState extends State<MapaInteractivo> {
  MapController? _mapController;
  LatLng? _currentPosition;
  bool _isLoading = true;
  String? _errorMessage;
  Timer? _trackingTimer;
  StreamSubscription<Position>? _positionStream;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  @override
  void dispose() {
    _trackingTimer?.cancel();
    _positionStream?.cancel();
    super.dispose();
  }

  Future<void> _initializeMap() async {
    try {
      // Verificar permisos de ubicación
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _errorMessage = 'Permisos de ubicación denegados';
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _errorMessage = 'Permisos de ubicación denegados permanentemente';
          _isLoading = false;
        });
        return;
      }

      // Obtener ubicación actual
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
        _isLoading = false;
        _mapController = MapController();
      });

      // Notificar la ubicación inicial
      if (widget.onLocationUpdate != null) {
        widget.onLocationUpdate!(position.latitude, position.longitude);
      }

      // Iniciar tracking automático cada 30 segundos
      _startLocationTracking();

      // Esperar un frame para que el mapa se renderice
      await Future.delayed(const Duration(milliseconds: 300));

      // Ajustar vista si hay destino
      if (widget.latitudDestino != null && widget.longitudDestino != null) {
        _fitBounds();
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al obtener ubicación: $e';
        _isLoading = false;
      });
    }
  }

  /// Inicia el tracking automático de ubicación cada 30 segundos
  void _startLocationTracking() {
    // Cancelar timer anterior si existe
    _trackingTimer?.cancel();

    _trackingTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        if (mounted) {
          setState(() {
            _currentPosition = LatLng(position.latitude, position.longitude);
          });

          // Notificar la nueva ubicación
          if (widget.onLocationUpdate != null) {
            widget.onLocationUpdate!(position.latitude, position.longitude);
          }

          print(
            '📍 Ubicación actualizada: ${position.latitude}, ${position.longitude}',
          );
        }
      } catch (e) {
        print('❌ Error actualizando ubicación: $e');
      }
    });
  }

  void _fitBounds() {
    if (_mapController == null ||
        _currentPosition == null ||
        widget.latitudDestino == null ||
        widget.longitudDestino == null) {
      return;
    }

    try {
      final bounds = LatLngBounds(
        _currentPosition!,
        LatLng(widget.latitudDestino!, widget.longitudDestino!),
      );

      _mapController!.fitCamera(
        CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)),
      );
    } catch (e) {
      print('Error ajustando bounds: $e');
    }
  }

  /// Construye la lista de polylines para mostrar la ruta
  List<Polyline> _buildPolylines() {
    if (widget.geometriaRuta == null || widget.geometriaRuta!.isEmpty) {
      return [];
    }

    try {
      // Convertir geometría OSRM [lng, lat] a LatLng
      final points = widget.geometriaRuta!.map((coord) {
        return LatLng(coord[1], coord[0]); // [lng, lat] -> LatLng(lat, lng)
      }).toList();

      return [
        Polyline(
          points: points,
          strokeWidth: 4.0,
          color: Colors.blue,
          borderStrokeWidth: 2.0,
          borderColor: Colors.blue.shade900,
        ),
      ];
    } catch (e) {
      print('Error construyendo polyline: $e');
      return [];
    }
  }

  List<Marker> _buildMarkers() {
    List<Marker> markers = [];

    // Marcador de ubicación actual
    if (_currentPosition != null) {
      markers.add(
        Marker(
          point: _currentPosition!,
          width: 40,
          height: 40,
          child: const Icon(Icons.my_location, color: Colors.blue, size: 40),
        ),
      );
    }

    // Marcador de destino
    if (widget.latitudDestino != null && widget.longitudDestino != null) {
      markers.add(
        Marker(
          point: LatLng(widget.latitudDestino!, widget.longitudDestino!),
          width: 40,
          height: 40,
          child: const Icon(Icons.location_on, color: Colors.red, size: 40),
        ),
      );
    }

    return markers;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Cargando mapa...'),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 60),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _errorMessage = null;
                });
                _initializeMap();
              },
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter:
                _currentPosition ??
                LatLng(
                  widget.latitudDestino ?? -17.7863924,
                  widget.longitudDestino ?? -63.1812076,
                ),
            initialZoom: 13.0,
            minZoom: 5.0,
            maxZoom: 18.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.example.mobile',
              maxZoom: 19,
            ),
            // Polyline de la ruta (si está disponible)
            PolylineLayer(polylines: _buildPolylines()),
            MarkerLayer(markers: _buildMarkers()),
          ],
        ),
        // Botón para centrar en ubicación actual
        Positioned(
          right: 16,
          bottom: 100,
          child: FloatingActionButton(
            mini: true,
            backgroundColor: Colors.white,
            onPressed: () {
              if (_currentPosition != null && _mapController != null) {
                _mapController!.move(_currentPosition!, 15.0);
              }
            },
            child: const Icon(Icons.my_location, color: Colors.blue),
          ),
        ),
        // Botón para ajustar vista
        if (widget.latitudDestino != null && widget.longitudDestino != null)
          Positioned(
            right: 16,
            bottom: 160,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: Colors.white,
              onPressed: _fitBounds,
              child: const Icon(Icons.zoom_out_map, color: Colors.green),
            ),
          ),
        // Información del destino
        if (widget.nombreDestino != null)
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.nombreDestino!,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
