  class CrearEncomiendaRequest {
  final String remitenteNombre;
  final String remitenteTelefono;
  final String? remitenteDireccion;
  final String destinatarioNombre;
  final String destinatarioTelefono;
  final String destinoCiudad;
  final String destinoDireccion;
  final String descripcion;
  final double peso;
  final String metodoPago;

  CrearEncomiendaRequest({
    required this.remitenteNombre,
    required this.remitenteTelefono,
    this.remitenteDireccion,
    required this.destinatarioNombre,
    required this.destinatarioTelefono,
    required this.destinoCiudad,
    required this.destinoDireccion,
    required this.descripcion,
    required this.peso,
    this.metodoPago = 'efectivo',
  });

  Map<String, dynamic> toJson() {
    return {
      'remitente_nombre': remitenteNombre,
      'remitente_telefono': remitenteTelefono,
      'remitente_direccion': remitenteDireccion ?? '',
      'destinatario_nombre': destinatarioNombre,
      'destinatario_telefono': destinatarioTelefono,
      'destino_ciudad': destinoCiudad,
      'destino_direccion': destinoDireccion,
      'descripcion': descripcion,
      'peso': peso,
      'metodo_pago': metodoPago,
    };
  }

  // Validaciones mejoradas
  bool get esValido {
    return remitenteNombre.isNotEmpty &&
        remitenteTelefono.isNotEmpty &&
        destinatarioNombre.isNotEmpty &&
        destinatarioTelefono.isNotEmpty &&
        destinoCiudad.isNotEmpty &&
        destinoDireccion.isNotEmpty &&
        descripcion.isNotEmpty &&
        peso > 0;
  }

  String? validar() {
    if (remitenteNombre.isEmpty) return 'El nombre del remitente es requerido';
    if (remitenteNombre.length < 2) return 'El nombre del remitente debe tener al menos 2 caracteres';
    
    if (remitenteTelefono.isEmpty) return 'El teléfono del remitente es requerido';
    if (!_esTelefonoValido(remitenteTelefono)) return 'El teléfono del remitente no es válido';
    
    if (destinatarioNombre.isEmpty) return 'El nombre del destinatario es requerido';
    if (destinatarioNombre.length < 2) return 'El nombre del destinatario debe tener al menos 2 caracteres';
    
    if (destinatarioTelefono.isEmpty) return 'El teléfono del destinatario es requerido';
    if (!_esTelefonoValido(destinatarioTelefono)) return 'El teléfono del destinatario no es válido';
    
    if (destinoCiudad.isEmpty) return 'La ciudad de destino es requerida';
    if (destinoDireccion.isEmpty) return 'La dirección de destino es requerida';
    if (destinoDireccion.length < 10) return 'La dirección de destino debe ser más específica';
    
    if (descripcion.isEmpty) return 'La descripción del paquete es requerida';
    if (descripcion.length < 10) return 'La descripción debe ser más detallada';
    
    if (peso <= 0) return 'El peso debe ser mayor a 0';
    if (peso > 100) return 'El peso no puede exceder los 100 kg';
    
    return null;
  }

  bool _esTelefonoValido(String telefono) {
    final regex = RegExp(r'^[0-9+\-\s()]{7,15}$');
    return regex.hasMatch(telefono);
  }

  // Calcular precio estimado - CORREGIDO (retorna double explícito)
  double calcularPrecioEstimado() {
    final preciosBase = {
      'La Paz': 20.0, 'Santa Cruz': 25.0, 'Cochabamba': 22.0, 'Oruro': 18.0,
      'Potosi': 20.0, 'Tarija': 23.0, 'Beni': 30.0, 'Pando': 35.0,
    };
    
    final base = preciosBase[destinoCiudad] ?? 25.0;
    final adicionalPeso = peso > 1 ? (peso - 1) * 5.0 : 0.0;
    return base + adicionalPeso; // ✅ Ahora retorna double explícitamente
  }

  // Método para crear copia con diferentes valores
  CrearEncomiendaRequest copyWith({
    String? remitenteNombre,
    String? remitenteTelefono,
    String? remitenteDireccion,
    String? destinatarioNombre,
    String? destinatarioTelefono,
    String? destinoCiudad,
    String? destinoDireccion,
    String? descripcion,
    double? peso,
    String? metodoPago,
  }) {
    return CrearEncomiendaRequest(
      remitenteNombre: remitenteNombre ?? this.remitenteNombre,
      remitenteTelefono: remitenteTelefono ?? this.remitenteTelefono,
      remitenteDireccion: remitenteDireccion ?? this.remitenteDireccion,
      destinatarioNombre: destinatarioNombre ?? this.destinatarioNombre,
      destinatarioTelefono: destinatarioTelefono ?? this.destinatarioTelefono,
      destinoCiudad: destinoCiudad ?? this.destinoCiudad,
      destinoDireccion: destinoDireccion ?? this.destinoDireccion,
      descripcion: descripcion ?? this.descripcion,
      peso: peso ?? this.peso,
      metodoPago: metodoPago ?? this.metodoPago,
    );
  }
}