import 'package:flutter/foundation.dart';
import 'dart:async';
import '../models/ubicacion_model.dart';
import '../services/ubicacion_service.dart';

/// Provider para gestión de estado de ubicación del conductor
///
/// Maneja:
/// - Viaje en curso con ubicaciones
/// - Tracking de ubicación en tiempo real
/// - Estado de conexión y errores
/// - Preparado para integración con Google Maps
class UbicacionProvider with ChangeNotifier {
  final UbicacionService _ubicacionService = UbicacionService();

  // Estado del viaje en curso
  ViajeEnCurso? _viajeEnCurso;
  ViajeEnCurso? get viajeEnCurso => _viajeEnCurso;

  // Ubicación actual del conductor
  UbicacionActual? _ubicacionActual;
  UbicacionActual? get ubicacionActual => _ubicacionActual;

  // ETA dinámico
  ETAResponse? _etaActual;
  ETAResponse? get etaActual => _etaActual;

  // Estado de carga
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // Errores
  String? _error;
  String? get error => _error;

  // Tracking automático
  Timer? _trackingTimer;
  bool _trackingActivo = false;
  bool get trackingActivo => _trackingActivo;

  // Intervalo de actualización (en segundos)
  int _intervaloActualizacion = 10;
  int get intervaloActualizacion => _intervaloActualizacion;

  // Última actualización exitosa
  DateTime? _ultimaActualizacion;
  DateTime? get ultimaActualizacion => _ultimaActualizacion;

  /// Carga el viaje actualmente en curso
  Future<void> cargarViajeEnCurso() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _ubicacionService.obtenerViajeEnCurso();

      if (response.success) {
        _viajeEnCurso = response.data;
        _error = null;
      } else {
        _error = response.error ?? 'Error al cargar viaje';
        _viajeEnCurso = null;
      }
    } catch (e) {
      _error = 'Error de conexión: $e';
      _viajeEnCurso = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Actualiza la ubicación actual del conductor
  ///
  /// Envía la ubicación al backend para tracking en tiempo real.
  /// Esta función se llama automáticamente si el tracking está activo.
  Future<bool> actualizarUbicacion({
    required double lat,
    required double lng,
    double? velocidad,
    double? rumbo,
    double? precision,
  }) async {
    try {
      final response = await _ubicacionService.actualizarUbicacion(
        lat: lat,
        lng: lng,
        velocidad: velocidad,
        rumbo: rumbo,
        precision: precision,
      );

      if (response.success && response.data != null) {
        _ubicacionActual = response.data!.ubicacion;
        _ultimaActualizacion = DateTime.now();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = response.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error al actualizar ubicación: $e';
      notifyListeners();
      return false;
    }
  }

  /// Inicia el tracking automático de ubicación
  ///
  /// Requiere que se proporcione un callback que obtenga la ubicación actual
  /// del dispositivo. Este callback será llamado periódicamente.
  ///
  /// Ejemplo:
  /// ```dart
  /// provider.iniciarTracking(
  ///   obtenerUbicacion: () async {
  ///     final position = await Geolocator.getCurrentPosition();
  ///     return UbicacionActual(
  ///       lat: position.latitude,
  ///       lng: position.longitude,
  ///       velocidad: position.speed * 3.6, // m/s a km/h
  ///       rumbo: position.heading,
  ///       timestamp: DateTime.now(),
  ///       precision: position.accuracy,
  ///     );
  ///   },
  /// );
  /// ```
  void iniciarTracking({
    required Future<UbicacionActual?> Function() obtenerUbicacion,
    int? intervaloSegundos,
  }) {
    if (_trackingActivo) {
      detenerTracking();
    }

    if (intervaloSegundos != null) {
      _intervaloActualizacion = intervaloSegundos;
    }

    _trackingActivo = true;
    notifyListeners();

    // Primera actualización inmediata
    _actualizarUbicacionConCallback(obtenerUbicacion);

    // Configurar timer para actualizaciones periódicas
    _trackingTimer = Timer.periodic(
      Duration(seconds: _intervaloActualizacion),
      (_) => _actualizarUbicacionConCallback(obtenerUbicacion),
    );
  }

  /// Detiene el tracking automático de ubicación
  void detenerTracking() {
    _trackingTimer?.cancel();
    _trackingTimer = null;
    _trackingActivo = false;
    notifyListeners();
  }

  /// Actualiza el intervalo de tracking (en segundos)
  void cambiarIntervaloTracking(int nuevoIntervalo) {
    if (nuevoIntervalo < 5) {
      throw ArgumentError('El intervalo mínimo es 5 segundos');
    }
    _intervaloActualizacion = nuevoIntervalo;
    notifyListeners();
  }

  /// Helper privado para actualizar ubicación con callback
  Future<void> _actualizarUbicacionConCallback(
    Future<UbicacionActual?> Function() obtenerUbicacion,
  ) async {
    try {
      final ubicacion = await obtenerUbicacion();

      if (ubicacion != null) {
        await actualizarUbicacion(
          lat: ubicacion.lat,
          lng: ubicacion.lng,
          velocidad: ubicacion.velocidad,
          rumbo: ubicacion.rumbo,
          precision: ubicacion.precision,
        );
      }
    } catch (e) {
      debugPrint('Error en tracking automático: $e');
    }
  }

  /// Calcula la distancia restante hasta el destino
  double? calcularDistanciaRestante() {
    if (_viajeEnCurso == null || _ubicacionActual == null) {
      return null;
    }

    return _ubicacionService.calcularDistancia(
      lat1: _ubicacionActual!.lat,
      lng1: _ubicacionActual!.lng,
      lat2: _viajeEnCurso!.destino.lat,
      lng2: _viajeEnCurso!.destino.lng,
    );
  }

  /// Verifica si el conductor está cerca del origen (dentro de 500m)
  bool estaCercaDelOrigen() {
    if (_viajeEnCurso == null || _ubicacionActual == null) {
      return false;
    }

    return _ubicacionService.estaDentroDeRadio(
      latActual: _ubicacionActual!.lat,
      lngActual: _ubicacionActual!.lng,
      latObjetivo: _viajeEnCurso!.origen.lat,
      lngObjetivo: _viajeEnCurso!.origen.lng,
      radioMetros: 500,
    );
  }

  /// Verifica si el conductor está cerca del destino (dentro de 500m)
  bool estaCercaDelDestino() {
    if (_viajeEnCurso == null || _ubicacionActual == null) {
      return false;
    }

    return _ubicacionService.estaDentroDeRadio(
      latActual: _ubicacionActual!.lat,
      lngActual: _ubicacionActual!.lng,
      latObjetivo: _viajeEnCurso!.destino.lat,
      lngObjetivo: _viajeEnCurso!.destino.lng,
      radioMetros: 500,
    );
  }

  /// Calcula el progreso del viaje (0.0 a 1.0)
  double? calcularProgresoViaje() {
    if (_viajeEnCurso == null || _ubicacionActual == null) {
      return null;
    }

    final distanciaTotal = _viajeEnCurso!.origen.distanciaA(
      _viajeEnCurso!.destino,
    );
    final distanciaRecorrida = _viajeEnCurso!.origen.distanciaA(
      Ubicacion(
        id: 0,
        nombre: 'Actual',
        lat: _ubicacionActual!.lat,
        lng: _ubicacionActual!.lng,
      ),
    );

    if (distanciaTotal == 0) return 0;

    final progreso = (distanciaRecorrida / distanciaTotal).clamp(0.0, 1.0);
    return progreso;
  }

  /// Calcula ETA dinámico usando OSRM desde el backend
  Future<void> calcularETAActual({
    required double lat,
    required double lng,
  }) async {
    if (_viajeEnCurso == null) return;

    try {
      final response = await _ubicacionService.calcularETA(
        lat: lat,
        lng: lng,
        destinoId: _viajeEnCurso!.destino.id,
      );

      if (response.success && response.data != null) {
        _etaActual = response.data;
        notifyListeners();
        print('✅ ETA actualizado: ${_etaActual!.tiempoFormateado}');
      } else {
        print('❌ Error calculando ETA: ${response.error}');
      }
    } catch (e) {
      print('❌ Excepción calculando ETA: $e');
    }
  }

  /// Limpia todos los datos
  void limpiar() {
    detenerTracking();
    _viajeEnCurso = null;
    _ubicacionActual = null;
    _etaActual = null;
    _error = null;
    _isLoading = false;
    _ultimaActualizacion = null;
    notifyListeners();
  }

  @override
  void dispose() {
    detenerTracking();
    super.dispose();
  }
}
