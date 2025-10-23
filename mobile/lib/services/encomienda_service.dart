import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/logger_service.dart'; 
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
      
      Logger.network('Creando encomienda: ${request.toJson()}', tag: 'ENCOMIENDA');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      Logger.network('Response status: ${response.statusCode}', tag: 'ENCOMIENDA');
      Logger.network('Response body: ${response.body}', tag: 'ENCOMIENDA');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        
        Logger.success('Encomienda creada exitosamente', tag: 'ENCOMIENDA');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Encomienda creada exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final errorMessage = _parseError(errorData, response.statusCode);
        
        Logger.error('Error al crear encomienda: $errorMessage', tag: 'ENCOMIENDA');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: errorMessage
        );
      }
    } catch (e) {
      Logger.error('Error en crearEncomienda', tag: 'ENCOMIENDA', error: e);
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
      
      Logger.network('Obteniendo mis encomiendas...', tag: 'ENCOMIENDA');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/mis_encomiendas/'),
        headers: headers,
      );

      Logger.network('Mis encomiendas response: ${response.statusCode}', tag: 'ENCOMIENDA');
      Logger.network('Mis encomiendas body: ${response.body}', tag: 'ENCOMIENDA');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        
        // ✅ DEBUG DETALLADO - Ver estructura real
        Logger.debug('Estructura de respuesta: ${responseData.runtimeType}', tag: 'ENCOMIENDA');
        if (responseData is Map) {
          Logger.debug('Keys del mapa: ${responseData.keys}', tag: 'ENCOMIENDA');
        }
        
        List<dynamic> results = [];
        
        if (responseData is Map) {
          if (responseData.containsKey('data')) {
            results = responseData['data'] ?? [];
          } else if (responseData.containsKey('results')) {
            results = responseData['results'] ?? [];
          } else if (responseData.containsKey('encomiendas')) {
            results = responseData['encomiendas'] ?? [];
          } else {
            final possibleList = responseData.values.firstWhere(
              (value) => value is List,
              orElse: () => []
            );
            results = possibleList is List ? possibleList : [];
          }
        } else if (responseData is List) {
          results = responseData;
        }
        
        Logger.debug('Resultados encontrados: ${results.length}', tag: 'ENCOMIENDA');
        
        if (results.isNotEmpty) {
          Logger.debug('Primer elemento: ${results.first}', tag: 'ENCOMIENDA');
        }
        
        // ✅ MANEJO DE ERRORES EN PARSEO
        final encomiendas = <Encomienda>[];
        for (var i = 0; i < results.length; i++) {
          try {
            final encomienda = Encomienda.fromJson(results[i]);
            encomiendas.add(encomienda);
          } catch (e) {
            Logger.error(
              'Error parseando encomienda $i', 
              tag: 'ENCOMIENDA', 
              error: e,
            );
            Logger.debug('Datos problemáticos: ${results[i]}', tag: 'ENCOMIENDA');
          }
        }
        
        Logger.success('Encomiendas cargadas: ${encomiendas.length}', tag: 'ENCOMIENDA');
        
        return ApiResponse<List<Encomienda>>(
          success: true,
          data: encomiendas,
          message: 'Encomiendas cargadas exitosamente'
        );
      } else if (response.statusCode == 404) {
        Logger.info('No hay encomiendas registradas', tag: 'ENCOMIENDA');
        return ApiResponse<List<Encomienda>>(
          success: true,
          data: [],
          message: 'No tienes encomiendas registradas'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = _parseError(errorData, response.statusCode);
        
        Logger.error('Error del servidor: $error', tag: 'ENCOMIENDA');
        
        return ApiResponse<List<Encomienda>>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en getMisEncomiendas', tag: 'ENCOMIENDA', error: e);
      return ApiResponse<List<Encomienda>>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // ✅ Método para parsear errores
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
      
      Logger.network('Buscando seguimiento: $codigo', tag: 'SEGUIMIENTO');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/seguimiento/$codigo/'),
      );

      Logger.network('Seguimiento response: ${response.statusCode}', tag: 'SEGUIMIENTO');
      Logger.network('Seguimiento body: ${response.body}', tag: 'SEGUIMIENTO');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        
        Logger.success('Encomienda encontrada', tag: 'SEGUIMIENTO');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Encomienda encontrada'
        );
      } else if (response.statusCode == 404) {
        Logger.warning('Encomienda no encontrada: $codigo', tag: 'SEGUIMIENTO');
        return ApiResponse<Encomienda>(
          success: false,
          error: 'Encomienda no encontrada'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = _parseError(errorData, response.statusCode);
        
        Logger.error('Error en seguimiento: $error', tag: 'SEGUIMIENTO');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en getSeguimiento', tag: 'SEGUIMIENTO', error: e);
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
      
      Logger.network('Obteniendo estadísticas...', tag: 'ESTADISTICAS');
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/encomiendas/estadisticas/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        
        Logger.success('Estadísticas cargadas', tag: 'ESTADISTICAS');
        
        return ApiResponse<Map<String, dynamic>>(
          success: true,
          data: responseData,
          message: 'Estadísticas cargadas'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = _parseError(errorData, response.statusCode);
        
        Logger.error('Error al cargar estadísticas: $error', tag: 'ESTADISTICAS');
        
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en getEstadisticas', tag: 'ESTADISTICAS', error: e);
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
      
      Logger.network('Actualizando estado de encomienda $encomiendaId a $estado', tag: 'ESTADO');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/actualizar_estado/'),
        headers: headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        
        Logger.success('Estado actualizado exitosamente', tag: 'ESTADO');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Estado actualizado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = errorData['error'] ?? 'Error al actualizar estado';
        
        Logger.error('Error al actualizar estado: $error', tag: 'ESTADO');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en actualizarEstado', tag: 'ESTADO', error: e);
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }

  // ✅ MÉTODOS DE PAGO
  Future<ApiResponse<Map<String, dynamic>>> crearPagoStripe(int encomiendaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      Logger.network('Creando pago Stripe para encomienda: $encomiendaId', tag: 'PAGO');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/crear_pago_stripe/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        
        Logger.success('Pago Stripe creado exitosamente', tag: 'PAGO');
        
        return ApiResponse<Map<String, dynamic>>(
          success: true,
          data: responseData,
          message: 'Pago creado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = errorData['error'] ?? 'Error al crear pago';
        
        Logger.error('Error al crear pago Stripe: $error', tag: 'PAGO');
        
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en crearPagoStripe', tag: 'PAGO', error: e);
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
      
      Logger.network('Confirmando pago para encomienda: $encomiendaId', tag: 'PAGO');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/confirmar_pago/'),
        headers: headers,
        body: json.encode({'payment_intent_id': paymentIntentId}),
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        
        Logger.success('Pago confirmado exitosamente', tag: 'PAGO');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Pago confirmado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final error = errorData['error'] ?? 'Error al confirmar pago';
        
        Logger.error('Error al confirmar pago: $error', tag: 'PAGO');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: error
        );
      }
    } catch (e) {
      Logger.error('Error en confirmarPago', tag: 'PAGO', error: e);
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }
   // ✅ NUEVOS MÉTODOS PARA PAGOS CON STRIPe
  Future<ApiResponse<Encomienda>> confirmarPagoStripe(int encomiendaId, String paymentIntentId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      Logger.network('Confirmando pago Stripe para encomienda: $encomiendaId', tag: 'PAGO_STRIPE');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/confirmar_pago/'),
        headers: headers,
        body: json.encode({'payment_intent_id': paymentIntentId}),
      );

      Logger.network('Confirmar pago response: ${response.statusCode}', tag: 'PAGO_STRIPE');
      Logger.network('Confirmar pago body: ${response.body}', tag: 'PAGO_STRIPE');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData);
        
        Logger.success('Pago Stripe confirmado exitosamente', tag: 'PAGO_STRIPE');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: 'Pago con tarjeta confirmado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final errorMessage = _parseError(errorData, response.statusCode);
        
        Logger.error('Error al confirmar pago Stripe: $errorMessage', tag: 'PAGO_STRIPE');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: errorMessage
        );
      }
    } catch (e) {
      Logger.error('Error en confirmarPagoStripe', tag: 'PAGO_STRIPE', error: e);
      return ApiResponse<Encomienda>(
        success: false,
        error: 'Error de conexión: $e'
      );
    }
  }


  Future<ApiResponse<Encomienda>> marcarPagoEfectivo(int encomiendaId) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final headers = await _getHeaders();
      
      Logger.network('Marcando pago en efectivo para encomienda: $encomiendaId', tag: 'PAGO');
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/encomiendas/$encomiendaId/marcar_pago_efectivo/'),
        headers: headers,
      );

      Logger.network('Pago efectivo response: ${response.statusCode}', tag: 'PAGO');
      Logger.network('Pago efectivo body: ${response.body}', tag: 'PAGO');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        final encomienda = Encomienda.fromJson(responseData['data']);
        
        Logger.success('Pago en efectivo registrado exitosamente', tag: 'PAGO');
        
        return ApiResponse<Encomienda>(
          success: true,
          data: encomienda,
          message: responseData['message'] ?? 'Pago en efectivo registrado exitosamente'
        );
      } else {
        final errorData = json.decode(response.body);
        final errorMessage = _parseError(errorData, response.statusCode);
        
        Logger.error('Error en pago efectivo: $errorMessage', tag: 'PAGO');
        
        return ApiResponse<Encomienda>(
          success: false,
          error: errorMessage
        );
      }
    } catch (e) {
      Logger.error('Error en marcarPagoEfectivo', tag: 'PAGO', error: e);
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