// lib/services/reserva_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';
import '../models/reserva_model.dart';

class ReservaService {
  static const String _endpoint = '/api/reservas/';

  // ✅ MÉTODO PARA OBTENER HEADERS CON AUTENTICACIÓN
  Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token =
        prefs.getString('auth_token') ??
        prefs.getString('token') ??
        prefs.getString('access_token');

    final headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
      print('🔐 [ReservaService] Token incluido en headers');
    } else {
      print('⚠️ [ReservaService] No se encontró token de autenticación');
    }

    return headers;
  }

  /// ✅ CORREGIDO: Crear reserva temporal CON AUTENTICACIÓN
  Future<Map<String, dynamic>> crearReservaTemporal({
    required int viajeId,
    required List<int> asientosIds,
    required double montoTotal,
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}crear-temporal/');

      print(
        '🌐 [ReservaService] Creando reserva temporal: viaje=$viajeId, asientos=$asientosIds',
      );

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      print('🔐 [ReservaService] Headers enviados: $headers');

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({
              'viaje_id': viajeId,
              'asientos_ids': asientosIds,
              'monto_total': montoTotal,
            }),
          )
          .timeout(const Duration(seconds: 15));

      print(
        '📡 [ReservaService] Respuesta crear reserva: ${response.statusCode}',
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final reserva = Reserva.fromJson(data['data']);
          print(
            '✅ [ReservaService] Reserva temporal creada: ${reserva.codigoReserva}',
          );
          return {
            'success': true,
            'data': reserva,
            'error': null,
            'expiracion': data['expiracion'],
            'tiempo_restante': data['tiempo_restante'],
          };
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al crear reserva',
          };
        }
      } else {
        print(
          '❌ [ReservaService] Error crear reserva: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al crear reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción crear reserva: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CORREGIDO: Confirmar pago de reserva CON AUTENTICACIÓN
  Future<Map<String, dynamic>> confirmarPago(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/confirmar-pago/');

      print('🌐 [ReservaService] Confirmando pago para reserva: $reservaId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .post(url, headers: headers, body: json.encode({}))
          .timeout(const Duration(seconds: 15));

      print(
        '📡 [ReservaService] Respuesta confirmar pago: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final reserva = Reserva.fromJson(data['data']);
          print('✅ [ReservaService] Pago confirmado: ${reserva.codigoReserva}');
          return {'success': true, 'data': reserva, 'error': null};
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al confirmar pago',
          };
        }
      } else {
        print(
          '❌ [ReservaService] Error confirmar pago: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al confirmar pago: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción confirmar pago: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CORREGIDO: Cancelar reserva temporal CON AUTENTICACIÓN
  Future<Map<String, dynamic>> cancelarReservaTemporal(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse(
        '$baseUrl${_endpoint}$reservaId/cancelar-temporal/',
      );

      print('🌐 [ReservaService] Cancelando reserva temporal: $reservaId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .post(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ReservaService] Respuesta cancelar reserva: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ReservaService] Reserva cancelada exitosamente');
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ReservaService] Error cancelar reserva: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al cancelar reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción cancelar reserva: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener una reserva específica por ID
  Future<Map<String, dynamic>> obtenerReserva(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/');

      print('🌐 [ReservaService] Obteniendo reserva: $reservaId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ReservaService] Respuesta obtener reserva: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        try {
          final reserva = Reserva.fromJson(jsonData);
          print(
            '✅ [ReservaService] Reserva obtenida exitosamente - Estado: ${reserva.estado}',
          );
          return {'success': true, 'data': reserva, 'error': null};
        } catch (e) {
          print('❌ [ReservaService] Error parseando reserva: $e');
          return {
            'success': false,
            'data': null,
            'error': 'Error al procesar datos de la reserva: $e',
          };
        }
      } else if (response.statusCode == 404) {
        print('❌ [ReservaService] Reserva no encontrada: $reservaId');
        return {
          'success': false,
          'data': null,
          'error': 'Reserva no encontrada',
        };
      } else {
        print(
          '❌ [ReservaService] Error obtener reserva: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción obtener reserva: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener reservas del usuario
  Future<Map<String, dynamic>> getMisReservas() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/mis-reservas/');

      print('🌐 [ReservaService] Obteniendo reservas del usuario');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ReservaService] Respuesta mis reservas: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ReservaService] Reservas obtenidas exitosamente');
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ReservaService] Error mis reservas: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener reservas: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción mis reservas: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener estado de reserva temporal
  Future<Map<String, dynamic>> getEstadoReservaTemporal(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/estado-temporal/');

      print('🌐 [ReservaService] Obteniendo estado de reserva: $reservaId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ReservaService] Respuesta estado reserva: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ReservaService] Estado de reserva obtenido');
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ReservaService] Error estado reserva: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener estado de reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción estado reserva: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener detalle completo de reserva
  Future<Map<String, dynamic>> getDetalleCompletoReserva(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/detalle-completo/');

      print(
        '🌐 [ReservaService] Obteniendo detalle completo de reserva: $reservaId',
      );

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ReservaService] Respuesta detalle reserva: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        try {
          final reserva = Reserva.fromJson(jsonData);
          print('✅ [ReservaService] Detalle de reserva obtenido exitosamente');
          return {'success': true, 'data': reserva, 'error': null};
        } catch (e) {
          print('❌ [ReservaService] Error parseando detalle reserva: $e');
          return {
            'success': false,
            'data': null,
            'error': 'Error al procesar datos de la reserva: $e',
          };
        }
      } else {
        print(
          '❌ [ReservaService] Error detalle reserva: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error':
              'Error al obtener detalle de reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ReservaService] Excepción detalle reserva: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }
}
