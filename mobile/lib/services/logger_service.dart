// lib/services/logger_service.dart
import 'dart:developer' as developer;

class Logger {
  static const bool _isDebug = bool.fromEnvironment('dart.vm.product') == false;

  static void debug(String message, {String? tag}) {
    if (_isDebug) {
      developer.log('🐛 ${tag != null ? '[$tag] ' : ''}$message', name: 'APP');
    }
  }

  static void info(String message, {String? tag}) {
    if (_isDebug) {
      developer.log('ℹ️ ${tag != null ? '[$tag] ' : ''}$message', name: 'APP');
    }
  }

  static void warning(String message, {String? tag}) {
    if (_isDebug) {
      developer.log('⚠️ ${tag != null ? '[$tag] ' : ''}$message', name: 'APP');
    }
  }

  static void error(String message, {String? tag, dynamic error, StackTrace? stackTrace}) {
    if (_isDebug) {
      developer.log(
        '❌ ${tag != null ? '[$tag] ' : ''}$message',
        name: 'APP',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  static void network(String message, {String? tag}) {
    if (_isDebug) {
      developer.log('📡 ${tag != null ? '[$tag] ' : ''}$message', name: 'APP');
    }
  }

  static void success(String message, {String? tag}) {
    if (_isDebug) {
      developer.log('✅ ${tag != null ? '[$tag] ' : ''}$message', name: 'APP');
    }
  }
}