import 'package:flutter/material.dart';
import 'package:mobile/services/encomienda_service.dart';
import 'package:mobile/models/encomienda_model.dart';
import 'package:mobile/models/encomienda_seguimiento_model.dart'; 
import 'package:mobile/widgets/neumorphic_card.dart';

class DetalleEncomiendaScreen extends StatefulWidget {
  final Encomienda encomienda;

  const DetalleEncomiendaScreen({super.key, required this.encomienda});

  @override
  State<DetalleEncomiendaScreen> createState() => _DetalleEncomiendaScreenState();
}

class _DetalleEncomiendaScreenState extends State<DetalleEncomiendaScreen> {
  final EncomiendaService _encomiendaService = EncomiendaService();
  late Encomienda _encomienda;
  bool _cargando = false;

  @override
  void initState() {
    super.initState();
    _encomienda = widget.encomienda;
  }

  void _actualizarSeguimiento() async {
    final codigo = _encomienda.codigoSeguimiento;
    if (codigo.isEmpty) return;

    setState(() {
      _cargando = true;
    });

    final result = await _encomiendaService.getSeguimiento(codigo);
    
    if (mounted) {
      setState(() {
        _cargando = false;
        if (result.success && result.data != null) {
          _encomienda = result.data!;
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error ?? 'Error al actualizar seguimiento'),
              backgroundColor: Colors.red,
            ),
          );
        }
      });
    }
  }

  Future<void> _pagarEncomienda() async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Pago'),
        content: Text(
          '¿Marcar encomienda ${_encomienda.codigoSeguimiento} como pagada en efectivo?\n\nMonto: ${_encomienda.precioFormateado}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Confirmar Pago'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      // Mostrar loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      try {
        final result = await _encomiendaService.marcarPagoEfectivo(_encomienda.id);
        
        // Ocultar loading
        Navigator.of(context).pop();
        
        if (result.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✅ ${result.message}'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _encomienda = result.data!;
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('❌ ${result.error}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        // Ocultar loading en caso de error
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Color _getEstadoColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'pendiente': return Colors.orange;
      case 'en_ruta': return Colors.blue;
      case 'entregado': return Colors.green;
      case 'cancelado': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getEstadoTexto(String estado) {
    switch (estado.toLowerCase()) {
      case 'pendiente': return 'Pendiente';
      case 'en_ruta': return 'En Ruta';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  }

  // ✅ NUEVO: Método para parsear fecha
  DateTime? _parseFecha(dynamic value) {
    if (value == null) return null;
    try {
      if (value is String) {
        return DateTime.parse(value);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

Widget _buildSeguimientoItem(dynamic seguimientoData) {
  // Convertir a EncomiendaSeguimiento si es posible
  final EncomiendaSeguimiento? seguimiento;
  
  if (seguimientoData is Map<String, dynamic>) {
    seguimiento = EncomiendaSeguimiento.fromJson(seguimientoData);
  } else if (seguimientoData is Map<dynamic, dynamic>) {
    // ✅ CORRECCIÓN: Convertir Map<dynamic, dynamic> a Map<String, dynamic>
    final Map<String, dynamic> jsonCorregido = {};
    seguimientoData.forEach((key, value) {
      jsonCorregido[key.toString()] = value;
    });
    seguimiento = EncomiendaSeguimiento.fromJson(jsonCorregido);
  } else {
    seguimiento = null;
  }

  final evento = seguimiento?.evento ?? 
      (seguimientoData is Map ? _obtenerValorMap(seguimientoData, 'evento', '') : 'Evento');
  final descripcion = seguimiento?.descripcion ?? 
      (seguimientoData is Map ? _obtenerValorMap(seguimientoData, 'descripcion', null) : null);
  final fecha = seguimiento?.fecha ?? 
      (seguimientoData is Map ? _parseFecha(_obtenerValorMap(seguimientoData, 'fecha', null)) : null);

  Color getColorPorTipo() {
    final tipo = seguimiento?.tipoEvento ?? 'general';
    switch (tipo) {
      case 'entrega': return Colors.green;
      case 'transito': return Colors.blue;
      case 'registro': return Colors.orange;
      case 'cancelacion': return Colors.red;
      default: return Colors.grey;
    }
  }

  return Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: getColorPorTipo().withOpacity(0.1),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: getColorPorTipo().withOpacity(0.3)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              _getIconPorTipo(seguimiento?.tipoEvento),
              color: getColorPorTipo(),
              size: 16,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                evento,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: getColorPorTipo(),
                ),
              ),
            ),
          ],
        ),
        if (descripcion != null) ...[
          const SizedBox(height: 4),
          Text(
            descripcion,
            style: TextStyle(
              color: Colors.grey.shade700,
            ),
          ),
        ],
        if (seguimiento?.tieneUbicacion == true) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.location_on, size: 12, color: Colors.grey.shade600),
              const SizedBox(width: 4),
              Text(
                seguimiento!.ubicacion!,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 4),
        Text(
          seguimiento?.fechaFormateada ?? _formatearFecha(fecha?.toString() ?? ''),
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      ],
    ),
  );
}

// ✅ NUEVO: Método helper para obtener valores de Map de forma segura
dynamic _obtenerValorMap(Map<dynamic, dynamic> map, String key, dynamic defaultValue) {
  try {
    return map[key] ?? defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

  // ✅ NUEVO: Método para obtener icono según tipo de evento
  IconData _getIconPorTipo(String? tipo) {
    switch (tipo) {
      case 'entrega': return Icons.check_circle;
      case 'transito': return Icons.local_shipping;
      case 'registro': return Icons.assignment;
      case 'cancelacion': return Icons.cancel;
      default: return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final estado = _encomienda.estado;
    final codigo = _encomienda.codigoSeguimiento;
    final precio = _encomienda.precio;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Encomienda'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _actualizarSeguimiento,
          ),
        ],
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Header con estado y código
                  NeumorphicCard(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _getEstadoColor(estado).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.local_shipping,
                              color: _getEstadoColor(estado),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  codigo,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  _getEstadoTexto(estado),
                                  style: TextStyle(
                                    color: _getEstadoColor(estado),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            'Bs. ${precio.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Información del remitente
                  _buildInfoSeccion(
                    'Remitente',
                    Icons.person,
                    [
                      _buildInfoItem('Nombre', _encomienda.remitenteNombre),
                      _buildInfoItem('Teléfono', _encomienda.remitenteTelefono),
                      if (_encomienda.remitenteDireccion != null)
                        _buildInfoItem('Dirección', _encomienda.remitenteDireccion!),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Información del destinatario
                  _buildInfoSeccion(
                    'Destinatario',
                    Icons.person,
                    [
                      _buildInfoItem('Nombre', _encomienda.destinatarioNombre),
                      _buildInfoItem('Teléfono', _encomienda.destinatarioTelefono),
                      _buildInfoItem('Ciudad', _encomienda.destinoCiudad),
                      _buildInfoItem('Dirección', _encomienda.destinoDireccion),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Detalles del paquete
                  _buildInfoSeccion(
                    'Detalles del Paquete',
                    Icons.inventory_2,
                    [
                      _buildInfoItem('Descripción', _encomienda.descripcion),
                      _buildInfoItem('Peso', '${_encomienda.peso} kg'),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ✅ BOTÓN DE PAGO EN EFECTIVO
                  if (_encomienda.puedePagar) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Column(
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.attach_money, color: Colors.green),
                              SizedBox(width: 8),
                              Text(
                                'Pago Pendiente',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Esta encomienda está pendiente de pago. Puedes marcarla como pagada en efectivo y luego llevar el paquete a nuestra sucursal.',
                           style: TextStyle(color: Color(0xFF2E7D32)),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _pagarEncomienda,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 50),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.attach_money),
                                SizedBox(width: 8),
                                Text('Pagar en Efectivo'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Seguimiento
                  if (_encomienda.seguimientos.isNotEmpty)
                    _buildSeguimiento(),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoSeccion(String titulo, IconData icon, List<Widget> children) {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.blue.shade600),
                const SizedBox(width: 8),
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSeguimiento() {
    final seguimientos = _encomienda.seguimientos;
    
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Seguimiento',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...seguimientos.map((seguimiento) => _buildSeguimientoItem(seguimiento)),
          ],
        ),
      ),
    );
  }

  String _formatearFecha(String fecha) {
    try {
      final date = DateTime.parse(fecha);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return fecha;
    }
  }
}