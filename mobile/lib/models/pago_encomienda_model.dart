import 'package:flutter/material.dart'; // Agrega
class PagoEncomienda {
  final int id;
  final int encomiendaId;
  final double monto;
  final String metodoPago;
  final String estado;
  final String? descripcion;
  final String? stripePaymentIntentId;
  final String? stripeChargeId;
  final DateTime fechaCreacion;
  final DateTime? fechaCompletado;
  final DateTime? fechaCancelado;

  PagoEncomienda({
    required this.id,
    required this.encomiendaId,
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

  factory PagoEncomienda.fromJson(Map<String, dynamic> json) {
    return PagoEncomienda(
      id: json['id'] ?? 0,
      encomiendaId: json['encomienda_id'] ?? 0,
      monto: _convertToDouble(json['monto']),
      metodoPago: json['metodo_pago'] ?? 'efectivo',
      estado: json['estado'] ?? 'pendiente',
      descripcion: json['descripcion'],
      stripePaymentIntentId: json['stripe_payment_intent_id'],
      stripeChargeId: json['stripe_charge_id'],
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
      fechaCompletado: json['fecha_completado'] != null 
          ? DateTime.parse(json['fecha_completado'])
          : null,
      fechaCancelado: json['fecha_cancelado'] != null 
          ? DateTime.parse(json['fecha_cancelado'])
          : null,
    );
  }

  static double _convertToDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is String) return double.tryParse(value) ?? 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encomienda_id': encomiendaId,
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

  // Propiedades calculadas
  String get estadoTexto {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      case 'fallido': return 'Fallido';
      default: return estado;
    }
  }

  Color get estadoColor {
    switch (estado) {
      case 'completado': return Colors.green;
      case 'procesando': return Colors.orange;
      case 'pendiente': return Colors.grey;
      case 'cancelado': return Colors.red;
      case 'fallido': return Colors.red;
      default: return Colors.grey;
    }
  }

  String get montoFormateado => 'Bs. ${monto.toStringAsFixed(2)}';
  String get fechaCreacionFormateada => '${fechaCreacion.day}/${fechaCreacion.month}/${fechaCreacion.year}';

  // Métodos de utilidad
  bool get estaPendiente => estado == 'pendiente';
  bool get estaProcesando => estado == 'procesando';
  bool get estaCompletado => estado == 'completado';
  bool get estaCancelado => estado == 'cancelado';
  bool get estaFallido => estado == 'fallido';

  bool get puedeCancelar => estaPendiente || estaProcesando;
  bool get puedeReintentar => estaFallido;
}