// lib/utils/stripe_config.dart
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class StripeConfig {
  static Future<void> initialize() async {
    // Leer la clave desde .env
    final publishableKey = dotenv.env['STRIPE_PUBLISHABLE_KEY'] ?? '';
    
    if (publishableKey.isEmpty) {
      throw Exception(
        'STRIPE_PUBLISHABLE_KEY no encontrada en .env. '
        'Copia .env.example a .env y configura tus credenciales.'
      );
    }
    
    Stripe.publishableKey = publishableKey;
    Stripe.merchantIdentifier = 'merchant.flutter.stripe';
    await Stripe.instance.applySettings();
  }
}
