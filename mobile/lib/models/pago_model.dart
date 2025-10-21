// lib/models/pago_model.dart
class Pago {
  final int id;
  final int usuarioId;
  final String? usuarioNombre;
  final String? usuarioEmail;
  final int? reservaId;
  final Map<String, dynamic>? reservaInfo;
  final String? codigoReserva;
  final String? reservaEstado;
  final double monto;
  final String metodoPago; // 'stripe', 'efectivo', 'transferencia'
  final String
  estado; // 'pendiente', 'procesando', 'completado', 'cancelado', 'fallido'
  final String? descripcion;
  final String? stripePaymentIntentId;
  final String? stripeChargeId;
  final DateTime fechaCreacion;
  final DateTime? fechaCompletado;
  final DateTime? fechaCancelado;

  Pago({
    required this.id,
    required this.usuarioId,
    this.usuarioNombre,
    this.usuarioEmail,
    this.reservaId,
    this.reservaInfo,
    this.codigoReserva,
    this.reservaEstado,
    required this.monto,
    required this.metodoPago,
    required this.estado,
    this.descripcion,
    this.stripePaymentIntentId,
    this.stripeChargeId,
    required this.fechaCreacion,
    this.fechaCompletado,
    this.fechaCancelado,
  });

  factory Pago.fromJson(Map<String, dynamic> json) {
    return Pago(
      id: json['id'] as int,
      usuarioId: json['usuario'] as int,
      usuarioNombre: json['usuario_nombre'] as String?,
      usuarioEmail: json['usuario_email'] as String?,
      reservaId: json['reserva'] as int?,
      reservaInfo: json['reserva_info'] != null
          ? Map<String, dynamic>.from(json['reserva_info'])
          : null,
      codigoReserva: json['codigo_reserva'] as String?,
      reservaEstado: json['reserva_estado'] as String?,
      monto: _parseMonto(json['monto']), // ✅ Función de parseo segura
      metodoPago: json['metodo_pago'] as String,
      estado: json['estado'] as String,
      descripcion: json['descripcion'] as String?,
      stripePaymentIntentId: json['stripe_payment_intent_id'] as String?,
      stripeChargeId: json['stripe_charge_id'] as String?,
      fechaCreacion: DateTime.parse(json['fecha_creacion'] as String),
      fechaCompletado: json['fecha_completado'] != null
          ? DateTime.parse(json['fecha_completado'] as String)
          : null,
      fechaCancelado: json['fecha_cancelado'] != null
          ? DateTime.parse(json['fecha_cancelado'] as String)
          : null,
    );
  }

  // ✅ FUNCIÓN PARA PARSEAR MONTO DE FORMA SEGURA
  static double _parseMonto(dynamic monto) {
    if (monto == null) return 0.0;

    if (monto is num) {
      return monto.toDouble();
    } else if (monto is String) {
      // Remover caracteres no numéricos si es necesario
      final cleaned = monto.replaceAll(RegExp(r'[^\d.]'), '');
      return double.tryParse(cleaned) ?? 0.0;
    } else {
      return 0.0;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'usuario': usuarioId,
      'usuario_nombre': usuarioNombre,
      'usuario_email': usuarioEmail,
      'reserva': reservaId,
      'reserva_info': reservaInfo,
      'codigo_reserva': codigoReserva,
      'reserva_estado': reservaEstado,
      'monto': monto,
      'metodo_pago': metodoPago,
      'estado': estado,
      'descripcion': descripcion,
      'stripe_payment_intent_id': stripePaymentIntentId,
      'stripe_charge_id': stripeChargeId,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_completado': fechaCompletado?.toIso8601String(),
      'fecha_cancelado': fechaCancelado?.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'Pago{id: $id, codigo: $codigoReserva, monto: $monto, estado: $estado}';
  }
}
