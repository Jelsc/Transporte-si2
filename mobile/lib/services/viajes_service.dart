// lib/services/viajes_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';
import '../models/asiento_model.dart';

class ViajesService {
  static const String _endpoint = '/api/viajes/';

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
      print('🔐 [ViajesService] Token incluido en headers');
    } else {
      print('⚠️ [ViajesService] No se encontró token de autenticación');
    }

    return headers;
  }

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

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(uriWithParams, headers: headers)
          .timeout(const Duration(seconds: 10));

      print('📡 [ViajesService] Respuesta: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print(
          '✅ [ViajesService] Viajes obtenidos: ${data['results']?.length ?? 0}',
        );
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ViajesService] Error: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar viajes: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// Obtiene un viaje específico por ID
  Future<Map<String, dynamic>> getViaje(int id) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint$id/');

      print('🌐 [ViajesService] Solicitando viaje: $url');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print('📡 [ViajesService] Respuesta: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [ViajesService] Viaje obtenido: ${data['id']}');
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ViajesService] Error: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar viaje: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// Obtiene asientos de un viaje
  Future<Map<String, dynamic>> getAsientos(int viajeId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/asientos/?viaje=$viajeId');

      print('🌐 [ViajesService] Solicitando asientos para viaje: $viajeId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      print('📡 [ViajesService] Respuesta asientos: ${response.statusCode}');
      print('📋 [ViajesService] Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // ✅ DETECCIÓN AUTOMÁTICA DEL FORMATO
        List<dynamic> asientosList = [];

        if (data is List) {
          asientosList = data;
          print('📊 [ViajesService] Formato: Lista directa');
        } else if (data is Map) {
          // Buscar en diferentes keys posibles
          if (data['results'] != null) {
            asientosList = data['results'] is List ? data['results'] : [];
            print('📊 [ViajesService] Formato: Map con "results"');
          } else if (data['asientos'] != null) {
            asientosList = data['asientos'] is List ? data['asientos'] : [];
            print('📊 [ViajesService] Formato: Map con "asientos"');
          } else if (data['data'] != null) {
            asientosList = data['data'] is List ? data['data'] : [];
            print('📊 [ViajesService] Formato: Map con "data"');
          } else {
            // Si es Map pero no tiene keys conocidas, verificar si contiene datos de asientos
            print('📊 [ViajesService] Formato: Map sin keys conocidas');
            print('🔍 [ViajesService] Keys del Map: ${data.keys}');
          }
        }

        // Convertir a modelos Asiento con manejo de errores
        final asientos = <Asiento>[];
        for (var item in asientosList) {
          try {
            final asiento = Asiento.fromJson(item);
            asientos.add(asiento);
          } catch (e) {
            print('⚠️ [ViajesService] Error parseando asiento: $e');
            print('📄 [ViajesService] Datos del asiento: $item');
          }
        }

        print('✅ [ViajesService] Asientos obtenidos: ${asientos.length}');
        return {'success': true, 'data': asientos, 'error': null};
      } else {
        print(
          '❌ [ViajesService] Error asientos: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar asientos: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción asientos: $e');
      print('🔄 [ViajesService] Error completo: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// ✅ CORREGIDO: Verificar disponibilidad de asientos CON AUTENTICACIÓN
  Future<Map<String, dynamic>> verificarDisponibilidad({
    required int viajeId,
    required List<int> asientosIds,
  }) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/reservas/verificar-disponibilidad/');

      print(
        '🌐 [ViajesService] Verificando disponibilidad: viaje=$viajeId, asientos=$asientosIds',
      );

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      print('🔐 [ViajesService] Headers enviados: $headers');

      final response = await http
          .post(
            url,
            headers: headers,
            body: json.encode({
              'viaje_id': viajeId,
              'asientos_ids': asientosIds,
            }),
          )
          .timeout(const Duration(seconds: 10));

      print(
        '📡 [ViajesService] Respuesta disponibilidad: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print(
          '✅ [ViajesService] Disponibilidad verificada: ${data['disponible']}',
        );
        return {'success': true, 'data': data, 'error': null};
      } else {
        print(
          '❌ [ViajesService] Error disponibilidad: ${response.statusCode} - ${response.body}',
        );
        return {
          'success': false,
          'data': null,
          'error': 'Error al verificar disponibilidad: ${response.statusCode}',
        };
      }
    } catch (e) {
      print('💥 [ViajesService] Excepción disponibilidad: $e');
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }
}
