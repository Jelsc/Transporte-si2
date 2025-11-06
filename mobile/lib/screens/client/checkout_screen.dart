// lib/screens/client/checkout_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart' as stripe;
import '../../models/reserva_model.dart';
import '../../models/viaje_model.dart';
import '../../models/pago_model.dart';
import '../../services/reserva_service.dart';
import '../../services/pago_service.dart';
import 'confirmacion_reserva_screen.dart';
import 'dart:async';

class CheckoutScreen extends StatefulWidget {
  final Reserva reserva;
  final Viaje viaje;

  const CheckoutScreen({Key? key, required this.reserva, required this.viaje})
    : super(key: key);

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final ReservaService _reservaService = ReservaService();
  final PagoService _pagoService = PagoService();

  String _metodoPago = 'stripe';
  String _estado = 'seleccionando';
  String _error = '';
  int _tiempoRestante = 900;
  bool _pagoExitoso = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _tiempoRestante = widget.reserva.tiempoRestante;
    _iniciarTimer();
    _configurarStripe();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _configurarStripe() async {
    try {
      stripe.Stripe.publishableKey = 'pk_test_';

      await stripe.Stripe.instance.applySettings();
    } catch (e) {
      // Error configurando Stripe
    }
  }

  void _iniciarTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_tiempoRestante <= 0) {
        timer.cancel();
        _manejarExpiracion();
        return;
      }
      setState(() {
        _tiempoRestante--;
      });
    });
  }

  void _manejarExpiracion() {
    setState(() {
      _error =
          'El tiempo para completar el pago ha expirado. Los asientos se han liberado.';
      _estado = 'error';
    });
  }

  Future<void> _procesarPago() async {
    if (_tiempoRestante <= 0) {
      setState(() {
        _error =
            'La reserva ha expirado. Por favor, selecciona nuevos asientos.';
        _estado = 'error';
      });
      return;
    }

    setState(() {
      _estado = 'procesando';
      _error = '';
    });

    try {
      if (_metodoPago == 'stripe') {
        await _procesarPagoStripe();
      } else {
        await _procesarPagoManual();
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _estado = 'error';
      });
    }
  }

  Future<void> _procesarPagoStripe() async {
    try {
      final resultadoPago = await _pagoService.crearPagoStripe(
        reservaId: widget.reserva.id,
      );

      if (resultadoPago['success'] == true) {
        final data = resultadoPago['data'];
        final clientSecret = data['client_secret'];
        final pagoId = data['pago_id'];

        try {
          await stripe.Stripe.instance.initPaymentSheet(
            paymentSheetParameters: stripe.SetupPaymentSheetParameters(
              paymentIntentClientSecret: clientSecret,
              merchantDisplayName: 'Tu Empresa de Transporte',
            ),
          );

          await stripe.Stripe.instance.presentPaymentSheet();

          final resultadoConfirmacion = await _pagoService.confirmarPagoStripe(
            pagoId: pagoId,
            paymentIntentId: data['payment_intent_id'],
          );

          if (resultadoConfirmacion['success'] == true) {
            // ✅ OBTENER LA RESERVA ACTUALIZADA DEL BACKEND
            final reservaActualizada = await _obtenerReservaActualizada();
            _manejarPagoExitoso(reservaActualizada);
          } else {
            throw Exception(
              resultadoConfirmacion['error'] ?? 'Error al confirmar pago',
            );
          }
        } on stripe.StripeException catch (e) {
          final mensajeError = _traducirErrorStripe(e.error.message);
          throw Exception('Error en Stripe: $mensajeError');
        } catch (e) {
          throw Exception('Error en interfaz de pago: $e');
        }
      } else {
        throw Exception(resultadoPago['error'] ?? 'Error al crear pago');
      }
    } catch (e) {
      throw Exception('Error en pago Stripe: $e');
    }
  }

  // ✅ NUEVO MÉTODO: Obtener reserva actualizada del backend
  Future<Reserva> _obtenerReservaActualizada() async {
    try {
      final resultado = await _reservaService.obtenerReserva(widget.reserva.id);

      if (resultado['success'] == true) {
        final reservaActualizada = resultado['data'] as Reserva;
        return reservaActualizada;
      } else {
        return widget.reserva;
      }
    } catch (e) {
      return widget.reserva;
    }
  }

  // ✅ FUNCIÓN CORREGIDA PARA MANEJAR NULL
  String _traducirErrorStripe(String? mensajeError) {
    if (mensajeError == null) {
      return 'Ocurrió un error inesperado durante el pago. Por favor, intenta nuevamente.';
    }

    final mensaje = mensajeError.toLowerCase();

    // Errores comunes de Stripe
    switch (mensaje) {
      case 'payment_intent_authentication_failure':
        return 'La autenticación del pago falló. Intenta con otro método de pago.';
      case 'payment_intent_payment_attempt_failed':
        return 'El intento de pago falló. Verifica tu saldo o intenta con otra tarjeta.';
      case 'card_declined':
        return 'Tu tarjeta fue rechazada. Contacta a tu banco o usa otra tarjeta.';
      case 'expired_card':
        return 'Tu tarjeta ha expirado. Usa otra tarjeta.';
      case 'incorrect_cvc':
        return 'El código de seguridad (CVC) es incorrecto.';
      case 'incorrect_number':
        return 'El número de tarjeta es incorrecto.';
      case 'invalid_cvc':
        return 'El código de seguridad (CVC) no es válido.';
      case 'invalid_expiry_month':
        return 'El mes de expiración no es válido.';
      case 'invalid_expiry_year':
        return 'El año de expiración no es válido.';
      case 'invalid_number':
        return 'El número de tarjeta no es válido.';
      default:
        // Para mensajes genéricos, buscar palabras clave
        if (mensaje.contains('canceled') || mensaje.contains('cancelado')) {
          return 'El pago fue cancelado.';
        } else if (mensaje.contains('failed') || mensaje.contains('falló')) {
          return 'El pago falló. Intenta con otro método de pago.';
        } else if (mensaje.contains('timeout') || mensaje.contains('tiempo')) {
          return 'El pago tardó demasiado tiempo. Intenta nuevamente.';
        } else if (mensaje.contains('network') || mensaje.contains('red')) {
          return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else {
          return 'Error en el pago: $mensajeError';
        }
    }
  }

  Future<void> _procesarPagoManual() async {
    try {
      final resultadoPago = await _pagoService.crearPagoManual(
        reservaId: widget.reserva.id,
        metodoPago: _metodoPago,
      );

      if (resultadoPago['success'] == true) {
        final resultadoConfirmacion = await _reservaService.confirmarPago(
          widget.reserva.id,
        );

        if (resultadoConfirmacion['success'] == true) {
          // ✅ OBTENER LA RESERVA ACTUALIZADA
          final reservaActualizada = await _obtenerReservaActualizada();
          _manejarPagoExitoso(reservaActualizada);
        } else {
          throw Exception(
            resultadoConfirmacion['error'] ?? 'Error al confirmar pago',
          );
        }
      } else {
        throw Exception(resultadoPago['error'] ?? 'Error al crear pago manual');
      }
    } catch (e) {
      throw Exception('Error en pago manual: $e');
    }
  }

  // ✅ MODIFICADO: Ahora recibe la reserva actualizada
  void _manejarPagoExitoso(Reserva reservaActualizada) {
    setState(() {
      _estado = 'completado';
      _pagoExitoso = true;
    });

    _timer?.cancel();

    Future.delayed(Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ConfirmacionReservaScreen(
              reserva: reservaActualizada, // ✅ USAR RESERVA ACTUALIZADA
              viaje: widget.viaje,
            ),
          ),
        );
      }
    });
  }

  void _cancelarReserva() async {
    final confirmado = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Cancelar Reserva'),
        content: Text(
          '¿Estás seguro de que quieres cancelar esta reserva? Los asientos se liberarán.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Sí, Cancelar'),
          ),
        ],
      ),
    );

    if (confirmado == true) {
      try {
        await _reservaService.cancelarReservaTemporal(widget.reserva.id);
        if (mounted) Navigator.pop(context);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error al cancelar reserva: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  String _formatearTiempo(int segundos) {
    final minutos = segundos ~/ 60;
    final segs = segundos % 60;
    return '${minutos.toString().padLeft(2, '0')}:${segs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Finalizar Compra'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          if (_estado != 'completado')
            IconButton(icon: Icon(Icons.close), onPressed: _cancelarReserva),
        ],
      ),
      body: _buildContenido(),
    );
  }

  Widget _buildContenido() {
    return Column(
      children: [
        if (_tiempoRestante > 0 && _estado != 'completado') _buildTimer(),
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                _buildInfoReserva(),
                SizedBox(height: 24),
                _buildFlujoPago(),
              ],
            ),
          ),
        ),
        if (_estado != 'completado') _buildBottomActions(),
      ],
    );
  }

  Widget _buildTimer() {
    final color = _tiempoRestante < 300 ? Colors.red : Colors.orange;
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border(bottom: BorderSide(color: color)),
      ),
      child: Row(
        children: [
          Icon(
            _tiempoRestante < 300 ? Icons.warning : Icons.timer,
            color: color,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tiempo restante: ${_formatearTiempo(_tiempoRestante)}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: color),
                ),
                SizedBox(height: 4),
                Text(
                  _tiempoRestante < 300
                      ? '¡Últimos minutos! Completa el pago antes de que expire.'
                      : 'Completa tu pago para confirmar los asientos.',
                  style: TextStyle(fontSize: 12, color: color),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoReserva() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Reserva ${widget.reserva.codigoReserva}',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                Chip(
                  label: Text(
                    widget.reserva.estado.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(fontSize: 12, color: Colors.white),
                  ),
                  backgroundColor: Colors.blue,
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.directions_bus, size: 16, color: Colors.grey),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${widget.viaje.origen} → ${widget.viaje.destino}',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                SizedBox(width: 8),
                Text('${_formatearFecha(widget.viaje.fecha)}'),
                SizedBox(width: 16),
                Icon(Icons.access_time, size: 16, color: Colors.grey),
                SizedBox(width: 8),
                Text(widget.viaje.hora),
              ],
            ),
            SizedBox(height: 12),
            Divider(),
            SizedBox(height: 8),
            Text(
              'Asientos seleccionados:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: widget.reserva.items
                  .map(
                    (item) => Chip(
                      // ✅ CORREGIDO: Usar numeroAsiento en lugar de asientoId
                      label: Text('Asiento ${item.numeroAsiento}'),
                      backgroundColor: Colors.green[100],
                    ),
                  )
                  .toList(),
            ),
            SizedBox(height: 12),
            Divider(),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total a pagar:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  'Bs. ${widget.reserva.total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFlujoPago() {
    switch (_estado) {
      case 'seleccionando':
        return _buildSeleccionMetodoPago();
      case 'procesando':
        return _buildProcesando();
      case 'completado':
        return _buildCompletado();
      case 'error':
        return _buildError();
      default:
        return Container();
    }
  }

  Widget _buildSeleccionMetodoPago() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Selecciona método de pago:',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        SizedBox(height: 16),
        Column(
          children: [
            _buildMetodoPago(
              'Tarjeta Crédito/Débito',
              Icons.credit_card,
              Colors.blue,
              'stripe',
              'Pago seguro con Stripe',
            ),
            SizedBox(height: 12),
            _buildMetodoPago(
              'Efectivo',
              Icons.money,
              Colors.green,
              'efectivo',
              'Pagar al subir al bus',
            ),
            SizedBox(height: 12),
            _buildMetodoPago(
              'Transferencia',
              Icons.account_balance,
              Colors.purple,
              'transferencia',
              'Depósito bancario',
            ),
          ],
        ),
        SizedBox(height: 24),
        if (_metodoPago == 'stripe')
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.security, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Pago 100% seguro con Stripe. Tus datos están encriptados.',
                    style: TextStyle(fontSize: 12, color: Colors.blue[800]),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildMetodoPago(
    String titulo,
    IconData icono,
    Color color,
    String valor,
    String descripcion,
  ) {
    final seleccionado = _metodoPago == valor;
    return GestureDetector(
      onTap: () => setState(() => _metodoPago = valor),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: seleccionado ? color : Colors.grey[300]!,
            width: seleccionado ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: seleccionado ? color.withOpacity(0.1) : Colors.white,
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icono, color: color, size: 24),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titulo,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 4),
                  Text(
                    descripcion,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            if (seleccionado) Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }

  Widget _buildProcesando() {
    return Column(
      children: [
        SizedBox(height: 40),
        CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
          strokeWidth: 4,
        ),
        SizedBox(height: 24),
        Text(
          _metodoPago == 'stripe'
              ? 'Procesando tu pago con Stripe...'
              : 'Procesando tu pago...',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        SizedBox(height: 8),
        Text(
          _metodoPago == 'stripe'
              ? 'Se abrirá la pasarela de pago de Stripe'
              : 'Por favor no cierres la aplicación',
          style: TextStyle(color: Colors.grey[600]),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCompletado() {
    return Column(
      children: [
        Icon(Icons.check_circle, size: 80, color: Colors.green),
        SizedBox(height: 24),
        Text(
          '¡Pago Completado Exitosamente!',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Colors.green,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 16),
        Text(
          'Tu reserva ha sido confirmada y está lista para viajar.',
          style: TextStyle(fontSize: 16),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: Colors.green[50],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                Text(
                  'CÓDIGO DE RESERVA',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green[800],
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  widget.reserva.codigoReserva,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.green[800],
                    letterSpacing: 2,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Guarda este código para presentarlo al abordar el bus',
                  style: TextStyle(fontSize: 12, color: Colors.green[800]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildError() {
    return Column(
      children: [
        Icon(Icons.error, size: 64, color: Colors.red),
        SizedBox(height: 16),
        Text(
          'Error en el pago',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Colors.red,
          ),
        ),
        SizedBox(height: 8),
        Text(
          _error,
          style: TextStyle(fontSize: 14),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 24),
        if (_tiempoRestante > 0)
          ElevatedButton(
            onPressed: () {
              setState(() {
                _estado = 'seleccionando';
                _error = '';
              });
            },
            child: Text('Reintentar Pago'),
          ),
      ],
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[300]!)),
        boxShadow: [
          BoxShadow(
            offset: Offset(0, -2),
            blurRadius: 4,
            color: Colors.black12,
          ),
        ],
      ),
      child: Row(
        children: [
          if (_estado == 'seleccionando') ...[
            Expanded(
              child: OutlinedButton(
                onPressed: _cancelarReserva,
                child: Text('Cancelar'),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _tiempoRestante > 0 ? _procesarPago : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(
                  _tiempoRestante > 0
                      ? 'Pagar Bs. ${widget.reserva.total.toStringAsFixed(2)}'
                      : 'Tiempo Agotado',
                ),
              ),
            ),
          ] else if (_estado == 'error') ...[
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: Text('Volver'),
              ),
            ),
            SizedBox(width: 12),
            if (_tiempoRestante > 0)
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _estado = 'seleccionando';
                      _error = '';
                    });
                  },
                  child: Text('Reintentar'),
                ),
              ),
          ],
        ],
      ),
    );
  }

  String _formatearFecha(DateTime fecha) {
    return '${fecha.day}/${fecha.month}/${fecha.year}';
  }
}
