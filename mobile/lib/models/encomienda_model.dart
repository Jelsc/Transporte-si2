import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:convert'; // ✅ AGREGAR ESTA IMPORTACIÓN

class Encomienda {
  // ✅ CONSTANTES PARA ESTADOS - RENOMBRADAS para evitar conflictos
  static const String kEstadoPendiente = 'pendiente';
  static const String kEstadoEnRuta = 'en_ruta';
  static const String kEstadoEntregado = 'entregado';
  static const String kEstadoCancelado = 'cancelado';

  static const String kPagoPendiente = 'pendiente';
  static const String kPagoProcesando = 'procesando';
  static const String kPagoCompletado = 'completado';
  static const String kPagoFallido = 'fallido';

  static const String kMetodoPagoEfectivo = 'efectivo';
  static const String kMetodoPagoStripe = 'stripe';

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
  final Map<String, dynamic>? viajeInfo;
  final Map<String, dynamic>? trackingInfo;

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
    this.viajeInfo,
    this.trackingInfo,
  });

  // ✅ CONSTRUCTOR PARA CASOS DE ERROR
  Encomienda._empty()
    : id = 0,
      codigoSeguimiento = 'ERROR',
      estado = kEstadoPendiente,
      remitenteNombre = '',
      remitenteTelefono = '',
      remitenteDireccion = null,
      destinatarioNombre = '',
      destinatarioTelefono = '',
      destinoCiudad = '',
      destinoDireccion = '',
      descripcion = 'Error al cargar encomienda',
      peso = 0.0,
      precio = 0.0,
      fechaCreacion = DateTime.now(),
      fechaEntregaEstimada = null,
      fechaEntregaReal = null,
      conductorAsignado = null,
      conductorNombre = null,
      notas = null,
      metodoPago = kMetodoPagoEfectivo,
      estadoPago = kPagoPendiente,
      pagoInfo = null,
      seguimientos = [],
      puedeSerAsignada = false,
      puedeSerEntregada = false,
      viajeInfo = null,
      trackingInfo = null;

  // ✅ FACTORY METHOD MEJORADO CON MANEJO DE ERRORES
  factory Encomienda.fromJson(Map<String, dynamic> json) {
    try {
      return Encomienda(
        id: json['id'] as int? ?? 0,
        codigoSeguimiento: (json['codigo_seguimiento'] ?? '') as String,
        estado: (json['estado'] ?? kEstadoPendiente) as String,
        remitenteNombre: (json['remitente_nombre'] ?? '') as String,
        remitenteTelefono: (json['remitente_telefono'] ?? '') as String,
        remitenteDireccion: json['remitente_direccion'] as String?,
        destinatarioNombre: (json['destinatario_nombre'] ?? '') as String,
        destinatarioTelefono: (json['destinatario_telefono'] ?? '') as String,
        destinoCiudad: (json['destino_ciudad'] ?? '') as String,
        destinoDireccion: (json['destino_direccion'] ?? '') as String,
        descripcion: (json['descripcion'] ?? '') as String,
        peso: _convertToDouble(json['peso']),
        precio: _convertToDouble(json['precio']),
        fechaCreacion: _parseDateTime(json['fecha_creacion']) ?? DateTime.now(),
        fechaEntregaEstimada: _parseDateTime(json['fecha_entrega_estimada']),
        fechaEntregaReal: _parseDateTime(json['fecha_entrega_real']),
        conductorAsignado: json['conductor_asignado'] as int?,
        conductorNombre: _getConductorNombre(json),
        notas: json['notas'] as String?,
        metodoPago: (json['metodo_pago'] ?? kMetodoPagoEfectivo) as String,
        estadoPago: (json['estado_pago'] ?? kPagoPendiente) as String,
        pagoInfo: json['pago_info'],
        seguimientos: (json['seguimientos'] ?? []) as List<dynamic>,
        puedeSerAsignada: json['puede_ser_asignada'] as bool? ?? false,
        puedeSerEntregada: json['puede_ser_entregada'] as bool? ?? false,
        viajeInfo: json['viaje_info'] as Map<String, dynamic>?,
        trackingInfo: json['tracking_info'] as Map<String, dynamic>?,
      );
    } catch (e, stackTrace) {
      // ✅ REEMPLAZADO: En lugar de print, puedes usar debugPrint o simplemente comentar
      debugPrint('❌ Error en Encomienda.fromJson: $e');
      debugPrint('❌ StackTrace: $stackTrace');
      debugPrint('❌ JSON problemático: $json');

      return Encomienda._empty();
    }
  }

  // ✅ MÉTODOS HELPER PARA PARSING
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

  static String? _getConductorNombre(Map<String, dynamic> json) {
    if (json['conductor_nombre'] != null)
      return json['conductor_nombre'] as String?;
    if (json['conductor_info'] is Map) {
      return (json['conductor_info'] as Map)['nombre_completo'] as String?;
    }
    return null;
  }

  // ✅ TO JSON
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

  // ✅ GETTERS CON VALIDACIONES
  String get fechaCreacionFormateada {
    try {
      return DateFormat('dd/MM/yyyy').format(fechaCreacion);
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  String get fechaCreacionCompleta {
    try {
      return DateFormat('dd/MM/yyyy HH:mm').format(fechaCreacion);
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  String get precioFormateado {
    return 'Bs. ${precio.toStringAsFixed(2)}';
  }

  String get pesoFormateado {
    return '${peso.toStringAsFixed(1)} kg';
  }

  // ✅ ESTADOS
  Color get estadoColor {
    final estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case kEstadoPendiente:
        return Colors.orange;
      case kEstadoEnRuta:
        return Colors.blue;
      case kEstadoEntregado:
        return Colors.green;
      case kEstadoCancelado:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData get estadoIcon {
    final estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case kEstadoPendiente:
        return Icons.pending;
      case kEstadoEnRuta:
        return Icons.local_shipping;
      case kEstadoEntregado:
        return Icons.check_circle;
      case kEstadoCancelado:
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  String get estadoTexto {
    final estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case kEstadoPendiente:
        return 'Pendiente';
      case kEstadoEnRuta:
        return 'En Ruta';
      case kEstadoEntregado:
        return 'Entregado';
      case kEstadoCancelado:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  // ✅ ESTADOS DE PAGO
  Color get estadoPagoColor {
    final estadoPagoLower = estadoPago.toLowerCase();
    switch (estadoPagoLower) {
      case kPagoCompletado:
        return Colors.green;
      case kPagoProcesando:
        return Colors.orange;
      case kPagoPendiente:
        return Colors.grey;
      case kPagoFallido:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String get estadoPagoTexto {
    final estadoPagoLower = estadoPago.toLowerCase();
    switch (estadoPagoLower) {
      case kPagoPendiente:
        return 'Pago Pendiente';
      case kPagoProcesando:
        return 'Procesando Pago';
      case kPagoCompletado:
        return 'Pagado';
      case kPagoFallido:
        return 'Pago Fallido';
      default:
        return estadoPago;
    }
  }

  // ✅ MÉTODOS DE UTILIDAD - CORREGIDOS para usar constantes
  bool get estaPendiente => estado == kEstadoPendiente;
  bool get estaEnRuta => estado == kEstadoEnRuta;
  bool get estaEntregado => estado == kEstadoEntregado;
  bool get estaCancelado => estado == kEstadoCancelado;

  bool get pagoCompletadoBool => estadoPago == kPagoCompletado;
  bool get pagoPendienteBool => estadoPago == kPagoPendiente;
  bool get pagoProcesandoBool => estadoPago == kPagoProcesando;
  bool get pagoFallidoBool => estadoPago == kPagoFallido;

  // ✅ CORREGIDO: Usar los getters booleanos en lugar de comparar strings directamente
  bool get puedePagar => pagoPendienteBool || pagoFallidoBool;
  bool get puedeCancelar => estaPendiente && pagoPendienteBool;

  // ✅ VALIDACIONES
  bool get esValida => id > 0 && codigoSeguimiento.isNotEmpty;
  bool get tieneError => codigoSeguimiento == 'ERROR';

  // ✅ INFORMACIÓN DEL CONDUCTOR
  bool get tieneConductor =>
      conductorNombre != null && conductorNombre!.isNotEmpty;

  String get conductorInfo {
    if (tieneConductor) {
      return conductorNombre!;
    }
    return 'Sin asignar';
  }

  // ✅ INFORMACIÓN DE SEGUIMIENTO
  String get ultimoSeguimiento {
    if (seguimientos.isEmpty) return 'Sin seguimiento disponible';

    final ultimo = seguimientos.last;
    if (ultimo is Map<String, dynamic>) {
      return ultimo['evento']?.toString() ?? 'Evento desconocido';
    }
    return ultimo.toString();
  }

  DateTime? get ultimaActualizacion {
    if (seguimientos.isEmpty) return null;

    try {
      final ultimo = seguimientos.last;
      if (ultimo is Map<String, dynamic> && ultimo['fecha'] != null) {
        return DateTime.parse(ultimo['fecha'] as String);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // ✅ INFORMACIÓN DE PAGO DETALLADA
  Map<String, dynamic>? get informacionPago {
    if (pagoInfo is Map) return pagoInfo as Map<String, dynamic>?;
    if (pagoInfo is String) {
      try {
        return jsonDecode(pagoInfo as String) as Map<String, dynamic>?;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  String? get idPagoStripe {
    final info = informacionPago;
    return info?['payment_intent_id'] as String?;
  }

  // ✅ MÉTODO PARA CREAR COPIA (ÚTIL PARA UPDATES)
  Encomienda copyWith({
    int? id,
    String? estado,
    String? estadoPago,
    String? conductorNombre,
    DateTime? fechaEntregaReal,
    List<dynamic>? seguimientos,
    double? precio,
  }) {
    return Encomienda(
      id: id ?? this.id,
      codigoSeguimiento: codigoSeguimiento,
      estado: estado ?? this.estado,
      remitenteNombre: remitenteNombre,
      remitenteTelefono: remitenteTelefono,
      remitenteDireccion: remitenteDireccion,
      destinatarioNombre: destinatarioNombre,
      destinatarioTelefono: destinatarioTelefono,
      destinoCiudad: destinoCiudad,
      destinoDireccion: destinoDireccion,
      descripcion: descripcion,
      peso: peso,
      precio: precio ?? this.precio,
      fechaCreacion: fechaCreacion,
      fechaEntregaEstimada: fechaEntregaEstimada,
      fechaEntregaReal: fechaEntregaReal ?? this.fechaEntregaReal,
      conductorAsignado: conductorAsignado,
      conductorNombre: conductorNombre ?? this.conductorNombre,
      notas: notas,
      metodoPago: metodoPago,
      estadoPago: estadoPago ?? this.estadoPago,
      pagoInfo: pagoInfo,
      seguimientos: seguimientos ?? this.seguimientos,
      puedeSerAsignada: puedeSerAsignada,
      puedeSerEntregada: puedeSerEntregada,
    );
  }

  // ✅ MÉTODOS DE COMPARACIÓN (PARA LIST UPDATES)
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Encomienda &&
        other.id == id &&
        other.estado == estado &&
        other.estadoPago == estadoPago;
  }

  @override
  int get hashCode => id.hashCode ^ estado.hashCode ^ estadoPago.hashCode;

  // ✅ MÉTODO PARA DEBUG
  @override
  String toString() {
    return 'Encomienda{id: $id, codigo: $codigoSeguimiento, estado: $estado, precio: $precio}';
  }
}

// ✅ CLASE HELPER PARA PARSING SEGURO
class EncomiendaParser {
  static List<Encomienda> fromList(List<dynamic> jsonList) {
    final encomiendas = <Encomienda>[];

    for (var i = 0; i < jsonList.length; i++) {
      try {
        final item = jsonList[i];
        if (item is Map<String, dynamic>) {
          final encomienda = Encomienda.fromJson(item);
          if (encomienda.esValida) {
            encomiendas.add(encomienda);
          }
        }
      } catch (e) {
        debugPrint('❌ Error parseando encomienda en índice $i: $e');
      }
    }

    return encomiendas;
  }
}
