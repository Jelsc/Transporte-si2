import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/ip_detection.dart';
import 'auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ViajeConductorService {
  static String get baseUrl => '${IPDetection.BACKEND_HOST}/api';

  // Helper method to get access token
  static Future<String?> _getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(
      'auth_token',
    ); // Cambiado de 'access_token' a 'auth_token'
  }

  /// Obtiene los viajes asignados al conductor actual
  /// Usa el nuevo endpoint /api/viajes/mis-viajes/
  static Future<ApiResponse<List<ViajeResumen>>> obtenerViajesAsignados({
    String? estado,
  }) async {
    try {
      final token = await _getAccessToken();
      if (token == null) {
        return ApiResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      String url = '$baseUrl/viajes/mis-viajes/';
      if (estado != null && estado != 'todos') {
        url += '?estado=$estado';
      }

      print('🚀 [ViajeConductorService] Obteniendo viajes del conductor: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
      );

      print('📡 [ViajeConductorService] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(
          utf8.decode(response.bodyBytes),
        );

        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          final List<dynamic> data = jsonResponse['data'];
          final viajes = data
              .map((json) => ViajeResumen.fromJson(json))
              .toList();

          print('✅ [ViajeConductorService] ${viajes.length} viajes cargados');

          return ApiResponse(
            success: true,
            data: viajes,
            message: 'Viajes cargados correctamente',
          );
        } else {
          return ApiResponse(
            success: false,
            error: jsonResponse['error'] ?? 'Error desconocido',
          );
        }
      } else if (response.statusCode == 403) {
        return ApiResponse(
          success: false,
          error: 'No tienes permisos de conductor',
        );
      } else {
        return ApiResponse(
          success: false,
          error: 'Error al obtener viajes: ${response.statusCode}',
        );
      }
    } catch (e) {
      print('❌ [ViajeConductorService] Error: $e');
      return ApiResponse(success: false, error: 'Error: $e');
    }
  }

  static Future<ApiResponse<ViajeDetallado>> obtenerDetalleViaje(int id) async {
    try {
      final token = await _getAccessToken();
      if (token == null) {
        return ApiResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      final response = await http.get(
        Uri.parse('$baseUrl/viajes/$id/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        final viaje = ViajeDetallado.fromJson(data);
        return ApiResponse(success: true, data: viaje);
      } else {
        return ApiResponse(
          success: false,
          error: 'Error al obtener detalle del viaje: ${response.statusCode}',
        );
      }
    } catch (e) {
      return ApiResponse(success: false, error: 'Error: $e');
    }
  }

  /// Actualiza el estado de un viaje
  /// Usa el endpoint personalizado /api/viajes/{id}/actualizar-estado/
  static Future<ApiResponse<ViajeResumen>> actualizarEstadoViaje(
    int id,
    String nuevoEstado,
  ) async {
    try {
      final token = await _getAccessToken();
      if (token == null) {
        return ApiResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      print(
        '🔄 [ViajeConductorService] Actualizando estado del viaje $id a $nuevoEstado',
      );

      final response = await http.post(
        Uri.parse('$baseUrl/viajes/$id/actualizar-estado/'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'estado': nuevoEstado}),
      );

      print(
        '📡 [ViajeConductorService] Status actualizar estado: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(
          utf8.decode(response.bodyBytes),
        );

        if (jsonResponse['success'] == true) {
          final viajeActualizado = ViajeResumen.fromJson(jsonResponse['data']);
          print('✅ [ViajeConductorService] Estado actualizado correctamente');

          return ApiResponse(
            success: true,
            data: viajeActualizado,
            message: jsonResponse['message'],
          );
        } else {
          return ApiResponse(
            success: false,
            error: jsonResponse['error'] ?? 'Error desconocido',
          );
        }
      } else if (response.statusCode == 403) {
        return ApiResponse(
          success: false,
          error: 'No tienes permisos para modificar este viaje',
        );
      } else {
        final errorData = json.decode(utf8.decode(response.bodyBytes));
        return ApiResponse(
          success: false,
          error:
              errorData['error'] ??
              'Error al actualizar estado: ${response.statusCode}',
        );
      }
    } catch (e) {
      print('❌ [ViajeConductorService] Error actualizando estado: $e');
      return ApiResponse(success: false, error: 'Error: $e');
    }
  }

  static Future<ApiResponse<ViajeResumen>> marcarInicioViaje(int id) async {
    return actualizarEstadoViaje(id, 'en_curso');
  }

  static Future<ApiResponse<ViajeResumen>> marcarFinViaje(int id) async {
    return actualizarEstadoViaje(id, 'completado');
  }

  static Future<ApiResponse<ListaPasajeros>> obtenerPasajerosViaje(
    int id,
  ) async {
    try {
      final token = await _getAccessToken();
      if (token == null) {
        return ApiResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      final url = '$baseUrl/viajes/$id/pasajeros/';
      print(
        '🚀 [ViajeConductorService] Obteniendo pasajeros del viaje $id: $url',
      );

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
      );

      print(
        '📡 [ViajeConductorService] Status pasajeros: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(
          utf8.decode(response.bodyBytes),
        );

        if (jsonResponse['success'] == true) {
          final listaPasajeros = ListaPasajeros.fromJson(jsonResponse);
          print(
            '✅ [ViajeConductorService] ${listaPasajeros.pasajeros.length} pasajeros cargados',
          );

          return ApiResponse(
            success: true,
            data: listaPasajeros,
            message: 'Pasajeros cargados correctamente',
          );
        }
      }

      return ApiResponse(
        success: false,
        error: 'Error al obtener pasajeros: ${response.statusCode}',
      );
    } catch (e) {
      print('❌ [ViajeConductorService] Error obteniendo pasajeros: $e');
      return ApiResponse(success: false, error: 'Error: $e');
    }
  }

  /// Obtiene información del vehículo asignado al conductor
  static Future<ApiResponse<VehiculoConductor>> obtenerMiVehiculo() async {
    try {
      final token = await _getAccessToken();
      if (token == null) {
        return ApiResponse(
          success: false,
          error: 'No hay token de autenticación',
        );
      }

      final url = '$baseUrl/viajes/mi-vehiculo/';
      print('🚀 [ViajeConductorService] Obteniendo mi vehículo: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
      );

      print(
        '📡 [ViajeConductorService] Status vehículo: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(
          utf8.decode(response.bodyBytes),
        );

        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          final vehiculo = VehiculoConductor.fromJson(jsonResponse['data']);
          print(
            '✅ [ViajeConductorService] Vehículo cargado: ${vehiculo.nombre}',
          );

          return ApiResponse(
            success: true,
            data: vehiculo,
            message: 'Vehículo cargado correctamente',
          );
        }
      } else if (response.statusCode == 404) {
        return ApiResponse(
          success: false,
          error: 'No tienes un vehículo asignado',
        );
      }

      return ApiResponse(
        success: false,
        error: 'Error al obtener vehículo: ${response.statusCode}',
      );
    } catch (e) {
      print('❌ [ViajeConductorService] Error obteniendo vehículo: $e');
      return ApiResponse(success: false, error: 'Error: $e');
    }
  }
}

// Modelo para resumen de viaje
class ViajeResumen {
  final int id;
  final String origen;
  final String destino;
  final DateTime fecha;
  final String hora;
  final String estado;
  final int asientosOcupados;
  final int asientosDisponibles;
  final String vehiculo;
  final double precio;

  ViajeResumen({
    required this.id,
    required this.origen,
    required this.destino,
    required this.fecha,
    required this.hora,
    required this.estado,
    required this.asientosOcupados,
    required this.asientosDisponibles,
    required this.vehiculo,
    required this.precio,
  });

  factory ViajeResumen.fromJson(Map<String, dynamic> json) {
    // Manejo seguro de los campos de ubicación
    String origen = 'N/A';
    String destino = 'N/A';

    if (json['origen_detalle'] != null) {
      origen = json['origen_detalle']['nombre'] ?? 'N/A';
    } else if (json['origen'] != null && json['origen'] is Map) {
      origen = json['origen']['nombre'] ?? 'N/A';
    }

    if (json['destino_detalle'] != null) {
      destino = json['destino_detalle']['nombre'] ?? 'N/A';
    } else if (json['destino'] != null && json['destino'] is Map) {
      destino = json['destino']['nombre'] ?? 'N/A';
    }

    // Manejo seguro del vehículo
    String vehiculo = 'N/A';
    if (json['vehiculo'] != null && json['vehiculo'] is Map) {
      vehiculo = json['vehiculo']['nombre'] ?? 'N/A';
    }

    // Manejo seguro del precio (puede venir como String o num)
    double precio = 0.0;
    if (json['precio'] != null) {
      if (json['precio'] is String) {
        precio = double.tryParse(json['precio']) ?? 0.0;
      } else if (json['precio'] is num) {
        precio = json['precio'].toDouble();
      }
    }

    return ViajeResumen(
      id: json['id'] ?? 0,
      origen: origen,
      destino: destino,
      fecha: DateTime.parse(json['fecha'] ?? DateTime.now().toIso8601String()),
      hora: json['hora'] ?? '',
      estado: json['estado'] ?? '',
      asientosOcupados: json['asientos_ocupados'] ?? 0,
      asientosDisponibles: json['asientos_disponibles'] ?? 0,
      vehiculo: vehiculo,
      precio: precio,
    );
  }

  String get estadoTexto {
    switch (estado) {
      case 'programado':
        return 'Programado';
      case 'en_curso':
        return 'En Curso';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  String get estadoColor {
    switch (estado) {
      case 'programado':
        return '#2196F3'; // Azul
      case 'en_curso':
        return '#FF9800'; // Naranja
      case 'completado':
        return '#4CAF50'; // Verde
      case 'cancelado':
        return '#F44336'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  }

  int get asientosLibres => asientosDisponibles - asientosOcupados;

  double get porcentajeOcupacion {
    if (asientosDisponibles == 0) return 0;
    return (asientosOcupados / asientosDisponibles) * 100;
  }
}

// Modelo detallado de viaje
class ViajeDetallado extends ViajeResumen {
  final String origenDireccion;
  final String destinoDireccion;
  final double? origenLat;
  final double? origenLng;
  final double? destinoLat;
  final double? destinoLng;
  final String vehiculoPlaca;

  ViajeDetallado({
    required super.id,
    required super.origen,
    required super.destino,
    required super.fecha,
    required super.hora,
    required super.estado,
    required super.asientosOcupados,
    required super.asientosDisponibles,
    required super.vehiculo,
    required super.precio,
    required this.origenDireccion,
    required this.destinoDireccion,
    this.origenLat,
    this.origenLng,
    this.destinoLat,
    this.destinoLng,
    required this.vehiculoPlaca,
  });

  factory ViajeDetallado.fromJson(Map<String, dynamic> json) {
    // Manejo seguro del precio (puede venir como String o num)
    double precio = 0.0;
    if (json['precio'] != null) {
      if (json['precio'] is String) {
        precio = double.tryParse(json['precio']) ?? 0.0;
      } else if (json['precio'] is num) {
        precio = json['precio'].toDouble();
      }
    }

    return ViajeDetallado(
      id: json['id'] ?? 0,
      origen: json['origen']?['nombre'] ?? '',
      destino: json['destino']?['nombre'] ?? '',
      fecha: DateTime.parse(json['fecha'] ?? DateTime.now().toIso8601String()),
      hora: json['hora'] ?? '',
      estado: json['estado'] ?? '',
      asientosOcupados: json['asientos_ocupados'] ?? 0,
      asientosDisponibles: json['asientos_disponibles'] ?? 0,
      vehiculo: json['vehiculo']?['nombre'] ?? '',
      origenDireccion: json['origen']?['direccion'] ?? '',
      destinoDireccion: json['destino']?['direccion'] ?? '',
      origenLat: json['origen']?['latitud']?.toDouble(),
      origenLng: json['origen']?['longitud']?.toDouble(),
      destinoLat: json['destino']?['latitud']?.toDouble(),
      destinoLng: json['destino']?['longitud']?.toDouble(),
      precio: precio,
      vehiculoPlaca: json['vehiculo']?['placa'] ?? '',
    );
  }
}

// Modelo de lista de pasajeros con totales
class ListaPasajeros {
  final List<Pasajero> pasajeros;
  final int totalPasajeros;
  final int asientosOcupados;
  final int asientosDisponibles;

  ListaPasajeros({
    required this.pasajeros,
    required this.totalPasajeros,
    required this.asientosOcupados,
    required this.asientosDisponibles,
  });

  factory ListaPasajeros.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return ListaPasajeros(
      pasajeros:
          (data['pasajeros'] as List?)
              ?.map((p) => Pasajero.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      totalPasajeros: data['totales']?['total_pasajeros'] ?? 0,
      asientosOcupados: data['totales']?['asientos_ocupados'] ?? 0,
      asientosDisponibles: data['totales']?['asientos_disponibles'] ?? 0,
    );
  }
}

// Modelo para pasajero
class Pasajero {
  final int id;
  final String nombre;
  final String apellido;
  final String telefono;
  final String email;
  final String? ci;
  final List<String> asientos;
  final int cantidadAsientos;
  final String estadoReserva;
  final String? codigoReserva;
  final DateTime? fechaReserva;
  final bool checkedIn;

  Pasajero({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.telefono,
    required this.email,
    this.ci,
    required this.asientos,
    required this.cantidadAsientos,
    required this.estadoReserva,
    this.codigoReserva,
    this.fechaReserva,
    this.checkedIn = false,
  });

  factory Pasajero.fromJson(Map<String, dynamic> json) {
    return Pasajero(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      telefono: json['telefono'] ?? '',
      email: json['email'] ?? '',
      ci: json['ci'],
      asientos:
          (json['asientos'] as List?)?.map((a) => a.toString()).toList() ?? [],
      cantidadAsientos: json['cantidad_asientos'] ?? 0,
      estadoReserva: json['estado_reserva'] ?? '',
      codigoReserva: json['codigo_reserva'],
      fechaReserva: json['fecha_reserva'] != null
          ? DateTime.tryParse(json['fecha_reserva'])
          : null,
      checkedIn: json['checked_in'] ?? false,
    );
  }

  String get nombreCompleto => '$nombre $apellido';

  String get asientosTexto => asientos.join(', ');
}

// Modelo para estadísticas del vehículo
class EstadisticasVehiculo {
  final int viajesHoy;
  final int viajesProgramados;
  final int viajesEnCurso;

  EstadisticasVehiculo({
    required this.viajesHoy,
    required this.viajesProgramados,
    required this.viajesEnCurso,
  });

  factory EstadisticasVehiculo.fromJson(Map<String, dynamic> json) {
    return EstadisticasVehiculo(
      viajesHoy: json['viajes_hoy'] ?? 0,
      viajesProgramados: json['viajes_programados'] ?? 0,
      viajesEnCurso: json['viajes_en_curso'] ?? 0,
    );
  }
}

// Modelo para información del vehículo del conductor
class VehiculoConductor {
  final int id;
  final String nombre;
  final String placa;
  final String tipo;
  final String? marca;
  final String? modelo;
  final int? anioFabricacion;
  final int capacidadPasajeros;
  final double? capacidadCarga;
  final String estado;
  final double? kilometraje;
  final DateTime? ultimoMantenimiento;
  final DateTime? proximoMantenimiento;
  final EstadisticasVehiculo estadisticas;

  VehiculoConductor({
    required this.id,
    required this.nombre,
    required this.placa,
    required this.tipo,
    this.marca,
    this.modelo,
    this.anioFabricacion,
    required this.capacidadPasajeros,
    this.capacidadCarga,
    required this.estado,
    this.kilometraje,
    this.ultimoMantenimiento,
    this.proximoMantenimiento,
    required this.estadisticas,
  });

  factory VehiculoConductor.fromJson(Map<String, dynamic> json) {
    return VehiculoConductor(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      placa: json['placa'] ?? '',
      tipo: json['tipo_vehiculo'] ?? json['tipo'] ?? '',
      marca: json['marca'],
      modelo: json['modelo'],
      anioFabricacion: json['año_fabricacion'] ?? json['anio_fabricacion'],
      capacidadPasajeros: json['capacidad_pasajeros'] ?? 0,
      capacidadCarga: json['capacidad_carga'] != null
          ? (json['capacidad_carga'] is String
                ? double.tryParse(json['capacidad_carga']) ?? 0.0
                : (json['capacidad_carga'] as num).toDouble())
          : null,
      estado: json['estado'] ?? 'activo',
      kilometraje: json['kilometraje'] != null
          ? (json['kilometraje'] is String
                ? double.tryParse(json['kilometraje']) ?? 0.0
                : (json['kilometraje'] as num).toDouble())
          : null,
      ultimoMantenimiento: json['ultimo_mantenimiento'] != null
          ? DateTime.tryParse(json['ultimo_mantenimiento'])
          : null,
      proximoMantenimiento: json['proximo_mantenimiento'] != null
          ? DateTime.tryParse(json['proximo_mantenimiento'])
          : null,
      estadisticas: EstadisticasVehiculo.fromJson(json['estadisticas'] ?? {}),
    );
  }

  String get nombreCompleto => '$nombre ($placa)';

  String get marcaModelo => marca != null && modelo != null
      ? '$marca $modelo'
      : marca ?? modelo ?? 'N/A';

  bool get requiereMantenimiento {
    if (proximoMantenimiento == null) return false;
    final diasHastaMantenimiento = proximoMantenimiento!
        .difference(DateTime.now())
        .inDays;
    return diasHastaMantenimiento <= 7; // Alerta si faltan 7 días o menos
  }
}
