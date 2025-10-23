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
    });

    Map<String, dynamic> toJson() {
      return {
        'remitente_nombre': remitenteNombre,
        'remitente_telefono': remitenteTelefono,
        if (remitenteDireccion != null) 'remitente_direccion': remitenteDireccion,
        'destinatario_nombre': destinatarioNombre,
        'destinatario_telefono': destinatarioTelefono,
        'destino_ciudad': destinoCiudad,
        'destino_direccion': destinoDireccion,
        'descripcion': descripcion,
        'peso': peso,
      };
    }

    // Validaciones
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
      if (remitenteTelefono.isEmpty) return 'El teléfono del remitente es requerido';
      if (destinatarioNombre.isEmpty) return 'El nombre del destinatario es requerido';
      if (destinatarioTelefono.isEmpty) return 'El teléfono del destinatario es requerido';
      if (destinoCiudad.isEmpty) return 'La ciudad de destino es requerida';
      if (destinoDireccion.isEmpty) return 'La dirección de destino es requerida';
      if (descripcion.isEmpty) return 'La descripción del paquete es requerida';
      if (peso <= 0) return 'El peso debe ser mayor a 0';
      return null;
    }
  }