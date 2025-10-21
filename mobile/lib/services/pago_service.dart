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
      print(
        '🔐 [PagoService] Token obtenido: ${token != null ? "✅" : "❌ NULL"}',
      );

      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // ✅ TOKEN INCLUIDO
      };
    } catch (e) {
      print('❌ [PagoService] Error obteniendo token: $e');
      return {'Accept': 'application/json', 'Content-Type': 'application/json'};
    }
  }

  /// ✅ CREAR PAGO CON STRIPE
  Future<Map<String, dynamic>> crearPagoStripe({required int reservaId}) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}crear_pago/');
      final headers = await _getHeaders();

      print('🌐 [PagoService] Creando pago Stripe para reserva: $reservaId');
      print('🔗 URL: $url');
      print(
        '🔐 Headers con token: ${headers.containsKey('Authorization') ? "✅" : "❌"}',
      );

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

      print('📡 [PagoService] Respuesta crear pago: ${response.statusCode}');
      print('📋 Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        // ✅ Manejar diferentes formatos de respuesta
        if (data['success'] == true ||
            data['pago_id'] != null ||
            data['client_secret'] != null) {
          final pagoId = data['pago_id'] ?? data['id'];
          final clientSecret = data['client_secret'];
          final paymentIntentId = data['payment_intent_id'];

          print('✅ [PagoService] Pago Stripe creado: $pagoId');
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
        print('❌ [PagoService] Error crear pago: ${response.statusCode}');
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } on http.ClientException catch (e) {
      print('🌐 [PagoService] Error de conexión: $e');
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

      print(
        '🌐 [PagoService] Confirmando pago Stripe: pago=$pagoId, intent=$paymentIntentId',
      );
      print('🔗 URL: $url');

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({'payment_intent_id': paymentIntentId}),
          )
          .timeout(const Duration(seconds: 15));

      print(
        '📡 [PagoService] Respuesta confirmar pago: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['success'] == true) {
          print('✅ [PagoService] Pago confirmado exitosamente en backend');

          // ✅ INTENTAR PARSEAR EL PAGO, PERO NO ES CRÍTICO
          Pago? pago;
          try {
            if (data['pago'] != null) {
              pago = Pago.fromJson(data['pago']);
              print(
                '💰 Pago parseado: ${pago.id} - ${pago.monto} - ${pago.estado}',
              );
            }
          } catch (e) {
            print('⚠️ [PagoService] Error parseando pago (no crítico): $e');
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
        print('❌ [PagoService] Error confirmar pago: ${response.statusCode}');
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      print('💥 [PagoService] Excepción confirmar pago: $e');
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

      print(
        '🌐 [PagoService] Creando pago manual: reserva=$reservaId, metodo=$metodoPago',
      );
      print('🔗 URL: $url');
      print(
        '🔐 Headers con token: ${headers.containsKey('Authorization') ? "✅" : "❌"}',
      );

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

      print('📡 [PagoService] Respuesta pago manual: ${response.statusCode}');
      print('📋 Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);

        // ✅ Manejar diferentes formatos de respuesta
        if (data['success'] == true ||
            data['pago_id'] != null ||
            data['id'] != null) {
          print('✅ [PagoService] Pago manual creado exitosamente');
          return {'success': true, 'data': data, 'error': null};
        } else {
          return {
            'success': false,
            'data': null,
            'error': data['error'] ?? 'Error al crear pago manual',
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
        print('❌ [PagoService] Error pago manual: ${response.statusCode}');
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      print('💥 [PagoService] Excepción pago manual: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CANCELAR PAGO
  Future<Map<String, dynamic>> cancelarPago(int pagoId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}$pagoId/cancelar/');
      final headers = await _getHeaders();

      print('🌐 [PagoService] Cancelando pago: $pagoId');
      print('🔗 URL: $url');

      final response = await http
          .post(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print('📡 [PagoService] Respuesta cancelar pago: ${response.statusCode}');
      print('📋 Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [PagoService] Pago cancelado exitosamente');
        return {'success': true, 'data': data, 'error': null};
      } else if (response.statusCode == 401) {
        print('🔐 [PagoService] Error 401 al cancelar pago');
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        print('❌ [PagoService] Error cancelar pago: ${response.statusCode}');
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      print('💥 [PagoService] Excepción cancelar pago: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ OBTENER PAGOS DEL USUARIO
  Future<Map<String, dynamic>> obtenerMisPagos() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl${_endpoint}mis_pagos/');
      final headers = await _getHeaders();

      print('🌐 [PagoService] Obteniendo mis pagos');
      print('🔗 URL: $url');

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print('📡 [PagoService] Respuesta mis pagos: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final pagos =
            (data['pagos'] as List?)
                ?.map((json) => Pago.fromJson(json))
                .toList() ??
            [];

        print('✅ [PagoService] Pagos obtenidos: ${pagos.length}');
        return {'success': true, 'data': pagos, 'error': null};
      } else if (response.statusCode == 401) {
        print('🔐 [PagoService] Error 401 al obtener pagos');
        return {
          'success': false,
          'data': null,
          'error':
              'Error de autenticación. Por favor, inicia sesión nuevamente.',
        };
      } else {
        print('❌ [PagoService] Error mis pagos: ${response.statusCode}');
        return {
          'success': false,
          'data': null,
          'error': 'Error ${response.statusCode}: ${response.body}',
        };
      }
    } catch (e) {
      print('💥 [PagoService] Excepción mis pagos: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ MÉTODO PARA PROBAR CONEXIÓN Y AUTENTICACIÓN
  Future<Map<String, dynamic>> probarConexion() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint');
      final headers = await _getHeaders();

      print('🔍 [PagoService] Probando conexión: $url');
      print(
        '🔍 Headers: ${headers.containsKey('Authorization') ? "✅ Con token" : "❌ Sin token"}',
      );

      final response = await http
          .get(url, headers: headers)
          .timeout(Duration(seconds: 10));

      print('🔍 [PagoService] Test response: ${response.statusCode}');

      return {
        'success': response.statusCode == 200,
        'status_code': response.statusCode,
        'has_token': headers.containsKey('Authorization'),
        'message': response.statusCode == 200
            ? 'Conexión exitosa'
            : 'Error ${response.statusCode}: ${response.body}',
      };
    } catch (e) {
      print('🔍 [PagoService] Error probando conexión: $e');
      return {'success': false, 'error': '$e'};
    }
  }
}
