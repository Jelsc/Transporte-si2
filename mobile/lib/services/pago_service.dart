// lib/services/pago_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/ip_detection.dart';
import '../models/pago_model.dart';
import 'auth_service.dart'; // Importar servicio de autenticación

class PagoService {
  static const String _endpoint = '/api/pagos/pagos/';
  final AuthService _authService = AuthService();

  /// ✅ OBTENER HEADERS CON TOKEN DE AUTENTICACIÓN
  Future<Map<String, String>> _getHeaders() async {
    try {
      final token = await _authService.getToken();

      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // ✅ TOKEN INCLUIDO
      };
    } catch (e) {
      return {'Accept': 'application/json', 'Content-Type': 'application/json'};
    }
  }

  /// ✅ CREAR PAGO CON STRIPE
  Future<Map<String, dynamic>> crearPagoStripe({required int reservaId}) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}crear_pago/');
      final headers = await _getHeaders();

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({
              'reserva_id': reservaId,
              'metodo_pago': 'stripe',
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        // ✅ Manejar diferentes formatos de respuesta
        if (data['success'] == true ||
            data['pago_id'] != null ||
            data['client_secret'] != null) {
          final pagoId = data['pago_id'] ?? data['id'];
          final clientSecret = data['client_secret'];
          final paymentIntentId = data['payment_intent_id'];

          return {
            'success': true,
            'data': {
              'pago_id': pagoId,
              'client_secret': clientSecret,
              'payment_intent_id': paymentIntentId,
              ...data,
            },
            'error': null,
          };
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al crear pago Stripe',
          };
        }
      } else if (response.statusCode == 401) {
        print('🔐 [PagoService] Error 401 - Token inválido o expirado');
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } on http.ClientException {
      return {
        'success': false,
        'data': null,
        'error': 'Error de conexión. Verifica tu internet.',
      };
    }
  }

  /// ✅ CONFIRMAR PAGO CON STRIPE - VERSIÓN ROBUSTA
  Future<Map<String, dynamic>> confirmarPagoStripe({
    required int pagoId,
    required String paymentIntentId,
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/pagos/pagos/$pagoId/confirmar/');
      final headers = await _getHeaders();

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({'payment_intent_id': paymentIntentId}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['success'] == true) {
          // ✅ INTENTAR PARSEAR EL PAGO, PERO NO ES CRÍTICO
          Pago? pago;
          try {
            if (data['pago'] != null) {
              pago = Pago.fromJson(data['pago']);
            }
          } catch (e) {
            // No lanzamos excepción porque la confirmación fue exitosa
          }

          return {
            'success': true,
            'data': data,
            'pago': pago,
            'message': data['message'] ?? 'Pago confirmado exitosamente',
            'error': null,
          };
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
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CREAR PAGO MANUAL (efectivo/transferencia)
  Future<Map<String, dynamic>> crearPagoManual({
    required int reservaId,
    required String metodoPago, // 'efectivo' o 'transferencia'
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}crear_pago/');
      final headers = await _getHeaders();

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({
              'reserva_id': reservaId,
              'metodo_pago': metodoPago,
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        // ✅ Manejar diferentes formatos de respuesta
        if (data['success'] == true ||
            data['pago_id'] != null ||
            data['id'] != null) {
          return {'success': true, 'data': data, 'error': null};
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al crear pago manual',
          };
        }
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CANCELAR PAGO
  Future<Map<String, dynamic>> cancelarPago(int pagoId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$pagoId/cancelar/');
      final headers = await _getHeaders();

      final response = await http
          .post(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data, 'error': null};
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ OBTENER PAGOS DEL USUARIO
  Future<Map<String, dynamic>> obtenerMisPagos() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}mis_pagos/');
      final headers = await _getHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final pagos =
            (data['pagos'] as List?)
                ?.map((json) => Pago.fromJson(json))
                .toList() ??
            [];

        return {'success': true, 'data': pagos, 'error': null};
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ MÉTODO PARA PROBAR CONEXIÓN Y AUTENTICACIÓN
  Future<Map<String, dynamic>> probarConexion() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint');
      final headers = await _getHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(Duration(seconds: 10));

      return {
        'success': response.statusCode == 200,
        'status_code': response.statusCode,
        'has_token': headers.containsKey('Authorization'),
        'message': response.statusCode == 200
            ? 'Conexión exitosa'
            : 'Error ${response.statusCode}: ${response.body}',
      };
    } catch (e) {
      return {'success': false, 'error': '$e'};
    }
  }
}
