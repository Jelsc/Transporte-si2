import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/ubicacion_model.dart';

/// Servicio para gestión de ubicaciones y tracking del conductor
///
/// Arquitectura escalable que soporta:
/// - Obtención de viaje en curso con ubicaciones
/// - Actualización de ubicación en tiempo real
/// - Preparado para integración con Google Maps API
class UbicacionService {
  // ⚠️ IMPORTANTE: Cambia esta IP según tu configuración:
  // - Emulador Android: 'http://10.0.2.2:8000/api'
  // - iOS Simulator: 'http://localhost:8000/api'
  // - Dispositivo Físico: Usa la IP de tu WiFi (ej: 192.168.0.143)
  //   Para obtenerla: ipconfig (Windows) / ifconfig (Mac/Linux)
  static const String baseUrl = 'http://192.168.0.143:8000/api';

  /// Headers base para todas las peticiones
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // ✅ Usar Bearer para JWT (no Token)
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Obtiene el viaje actualmente en curso para el conductor
  ///
  /// Retorna información completa incluyendo:
  /// - Ubicaciones de origen y destino
  /// - Lista de pasajeros
  /// - Estado del viaje
  Future<ApiResponse<ViajeEnCurso>> obtenerViajeEnCurso() async {
    try {
      final headers = await _getHeaders();

      // 🐛 DEBUG: Ver qué headers se están enviando
      print('🔍 DEBUG - URL: $baseUrl/viajes/viaje-en-curso/');
      print('🔍 DEBUG - Headers: $headers');
      print(
        '🔍 DEBUG - Token presente: ${headers.containsKey('Authorization')}',
      );

      final response = await http
          .get(Uri.parse('$baseUrl/viajes/viaje-en-curso/'), headers: headers)
          .timeout(const Duration(seconds: 15));

      // 🐛 DEBUG: Ver respuesta del servidor
      print('🔍 DEBUG - Status Code: ${response.statusCode}');
      print('🔍 DEBUG - Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['success'] == true) {
          if (data['data'] == null) {
            // No hay viaje en curso
            return ApiResponse(
              success: true,
              data: null,
              message: data['mensaje'] ?? 'No hay viaje en curso',
            );
          }

          final viaje = ViajeEnCurso.fromJson(data['data']);
          return ApiResponse(
            success: true,
            data: viaje,
            message: 'Viaje en curso obtenido exitosamente',
          );
        } else {
          return ApiResponse(
            success: false,
            error: data['error'] ?? 'Error desconocido',
          );
        }
      } else if (response.statusCode == 403) {
        return ApiResponse(
          success: false,
          error: 'No tienes permisos de conductor',
        );
      } else {
        return ApiResponse(
          success: false,
          error: 'Error del servidor: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, error: 'Error de conexión: $e');
    }
  }

  /// Actualiza la ubicación actual del conductor
  ///
  /// Parámetros:
  /// - [lat]: Latitud actual
  /// - [lng]: Longitud actual
  /// - [velocidad]: Velocidad actual en km/h (opcional)
  /// - [rumbo]: Dirección/rumbo en grados 0-360 (opcional)
  /// - [precision]: Precisión de la ubicación en metros (opcional)
  ///
  /// Esta función debe llamarse periódicamente durante un viaje en curso
  /// para mantener el tracking en tiempo real.
  Future<ApiResponse<ActualizacionUbicacionResultado>> actualizarUbicacion({
    required double lat,
    required double lng,
    double? velocidad,
    double? rumbo,
    double? precision,
  }) async {
    try {
      // Validar coordenadas
      if (lat < -90 || lat > 90) {
        return ApiResponse(
          success: false,
          error: 'Latitud fuera de rango (-90 a 90)',
        );
      }
      if (lng < -180 || lng > 180) {
        return ApiResponse(
          success: false,
          error: 'Longitud fuera de rango (-180 a 180)',
        );
      }

      final headers = await _getHeaders();
      final body = <String, dynamic>{'lat': lat, 'lng': lng};

      if (velocidad != null) body['velocidad'] = velocidad;
      if (rumbo != null) body['rumbo'] = rumbo;
      if (precision != null) body['precision'] = precision;

      final response = await http
          .post(
            Uri.parse('$baseUrl/viajes/actualizar-ubicacion/'),
            headers: headers,
            body: json.encode(body),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final resultado = ActualizacionUbicacionResultado.fromJson(data);

        return ApiResponse(
          success: resultado.success,
          data: resultado,
          message: resultado.mensaje,
        );
      } else if (response.statusCode == 403) {
        return ApiResponse(
          success: false,
          error: 'No tienes permisos de conductor',
        );
      } else if (response.statusCode == 400) {
        final data = json.decode(response.body);
        return ApiResponse(
          success: false,
          error: data['error'] ?? 'Datos de ubicación inválidos',
        );
      } else {
        return ApiResponse(
          success: false,
          error: 'Error del servidor: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, error: 'Error de conexión: $e');
    }
  }

  /// Calcula la distancia entre dos coordenadas (en kilómetros)
  /// Usa la fórmula Haversine para cálculo preciso
  double calcularDistancia({
    required double lat1,
    required double lng1,
    required double lat2,
    required double lng2,
  }) {
    final origen = Ubicacion(id: 0, nombre: '', lat: lat1, lng: lng1);
    final destino = Ubicacion(id: 0, nombre: '', lat: lat2, lng: lng2);

    return origen.distanciaA(destino);
  }

  /// Valida si una ubicación está dentro de un radio específico (en metros)
  bool estaDentroDeRadio({
    required double latActual,
    required double lngActual,
    required double latObjetivo,
    required double lngObjetivo,
    required double radioMetros,
  }) {
    final distanciaKm = calcularDistancia(
      lat1: latActual,
      lng1: lngActual,
      lat2: latObjetivo,
      lng2: lngObjetivo,
    );

    final distanciaMetros = distanciaKm * 1000;
    return distanciaMetros <= radioMetros;
  }

  /// Calcula ETA y obtiene geometría de ruta desde el backend (usa OSRM)
  ///
  /// Retorna:
  /// - distancia_km: Distancia real de la ruta
  /// - tiempo_minutos: Tiempo estimado de llegada
  /// - tiempo_llegada_estimado: Hora estimada de llegada
  /// - geometria_ruta: Array de coordenadas [lng, lat] para polyline
  /// - modo_calculo: 'osrm' o 'haversine'
  Future<ApiResponse<ETAResponse>> calcularETA({
    required double lat,
    required double lng,
    required int destinoId,
  }) async {
    try {
      final headers = await _getHeaders();

      // Construir URL con query parameters (GET request)
      final uri = Uri.parse('$baseUrl/viajes/calcular-eta/').replace(
        queryParameters: {
          'lat': lat.toString(),
          'lng': lng.toString(),
          'destino_id': destinoId.toString(),
        },
      );

      print(
        '🔍 DEBUG - Calculando ETA: lat=$lat, lng=$lng, destino=$destinoId',
      );
      print('🔍 DEBUG - URL: $uri');

      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 20));

      print('🔍 DEBUG - ETA Status: ${response.statusCode}');
      print('🔍 DEBUG - ETA Response: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // Backend devuelve {success: true, eta: {...}}
        if (data['success'] == true && data['eta'] != null) {
          final eta = ETAResponse.fromJson(data['eta']);

          return ApiResponse(
            success: true,
            data: eta,
            message: 'ETA calculado correctamente',
          );
        } else {
          return ApiResponse(
            success: false,
            error: data['error'] ?? 'Error desconocido',
          );
        }
      } else if (response.statusCode == 404) {
        return ApiResponse(
          success: false,
          error: 'No hay viaje en curso o destino no encontrado',
        );
      } else {
        return ApiResponse(
          success: false,
          error: 'Error al calcular ETA: ${response.statusCode}',
        );
      }
    } catch (e) {
      print('❌ ERROR calculando ETA: $e');
      return ApiResponse(
        success: false,
        error: 'Error de conexión al calcular ETA: $e',
      );
    }
  }
}

/// Clase genérica para respuestas de API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse({required this.success, this.data, this.error, this.message});
}
