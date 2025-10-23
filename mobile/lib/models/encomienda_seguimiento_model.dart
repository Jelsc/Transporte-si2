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
      id: json['id'] ?? 0,
      encomiendaId: json['encomienda'] ?? json['encomienda_id'] ?? 0,
      evento: json['evento'] ?? '',
      descripcion: json['descripcion'] ?? '',
      fecha: _parseDateTime(json['fecha']),
      ubicacion: json['ubicacion'],
    );
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    try {
      return DateTime.parse(value);
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

  // Propiedades calculadas para UI
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

  // Métodos de utilidad
  bool get tieneUbicacion => ubicacion != null && ubicacion!.isNotEmpty;
  
  bool get esReciente {
    final ahora = DateTime.now();
    final diferencia = ahora.difference(fecha);
    return diferencia.inHours < 24;
  }

  // Método para mostrar información resumida
  String get resumen {
    if (tieneUbicacion) {
      return '$evento - $ubicacion';
    }
    return evento;
  }

  // Método para obtener color según el tipo de evento
  String get tipoEvento {
    if (evento.toLowerCase().contains('entreg')) return 'entrega';
    if (evento.toLowerCase().contains('ruta')) return 'transito';
    if (evento.toLowerCase().contains('registr')) return 'registro';
    if (evento.toLowerCase().contains('cancel')) return 'cancelacion';
    return 'general';
  }
}