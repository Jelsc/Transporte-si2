import 'dart:io';

class IPDetection {
  // 🔧 CONFIGURACIÓN MANUAL - Cambia esta constante según necesites
  // Para desarrollo local:
  static const String BACKEND_HOST = "http://192.168.0.5:8000";

  // Para producción en la nube (descomenta la línea de abajo y comenta la de arriba):
  // static const String BACKEND_HOST = "http://3.230.69.204:8000";

  // Para IP local de tu máquina (prueba esta si 10.0.2.2 no funciona):
  // static const String BACKEND_HOST = "http://10.135.114.93:8000";

  // Para iOS localhost (si usas iOS):
  // static const String BACKEND_HOST = "http://localhost:8000";

  static String? _cachedBaseUrl;

  /// Obtiene la URL base configurada
  static Future<String> getBaseUrl() async {
    // Si ya tenemos una URL en caché, la usamos
    if (_cachedBaseUrl != null) {
      print('🌐 Usando URL en caché: $_cachedBaseUrl');
      return _cachedBaseUrl!;
    }

    // Usar la constante configurada
    _cachedBaseUrl = BACKEND_HOST;
    print('🔧 Usando URL configurada: $BACKEND_HOST');
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
    print('🗑️ Caché limpiada');
  }
}
