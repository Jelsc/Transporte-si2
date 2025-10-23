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

    try {
      // Configurar notificaciones locales
      await _setupLocalNotifications();

      // Configurar Firebase Messaging
      await _setupFirebaseMessaging();

      // Configurar listeners
      _setupMessageHandlers();

      _isInitialized = true;
    } catch (e) {
      rethrow;
    }
  }

  /// Registrar dispositivo después del login exitoso
  static Future<void> registerDeviceAfterLogin() async {
    await _registerDeviceWithBackend();
  }

  /// Configurar notificaciones locales
  static Future<void> _setupLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
          requestAlertPermission: true,
          requestBadgePermission: true,
          requestSoundPermission: true,
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

    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      return;
    }

    // Obtener token FCM
    _fcmToken = await _firebaseMessaging.getToken();
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
    // Mostrar notificación local
    await _showLocalNotification(
      title: message.notification?.title ?? 'Nueva notificación',
      body: message.notification?.body ?? 'Tienes una nueva notificación',
      payload: jsonEncode(message.data),
    );
  }

  /// Mostrar notificación local
  static Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          'transport_notifications',
          'Notificaciones de Transporte',
          channelDescription: 'Notificaciones sobre viajes y reservas',
          importance: Importance.high,
          priority: Priority.high,
          showWhen: true,
          icon: '@mipmap/ic_launcher',
        );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    int id = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    await _localNotifications.show(
      id,
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }

  /// Manejar mensaje cuando la app se abre desde notificación
  static Future<void> _handleMessageOpenedApp(RemoteMessage message) async {
    // Marcar notificación como entregada
    await _markNotificationAsDelivered(message);

    // Navegar según el tipo de notificación
    _handleNotificationNavigation(message);
  }

  /// Manejar toque en notificación local
  static Future<void> _onNotificationTapped(
    NotificationResponse response,
  ) async {
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!);

        // Crear RemoteMessage simulado para manejar navegación
        final message = RemoteMessage(data: Map<String, String>.from(data));

        _handleNotificationNavigation(message);
      } catch (e) {
        // Ignorar errores de parseo
      }
    }
  }

  /// Registrar dispositivo en el backend
  static Future<void> _registerDeviceWithBackend() async {
    if (_fcmToken == null) {
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) {
        return;
      }

      final baseUrl = await IPDetection.getBaseUrl();
      await http.post(
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
    } catch (e) {
      // Ignorar errores de registro
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
      await http.patch(
        Uri.parse(
          '$baseUrl/api/notificaciones/notificaciones/$notificationId/',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'fue_entregada': true}),
      );
    } catch (e) {
      // Ignorar errores al marcar notificación
    }
  }

  /// Manejar navegación por notificación
  static void _handleNotificationNavigation(RemoteMessage message) {
    final tipo = message.data['tipo'] ?? message.data['modulo'] ?? 'general';

    // Aquí puedes implementar la lógica de navegación específica
    // usando tu router existente
    switch (tipo) {
      case 'nuevo_viaje':
        // Navegar a lista de viajes disponibles
        break;
      case 'viaje_cancelado':
        // Navegar a detalles del viaje o mis reservas
        break;
      case 'recordatorio':
        // Navegar a detalles del viaje
        break;
      default:
        break;
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

      // Obtener ID del dispositivo (necesitarías implementar un endpoint para esto)
      // Por ahora, simplemente enviamos el token para que el backend lo desactive
    } catch (e) {
      // Ignorar errores al desregistrar
    }
  }
}
