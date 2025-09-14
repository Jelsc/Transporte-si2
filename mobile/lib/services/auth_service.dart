import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthResult {
  final bool success;
  final String message;
  final String? token;
  AuthResult(this.success, this.message, [this.token]);
}

class AuthService {
  // Ajusta la URL cuando tengas el backend
  static const String base = 'http://10.0.2.2:8000/api/users'; // 10.0.2.2 para emulador Android

  static Future<AuthResult> register({
    required String username,
    required String email,
    String? phone,
    required String role,
    required String password,
  }) async {
    final url = Uri.parse('$base/register/');
    try {
      final res = await http.post(url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': username, 'email': email, 'phone': phone, 'role': role, 'password': password}));

      if (res.statusCode == 201 || res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        final token = body['token'] ?? body['data']?['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', token);
          return AuthResult(true, 'Registrado', token);
        }
        return AuthResult(true, 'Registrado (sin token)', null);
      } else {
        String msg = res.body;
        try {
          final Map<String, dynamic> b = jsonDecode(res.body);
          msg = b.values.map((v) => v.toString()).join(' - ');
        } catch (_) {}
        return AuthResult(false, msg);
      }
    } catch (e) {
      return AuthResult(false, e.toString());
    }
  }

  // Login (ejemplo)
  static Future<AuthResult> login({required String username, required String password}) async {
    final url = Uri.parse('$base/login/');
    try {
      final res = await http.post(url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': username, 'password': password}));

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        final token = body['token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', token);
          return AuthResult(true, 'Login OK', token);
        }
        return AuthResult(false, 'No token in response');
      } else {
        return AuthResult(false, res.body);
      }
    } catch (e) {
      return AuthResult(false, e.toString());
    }
  }
}