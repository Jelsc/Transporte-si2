// lib/models/asiento_model.dart
import 'viaje_model.dart';

class Asiento {
  final int id;
  final String numero;
  final String estado;
  final int viajeId;
  final Viaje? viaje;
  final int? reservaTemporalId;
  final bool estaDisponible;

  Asiento({
    required this.id,
    required this.numero,
    required this.estado,
    required this.viajeId,
    this.viaje,
    this.reservaTemporalId,
  }) : estaDisponible = estado == 'libre';

  factory Asiento.fromJson(Map<String, dynamic> json) {
    // ✅ MANEJO ROBUSTO DE ID
    int id = 0;
    if (json['id'] != null) {
      if (json['id'] is String) {
        id = int.tryParse(json['id']) ?? 0;
      } else {
        id = (json['id'] as num).toInt();
      }
    }

    // ✅ MANEJO ROBUSTO DE VIAJE
    int viajeId = 0;
    Viaje? viajeObj;

    if (json['viaje'] is Map) {
      final viajeData = json['viaje'] as Map<String, dynamic>;

      // Extraer ID del viaje
      if (viajeData['id'] != null) {
        if (viajeData['id'] is String) {
          viajeId = int.tryParse(viajeData['id']) ?? 0;
        } else {
          viajeId = (viajeData['id'] as num).toInt();
        }
      }

      // Crear objeto Viaje
      try {
        viajeObj = Viaje.fromJson(viajeData);
      } catch (e) {
        print('⚠️ [AsientoModel] Error creando Viaje: $e');
      }
    } else if (json['viaje'] is num) {
      viajeId = (json['viaje'] as num).toInt();
    } else if (json['viaje'] is String) {
      viajeId = int.tryParse(json['viaje']) ?? 0;
    }

    // ✅ MANEJO ROBUSTO DE RESERVA TEMPORAL
    int? reservaTemporalId;
    if (json['reserva_temporal'] != null) {
      if (json['reserva_temporal'] is String) {
        reservaTemporalId = int.tryParse(json['reserva_temporal']);
      } else {
        reservaTemporalId = (json['reserva_temporal'] as num).toInt();
      }
    }

    return Asiento(
      id: id,
      numero: json['numero']?.toString() ?? '0',
      estado: json['estado'] ?? 'libre',
      viajeId: viajeId,
      viaje: viajeObj,
      reservaTemporalId: reservaTemporalId,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'numero': numero,
      'estado': estado,
      'viaje': viajeId,
      'viaje_object': viaje?.toJson(),
      'reserva_temporal': reservaTemporalId,
    };
  }
}
