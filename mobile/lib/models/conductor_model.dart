class Conductor {
  final int id;
  final String nombre;
  final String apellido;
  final DateTime? fechaNacimiento;
  final String telefono;
  final String email;
  final String ci;
  final String nroLicencia;
  final String tipoLicencia;
  final DateTime fechaVencLicencia;
  final String estado;
  final int experienciaAnios;
  final String? telefonoEmergencia;
  final String? contactoEmergencia;
  final String nombreCompleto;
  final bool licenciaVencida;
  final int diasParaVencerLicencia;
  final bool puedeConducir;
  final String estadoUsuario;
  final double? ultimaUbicacionLat;
  final double? ultimaUbicacionLng;
  final DateTime? ultimaActualizacionUbicacion;
  final DateTime fechaCreacion;
  final DateTime fechaActualizacion;

  Conductor({
    required this.id,
    required this.nombre,
    required this.apellido,
    this.fechaNacimiento,
    required this.telefono,
    required this.email,
    required this.ci,
    required this.nroLicencia,
    required this.tipoLicencia,
    required this.fechaVencLicencia,
    required this.estado,
    required this.experienciaAnios,
    this.telefonoEmergencia,
    this.contactoEmergencia,
    required this.nombreCompleto,
    required this.licenciaVencida,
    required this.diasParaVencerLicencia,
    required this.puedeConducir,
    required this.estadoUsuario,
    this.ultimaUbicacionLat,
    this.ultimaUbicacionLng,
    this.ultimaActualizacionUbicacion,
    required this.fechaCreacion,
    required this.fechaActualizacion,
  });

  factory Conductor.fromJson(Map<String, dynamic> json) {
    return Conductor(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      fechaNacimiento: json['fecha_nacimiento'] != null
          ? DateTime.parse(json['fecha_nacimiento'])
          : null,
      telefono: json['telefono'] ?? '',
      email: json['email'] ?? '',
      ci: json['ci'] ?? '',
      nroLicencia: json['nro_licencia'] ?? '',
      tipoLicencia: json['tipo_licencia'] ?? '',
      fechaVencLicencia: DateTime.parse(
        json['fecha_venc_licencia'] ?? DateTime.now().toIso8601String(),
      ),
      estado: json['estado'] ?? 'inactivo',
      experienciaAnios: json['experiencia_anios'] ?? 0,
      telefonoEmergencia: json['telefono_emergencia'],
      contactoEmergencia: json['contacto_emergencia'],
      nombreCompleto: json['nombre_completo'] ?? '',
      licenciaVencida: json['licencia_vencida'] ?? false,
      diasParaVencerLicencia: json['dias_para_vencer_licencia'] ?? 0,
      puedeConducir: json['puede_conducir'] ?? false,
      estadoUsuario: json['estado_usuario'] ?? 'Inactivo',
      ultimaUbicacionLat: json['ultima_ubicacion_lat']?.toDouble(),
      ultimaUbicacionLng: json['ultima_ubicacion_lng']?.toDouble(),
      ultimaActualizacionUbicacion:
          json['ultima_actualizacion_ubicacion'] != null
          ? DateTime.parse(json['ultima_actualizacion_ubicacion'])
          : null,
      fechaCreacion: DateTime.parse(
        json['fecha_creacion'] ?? DateTime.now().toIso8601String(),
      ),
      fechaActualizacion: DateTime.parse(
        json['fecha_actualizacion'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'apellido': apellido,
      'fecha_nacimiento': fechaNacimiento?.toIso8601String(),
      'telefono': telefono,
      'email': email,
      'ci': ci,
      'nro_licencia': nroLicencia,
      'tipo_licencia': tipoLicencia,
      'fecha_venc_licencia': fechaVencLicencia.toIso8601String(),
      'estado': estado,
      'experiencia_anios': experienciaAnios,
      'telefono_emergencia': telefonoEmergencia,
      'contacto_emergencia': contactoEmergencia,
      'nombre_completo': nombreCompleto,
      'licencia_vencida': licenciaVencida,
      'dias_para_vencer_licencia': diasParaVencerLicencia,
      'puede_conducir': puedeConducir,
      'estado_usuario': estadoUsuario,
      'ultima_ubicacion_lat': ultimaUbicacionLat,
      'ultima_ubicacion_lng': ultimaUbicacionLng,
      'ultima_actualizacion_ubicacion': ultimaActualizacionUbicacion
          ?.toIso8601String(),
      'fecha_creacion': fechaCreacion.toIso8601String(),
      'fecha_actualizacion': fechaActualizacion.toIso8601String(),
    };
  }

  // Getter conveniente para descripción de licencia
  String get descripcionLicencia {
    switch (tipoLicencia) {
      case 'A':
        return 'Tipo A - Motocicletas';
      case 'B':
        return 'Tipo B - Vehículos particulares';
      case 'C':
        return 'Tipo C - Vehículos de carga liviana';
      case 'D':
        return 'Tipo D - Vehículos de carga pesada';
      case 'E':
        return 'Tipo E - Vehículos de transporte público';
      default:
        return 'Tipo $tipoLicencia';
    }
  }

  // Getter para el color del estado
  String get colorEstado {
    switch (estado) {
      case 'disponible':
        return '#4CAF50'; // Verde
      case 'ocupado':
        return '#FF9800'; // Naranja
      case 'descanso':
        return '#2196F3'; // Azul
      case 'inactivo':
        return '#9E9E9E'; // Gris
      default:
        return '#9E9E9E';
    }
  }

  // Getter para el texto del estado
  String get estadoTexto {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'ocupado':
        return 'Ocupado';
      case 'descanso':
        return 'En Descanso';
      case 'inactivo':
        return 'Inactivo';
      default:
        return estado;
    }
  }

  // Método para verificar si la licencia está próxima a vencer (menos de 30 días)
  bool get licenciaProximaVencer =>
      diasParaVencerLicencia > 0 && diasParaVencerLicencia <= 30;

  // Método para copiar con cambios
  Conductor copyWith({
    int? id,
    String? nombre,
    String? apellido,
    DateTime? fechaNacimiento,
    String? telefono,
    String? email,
    String? ci,
    String? nroLicencia,
    String? tipoLicencia,
    DateTime? fechaVencLicencia,
    String? estado,
    int? experienciaAnios,
    String? telefonoEmergencia,
    String? contactoEmergencia,
    String? nombreCompleto,
    bool? licenciaVencida,
    int? diasParaVencerLicencia,
    bool? puedeConducir,
    String? estadoUsuario,
    double? ultimaUbicacionLat,
    double? ultimaUbicacionLng,
    DateTime? ultimaActualizacionUbicacion,
    DateTime? fechaCreacion,
    DateTime? fechaActualizacion,
  }) {
    return Conductor(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      apellido: apellido ?? this.apellido,
      fechaNacimiento: fechaNacimiento ?? this.fechaNacimiento,
      telefono: telefono ?? this.telefono,
      email: email ?? this.email,
      ci: ci ?? this.ci,
      nroLicencia: nroLicencia ?? this.nroLicencia,
      tipoLicencia: tipoLicencia ?? this.tipoLicencia,
      fechaVencLicencia: fechaVencLicencia ?? this.fechaVencLicencia,
      estado: estado ?? this.estado,
      experienciaAnios: experienciaAnios ?? this.experienciaAnios,
      telefonoEmergencia: telefonoEmergencia ?? this.telefonoEmergencia,
      contactoEmergencia: contactoEmergencia ?? this.contactoEmergencia,
      nombreCompleto: nombreCompleto ?? this.nombreCompleto,
      licenciaVencida: licenciaVencida ?? this.licenciaVencida,
      diasParaVencerLicencia:
          diasParaVencerLicencia ?? this.diasParaVencerLicencia,
      puedeConducir: puedeConducir ?? this.puedeConducir,
      estadoUsuario: estadoUsuario ?? this.estadoUsuario,
      ultimaUbicacionLat: ultimaUbicacionLat ?? this.ultimaUbicacionLat,
      ultimaUbicacionLng: ultimaUbicacionLng ?? this.ultimaUbicacionLng,
      ultimaActualizacionUbicacion:
          ultimaActualizacionUbicacion ?? this.ultimaActualizacionUbicacion,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
      fechaActualizacion: fechaActualizacion ?? this.fechaActualizacion,
    );
  }
}
