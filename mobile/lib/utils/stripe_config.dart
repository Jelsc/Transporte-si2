import 'package:flutter_stripe/flutter_stripe.dart';

class StripeConfig {
  static Future<void> initialize() async {
    Stripe.publishableKey = 'pk_test_51SFOxOB9S1VdGc0Rs6sEecz84SqlUSMGZ7CzOTNf1WLUPMrZfcEdPe3y0zDsfBPsxM0pR1cV4azJCjLspvfzLboL00KY7wBet1'; // Reemplazar con tu key
    Stripe.merchantIdentifier = 'merchant.flutter.stripe';
    await Stripe.instance.applySettings();
  }
}
