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

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

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

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final reserva = Reserva.fromJson(data['data']);
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
        return {
          'success': false,
          'data': null,
          'error': 'Error al crear reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CORREGIDO: Confirmar pago de reserva CON AUTENTICACIÓN
  Future<Map<String, dynamic>> confirmarPago(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/confirmar-pago/');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .post(url, headers: headers, body: json.encode({}))
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final reserva = Reserva.fromJson(data['data']);
          return {'success': true, 'data': reserva, 'error': null};
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al confirmar pago',
          };
        }
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al confirmar pago: ${response.statusCode}',
        };
      }
    } catch (e) {
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

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .post(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data, 'error': null};
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al cancelar reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener una reserva específica por ID
  Future<Map<String, dynamic>> obtenerReserva(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        try {
          final reserva = Reserva.fromJson(jsonData);
          return {'success': true, 'data': reserva, 'error': null};
        } catch (e) {
          return {
            'success': false,
            'data': null,
            'error': 'Error al procesar datos de la reserva: $e',
          };
        }
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'data': null,
          'error': 'Reserva no encontrada',
        };
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener reservas del usuario
  Future<Map<String, dynamic>> getMisReservas() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/mis-reservas/');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data, 'error': null};
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener reservas: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener estado de reserva temporal
  Future<Map<String, dynamic>> getEstadoReservaTemporal(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/estado-temporal/');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data, 'error': null};
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al obtener estado de reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ NUEVO: Obtener detalle completo de reserva
  Future<Map<String, dynamic>> getDetalleCompletoReserva(int reservaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$reservaId/detalle-completo/');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        try {
          final reserva = Reserva.fromJson(jsonData);
          return {'success': true, 'data': reserva, 'error': null};
        } catch (e) {
          return {
            'success': false,
            'data': null,
            'error': 'Error al procesar datos de la reserva: $e',
          };
        }
      } else {
        return {
          'success': false,
          'data': null,
          'error':
              'Error al obtener detalle de reserva: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }
}
