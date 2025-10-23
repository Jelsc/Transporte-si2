import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Encomienda {
  final int id;
  final String codigoSeguimiento;
  final String estado;
  final String remitenteNombre;
  final String remitenteTelefono;
  final String? remitenteDireccion;
  final String destinatarioNombre;
  final String destinatarioTelefono;
  final String destinoCiudad;
  final String destinoDireccion;
  final String descripcion;
  final double peso;
  final double precio;
  final DateTime fechaCreacion;
  final DateTime? fechaEntregaEstimada;
  final DateTime? fechaEntregaReal;
  final int? conductorAsignado;
  final String? conductorNombre;
  final String? notas;
  final String metodoPago;
  final String estadoPago;
  final dynamic pagoInfo;
  final List<dynamic> seguimientos;
  final bool? puedeSerAsignada;
  final bool? puedeSerEntregada;

  Encomienda({
    required this.id,
    required this.codigoSeguimiento,
    required this.estado,
    required this.remitenteNombre,
    required this.remitenteTelefono,
    this.remitenteDireccion,
    required this.destinatarioNombre,
    required this.destinatarioTelefono,
    required this.destinoCiudad,
    required this.destinoDireccion,
    required this.descripcion,
    required this.peso,
    required this.precio,
    required this.fechaCreacion,
    this.fechaEntregaEstimada,
    this.fechaEntregaReal,
    this.conductorAsignado,
    this.conductorNombre,
    this.notas,
    required this.metodoPago,
    required this.estadoPago,
    this.pagoInfo,
    required this.seguimientos,
    this.puedeSerAsignada,
    this.puedeSerEntregada,
  });

  // ✅ FACTORY METHOD MEJORADO
  factory Encomienda.fromJson(Map<String, dynamic> json) {
    return Encomienda(
      id: json['id'] ?? 0,
      codigoSeguimiento: json['codigo_seguimiento'] ?? '',
      estado: json['estado'] ?? 'pendiente',
      remitenteNombre: json['remitente_nombre'] ?? '',
      remitenteTelefono: json['remitente_telefono'] ?? '',
      remitenteDireccion: json['remitente_direccion'],
      destinatarioNombre: json['destinatario_nombre'] ?? '',
      destinatarioTelefono: json['destinatario_telefono'] ?? '',
      destinoCiudad: json['destino_ciudad'] ?? '',
      destinoDireccion: json['destino_direccion'] ?? '',
      descripcion: json['descripcion'] ?? '',
      peso: _convertToDouble(json['peso']),
      precio: _convertToDouble(json['precio']),
      fechaCreacion: _parseDateTime(json['fecha_creacion']) ?? DateTime.now(),
      fechaEntregaEstimada: _parseDateTime(json['fecha_entrega_estimada']),
      fechaEntregaReal: _parseDateTime(json['fecha_entrega_real']),
      conductorAsignado: json['conductor_asignado'] ?? json['conductor_asignado_id'],
      conductorNombre: json['conductor_nombre'] ?? _getConductorNombre(json),
      notas: json['notas'],
      metodoPago: json['metodo_pago'] ?? 'efectivo',
      estadoPago: json['estado_pago'] ?? 'pendiente',
      pagoInfo: json['pago_info'],
      seguimientos: json['seguimientos'] ?? [],
      puedeSerAsignada: json['puede_ser_asignada'] ?? false,
      puedeSerEntregada: json['puede_ser_entregada'] ?? false,
    );
  }

  // ✅ NUEVO: Método para obtener nombre del conductor
  static String? _getConductorNombre(Map<String, dynamic> json) {
    if (json['conductor_nombre'] != null) return json['conductor_nombre'];
    if (json['conductor_info'] is Map) {
      return json['conductor_info']['nombre_completo'];
    }
    return null;
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
      if (value is String) {
        return DateTime.parse(value);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'codigo_seguimiento': codigoSeguimiento,
      'estado': estado,
      'precio': precio,
      'remitente_nombre': remitenteNombre,
      'remitente_telefono': remitenteTelefono,
      'remitente_direccion': remitenteDireccion,
      'destinatario_nombre': destinatarioNombre,
      'destinatario_telefono': destinatarioTelefono,
      'destino_ciudad': destinoCiudad,
      'destino_direccion': destinoDireccion,
      'descripcion': descripcion,
      'peso': peso,
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_entrega_estimada': fechaEntregaEstimada?.toIso8601String(),
      'fecha_entrega_real': fechaEntregaReal?.toIso8601String(),
      'conductor_asignado': conductorAsignado,
      'conductor_nombre': conductorNombre,
      'notas': notas,
      'metodo_pago': metodoPago,
      'estado_pago': estadoPago,
      'pago_info': pagoInfo,
      'seguimientos': seguimientos,
    };
  }
  // GETTERS
  String get fechaCreacionFormateada {
    return DateFormat('dd/MM/yyyy').format(fechaCreacion);
  }

  String get fechaCreacionCompleta {
    return DateFormat('dd/MM/yyyy HH:mm').format(fechaCreacion);
  }

  String get precioFormateado {
    return 'Bs. ${precio.toStringAsFixed(2)}';
  }

  // ESTADOS
  Color get estadoColor {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return Colors.orange;
      case 'en_ruta':
        return Colors.blue;
      case 'entregado':
        return Colors.green;
      case 'cancelado':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData get estadoIcon {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return Icons.pending;
      case 'en_ruta':
        return Icons.local_shipping;
      case 'entregado':
        return Icons.check_circle;
      case 'cancelado':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String get estadoTexto {
    switch (estado.toLowerCase()) {
      case 'pendiente': return 'Pendiente';
      case 'en_ruta': return 'En Ruta';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  }

  // ESTADOS DE PAGO
  Color get estadoPagoColor {
    switch (estadoPago.toLowerCase()) {
      case 'completado':
        return Colors.green;
      case 'procesando':
        return Colors.orange;
      case 'pendiente':
        return Colors.grey;
      case 'fallido':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String get estadoPagoTexto {
    switch (estadoPago.toLowerCase()) {
      case 'pendiente': return 'Pago Pendiente';
      case 'procesando': return 'Procesando Pago';
      case 'completado': return 'Pagado';
      case 'fallido': return 'Pago Fallido';
      default: return estadoPago;
    }
  }

  // MÉTODOS DE UTILIDAD
  bool get estaPendiente => estado == 'pendiente';
  bool get estaEnRuta => estado == 'en_ruta';
  bool get estaEntregado => estado == 'entregado';
  bool get estaCancelado => estado == 'cancelado';

  bool get pagoCompletado => estadoPago == 'completado';
  bool get pagoPendiente => estadoPago == 'pendiente';
  bool get pagoProcesando => estadoPago == 'procesando';
  bool get pagoFallido => estadoPago == 'fallido';

  bool get puedePagar => pagoPendiente || pagoFallido;
  bool get puedeCancelar => estaPendiente && pagoPendiente;

  // Información del conductor
  bool get tieneConductor => conductorNombre != null && conductorNombre!.isNotEmpty;
  
  String get conductorInfo {
    if (tieneConductor) {
      return conductorNombre!;
    }
    return 'Sin asignar';
  }
}