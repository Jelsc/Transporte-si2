import 'dart:io';

class IPDetection {
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
      print('🌐 Usando URL en caché: $_cachedBaseUrl');
      return _cachedBaseUrl!;
    }

    // Seleccionar URL según entorno
    String host;
    switch (ENVIRONMENT) {
      case 'production':
        host = PROD_HOST;
        break;
      case 'staging':
        host = STAGING_HOST;
        break;
      case 'development':
      default:
        // Detectar plataforma para desarrollo
        if (Platform.isIOS) {
          host = DEV_HOST_IOS;
        } else {
          host = DEV_HOST;
        }
        break;
    }

    _cachedBaseUrl = host;
    print('🔧 Entorno: $ENVIRONMENT | URL: $host');
    return host;
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
    print('🗑️ Caché limpiada');
  }
}
