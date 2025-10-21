class TarifaEncomienda {
  final int id;
  final String ciudad;
  final double precioBase;
  final double precioKgAdicional;
  final bool activo;

  TarifaEncomienda({
    required this.id,
    required this.ciudad,
    required this.precioBase,
    required this.precioKgAdicional,
    required this.activo,
  });

  factory TarifaEncomienda.fromJson(Map<String, dynamic> json) {
    return TarifaEncomienda(
      id: json['id'] ?? 0,
      ciudad: json['ciudad'] ?? '',
      precioBase: _convertToDouble(json['precio_base']),
      precioKgAdicional: _convertToDouble(json['precio_kg_adicional']),
      activo: json['activo'] ?? true,
    );
  }

  static double _convertToDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is String) return double.tryParse(value) ?? 0.0;
    if (value is int) return value.toDouble();
    if (value is double) return value;
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ciudad': ciudad,
      'precio_base': precioBase,
      'precio_kg_adicional': precioKgAdicional,
      'activo': activo,
    };
  }

  // Método para calcular precio total
  double calcularPrecioTotal(double peso) {
    if (peso <= 1.0) {
      return precioBase;
    } else {
      final kgAdicionales = peso - 1.0;
      return precioBase + (kgAdicionales * precioKgAdicional);
    }
  }

  String get precioBaseFormateado => 'Bs. ${precioBase.toStringAsFixed(2)}';
  String get precioKgAdicionalFormateado => 'Bs. ${precioKgAdicional.toStringAsFixed(2)}';
}