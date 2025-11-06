import 'package:flutter_stripe/flutter_stripe.dart';

class StripeConfig {
  static Future<void> initialize() async {
    Stripe.publishableKey = 'xd'; // Reemplazar con tu key
    Stripe.merchantIdentifier = 'merchant.flutter.stripe';
    await Stripe.instance.applySettings();
  }
}
