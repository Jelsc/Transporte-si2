import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:flutter/material.dart';

// Configuración base de la API
const String API_BASE_URL = "http://10.0.2.2:8000"; // Para emulador Android

// Tipos de datos para la API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse({required this.success, this.data, this.error, this.message});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      error: json['error'],
      message: json['message'],
    );
  }
}

class User {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String? telefono;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.telefono,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      telefono: json['telefono'],
      isActive: json['is_active'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'telefono': telefono,
      'is_active': isActive,
    };
  }
}

class LoginCredentials {
  final String email;
  final String password;
  final bool rememberMe;

  LoginCredentials({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });

  Map<String, dynamic> toJson() {
    return {'email': email, 'password': password};
  }
}

class RegisterData {
  final String username;
  final String firstName;
  final String lastName;
  final String email;
  final String telefono;
  final String ci;
  final String password1;
  final String password2;

  RegisterData({
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.telefono,
    required this.ci,
    required this.password1,
    required this.password2,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'telefono': telefono,
      'ci': ci,
      'password1': password1,
      'password2': password2,
    };
  }
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Headers por defecto
  Map<String, String> get _defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers con autenticación
  Future<Map<String, String>> get _authHeaders async {
    final token = await getToken();
    final headers = Map<String, String>.from(_defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Función para hacer peticiones HTTP
  Future<ApiResponse<T>> _apiRequest<T>(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
  }) async {
    final url = Uri.parse('$API_BASE_URL$endpoint');
    final headers = await _authHeaders;

    try {
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Método HTTP no soportado: $method');
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson != null ? fromJson(responseData) : responseData,
          message: responseData['message'] ?? 'Operación exitosa',
        );
      } else {
        // Extraer mensaje de error específico
        String errorMessage = 'Error en la petición';

        if (responseData['detail'] != null) {
          errorMessage = responseData['detail'];
        } else if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        } else if (responseData['non_field_errors'] != null) {
          // Para errores de validación generales
          errorMessage = responseData['non_field_errors'].join(', ');
        } else {
          // Para errores de campos específicos
          List<String> fieldErrors = [];
          responseData.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              fieldErrors.add('$key: ${value.join(', ')}');
            }
          });
          if (fieldErrors.isNotEmpty) {
            errorMessage = fieldErrors.join('; ');
          }
        }

        return ApiResponse<T>(
          success: false,
          error: errorMessage,
          message: responseData['message'],
        );
      }
    } catch (e) {
      return ApiResponse<T>(success: false, error: 'Error de conexión: $e');
    }
  }

  // Función para hacer peticiones HTTP sin autenticación
  Future<ApiResponse<T>> _apiRequestWithoutAuth<T>(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
  }) async {
    final url = Uri.parse('$API_BASE_URL$endpoint');
    final headers = _defaultHeaders;

    try {
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Método HTTP no soportado: $method');
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson != null ? fromJson(responseData) : responseData,
          message: responseData['message'] ?? 'Operación exitosa',
        );
      } else {
        // Extraer mensaje de error específico
        String errorMessage = 'Error en la petición';

        if (responseData['detail'] != null) {
          errorMessage = responseData['detail'];
        } else if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        } else if (responseData['non_field_errors'] != null) {
          // Para errores de validación generales
          errorMessage = responseData['non_field_errors'].join(', ');
        } else {
          // Para errores de campos específicos
          List<String> fieldErrors = [];
          responseData.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              fieldErrors.add('$key: ${value.join(', ')}');
            }
          });
          if (fieldErrors.isNotEmpty) {
            errorMessage = fieldErrors.join('; ');
          }
        }

        return ApiResponse<T>(
          success: false,
          error: errorMessage,
          message: responseData['message'],
        );
      }
    } catch (e) {
      return ApiResponse<T>(success: false, error: 'Error de conexión: $e');
    }
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  // Login
  Future<ApiResponse<User>> login(LoginCredentials credentials) async {
    try {
      final response = await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/auth/login/',
        method: 'POST',
        body: credentials.toJson(),
      );

      if (response.success && response.data != null) {
        // Guardar tokens si vienen en la respuesta
        final data = response.data!;
        if (data['access'] != null) {
          await saveToken(data['access']);
        }

        // Obtener perfil del usuario
        final profileResponse = await getCurrentUser();
        if (profileResponse.success && profileResponse.data != null) {
          return ApiResponse<User>(
            success: true,
            data: profileResponse.data,
            message: 'Inicio de sesión exitoso',
          );
        } else {
          return ApiResponse<User>(
            success: false,
            error: 'Error al obtener perfil del usuario',
          );
        }
      } else {
        return ApiResponse<User>(
          success: false,
          error: response.error ?? 'Error en el login',
        );
      }
    } catch (e) {
      return ApiResponse<User>(success: false, error: 'Error en el login: $e');
    }
  }

  // Registro
  Future<ApiResponse<User>> register(RegisterData userData) async {
    try {
      final response = await _apiRequestWithoutAuth<User>(
        '/api/admin/mobile/register/',
        method: 'POST',
        body: userData.toJson(),
        fromJson: (data) => User.fromJson(data),
      );

      if (response.success && response.data != null) {
        // Simular token para mantener la sesión
        await saveToken('mock_token_${DateTime.now().millisecondsSinceEpoch}');
      }

      return response;
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Error en el registro: $e',
      );
    }
  }

  // ===== MÉTODOS DE VERIFICACIÓN MÓVIL =====

  // Enviar código de verificación móvil
  Future<ApiResponse<Map<String, dynamic>>> sendMobileVerificationCode(
    String email,
  ) async {
    try {
      return await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/admin/mobile/send-code/',
        method: 'POST',
        body: {'email': email},
      );
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al enviar código: $e',
      );
    }
  }

  // Verificar código móvil
  Future<ApiResponse<Map<String, dynamic>>> verifyMobileCode(
    String email,
    String code,
  ) async {
    try {
      return await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/admin/mobile/verify-code/',
        method: 'POST',
        body: {'email': email, 'code': code},
      );
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al verificar código: $e',
      );
    }
  }

  // Reenviar código de verificación
  Future<ApiResponse<Map<String, dynamic>>> resendMobileVerificationCode(
    String email,
  ) async {
    try {
      return await _apiRequestWithoutAuth<Map<String, dynamic>>(
        '/api/admin/mobile/resend-code/',
        method: 'POST',
        body: {'email': email},
      );
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al reenviar código: $e',
      );
    }
  }

  // Obtener información del usuario actual
  Future<ApiResponse<User>> getCurrentUser() async {
    try {
      return await _apiRequest<User>(
        '/api/auth/user/',
        fromJson: (data) => User.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<User>(
        success: false,
        error: 'Error al obtener usuario: $e',
      );
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _apiRequest('/api/auth/logout/', method: 'POST');
    } catch (e) {
      // Ignorar errores en logout
    } finally {
      await clearToken();
    }
  }

  // ===== MÉTODOS DE TOKEN =====

  // Guardar token
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // Obtener token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Limpiar token
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Verificar si está autenticado
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null;
  }

  // ===== MÉTODOS DE UI =====

  // Mostrar toast de éxito
  void showSuccessToast(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.green,
      textColor: Colors.white,
    );
  }

  // Mostrar toast de error
  void showErrorToast(String message) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: Colors.red,
      textColor: Colors.white,
    );
  }
}
