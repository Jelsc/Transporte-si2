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
  final String? conductorNombre;
  final String? notas;
  final List<dynamic> seguimientos;

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
    this.conductorNombre,
    this.notas,
    required this.seguimientos,
  });

  // MÉTODO toJson() CORREGIDO
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
      'conductor_nombre': conductorNombre,
      'notas': notas,
      'seguimientos': seguimientos,
    };
  }

  // GETTERS CORREGIDOS (sin null-aware operators innecesarios)
  String get fechaCreacionFormateada {
    return DateFormat('dd/MM/yyyy').format(fechaCreacion);
  }

  String get precioFormateado {
    return 'Bs. ${precio.toStringAsFixed(2)}';
  }

  Color get estadoColor {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return Colors.orange;
      case 'entregado':
        return Colors.green;
      case 'en camino':
        return Colors.blue;
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
      case 'entregado':
        return Icons.check_circle;
      case 'en camino':
        return Icons.local_shipping;
      case 'cancelado':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String get estadoTexto {
    return estado;
  }

  // Método fromJson para crear Encomienda desde Map (opcional pero útil)
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
      peso: (json['peso'] is int ? (json['peso'] as int).toDouble() : json['peso']) ?? 0.0,
      precio: (json['precio'] is int ? (json['precio'] as int).toDouble() : json['precio']) ?? 0.0,
      fechaCreacion: DateTime.parse(json['fecha_creacion']),
      fechaEntregaEstimada: json['fecha_entrega_estimada'] != null 
          ? DateTime.parse(json['fecha_entrega_estimada']) 
          : null,
      fechaEntregaReal: json['fecha_entrega_real'] != null 
          ? DateTime.parse(json['fecha_entrega_real']) 
          : null,
      conductorNombre: json['conductor_nombre'],
      notas: json['notas'],
      seguimientos: json['seguimientos'] ?? [],
    );
  }
}