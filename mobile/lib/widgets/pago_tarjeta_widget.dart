// widgets/pago_tarjeta_widget.dart
import 'package:flutter/material.dart';
import 'package:mobile/services/encomienda_service.dart';
import 'package:mobile/models/encomienda_model.dart';

class PagoTarjetaWidget extends StatefulWidget {
  final Encomienda encomienda;
  final Function(Encomienda)? onPagoExitoso;

  const PagoTarjetaWidget({
    super.key,
    required this.encomienda,
    this.onPagoExitoso,
  });

  @override
  State<PagoTarjetaWidget> createState() => _PagoTarjetaWidgetState();
}

class _PagoTarjetaWidgetState extends State<PagoTarjetaWidget> {
  final EncomiendaService _encomiendaService = EncomiendaService();
  bool _procesando = false;
  String? _errorMessage;

  Future<void> _procesarPagoTarjeta() async {
    if (_procesando) return;

    setState(() {
      _procesando = true;
      _errorMessage = null;
    });

    try {
      // 1. Crear pago en Stripe
      final crearPagoResult = await _encomiendaService.crearPagoStripe(widget.encomienda.id);
      
      if (!crearPagoResult.success) {
        setState(() {
          _errorMessage = crearPagoResult.error;
          _procesando = false;
        });
        return;
      }

      final paymentIntent = crearPagoResult.data!;
      
      // 2. Aquí integrarías con el SDK de Stripe
      // Por ahora simulamos una confirmación exitosa
      await _simularPagoStripe(paymentIntent);
      
    } catch (e) {
      setState(() {
        _errorMessage = 'Error al procesar pago: $e';
        _procesando = false;
      });
    }
  }

  Future<void> _simularPagoStripe(Map<String, dynamic> paymentIntent) async {
    // ✅ SIMULACIÓN: En una app real aquí integrarías el SDK de Stripe
    // Stripe.instance.confirmPayment(...)
    
    await Future.delayed(const Duration(seconds: 2));
    
    // Simular pago exitoso
    final confirmarPagoResult = await _encomiendaService.confirmarPagoStripe(
      widget.encomienda.id,
      paymentIntent['id'] as String,
    );

    setState(() {
      _procesando = false;
    });

    if (confirmarPagoResult.success && confirmarPagoResult.data != null) {
      if (widget.onPagoExitoso != null) {
        widget.onPagoExitoso!(confirmarPagoResult.data!);
      }
      
      // Mostrar éxito
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Pago con tarjeta procesado exitosamente'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        
        Navigator.of(context).pop(); // Cerrar diálogo
      }
    } else {
      setState(() {
        _errorMessage = confirmarPagoResult.error ?? 'Error al confirmar pago';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Encabezado
          const Row(
            children: [
              Icon(Icons.credit_card, color: Colors.blue),
              SizedBox(width: 8),
              Text(
                'Pago con Tarjeta',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Información del pago
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Text('Encomienda: ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(widget.encomienda.codigoSeguimiento),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Text('Monto: ', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(
                      widget.encomienda.precioFormateado,
                      style: const TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Mensaje informativo
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              '🔒 El pago se procesará de forma segura a través de Stripe. '
              'Serás redirigido a una pasarela de pago segura.',
              style: TextStyle(fontSize: 12),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Botón de pago
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            ),
            const SizedBox(height: 12),
          ],
          
          ElevatedButton(
            onPressed: _procesando ? null : _procesarPagoTarjeta,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 50),
            ),
            child: _procesando
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.credit_card),
                      SizedBox(width: 8),
                      Text('Pagar con Tarjeta'),
                    ],
                  ),
          ),
          
          const SizedBox(height: 8),
          
          TextButton(
            onPressed: _procesando ? null : () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
        ],
      ),
    );
  }
}