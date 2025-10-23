import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/services/auth_service.dart';
import '../models/encomienda_model.dart';
import '../models/crear_encomienda_model.dart';
import '../utils/ip_detection.dart';

class EncomiendaService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ✅ CORREGIDO: Crear encomienda
  Future<ApiResponse<Encomienda>> crearEncomienda(CrearEncomiendaRequest request) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      print('📦 Creando encomienda: ${request.toJson()}');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      print('📦 Response status: ${response.statusCode}');
      print('📦 Response body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Encomienda creada exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final errorMessage = _parseError(errorData, response.statusCode);
        
        return ApiResponse<Encomienda>(
          success: false,
          error: errorMessage
        );
      }
    } catch (e) {
      print('❌ Error en crearEncomienda: $e');
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // ✅ CORREGIDO: Obtener mis encomiendas
  Future<ApiResponse<List<Encomienda>>> getMisEncomiendas() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      print('📦 Obteniendo mis encomiendas...');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/mis_encomiendas/'),
        headers: headers,
      );

      print('📦 Mis encomiendas response: ${response.statusCode}');
      print('📦 Mis encomiendas body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        
        List<dynamic> results = [];
        
        // ✅ MEJOR MANEJO DE DIFERENTES FORMATOS
        if (responseData is Map) {
          if (responseData.containsKey('data')) {
            results = responseData['data'] ?? [];
          } else if (responseData.containsKey('results')) {
            results = responseData['results'] ?? [];
          } else if (responseData.containsKey('encomiendas')) {
            results = responseData['encomiendas'] ?? [];
          } else {
            // Si es un mapa sin estructura conocida, buscar lista directamente
            final possibleList = responseData.values.firstWhere(
              (value) => value is List,
              orElse: () => []
            );
            results = possibleList is List ? possibleList : [];
          }
        } else if (responseData is List) {
          results = responseData;
        }
        
        final encomiendas = results.map((json) => Encomienda.fromJson(json)).toList();
        
        return ApiResponse<List<Encomienda>>(
          success: true,
          data: encomiendas,
          message: 'Encomiendas cargadas exitosamente'
        );
      } else if (response.statusCode == 404) {
        return ApiResponse<List<Encomienda>>(
          success: true,
          data: [],
          message: 'No tienes encomiendas registradas'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<List<Encomienda>>(
          success: false,
          error: _parseError(errorData, response.statusCode)
        );
      }
    } catch (e) {
      print('❌ Error en getMisEncomiendas: $e');
      return ApiResponse<List<Encomienda>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }
  // ✅ NUEVO: Método para parsear errores
  String _parseError(dynamic errorData, int statusCode) {
    if (errorData is Map) {
      return errorData['error'] ?? 
             errorData['detail'] ?? 
             errorData['message'] ??
             errorData.toString();
    } else if (errorData is String) {
      return errorData;
    } else {
      return 'Error del servidor: $statusCode';
    }
  }
  Future<ApiResponse<Encomienda>> getSeguimiento(String codigo) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      
      print('📦 Buscando seguimiento: $codigo');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/seguimiento/$codigo/'),
      );

      print('📦 Seguimiento response: ${response.statusCode}');
      print('📦 Seguimiento body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Encomienda encontrada'
        );
      } else if (response.statusCode == 404) {
        return ApiResponse<Encomienda>(
          success: false,
          error: 'Encomienda no encontrada'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Encomienda>(
          success: false,
          error: _parseError(errorData, response.statusCode)
        );
      }
    } catch (e) {
      print('❌ Error en getSeguimiento: $e');
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getEstadisticas() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/estadisticas/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return ApiResponse<Map<String, dynamic>>(
          success: true,
          data: responseData,
          message: 'Estadísticas cargadas'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: _parseError(errorData, response.statusCode)
        );
      }
    } catch (e) {
      print('❌ Error en getEstadisticas: $e');
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // ✅ NUEVO: Actualizar estado de encomienda
  Future<ApiResponse<Encomienda>> actualizarEstado(int encomiendaId, String estado, {String? notas, String? ubicacion}) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final body = {
        'estado': estado,
        if (notas != null) 'notas': notas,
        if (ubicacion != null) 'ubicacion': ubicacion,
      };
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/actualizar_estado/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Estado actualizado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Encomienda>(
          success: false,
          error: errorData['error'] ?? 'Error al actualizar estado'
        );
      }
    } catch (e) {
      print('❌ Error en actualizarEstado: $e');
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // ✅ MÉTODOS DE PAGO (mantienen igual)
  Future<ApiResponse<Map<String, dynamic>>> crearPagoStripe(int encomiendaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/crear_pago_stripe/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        return ApiResponse<Map<String, dynamic>>(
          success: true,
          data: responseData,
          message: 'Pago creado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: errorData['error'] ?? 'Error al crear pago'
        );
      }
    } catch (e) {
      print('❌ Error en crearPagoStripe: $e');
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  Future<ApiResponse<Encomienda>> confirmarPago(int encomiendaId, String paymentIntentId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/confirmar_pago/'),
        headers: headers,
        body: json.encode({'payment_intent_id': paymentIntentId}),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Pago confirmado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Encomienda>(
          success: false,
          error: errorData['error'] ?? 'Error al confirmar pago'
        );
      }
    } catch (e) {
      print('❌ Error en confirmarPago: $e');
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.message,
  });
}