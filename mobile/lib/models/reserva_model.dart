// lib/models/reserva_model.dart
class Reserva {
  final int id;
  final String codigoReserva;
  final String
  estado; // 'pendiente_pago', 'confirmada', 'cancelada', 'expirada'
  final double total;
  final DateTime fechaReserva;
  final DateTime? fechaExpiracion;
  final int clienteId;
  final int? viajeId;
  final bool pagado;
  final List<ItemReserva> items;

  Reserva({
    required this.id,
    required this.codigoReserva,
    required this.estado,
    required this.total,
    required this.fechaReserva,
    this.fechaExpiracion,
    required this.clienteId,
    this.viajeId,
    required this.pagado,
    required this.items,
  });

  int get tiempoRestante {
    if (fechaExpiracion == null || estado != 'pendiente_pago') return 0;
    final now = DateTime.now();
    final diff = fechaExpiracion!.difference(now);
    return diff.inSeconds.clamp(0, 900); // 15 minutos máximo
  }

  bool get estaExpirada => tiempoRestante == 0 && estado == 'pendiente_pago';

  factory Reserva.fromJson(Map<String, dynamic> json) {
    return Reserva(
      id: _safeParseInt(json['id']),
      codigoReserva: json['codigo_reserva']?.toString() ?? '',
      estado: json['estado']?.toString() ?? 'pendiente_pago',
      total: _safeParseDouble(json['total']),
      fechaReserva: _safeParseDateTime(json['fecha_reserva']),
      fechaExpiracion: _safeParseDateTimeNullable(json['fecha_expiracion']),
      clienteId: _safeParseInt(json['cliente']),
      viajeId: _safeParseIntNullable(json['viaje']),
      pagado: _safeParseBool(json['pagado']),
      items: _safeParseItems(json['items']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'codigo_reserva': codigoReserva,
      'estado': estado,
      'total': total,
      'fecha_reserva': fechaReserva.toIso8601String(),
      'fecha_expiracion': fechaExpiracion?.toIso8601String(),
      'cliente': clienteId,
      'viaje': viajeId,
      'pagado': pagado,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }

  // ✅ MÉTODOS AUXILIARES PARA PARSING SEGURO
  static int _safeParseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is num) return value.toInt();
    return 0;
  }

  static int? _safeParseIntNullable(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    if (value is num) return value.toInt();
    return null;
  }

  static double _safeParseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is String) return double.tryParse(value) ?? 0.0;
    if (value is num) return value.toDouble();
    return 0.0;
  }

  static DateTime _safeParseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  static DateTime? _safeParseDateTimeNullable(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static bool _safeParseBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is String) {
      return value.toLowerCase() == 'true' || value == '1';
    }
    if (value is num) return value == 1;
    return false;
  }

  static List<ItemReserva> _safeParseItems(dynamic value) {
    if (value == null) return [];
    if (value is! List) return [];
    try {
      return value
          .where((item) => item is Map<String, dynamic>)
          .map<ItemReserva>((item) => ItemReserva.fromJson(item))
          .toList();
    } catch (e) {
      print('❌ Error parseando items de reserva: $e');
      return [];
    }
  }
}

class ItemReserva {
  final int id;
  final int reservaId;
  final int asientoId;
  final double precio;
  final String numeroAsiento; // ✅ NUEVO CAMPO

  ItemReserva({
    required this.id,
    required this.reservaId,
    required this.asientoId,
    required this.precio,
    required this.numeroAsiento, // ✅ AGREGAR AL CONSTRUCTOR
  });

  factory ItemReserva.fromJson(Map<String, dynamic> json) {
    return ItemReserva(
      id: _safeParseInt(json['id']),
      reservaId: _safeParseInt(json['reserva']),
      asientoId: _safeParseInt(json['asiento']),
      precio: _safeParseDouble(json['precio']),
      numeroAsiento: _obtenerNumeroAsiento(json), // ✅ NUEVO MÉTODO
    );
  }

  // ✅ MÉTODO PARA OBTENER EL NÚMERO DEL ASIENTO
  static String _obtenerNumeroAsiento(Map<String, dynamic> json) {
    // 1. Si viene el objeto asiento completo (como en la respuesta que mostraste)
    if (json['asiento'] is Map<String, dynamic>) {
      final asientoData = json['asiento'] as Map<String, dynamic>;
      final numero = asientoData['numero']?.toString();
      if (numero != null && numero != 'null' && numero.isNotEmpty) {
        print('✅ [ItemReserva] Número del asiento encontrado: $numero');
        return numero;
      }
    }

    // 2. Si viene un campo directo numero_asiento
    if (json['numero_asiento'] != null) {
      final numero = json['numero_asiento'].toString();
      if (numero != 'null' && numero.isNotEmpty) {
        print(
          '✅ [ItemReserva] Número del asiento desde campo directo: $numero',
        );
        return numero;
      }
    }

    // 3. Si viene el número directamente en el JSON
    if (json['numero'] != null) {
      final numero = json['numero'].toString();
      if (numero != 'null' && numero.isNotEmpty) {
        print('✅ [ItemReserva] Número del asiento directo: $numero');
        return numero;
      }
    }

    // 4. Fallback: usar el ID (pero esto mostrará "Asiento 121", "Asiento 122")
    final asientoId = _safeParseInt(json['asiento']);
    final fallback = asientoId.toString();
    print('⚠️ [ItemReserva] Usando ID como fallback: $fallback');
    return fallback;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reserva': reservaId,
      'asiento': asientoId,
      'precio': precio,
      'numero_asiento': numeroAsiento, // ✅ INCLUIR EN JSON
    };
  }

  // ✅ MÉTODOS AUXILIARES PARA ItemReserva
  static int _safeParseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is num) return value.toInt();
    return 0;
  }

  static double _safeParseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is String) return double.tryParse(value) ?? 0.0;
    if (value is num) return value.toDouble();
    return 0.0;
  }

  @override
  String toString() {
    return 'ItemReserva{id: $id, asientoId: $asientoId, numeroAsiento: $numeroAsiento, precio: $precio}';
  }
}
