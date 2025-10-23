// lib/models/viaje_model.dart
class Viaje {
  final int id;
  final String origen;
  final String destino;
  final DateTime fecha;
  final String hora;
  final double precio;
  final int asientosDisponibles;
  final int asientosOcupados;
  final String estado;
  final int? vehiculoId;

  Viaje({
    required this.id,
    required this.origen,
    required this.destino,
    required this.fecha,
    required this.hora,
    required this.precio,
    required this.asientosDisponibles,
    required this.asientosOcupados,
    required this.estado,
    this.vehiculoId,
  });

  factory Viaje.fromJson(Map<String, dynamic> json) {
    // ✅ MANEJO ROBUSTO DE CAMPOS NUMÉRICOS QUE PUEDEN VENIR COMO STRING

    // ID
    int id = 0;
    if (json['id'] != null) {
      if (json['id'] is String) {
        id = int.tryParse(json['id']) ?? 0;
      } else {
        id = (json['id'] as num).toInt();
      }
    }

    // Precio
    double precio = 0.0;
    if (json['precio'] != null) {
      if (json['precio'] is String) {
        precio = double.tryParse(json['precio']) ?? 0.0;
      } else {
        precio = (json['precio'] as num).toDouble();
      }
    }

    // Asientos disponibles
    int asientosDisponibles = 0;
    if (json['asientos_disponibles'] != null) {
      if (json['asientos_disponibles'] is String) {
        asientosDisponibles = int.tryParse(json['asientos_disponibles']) ?? 0;
      } else {
        asientosDisponibles = (json['asientos_disponibles'] as num).toInt();
      }
    }

    // Asientos ocupados
    int asientosOcupados = 0;
    if (json['asientos_ocupados'] != null) {
      if (json['asientos_ocupados'] is String) {
        asientosOcupados = int.tryParse(json['asientos_ocupados']) ?? 0;
      } else {
        asientosOcupados = (json['asientos_ocupados'] as num).toInt();
      }
    }

    // Vehículo ID (puede ser nulo)
    int? vehiculoId;
    if (json['vehiculo'] != null) {
      if (json['vehiculo'] is Map) {
        final vehiculoData = json['vehiculo'] as Map<String, dynamic>;
        if (vehiculoData['id'] != null) {
          if (vehiculoData['id'] is String) {
            vehiculoId = int.tryParse(vehiculoData['id']);
          } else {
            vehiculoId = (vehiculoData['id'] as num).toInt();
          }
        }
      } else if (json['vehiculo'] is num) {
        vehiculoId = (json['vehiculo'] as num).toInt();
      } else if (json['vehiculo'] is String) {
        vehiculoId = int.tryParse(json['vehiculo']);
      }
    }

    // Fecha
    DateTime fecha;
    try {
      if (json['fecha'] is DateTime) {
        fecha = json['fecha'];
      } else {
        fecha = DateTime.parse(json['fecha']);
      }
    } catch (e) {
      print('⚠️ [ViajeModel] Error parseando fecha: ${json['fecha']}');
      fecha = DateTime.now();
    }

    return Viaje(
      id: id,
      origen: json['origen'] ?? 'N/A',
      destino: json['destino'] ?? 'N/A',
      fecha: fecha,
      hora: json['hora'] ?? '',
      precio: precio,
      asientosDisponibles: asientosDisponibles,
      asientosOcupados: asientosOcupados,
      estado: json['estado'] ?? 'programado',
      vehiculoId: vehiculoId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'origen': origen,
      'destino': destino,
      'fecha': fecha.toIso8601String().split('T')[0],
      'hora': hora,
      'precio': precio,
      'asientos_disponibles': asientosDisponibles,
      'asientos_ocupados': asientosOcupados,
      'estado': estado,
      'vehiculo': vehiculoId,
    };
  }
}
