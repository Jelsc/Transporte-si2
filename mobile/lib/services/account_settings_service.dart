import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';

class AccountSettingsService {
  // Headers por defecto
  static const Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Obtener headers con autenticación
  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _getToken();
    final headers = Map<String, String>.from(_defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Obtener token de autenticación
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Cambio de contraseña usando la API personalizada
  Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
    required String newPasswordConfirm,
  }) async {
    try {
      print('🔧 [AccountSettingsService] Iniciando cambio de contraseña...');
      print('🔧 [AccountSettingsService] Datos: oldPassword=${oldPassword.isNotEmpty ? "***" : "vacío"}, newPassword=${newPassword.isNotEmpty ? "***" : "vacío"}, confirm=${newPasswordConfirm.isNotEmpty ? "***" : "vacío"}');
      
      final baseUrl = await IPDetection.getBaseUrl();
      final endpoint = '/api/change-password/';
      final headers = await _getAuthHeaders();
      
      print('🌐 [AccountSettingsService] URL: $baseUrl$endpoint');
      
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode({
          'old_password': oldPassword,
          'new_password': newPassword,
          'new_password_confirm': newPasswordConfirm,
        }),
      ).timeout(const Duration(seconds: 10));

      print('📡 [AccountSettingsService] Cambio de contraseña - Status: ${response.statusCode}');
      print('📦 [AccountSettingsService] Response: ${response.body}');
      print('🔑 [AccountSettingsService] Headers enviados: $headers');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        print('✅ [AccountSettingsService] Contraseña cambiada exitosamente');
        return {'success': true, 'data': data};
      } else {
        print('❌ [AccountSettingsService] Error HTTP: ${response.statusCode}');
        print('❌ [AccountSettingsService] Response body: ${response.body}');
        
        try {
          final errorData = json.decode(utf8.decode(response.bodyBytes));
          print('❌ [AccountSettingsService] Error parseado: $errorData');
          
          // Manejar diferentes formatos de error
          String errorMessage = 'Error al cambiar la contraseña';
          if (errorData is Map<String, dynamic>) {
            // Manejar errores de validación de Django
            if (errorData.containsKey('new_password')) {
              final newPasswordErrors = errorData['new_password'];
              if (newPasswordErrors is List && newPasswordErrors.isNotEmpty) {
                errorMessage = newPasswordErrors.first.toString();
              } else if (newPasswordErrors is String) {
                errorMessage = newPasswordErrors;
              }
            } else if (errorData.containsKey('old_password')) {
              final oldPasswordErrors = errorData['old_password'];
              if (oldPasswordErrors is List && oldPasswordErrors.isNotEmpty) {
                errorMessage = oldPasswordErrors.first.toString();
              } else if (oldPasswordErrors is String) {
                errorMessage = oldPasswordErrors;
              }
            } else if (errorData.containsKey('non_field_errors')) {
              final nonFieldErrors = errorData['non_field_errors'];
              if (nonFieldErrors is List && nonFieldErrors.isNotEmpty) {
                errorMessage = nonFieldErrors.first.toString();
              } else if (nonFieldErrors is String) {
                errorMessage = nonFieldErrors;
              }
            } else {
              errorMessage = errorData['detail'] ?? 
                            errorData['message'] ?? 
                            errorData['error'] ?? 
                            errorData.toString();
            }
          } else if (errorData is String) {
            errorMessage = errorData;
          }
          
          return {'success': false, 'error': errorMessage};
        } catch (parseError) {
          print('❌ [AccountSettingsService] Error parseando respuesta: $parseError');
          return {
            'success': false, 
            'error': 'Error del servidor (${response.statusCode}): ${response.body}'
          };
        }
      }
    } on SocketException catch (e) {
      print('❌ [AccountSettingsService] Error de socket: $e');
      return {'success': false, 'error': 'Error de red: $e'};
    } on http.ClientException catch (e) {
      print('❌ [AccountSettingsService] Error de cliente HTTP: $e');
      return {'success': false, 'error': 'Error de conexión: $e'};
    } on FormatException catch (e) {
      print('❌ [AccountSettingsService] Error de formato JSON: $e');
      return {'success': false, 'error': 'Error en el formato de la respuesta del servidor'};
    } catch (e) {
      print('❌ [AccountSettingsService] Error inesperado: $e');
      return {'success': false, 'error': 'Error inesperado: $e'};
    }
  }

  // Obtener información del usuario (incluyendo emails)
  Future<Map<String, dynamic>> getUserInfo() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final endpoint = '/api/auth/user-info/';
      final headers = await _getAuthHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      print('📡 [AccountSettingsService] Obtener info usuario - Status: ${response.statusCode}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        print('✅ [AccountSettingsService] Info de usuario obtenida');
        return {'success': true, 'data': data};
      } else {
        final errorData = json.decode(utf8.decode(response.bodyBytes));
        print('❌ [AccountSettingsService] Error: ${response.statusCode} - $errorData');
        return {
          'success': false, 
          'error': errorData['detail'] ?? 'Error al obtener información del usuario'
        };
      }
    } on SocketException catch (e) {
      print('❌ [AccountSettingsService] Error de socket: $e');
      return {'success': false, 'error': 'Error de red: $e'};
    } on http.ClientException catch (e) {
      print('❌ [AccountSettingsService] Error de cliente HTTP: $e');
      return {'success': false, 'error': 'Error de conexión: $e'};
    } on FormatException catch (e) {
      print('❌ [AccountSettingsService] Error de formato JSON: $e');
      return {'success': false, 'error': 'Error en el formato de la respuesta del servidor'};
    } catch (e) {
      print('❌ [AccountSettingsService] Error inesperado: $e');
      return {'success': false, 'error': 'Error inesperado: $e'};
    }
  }

  // Solicitar restablecimiento de contraseña
  Future<Map<String, dynamic>> requestPasswordReset(String email) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final endpoint = '/api/auth/password/reset/';
      final headers = await _getAuthHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode({
          'email': email,
        }),
      ).timeout(const Duration(seconds: 10));

      print('📡 [AccountSettingsService] Reset contraseña - Status: ${response.statusCode}');
      print('📦 [AccountSettingsService] Response: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        print('✅ [AccountSettingsService] Email de reset enviado');
        return {'success': true, 'data': data};
      } else {
        final errorData = json.decode(utf8.decode(response.bodyBytes));
        print('❌ [AccountSettingsService] Error: ${response.statusCode} - $errorData');
        return {
          'success': false, 
          'error': errorData['detail'] ?? errorData['email'] ?? 'Error al enviar email de restablecimiento'
        };
      }
    } on SocketException catch (e) {
      print('❌ [AccountSettingsService] Error de socket: $e');
      return {'success': false, 'error': 'Error de red: $e'};
    } on http.ClientException catch (e) {
      print('❌ [AccountSettingsService] Error de cliente HTTP: $e');
      return {'success': false, 'error': 'Error de conexión: $e'};
    } on FormatException catch (e) {
      print('❌ [AccountSettingsService] Error de formato JSON: $e');
      return {'success': false, 'error': 'Error en el formato de la respuesta del servidor'};
    } catch (e) {
      print('❌ [AccountSettingsService] Error inesperado: $e');
      return {'success': false, 'error': 'Error inesperado: $e'};
    }
  }

  // Agregar nuevo email (funcionalidad futura)
  Future<Map<String, dynamic>> addEmailAddress(String email) async {
    // Esta funcionalidad requiere implementación personalizada en el backend
    return {
      'success': false, 
      'error': 'Funcionalidad de agregar email no implementada aún'
    };
  }

  // Reenviar verificación de email (funcionalidad futura)
  Future<Map<String, dynamic>> resendEmailVerification(int emailId) async {
    // Esta funcionalidad requiere implementación personalizada en el backend
    return {
      'success': false, 
      'error': 'Funcionalidad de reenvío de verificación no implementada aún'
    };
  }
}
