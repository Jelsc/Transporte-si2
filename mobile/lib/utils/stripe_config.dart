import 'package:flutter_stripe/flutter_stripe.dart';

class StripeConfig {
  static Future<void> initialize() async {
    Stripe.publishableKey = '<YOUR_PUBLISHABLE_KEY>'; // Reemplazar con tu key
    Stripe.merchantIdentifier = 'merchant.flutter.stripe';
    await Stripe.instance.applySettings();
  }
}
