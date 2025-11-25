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

      // Construir términos de búsqueda combinando search, origen y destino
      // El backend busca por nombre en origen__nombre y destino__nombre usando search
      final searchTerms = <String>[];

      if (search != null && search.isNotEmpty) {
        searchTerms.add(search);
      }

      // Si origen/destino son números (IDs), usar filtro directo
      // Si son strings (nombres), agregar a search
      if (origen != null && origen.isNotEmpty && origen != 'all') {
        final origenIsId = RegExp(r'^\d+$').hasMatch(origen);
        if (origenIsId) {
          queryParams['origen'] = origen;
        } else {
          searchTerms.add(origen);
        }
      }

      if (destino != null && destino.isNotEmpty && destino != 'all') {
        final destinoIsId = RegExp(r'^\d+$').hasMatch(destino);
        if (destinoIsId) {
          queryParams['destino'] = destino;
        } else {
          searchTerms.add(destino);
        }
      }

      // Si hay términos de búsqueda, combinarlos
      if (searchTerms.isNotEmpty) {
        queryParams['search'] = searchTerms.join(' ');
      }

      if (fechaDesde != null && fechaDesde.isNotEmpty) {
        queryParams['fecha__gte'] = fechaDesde; // Usar el filtro correcto
      }
      if (estado != null && estado.isNotEmpty) {
        queryParams['estado'] = estado;
      }

      // Agregar parámetros a la URL
      final uriWithParams = url.replace(queryParameters: queryParams);

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(uriWithParams, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Debug: verificar qué se recibió
        print(
          '🔍 Viajes recibidos: ${data is Map ? (data['results']?.length ?? data['count'] ?? 0) : (data is List ? data.length : 0)} viajes',
        );
        return {'success': true, 'data': data, 'error': null};
      } else {
        final errorBody = response.body;
        print('❌ Error al obtener viajes: ${response.statusCode} - $errorBody');
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar viajes: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// Obtiene un viaje específico por ID
  Future<Map<String, dynamic>> getViaje(int id) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl$_endpoint$id/');

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
          'error': 'Error al cargar viaje: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }

  /// Obtiene asientos de un viaje
  Future<Map<String, dynamic>> getAsientos(int viajeId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/asientos/?viaje=$viajeId');

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // ✅ DETECCIÓN AUTOMÁTICA DEL FORMATO
        List<dynamic> asientosList = [];

        if (data is List) {
          asientosList = data;
        } else if (data is Map) {
          // Buscar en diferentes keys posibles
          if (data['results'] != null) {
            asientosList = data['results'] is List ? data['results'] : [];
          } else if (data['asientos'] != null) {
            asientosList = data['asientos'] is List ? data['asientos'] : [];
          } else if (data['data'] != null) {
            asientosList = data['data'] is List ? data['data'] : [];
          }
        }

        // Convertir a modelos Asiento con manejo de errores
        final asientos = <Asiento>[];
        for (var item in asientosList) {
          try {
            final asiento = Asiento.fromJson(item);
            asientos.add(asiento);
          } catch (e) {
            // Ignorar asientos con error de parseo
          }
        }

        return {'success': true, 'data': asientos, 'error': null};
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al cargar asientos: ${response.statusCode}',
        };
      }
    } catch (e) {
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

      // ✅ USAR HEADERS CON AUTENTICACIÓN
      final headers = await _getAuthHeaders();

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

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data, 'error': null};
      } else {
        return {
          'success': false,
          'data': null,
          'error': 'Error al verificar disponibilidad: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {'success': false, 'data': null, 'error': 'Error de conexión: $e'};
    }
  }
}
