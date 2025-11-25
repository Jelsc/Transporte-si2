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
  final double precio;
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
    required this.precio,
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
      'precio': precio,
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
        peso > 0 &&
        precio > 0;
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
    
    // Validación mejorada de dirección: más flexible pero aún válida
    final direccionError = _validarDireccion(destinoDireccion);
    if (direccionError != null) return direccionError;
    
    if (descripcion.isEmpty) return 'La descripción del paquete es requerida';
    
    // Validación mejorada de descripción: más flexible pero aún válida
    final descripcionError = _validarDescripcion(descripcion);
    if (descripcionError != null) return descripcionError;
    
    if (peso <= 0) return 'El peso debe ser mayor a 0';
    if (peso > 100) return 'El peso no puede exceder los 100 kg';
    if (precio <= 0) return 'El precio debe ser mayor a 0';
    
    return null;
  }

  /// Valida que la dirección sea razonable sin ser demasiado restrictiva
  String? _validarDireccion(String direccion) {
    // Eliminar espacios al inicio y final
    final direccionTrim = direccion.trim();
    
    // Verificar que no esté vacío después de trim
    if (direccionTrim.isEmpty) {
      return 'La dirección de destino es requerida';
    }
    
    // Verificar longitud mínima razonable (3 caracteres)
    if (direccionTrim.length < 3) {
      return 'La dirección debe tener al menos 3 caracteres';
    }
    
    // Verificar que tenga al menos una letra (no solo números o caracteres especiales)
    final tieneLetras = RegExp(r'[a-zA-ZÁÉÍÓÚÑáéíóúñ]').hasMatch(direccionTrim);
    if (!tieneLetras) {
      return 'La dirección debe contener al menos una letra';
    }
    
    // Verificar que no sea solo espacios repetidos
    final sinEspacios = direccionTrim.replaceAll(RegExp(r'\s+'), '');
    if (sinEspacios.length < 3) {
      return 'La dirección debe ser más específica';
    }
    
    return null;
  }

  /// Valida que la descripción sea razonable sin ser demasiado restrictiva
  String? _validarDescripcion(String descripcion) {
    // Eliminar espacios al inicio y final
    final descripcionTrim = descripcion.trim();
    
    // Verificar que no esté vacío después de trim
    if (descripcionTrim.isEmpty) {
      return 'La descripción del paquete es requerida';
    }
    
    // Verificar longitud mínima razonable (3 caracteres)
    if (descripcionTrim.length < 3) {
      return 'La descripción debe tener al menos 3 caracteres';
    }
    
    // Verificar que tenga al menos una letra o número (no solo caracteres especiales)
    final tieneContenido = RegExp(r'[a-zA-ZÁÉÍÓÚÑáéíóúñ0-9]').hasMatch(descripcionTrim);
    if (!tieneContenido) {
      return 'La descripción debe contener texto o números';
    }
    
    // Verificar que no sea solo espacios repetidos
    final sinEspacios = descripcionTrim.replaceAll(RegExp(r'\s+'), '');
    if (sinEspacios.length < 3) {
      return 'La descripción debe ser más específica';
    }
    
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
    double? precio,
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
      precio: precio ?? this.precio,
      metodoPago: metodoPago ?? this.metodoPago,
    );
  }
}