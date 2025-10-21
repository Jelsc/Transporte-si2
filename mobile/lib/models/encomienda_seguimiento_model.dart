class EncomiendaSeguimiento {
  final int id;
  final int encomiendaId;
  final String evento;
  final String descripcion;
  final DateTime fecha;
  final String? ubicacion;
  final String? usuarioNombre;

  EncomiendaSeguimiento({
    required this.id,
    required this.encomiendaId,
    required this.evento,
    required this.descripcion,
    required this.fecha,
    this.ubicacion,
    this.usuarioNombre,
  });

  factory EncomiendaSeguimiento.fromJson(Map<String, dynamic> json) {
    return EncomiendaSeguimiento(
      id: json['id'] ?? 0,
      encomiendaId: json['encomienda'] ?? json['encomienda_id'] ?? 0,
      evento: json['evento'] ?? '',
      descripcion: json['descripcion'] ?? '',
      fecha: DateTime.parse(json['fecha'] ?? DateTime.now().toIso8601String()),
      ubicacion: json['ubicacion'],
      usuarioNombre: json['usuario_nombre'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'encomienda_id': encomiendaId,
      'evento': evento,
      'descripcion': descripcion,
      'fecha': fecha.toIso8601String(),
      'ubicacion': ubicacion,
      'usuario_nombre': usuarioNombre,
    };
  }

  // Propiedades calculadas para UI
  String get fechaFormateada {
    return '${fecha.day}/${fecha.month}/${fecha.year} ${fecha.hour}:${fecha.minute.toString().padLeft(2, '0')}';
  }

  String get fechaCorta {
    return '${fecha.day}/${fecha.month}/${fecha.year}';
  }

  String get hora {
    return '${fecha.hour}:${fecha.minute.toString().padLeft(2, '0')}';
  }

  // Métodos de utilidad
  bool get tieneUbicacion => ubicacion != null && ubicacion!.isNotEmpty;
  bool get tieneUsuario => usuarioNombre != null && usuarioNombre!.isNotEmpty;
}