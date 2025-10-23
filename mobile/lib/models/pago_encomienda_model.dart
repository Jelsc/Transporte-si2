import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PagoEncomienda {
  final int id;
  final int encomiendaId;
  final double monto;
  final String metodoPago;
  final String estado;
  final String? descripcion;
  final String? paymentIntentId;
  final DateTime fechaCreacion;
  final DateTime? fechaCompletado;
  final DateTime? fechaCancelado;
  final dynamic metadata;

  PagoEncomienda({
    required this.id,
    required this.encomiendaId,
    required this.monto,
    required this.metodoPago,
    required this.estado,
    this.descripcion,
    this.paymentIntentId,
    required this.fechaCreacion,
    this.fechaCompletado,
    this.fechaCancelado,
    this.metadata,
  });

  factory PagoEncomienda.fromJson(Map<String, dynamic> json) {
    return PagoEncomienda(
      id: json['id'] ?? 0,
      encomiendaId: json['encomienda_id'] ?? 0,
      monto: _convertToDouble(json['monto']),
      metodoPago: json['metodo_pago'] ?? 'efectivo',
      estado: json['estado'] ?? 'pendiente',
      descripcion: json['descripcion'],
      paymentIntentId: json['payment_intent_id'],
      fechaCreacion: _parseDateTime(json['fecha_creacion']) ?? DateTime.now(),
      fechaCompletado: _parseDateTime(json['fecha_completado']),
      fechaCancelado: _parseDateTime(json['fecha_cancelado']),
      metadata: json['metadata'],
    );
  }

  static double _convertToDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is String) return double.tryParse(value) ?? 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    return 0.0;
  }

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    try {
      return DateTime.parse(value);
    } catch (e) {
      return null;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encomienda_id': encomiendaId,
      'monto': monto,
      'metodo_pago': metodoPago,
      'estado': estado,
      'descripcion': descripcion,
      'payment_intent_id': paymentIntentId,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_completado': fechaCompletado?.toIso8601String(),
      'fecha_cancelado': fechaCancelado?.toIso8601String(),
      'metadata': metadata,
    };
  }

  // Propiedades calculadas
  String get estadoTexto {
    switch (estado.toLowerCase()) {
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      case 'fallido': return 'Fallido';
      default: return estado;
    }
  }

  Color get estadoColor {
    switch (estado.toLowerCase()) {
      case 'completado': return Colors.green;
      case 'procesando': return Colors.orange;
      case 'pendiente': return Colors.grey;
      case 'cancelado': return Colors.red;
      case 'fallido': return Colors.red;
      default: return Colors.grey;
    }
  }

  String get montoFormateado => 'Bs. ${monto.toStringAsFixed(2)}';
  String get fechaCreacionFormateada => DateFormat('dd/MM/yyyy HH:mm').format(fechaCreacion);

  // Métodos de utilidad
  bool get estaPendiente => estado == 'pendiente';
  bool get estaProcesando => estado == 'procesando';
  bool get estaCompletado => estado == 'completado';
  bool get estaCancelado => estado == 'cancelado';
  bool get estaFallido => estado == 'fallido';

  bool get puedeCancelar => estaPendiente || estaProcesando;
  bool get puedeReintentar => estaFallido;
  bool get esPagoStripe => metodoPago == 'tarjeta' && paymentIntentId != null;
}