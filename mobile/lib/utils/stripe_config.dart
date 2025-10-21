// lib/utils/stripe_config.dart
import 'package:flutter_stripe/flutter_stripe.dart';

class StripeConfig {
  static Future<void> initialize() async {
    Stripe.publishableKey = 'pk_test_tu_public_key'; // Reemplazar con tu key
    Stripe.merchantIdentifier = 'merchant.flutter.stripe';
    await Stripe.instance.applySettings();
  }
}
