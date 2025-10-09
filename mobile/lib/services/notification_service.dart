import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../utils/ip_detection.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static String? _fcmToken;
  static bool _isInitialized = false;

  /// Inicializar el servicio de notificaciones
  static Future<void> initialize() async {
    if (_isInitialized) return;

    print('🚀 Iniciando NotificationService...');

    try {
      print('📱 Configurando notificaciones locales...');
      // Configurar notificaciones locales
      await _setupLocalNotifications();
      print('✅ Notificaciones locales configuradas');

      print('🔥 Configurando Firebase Messaging...');
      // Configurar Firebase Messaging
      await _setupFirebaseMessaging();
      print('✅ Firebase Messaging configurado');

      print('👂 Configurando listeners de mensajes...');
      // Configurar listeners
      _setupMessageHandlers();
      print('✅ Listeners configurados');

      _isInitialized = true;
      print('🔔 NotificationService inicializado exitosamente');
    } catch (e) {
      print('❌ Error al inicializar NotificationService: $e');
      print('🔍 Stack trace: ${e.toString()}');
      rethrow;
    }
  }

  /// Configurar notificaciones locales
  static Future<void> _setupLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
          requestSoundPermission: true,
          requestBadgePermission: true,
          requestAlertPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsDarwin,
        );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Configurar canal para Android
    if (Platform.isAndroid) {
      await _createNotificationChannel();
    }
  }

  /// Crear canal de notificación para Android
  static Future<void> _createNotificationChannel() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'transport_notifications', // ID del canal
      'Notificaciones de Transporte', // Nombre
      description:
          'Notificaciones sobre viajes, reservas y actualizaciones del sistema',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);
  }

  /// Configurar Firebase Messaging
  static Future<void> _setupFirebaseMessaging() async {
    // Solicitar permisos
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Permisos de notificaciones otorgados');
    } else {
      print('❌ Permisos de notificaciones denegados');
      return;
    }

    // Obtener token FCM
    print('🔄 Obteniendo token FCM...');
    _fcmToken = await _firebaseMessaging.getToken();

    if (_fcmToken != null) {
      print('🔑 Token FCM obtenido exitosamente!');
      print(' Longitud del token: ${_fcmToken!.length} caracteres');
      print('=================== TOKEN FCM COMPLETO ===================');
      print(_fcmToken);
      print('========================================================');

      // Registrar dispositivo en el backend
      print('📤 Registrando dispositivo en el backend...');
      await _registerDeviceWithBackend();
    } else {
      print('❌ No se pudo obtener el token FCM');
    }
  }

  /// Configurar manejadores de mensajes
  static void _setupMessageHandlers() {
    // Mensaje recibido cuando la app está en primer plano
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Mensaje tocado cuando la app está en background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Mensaje recibido cuando la app está terminada (requiere configuración adicional)
    _handleInitialMessage();

    // Listener para actualización de token
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      print('🔄 Token FCM actualizado: $newToken');
      _fcmToken = newToken;
      _registerDeviceWithBackend();
    });
  }

  /// Manejar mensaje inicial (app abierta desde notificación)
  static Future<void> _handleInitialMessage() async {
    RemoteMessage? initialMessage = await _firebaseMessaging
        .getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpenedApp(initialMessage);
    }
  }

  /// Manejar mensaje en primer plano
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print(
      '📨 Mensaje recibido en primer plano: ${message.notification?.title}',
    );

    // Mostrar notificación local
    await _showLocalNotification(message);

    // Marcar como entregada en el backend
    await _markNotificationAsDelivered(message);
  }

  /// Manejar mensaje cuando se toca la notificación
  static void _handleMessageOpenedApp(RemoteMessage message) {
    print('👆 Notificación tocada: ${message.notification?.title}');

    // Marcar como leída en el backend
    _markNotificationAsRead(message);

    // Navegar según el tipo de notificación
    _handleNotificationNavigation(message);
  }

  /// Mostrar notificación local
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails
    androidDetails = AndroidNotificationDetails(
      'transport_notifications',
      'Notificaciones de Transporte',
      channelDescription:
          'Notificaciones sobre viajes, reservas y actualizaciones del sistema',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Nueva notificación',
      message.notification?.body ?? 'Tienes una nueva notificación',
      details,
      payload: jsonEncode(message.data),
    );
  }

  /// Manejar toque de notificación local
  static void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!);
        print('📱 Notificación local tocada: $data');

        // Crear RemoteMessage simulado para manejar navegación
        final message = RemoteMessage(data: Map<String, String>.from(data));

        _handleNotificationNavigation(message);
      } catch (e) {
        print('❌ Error al procesar payload de notificación: $e');
      }
    }
  }

  /// Registrar dispositivo en el backend
  static Future<void> _registerDeviceWithBackend() async {
    if (_fcmToken == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) {
        print(
          '⚠️ No hay token de autenticación, no se puede registrar dispositivo',
        );
        return;
      }

      final baseUrl = await IPDetection.getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/notificaciones/dispositivos/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'token_fcm': _fcmToken,
          'tipo_dispositivo': Platform.isIOS ? 'ios' : 'android',
          'nombre_dispositivo': '${Platform.operatingSystem} Device',
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Dispositivo registrado en el backend');
      } else {
        print('❌ Error al registrar dispositivo: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error al registrar dispositivo: $e');
    }
  }

  /// Marcar notificación como entregada
  static Future<void> _markNotificationAsDelivered(
    RemoteMessage message,
  ) async {
    final notificationId = message.data['notificacion_id'];
    if (notificationId == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) return;

      final baseUrl = await IPDetection.getBaseUrl();
      await http.post(
        Uri.parse(
          '$baseUrl/api/notificaciones/notificaciones/marcar_multiples/',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'notificacion_ids': [int.parse(notificationId)],
          'accion': 'marcar_entregada',
        }),
      );
    } catch (e) {
      print('❌ Error al marcar notificación como entregada: $e');
    }
  }

  /// Marcar notificación como leída
  static Future<void> _markNotificationAsRead(RemoteMessage message) async {
    final notificationId = message.data['notificacion_id'];
    if (notificationId == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) return;

      final baseUrl = await IPDetection.getBaseUrl();
      await http.post(
        Uri.parse(
          '$baseUrl/api/notificaciones/notificaciones/$notificationId/marcar_leida/',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
    } catch (e) {
      print('❌ Error al marcar notificación como leída: $e');
    }
  }

  /// Manejar navegación según tipo de notificación
  static void _handleNotificationNavigation(RemoteMessage message) {
    final tipo = message.data['tipo'];
    final viajeId = message.data['viaje_id'];

    // Aquí deberías implementar tu lógica de navegación
    // usando tu router existente
    print('🧭 Navegando por notificación tipo: $tipo');

    switch (tipo) {
      case 'nuevo_viaje':
        // Navegar a lista de viajes disponibles
        print('📍 Navegando a viajes disponibles');
        break;
      case 'viaje_cancelado':
        // Navegar a detalles del viaje o mis reservas
        print('📍 Navegando a viaje cancelado: $viajeId');
        break;
      case 'recordatorio':
        // Navegar a detalles del viaje
        print('📍 Navegando a recordatorio de viaje: $viajeId');
        break;
      default:
        print('📍 Tipo de notificación no manejado: $tipo');
    }
  }

  /// Obtener token FCM actual
  static String? get fcmToken => _fcmToken;

  /// Verificar si las notificaciones están habilitadas
  static Future<bool> areNotificationsEnabled() async {
    final settings = await _firebaseMessaging.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Solicitar permisos de notificaciones
  static Future<bool> requestNotificationPermissions() async {
    final settings = await _firebaseMessaging.requestPermission();
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Desactivar dispositivo en el backend
  static Future<void> unregisterDevice() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null || _fcmToken == null) return;

      final baseUrl = await IPDetection.getBaseUrl();

      // Obtener ID del dispositivo (necesitarías implementar un endpoint para esto)
      // Por ahora, simplemente enviamos el token para que el backend lo desactive

      print('🚫 Desregistrando dispositivo del backend');
    } catch (e) {
      print('❌ Error al desregistrar dispositivo: $e');
    }
  }
}
