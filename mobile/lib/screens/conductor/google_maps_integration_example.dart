/// Ejemplo de integración con Google Maps
/// 
/// Este archivo muestra cómo agregar un mapa interactivo al sistema de ubicación.
/// Descomenta y adapta este código cuando estés listo para integrar Google Maps.

/*

// 1. AGREGAR DEPENDENCIA EN pubspec.yaml:
dependencies:
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0

// 2. CONFIGURAR API KEY:
// Android: android/app/src/main/AndroidManifest.xml
<manifest>
  <application>
    <meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="TU_API_KEY_AQUI"/>
  </application>
</manifest>

// iOS: ios/Runner/AppDelegate.swift
import GoogleMaps
GMSServices.provideAPIKey("TU_API_KEY_AQUI")

// 3. ACTUALIZAR mi_ubicacion_screen.dart:

import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

class _MiUbicacionScreenState extends State<MiUbicacionScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  
  @override
  void initState() {
    super.initState();
    _cargarDatos();
    _iniciarTracking();
  }

  // Iniciar tracking de ubicación
  Future<void> _iniciarTracking() async {
    // Verificar permisos
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return;
      }
    }

    // Obtener ubicación inicial
    _currentPosition = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // Iniciar tracking automático con Provider
    final provider = Provider.of<UbicacionProvider>(context, listen: false);
    provider.iniciarTracking(
      obtenerUbicacion: () async {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        
        setState(() {
          _currentPosition = position;
        });

        return UbicacionActual(
          lat: position.latitude,
          lng: position.longitude,
          velocidad: position.speed * 3.6, // m/s a km/h
          rumbo: position.heading,
          timestamp: DateTime.now(),
          precision: position.accuracy,
        );
      },
      intervaloSegundos: 10,
    );
  }

  @override
  void dispose() {
    final provider = Provider.of<UbicacionProvider>(context, listen: false);
    provider.detenerTracking();
    _mapController?.dispose();
    super.dispose();
  }

  // Reemplazar _buildMapaPlaceholder con mapa real
  Widget _buildMapaReal(ViajeEnCurso viaje) {
    final hasCurrentLocation = _currentPosition != null;
    
    return NeumorphicCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          height: 300,
          child: GoogleMap(
            onMapCreated: (controller) {
              _mapController = controller;
              _centrarMapa(viaje);
            },
            initialCameraPosition: CameraPosition(
              target: LatLng(viaje.origen.lat, viaje.origen.lng),
              zoom: 12,
            ),
            markers: _crearMarcadores(viaje),
            polylines: _crearPolilinea(viaje),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            mapType: MapType.normal,
            zoomControlsEnabled: false,
            compassEnabled: true,
            trafficEnabled: false,
          ),
        ),
      ),
    );
  }

  // Crear marcadores para el mapa
  Set<Marker> _crearMarcadores(ViajeEnCurso viaje) {
    final markers = <Marker>{};

    // Marcador de origen
    markers.add(
      Marker(
        markerId: MarkerId('origen'),
        position: LatLng(viaje.origen.lat, viaje.origen.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueGreen,
        ),
        infoWindow: InfoWindow(
          title: 'Origen',
          snippet: viaje.origen.nombre,
        ),
      ),
    );

    // Marcador de destino
    markers.add(
      Marker(
        markerId: MarkerId('destino'),
        position: LatLng(viaje.destino.lat, viaje.destino.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueRed,
        ),
        infoWindow: InfoWindow(
          title: 'Destino',
          snippet: viaje.destino.nombre,
        ),
      ),
    );

    // Marcador de ubicación actual del conductor
    if (_currentPosition != null) {
      markers.add(
        Marker(
          markerId: MarkerId('conductor'),
          position: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueBlue,
          ),
          infoWindow: InfoWindow(
            title: 'Tu ubicación',
            snippet: 'Velocidad: ${(_currentPosition!.speed * 3.6).toStringAsFixed(0)} km/h',
          ),
          rotation: _currentPosition!.heading,
        ),
      );
    }

    return markers;
  }

  // Crear polilínea para la ruta
  Set<Polyline> _crearPolilinea(ViajeEnCurso viaje) {
    final polylines = <Polyline>{};

    // TODO: Obtener ruta real desde OSRM o Google Directions API
    // Por ahora, línea directa entre origen y destino
    final puntos = <LatLng>[
      LatLng(viaje.origen.lat, viaje.origen.lng),
      if (_currentPosition != null)
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      LatLng(viaje.destino.lat, viaje.destino.lng),
    ];

    polylines.add(
      Polyline(
        polylineId: PolylineId('ruta'),
        points: puntos,
        color: Color(0xFF5DADE2),
        width: 5,
        patterns: [
          PatternItem.dash(20),
          PatternItem.gap(10),
        ],
      ),
    );

    return polylines;
  }

  // Centrar mapa para mostrar toda la ruta
  void _centrarMapa(ViajeEnCurso viaje) {
    if (_mapController == null) return;

    final bounds = _calcularBounds(viaje);
    _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 50),
    );
  }

  // Calcular límites del mapa
  LatLngBounds _calcularBounds(ViajeEnCurso viaje) {
    final puntos = <LatLng>[
      LatLng(viaje.origen.lat, viaje.origen.lng),
      LatLng(viaje.destino.lat, viaje.destino.lng),
      if (_currentPosition != null)
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
    ];

    double? minLat, maxLat, minLng, maxLng;

    for (var punto in puntos) {
      if (minLat == null || punto.latitude < minLat) minLat = punto.latitude;
      if (maxLat == null || punto.latitude > maxLat) maxLat = punto.latitude;
      if (minLng == null || punto.longitude < minLng) minLng = punto.longitude;
      if (maxLng == null || punto.longitude > maxLng) maxLng = punto.longitude;
    }

    return LatLngBounds(
      southwest: LatLng(minLat!, minLng!),
      northeast: LatLng(maxLat!, maxLng!),
    );
  }

  // Widget para botones flotantes sobre el mapa
  Widget _buildMapaControles() {
    return Stack(
      children: [
        _buildMapaReal(provider.viajeEnCurso!),
        Positioned(
          top: 16,
          right: 16,
          child: Column(
            children: [
              // Botón para centrar en ubicación actual
              FloatingActionButton(
                mini: true,
                backgroundColor: Colors.white,
                onPressed: () {
                  if (_currentPosition != null && _mapController != null) {
                    _mapController!.animateCamera(
                      CameraUpdate.newLatLng(
                        LatLng(
                          _currentPosition!.latitude,
                          _currentPosition!.longitude,
                        ),
                      ),
                    );
                  }
                },
                child: Icon(Icons.my_location, color: Color(0xFF5DADE2)),
              ),
              SizedBox(height: 8),
              // Botón para centrar en toda la ruta
              FloatingActionButton(
                mini: true,
                backgroundColor: Colors.white,
                onPressed: () => _centrarMapa(provider.viajeEnCurso!),
                child: Icon(Icons.zoom_out_map, color: Color(0xFF5DADE2)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// 4. INTEGRACIÓN CON GOOGLE DIRECTIONS API (Opcional):

import 'dart:convert';
import 'package:http/http.dart' as http;

class GoogleDirectionsService {
  static const String apiKey = 'TU_API_KEY_AQUI';
  static const String baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  Future<List<LatLng>> obtenerRuta({
    required double origenLat,
    required double origenLng,
    required double destinoLat,
    required double destinoLng,
  }) async {
    final url = Uri.parse(
      '$baseUrl?origin=$origenLat,$origenLng&destination=$destinoLat,$destinoLng&key=$apiKey',
    );

    final response = await http.get(url);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      
      if (data['status'] == 'OK') {
        final polyline = data['routes'][0]['overview_polyline']['points'];
        return _decodificarPolyline(polyline);
      }
    }

    return [];
  }

  List<LatLng> _decodificarPolyline(String encoded) {
    List<LatLng> puntos = [];
    int index = 0;
    int len = encoded.length;
    int lat = 0;
    int lng = 0;

    while (index < len) {
      int b, shift = 0, result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      puntos.add(LatLng(lat / 1E5, lng / 1E5));
    }

    return puntos;
  }
}

// 5. USO DEL SERVICIO DE RUTAS:

Future<void> _cargarRuta(ViajeEnCurso viaje) async {
  final service = GoogleDirectionsService();
  
  final puntos = await service.obtenerRuta(
    origenLat: viaje.origen.lat,
    origenLng: viaje.origen.lng,
    destinoLat: viaje.destino.lat,
    destinoLng: viaje.destino.lng,
  );

  setState(() {
    _rutaPuntos = puntos;
  });
}

// 6. PERMISOS DE UBICACIÓN:

// Android: android/app/src/main/AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>

// iOS: ios/Runner/Info.plist
<key>NSLocationWhenInUseUsageDescription</key>
<string>La app necesita tu ubicación para mostrar tu posición en el mapa</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>La app necesita tu ubicación para tracking en segundo plano</string>

*/

/// NOTAS IMPORTANTES:
/// 
/// 1. API Key de Google Maps:
///    - Obtén tu key en: https://console.cloud.google.com/
///    - Habilita: Maps SDK for Android, Maps SDK for iOS, Directions API
///    - Configura restricciones para seguridad
/// 
/// 2. Costos:
///    - Google Maps tiene plan gratuito limitado
///    - Monitorea uso en Google Cloud Console
///    - Considera alternativas: OpenStreetMap, Mapbox
/// 
/// 3. Alternativa con OSRM (Gratis):
///    - Ya tienes OSRM configurado en docker-compose.yml
///    - URL: https://router.project-osrm.org
///    - Endpoint: /route/v1/driving/{lng},{lat};{lng},{lat}
/// 
/// 4. Performance:
///    - Limita actualizaciones de ubicación (cada 5-10 segundos)
///    - Usa clustering para múltiples marcadores
///    - Cachea rutas calculadas
/// 
/// 5. Testing:
///    - Usa emulador con ubicaciones simuladas
///    - Android Studio: Extended Controls > Location
///    - Prueba en dispositivo real para mejor experiencia
