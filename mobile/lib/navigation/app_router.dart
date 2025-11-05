import 'package:flutter/material.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/client/notification_history_screen.dart';
import '../screens/conductor/conductor_home_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/client/seleccion_asientos_screen.dart';
import '../screens/client/checkout_screen.dart';
import '../screens/client/confirmacion_reserva_screen.dart';
import '../models/viaje_model.dart';
import '../models/reserva_model.dart';

class AppRouter {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String home = '/home';
  static const String conductorHome = '/conductor-home';
  static const String conductorViajes = '/conductor-viajes';
  static const String conductorPerfil = '/conductor-perfil';
  static const String userSettings = '/user-settings';

  static const String seleccionAsientos = '/seleccion-asientos';
  static const String checkout = '/checkout';
  static const String confirmacionReserva = '/confirmacion-reserva';

  static const String notificationHistory = '/notification-history';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case onboarding:
        return MaterialPageRoute(
          builder: (_) => const OnboardingScreen(),
          settings: settings,
        );

      case login:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );

      case home:
        return MaterialPageRoute(
          builder: (_) => const ClientHomeScreen(),
          settings: settings,
        );

      case conductorHome:
        return MaterialPageRoute(
          builder: (_) => const ConductorHomeScreen(),
          settings: settings,
        );

      case seleccionAsientos:
        final viaje = settings.arguments as Viaje;
        return MaterialPageRoute(
          builder: (_) => SeleccionAsientosScreen(viaje: viaje),
          settings: settings,
        );

      case checkout:
        final args = settings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => CheckoutScreen(
            reserva: args['reserva'] as Reserva,
            viaje: args['viaje'] as Viaje,
          ),
          settings: settings,
        );

      case confirmacionReserva:
        final args = settings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => ConfirmacionReservaScreen(
            reserva: args['reserva'] as Reserva,
            viaje: args['viaje'] as Viaje,
          ),
          settings: settings,
        );

      case notificationHistory:
        return MaterialPageRoute(
          builder: (_) => const NotificationHistoryScreen(),
          settings: settings,
        );

      default:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
    }
  }

  static Future<void> navigateBasedOnUserType(
    BuildContext context,
    String userType,
    String userName, {
    dynamic user,
  }) async {
    // Verificar primero si el usuario tiene un conductor asociado
    if (user != null && user.conductor != null) {
      Navigator.pushReplacementNamed(context, conductorHome);
      return;
    }

    // Si no es conductor, usar la lógica por tipo de usuario
    switch (userType.toLowerCase()) {
      case 'conductor':
        Navigator.pushReplacementNamed(context, conductorHome);
        break;
      case 'administrativo':
      case 'admin':
        Navigator.pushReplacementNamed(context, home);
        break;
      case 'cliente':
      default:
        Navigator.pushReplacementNamed(context, home);
        break;
    }
  }

  // ✅ MÉTODOS CONVENIENTES PARA NAVEGACIÓN
  static void navegarASeleccionAsientos(BuildContext context, Viaje viaje) {
    Navigator.pushNamed(context, seleccionAsientos, arguments: viaje);
  }

  static void navegarACheckout(
    BuildContext context, {
    required Reserva reserva,
    required Viaje viaje,
  }) {
    Navigator.pushNamed(
      context,
      checkout,
      arguments: {'reserva': reserva, 'viaje': viaje},
    );
  }

  static void navegarAConfirmacionReserva(
    BuildContext context, {
    required Reserva reserva,
    required Viaje viaje,
  }) {
    Navigator.pushNamed(
      context,
      confirmacionReserva,
      arguments: {'reserva': reserva, 'viaje': viaje},
    );
  }

  static void navegarAHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, home, (route) => false);
  }
}
