/// Modelos para el sistema de ubicación y tracking del conductor
///
/// Arquitectura escalable preparada para integración con Google Maps
/// y servicios de geolocalización en tiempo real.

/// Parser universal robusto para conversión de tipos
/// Maneja conversiones seguras de tipos dinámicos desde JSON
class _TypeParser {
  /// Convierte cualquier tipo dinámico a int de forma segura
  static int parseInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      return int.tryParse(value) ?? defaultValue;
    }
    return defaultValue;
  }

  /// Convierte cualquier tipo dinámico a double de forma segura
  static double parseDouble(dynamic value, {double defaultValue = 0.0}) {
    if (value == null) return defaultValue;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? defaultValue;
    }
    return defaultValue;
  }

  /// Convierte cualquier tipo dinámico a String de forma segura
  static String parseString(dynamic value, {String defaultValue = ''}) {
    if (value == null) return defaultValue;
    if (value is String) return value;
    return value.toString();
  }

  /// Convierte cualquier tipo dinámico a bool de forma segura
  static bool parseBool(dynamic value, {bool defaultValue = false}) {
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) {
      final lower = value.toLowerCase();
      if (lower == 'true' || lower == '1') return true;
      if (lower == 'false' || lower == '0') return false;
    }
    return defaultValue;
  }
}

/// Representa una ubicación geográfica en el sistema
class Ubicacion {
  final int id;
  final String nombre;
  final String? direccion;
  final double lat;
  final double lng;
  final String? descripcion;

  Ubicacion({
    required this.id,
    required this.nombre,
    this.direccion,
    required this.lat,
    required this.lng,
    this.descripcion,
  });

  factory Ubicacion.fromJson(Map<String, dynamic> json) {
    return Ubicacion(
      id: _TypeParser.parseInt(json['id']),
      nombre: _TypeParser.parseString(json['nombre']),
      direccion: json['direccion'] as String?,
      lat: _TypeParser.parseDouble(json['lat']),
      lng: _TypeParser.parseDouble(json['lng']),
      descripcion: json['descripcion'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'direccion': direccion,
      'lat': lat,
      'lng': lng,
      'descripcion': descripcion,
    };
  }

  /// Convierte a formato LatLng para uso con mapas
  Map<String, double> toLatLng() {
    return {'lat': lat, 'lng': lng};
  }

  /// Calcula distancia aproximada a otra ubicación (en km)
  /// Fórmula Haversine simplificada
  double distanciaA(Ubicacion otra) {
    const double radioTierra = 6371; // km
    final dLat = _toRadians(otra.lat - lat);
    final dLng = _toRadians(otra.lng - lng);

    final a = _sin2(dLat / 2) + _cos(lat) * _cos(otra.lat) * _sin2(dLng / 2);

    final c = 2 * _atan2(_sqrt(a), _sqrt(1 - a));
    return radioTierra * c;
  }

  static double _toRadians(double grados) => grados * 3.141592653589793 / 180;
  static double _sin2(double x) {
    final s = _sin(x);
    return s * s;
  }

  static double _sin(double x) =>
      x - (x * x * x) / 6 + (x * x * x * x * x) / 120;
  static double _cos(double x) => 1 - (x * x) / 2 + (x * x * x * x) / 24;
  static double _sqrt(double x) => x < 0 ? 0 : _sqrtNewton(x);
  static double _sqrtNewton(double x) {
    if (x == 0) return 0;
    double z = x;
    double prevZ = 0;
    while ((z - prevZ).abs() > 0.0001) {
      prevZ = z;
      z = (z + x / z) / 2;
    }
    return z;
  }

  static double _atan2(double y, double x) {
    // Implementación simplificada de atan2
    if (x > 0) {
      return _atan(y / x);
    } else if (x < 0 && y >= 0) {
      return _atan(y / x) + 3.141592653589793;
    } else if (x < 0 && y < 0) {
      return _atan(y / x) - 3.141592653589793;
    } else if (x == 0 && y > 0) {
      return 3.141592653589793 / 2;
    } else if (x == 0 && y < 0) {
      return -3.141592653589793 / 2;
    }
    return 0; // x == 0 && y == 0
  }

  static double _atan(double x) {
    // Serie de Taylor para arctan (aproximación)
    return x - (x * x * x) / 3 + (x * x * x * x * x) / 5;
  }

  @override
  String toString() => 'Ubicacion($nombre, $lat, $lng)';
}

/// Representa la ubicación actual del conductor con metadatos adicionales
class UbicacionActual {
  final double lat;
  final double lng;
  final double? velocidad; // km/h
  final double? rumbo; // grados (0-360)
  final DateTime timestamp;
  final double? precision; // metros

  UbicacionActual({
    required this.lat,
    required this.lng,
    this.velocidad,
    this.rumbo,
    required this.timestamp,
    this.precision,
  });

  factory UbicacionActual.fromJson(Map<String, dynamic> json) {
    return UbicacionActual(
      lat: _TypeParser.parseDouble(json['lat']),
      lng: _TypeParser.parseDouble(json['lng']),
      velocidad: json['velocidad'] != null
          ? _TypeParser.parseDouble(json['velocidad'])
          : null,
      rumbo: json['rumbo'] != null
          ? _TypeParser.parseDouble(json['rumbo'])
          : null,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      precision: json['precision'] != null
          ? _TypeParser.parseDouble(json['precision'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'lat': lat,
      'lng': lng,
      'timestamp': timestamp.toIso8601String(),
    };

    if (velocidad != null) map['velocidad'] = velocidad!;
    if (rumbo != null) map['rumbo'] = rumbo!;
    if (precision != null) map['precision'] = precision!;

    return map;
  }

  /// Verifica si la ubicación es reciente (menos de 30 segundos)
  bool esReciente() {
    final diferencia = DateTime.now().difference(timestamp);
    return diferencia.inSeconds < 30;
  }

  /// Verifica si la ubicación es precisa (menos de 50 metros)
  bool esPrecisa() {
    return precision != null && precision! < 50;
  }

  @override
  String toString() =>
      'UbicacionActual($lat, $lng, velocidad: $velocidad km/h)';
}

/// Representa información completa de un viaje en curso con ubicaciones
class ViajeEnCurso {
  final int id;
  final Ubicacion origen;
  final Ubicacion destino;
  final DateTime fecha;
  final String hora;
  final String estado;
  final double precio;
  final int asientosDisponibles;
  final int asientosOcupados;
  final List<PasajeroViaje> pasajeros;
  final TotalesViaje totales;

  ViajeEnCurso({
    required this.id,
    required this.origen,
    required this.destino,
    required this.fecha,
    required this.hora,
    required this.estado,
    required this.precio,
    required this.asientosDisponibles,
    required this.asientosOcupados,
    required this.pasajeros,
    required this.totales,
  });

  factory ViajeEnCurso.fromJson(Map<String, dynamic> json) {
    final viajeData = json['viaje'] as Map<String, dynamic>;
    final pasajerosData = json['pasajeros'] as List<dynamic>? ?? [];
    final totalesData = json['totales'] as Map<String, dynamic>;

    return ViajeEnCurso(
      id: _TypeParser.parseInt(viajeData['id']),
      origen: Ubicacion.fromJson(viajeData['origen'] as Map<String, dynamic>),
      destino: Ubicacion.fromJson(viajeData['destino'] as Map<String, dynamic>),
      fecha: DateTime.parse(viajeData['fecha'] as String),
      hora: viajeData['hora'] as String,
      estado: viajeData['estado'] as String,
      precio: _TypeParser.parseDouble(viajeData['precio']),
      asientosDisponibles: _TypeParser.parseInt(
        viajeData['asientos_disponibles'],
      ),
      asientosOcupados: _TypeParser.parseInt(viajeData['asientos_ocupados']),
      pasajeros: pasajerosData
          .map((p) => PasajeroViaje.fromJson(p as Map<String, dynamic>))
          .toList(),
      totales: TotalesViaje.fromJson(totalesData),
    );
  }

  /// Calcula la distancia total del viaje
  double distanciaTotal() {
    return origen.distanciaA(destino);
  }

  /// Calcula el porcentaje de ocupación
  double porcentajeOcupacion() {
    final total = asientosDisponibles + asientosOcupados;
    if (total == 0) return 0.0;
    return (asientosOcupados / total) * 100;
  }
}

/// Información de pasajero dentro de un viaje en curso
class PasajeroViaje {
  final int id;
  final String nombre;
  final List<int> asientos;
  final int cantidadAsientos;
  final String estadoReserva;
  final String codigoReserva;

  PasajeroViaje({
    required this.id,
    required this.nombre,
    required this.asientos,
    required this.cantidadAsientos,
    required this.estadoReserva,
    required this.codigoReserva,
  });

  factory PasajeroViaje.fromJson(Map<String, dynamic> json) {
    return PasajeroViaje(
      id: _TypeParser.parseInt(json['id']),
      nombre: _TypeParser.parseString(json['nombre']),
      asientos: (json['asientos'] as List<dynamic>)
          .map((a) => _TypeParser.parseInt(a))
          .toList(),
      cantidadAsientos: _TypeParser.parseInt(json['cantidad_asientos']),
      estadoReserva: _TypeParser.parseString(json['estado_reserva']),
      codigoReserva: _TypeParser.parseString(json['codigo_reserva']),
    );
  }
}

/// Totales de un viaje en curso
class TotalesViaje {
  final int totalPasajeros;
  final int asientosOcupados;
  final int asientosDisponibles;

  TotalesViaje({
    required this.totalPasajeros,
    required this.asientosOcupados,
    required this.asientosDisponibles,
  });

  factory TotalesViaje.fromJson(Map<String, dynamic> json) {
    return TotalesViaje(
      totalPasajeros: _TypeParser.parseInt(json['total_pasajeros']),
      asientosOcupados: _TypeParser.parseInt(json['asientos_ocupados']),
      asientosDisponibles: _TypeParser.parseInt(json['asientos_disponibles']),
    );
  }
}

/// Resultado de actualización de ubicación
class ActualizacionUbicacionResultado {
  final bool success;
  final String mensaje;
  final UbicacionActual? ubicacion;

  ActualizacionUbicacionResultado({
    required this.success,
    required this.mensaje,
    this.ubicacion,
  });

  factory ActualizacionUbicacionResultado.fromJson(Map<String, dynamic> json) {
    return ActualizacionUbicacionResultado(
      success: json['success'] as bool,
      mensaje: json['mensaje'] as String? ?? '',
      ubicacion: json['data'] != null
          ? UbicacionActual.fromJson(json['data'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Respuesta del endpoint de cálculo de ETA
class ETAResponse {
  final double distanciaKm;
  final double tiempoMinutos;
  final String tiempoLlegadaEstimado;
  final List<List<double>>? geometriaRuta; // Array de [lng, lat]
  final String modoCalculo; // 'osrm' o 'haversine'

  ETAResponse({
    required this.distanciaKm,
    required this.tiempoMinutos,
    required this.tiempoLlegadaEstimado,
    this.geometriaRuta,
    required this.modoCalculo,
  });

  factory ETAResponse.fromJson(Map<String, dynamic> json) {
    List<List<double>>? geometria;

    if (json['geometria_ruta'] != null) {
      try {
        final geometriaData = json['geometria_ruta'] as List<dynamic>;
        geometria = geometriaData.map((coord) {
          final coordList = coord as List<dynamic>;
          return [
            _TypeParser.parseDouble(coordList[0]), // lng
            _TypeParser.parseDouble(coordList[1]), // lat
          ];
        }).toList();
      } catch (e) {
        print('⚠️ Error parseando geometría: $e');
        geometria = null;
      }
    }

    return ETAResponse(
      distanciaKm: _TypeParser.parseDouble(json['distancia_km']),
      tiempoMinutos: _TypeParser.parseDouble(json['tiempo_minutos']),
      tiempoLlegadaEstimado: _TypeParser.parseString(
        json['tiempo_llegada_estimado'],
        defaultValue: DateTime.now().toIso8601String(),
      ),
      geometriaRuta: geometria,
      modoCalculo: _TypeParser.parseString(
        json['modo_calculo'],
        defaultValue: 'unknown',
      ),
    );
  }

  /// Formatea el tiempo en formato legible (ej: "2h 30min")
  String get tiempoFormateado {
    final horas = (tiempoMinutos / 60).floor();
    final minutos = (tiempoMinutos % 60).round();

    if (horas > 0) {
      return '${horas}h ${minutos}min';
    }
    return '${minutos}min';
  }
}
