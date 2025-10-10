import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/ip_detection.dart';

class ViajesService {
  static const String _endpoint = '/api/viajes/';

  /// Obtiene la lista de viajes disponibles
  Future<Map<String, dynamic>> getViajes({
    String? search,
    String? origen,
    String? destino,
    String? fechaDesde,
    String? estado = 'programado',
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint');
      
      // Construir parámetros de consulta
      final queryParams = <String, String>{};
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (origen != null && origen.isNotEmpty && origen != 'all') {
        queryParams['origen'] = origen;
      }
      if (destino != null && destino.isNotEmpty && destino != 'all') {
        queryParams['destino'] = destino;
      }
      if (fechaDesde != null && fechaDesde.isNotEmpty) {
        queryParams['fecha_desde'] = fechaDesde;
      }
      if (estado != null && estado.isNotEmpty) {
        queryParams['estado'] = estado;
      }

      // Agregar parámetros a la URL
      final uriWithParams = url.replace(queryParameters: queryParams);
      
      print('🌐 [ViajesService] Solicitando viajes: $uriWithParams');
      
      final response = await http.get(
        uriWithParams,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      print('📡 [ViajesService] Respuesta: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ViajesService] Viajes obtenidos: ${data['results']?.length ?? 0}');
        return {
          'success': true,
          'data': data,
          'error': null,
        };
      } else {
        print('❌ [ViajesService] Error: ${response.statusCode} - ${response.body}');
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar viajes: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción: $e');
      return {
        'success': false,
        'data': null,
        'error': 'Error de conexión: $e',
      };
    }
  }

  /// Obtiene un viaje específico por ID
  Future<Map<String, dynamic>> getViaje(int id) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint$id/');
      
      print('🌐 [ViajesService] Solicitando viaje: $url');
      
      final response = await http.get(
        url,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      print('📡 [ViajesService] Respuesta: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ViajesService] Viaje obtenido: ${data['id']}');
        return {
          'success': true,
          'data': data,
          'error': null,
        };
      } else {
        print('❌ [ViajesService] Error: ${response.statusCode} - ${response.body}');
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar viaje: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción: $e');
      return {
        'success': false,
        'data': null,
        'error': 'Error de conexión: $e',
      };
    }
  }
}
