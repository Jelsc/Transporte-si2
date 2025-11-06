import 'dart:io';

class IPDetection {
  // 🔧 CONFIGURACIÓN MANUAL - Cambia esta constante según necesites
  // Para desarrollo con teléfono físico (usando IP local de tu PC):
  static const String BACKEND_HOST = "http://57.154.17.34:8000";

  // Para desarrollo con emulador Android (cambia si usas emulador):
  // static const String BACKEND_HOST = "http://10.0.2.2:8000";

  // Para producción en la nube (descomenta la línea de abajo y comenta la de arriba):
  // static const String BACKEND_HOST = "http://3.230.69.204:8000";

  // Para iOS localhost (si usas iOS):
  // static const String BACKEND_HOST = "http://localhost:8000";

  /// Obtiene la URL base configurada

  // 🔧 CONFIGURACIÓN DE BACKEND HOST
  // La app detecta automáticamente el entorno y usa la URL apropiada

  // URLs por entorno
  static const String DEV_HOST = "http://10.0.2.2:8000"; // Android Emulator
  static const String DEV_HOST_IOS = "http://localhost:8000"; // iOS Simulator
  static const String STAGING_HOST = "https://api-staging.tu-dominio.com";
  static const String PROD_HOST = "https://api.tu-dominio.com";

  // Variable de entorno (cambiar para release builds)
  static const String ENVIRONMENT = String.fromEnvironment(
    'FLUTTER_ENV',
    defaultValue: 'development',
  );

  static String? _cachedBaseUrl;

  /// Obtiene la URL base configurada según el entorno

  static Future<String> getBaseUrl() async {
    // Si ya tenemos una URL en caché, la usamos
    if (_cachedBaseUrl != null) {
      return _cachedBaseUrl!;
    }

    // Usar la constante configurada
    _cachedBaseUrl = BACKEND_HOST;
    return BACKEND_HOST;
  }

  /// Obtiene información del entorno actual
  static Future<Map<String, dynamic>> getEnvironmentInfo() async {
    final baseUrl = await getBaseUrl();
    final isCloud = baseUrl.contains('3.230.69.204');
    final isLocalhost =
        baseUrl.contains('localhost') || baseUrl.contains('10.0.2.2');

    return {
      'baseUrl': baseUrl,
      'isCloud': isCloud,
      'isLocalhost': isLocalhost,
      'platform': Platform.operatingSystem,
      'isManual': true,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }

  /// Limpia la caché (útil para forzar recarga)
  static void clearCache() {
    _cachedBaseUrl = null;
  }
}
