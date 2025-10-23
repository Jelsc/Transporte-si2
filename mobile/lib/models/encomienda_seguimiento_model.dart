import 'package:intl/intl.dart';

class EncomiendaSeguimiento {
  final int id;
  final int encomiendaId;
  final String evento;
  final String descripcion;
  final DateTime fecha;
  final String? ubicacion;

  EncomiendaSeguimiento({
    required this.id,
    required this.encomiendaId,
    required this.evento,
    required this.descripcion,
    required this.fecha,
    this.ubicacion,
  });

  factory EncomiendaSeguimiento.fromJson(Map<String, dynamic> json) {
    return EncomiendaSeguimiento(
      id: _parseInt(json['id']),
      encomiendaId: _parseInt(json['encomienda'] ?? json['encomienda_id']),
      evento: _parseString(json['evento']),
      descripcion: _parseString(json['descripcion']),
      fecha: _parseDateTime(json['fecha']),
      ubicacion: json['ubicacion']?.toString(),
    );
  }

  // ✅ MÉTODOS HELPER PARA PARSING SEGURO
  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static String _parseString(dynamic value) {
    if (value == null) return '';
    return value.toString();
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    try {
      if (value is String) {
        return DateTime.parse(value);
      }
      return DateTime.now();
    } catch (e) {
      return DateTime.now();
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encomienda_id': encomiendaId,
      'evento': evento,
      'descripcion': descripcion,
      'fecha': fecha.toIso8601String(),
      'ubicacion': ubicacion,
    };
  }

  // ... el resto de los métodos se mantienen igual
  String get fechaFormateada {
    return DateFormat('dd/MM/yyyy HH:mm').format(fecha);
  }

  String get fechaCorta {
    return DateFormat('dd/MM/yyyy').format(fecha);
  }

  String get hora {
    return DateFormat('HH:mm').format(fecha);
  }

  String get diaSemana {
    return DateFormat('EEEE', 'es_ES').format(fecha);
  }

  bool get tieneUbicacion => ubicacion != null && ubicacion!.isNotEmpty;
  
  bool get esReciente {
    final ahora = DateTime.now();
    final diferencia = ahora.difference(fecha);
    return diferencia.inHours < 24;
  }

  String get resumen {
    if (tieneUbicacion) {
      return '$evento - $ubicacion';
    }
    return evento;
  }

  String get tipoEvento {
    final eventoLower = evento.toLowerCase();
    if (eventoLower.contains('entreg')) return 'entrega';
    if (eventoLower.contains('ruta')) return 'transito';
    if (eventoLower.contains('registr')) return 'registro';
    if (eventoLower.contains('cancel')) return 'cancelacion';
    return 'general';
  }
}