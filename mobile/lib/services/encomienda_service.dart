import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/services/auth_service.dart';
import '../models/encomienda_model.dart';
import '../models/encomienda_seguimiento_model.dart';
import '../models/crear_encomienda_model.dart';
import '../utils/ip_detection.dart';

class EncomiendaService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Crear encomienda usando el modelo
  Future<ApiResponse<Encomienda>> crearEncomienda(CrearEncomiendaRequest request) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 201) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData['data']);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Encomienda creada exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse<Encomienda>(
          success: false,
          error: errorData['error'] ?? 'Error al crear encomienda'
        );
      }
    } catch (e) {
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // Obtener mis encomiendas usando el modelo
  Future<ApiResponse<List<Encomienda>>> getMisEncomiendas() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/mis_encomiendas/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final List<dynamic> results = responseData['data']['results'] ?? [];
        final encomiendas = results.map((json) => Encomienda.fromJson(json)).toList();
        
        return ApiResponse<List<Encomienda>>(
          success: true,
          data: encomiendas,
        );
      } else {
        return ApiResponse<List<Encomienda>>(
          success: false,
          error: 'Error al cargar encomiendas'
        );
      }
    } catch (e) {
      return ApiResponse<List<Encomienda>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // Obtener seguimiento por código usando el modelo
  Future<ApiResponse<Encomienda>> getSeguimiento(String codigo) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/seguimiento/$codigo/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData['data']);
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
        );
      } else {
        return ApiResponse<Encomienda>(
          success: false,
          error: 'Encomienda no encontrada'
        );
      }
    } catch (e) {
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // Obtener estadísticas
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
          data: responseData['data'],
        );
      } else {
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: 'Error al cargar estadísticas'
        );
      }
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // Actualizar estado de encomienda
  Future<ApiResponse<Encomienda>> actualizarEstado(int encomiendaId, String estado, {String? notas}) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/actualizar_estado/'),
        headers: headers,
        body: json.encode({
          'estado': estado,
          'notas': notas,
        }),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData['data']);
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
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }
}

// Clase ApiResponse genérica para tipado fuerte
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