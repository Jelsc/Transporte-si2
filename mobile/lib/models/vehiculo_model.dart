// lib/models/vehiculo_model.dart
class Vehiculo {
  final int id;
  final String nombre;
  final String placa;
  final String tipoVehiculo;
  final int capacidadPasajeros;
  final String estado;

  Vehiculo({
    required this.id,
    required this.nombre,
    required this.placa,
    required this.tipoVehiculo,
    required this.capacidadPasajeros,
    required this.estado,
  });

  factory Vehiculo.fromJson(Map<String, dynamic> json) {
    return Vehiculo(
      id: json['id'],
      nombre: json['nombre'],
      placa: json['placa'],
      tipoVehiculo: json['tipo_vehiculo'],
      capacidadPasajeros: json['capacidad_pasajeros'],
      estado: json['estado'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'placa': placa,
      'tipo_vehiculo': tipoVehiculo,
      'capacidad_pasajeros': capacidadPasajeros,
      'estado': estado,
    };
  }
}
