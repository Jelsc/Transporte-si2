import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/services/auth_service.dart';
import '../utils/ip_detection.dart';

class PagoService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Crear pago
  Future<Map<String, dynamic>> crearPago(double monto, String metodoPago, String descripcion) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/pagos/pagos/crear_pago/'),
        headers: headers,
        body: json.encode({
          'monto': monto,
          'metodo_pago': metodoPago,
          'descripcion': descripcion,
        }),
      );

      if (response.statusCode == 201) {
        final responseData = json.decode(response.body);
        return {
          'success': true,
          'data': responseData,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Error al crear pago'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e'
      };
    }
  }

  // Obtener mis pagos
  Future<Map<String, dynamic>> getMisPagos() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/pagos/pagos/mis_pagos/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return {
          'success': true,
          'data': responseData,
        };
      } else {
        return {
          'success': false,
          'error': 'Error al cargar pagos'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e'
      };
    }
  }

  // Confirmar pago
  Future<Map<String, dynamic>> confirmarPago(int pagoId, String paymentIntentId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/pagos/pagos/$pagoId/confirmar/'),
        headers: headers,
        body: json.encode({
          'payment_intent_id': paymentIntentId,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return {
          'success': true,
          'data': responseData,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Error al confirmar pago'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e'
      };
    }
  }

  // Cancelar pago
  Future<Map<String, dynamic>> cancelarPago(int pagoId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/pagos/pagos/$pagoId/cancelar/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return {
          'success': true,
          'data': responseData,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Error al cancelar pago'
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: $e'
      };
    }
  }
}