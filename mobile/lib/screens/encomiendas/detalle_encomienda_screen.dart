import 'package:flutter/material.dart';
import 'package:mobile/services/encomienda_service.dart';
import 'package:mobile/models/encomienda_model.dart'; // AGREGAR ESTE IMPORT
import 'package:mobile/widgets/neumorphic_card.dart';

class DetalleEncomiendaScreen extends StatefulWidget {
  final Encomienda encomienda; // CAMBIAR de Map a Encomienda

  const DetalleEncomiendaScreen({super.key, required this.encomienda});

  @override
  State<DetalleEncomiendaScreen> createState() => _DetalleEncomiendaScreenState();
}

class _DetalleEncomiendaScreenState extends State<DetalleEncomiendaScreen> {
  final EncomiendaService _encomiendaService = EncomiendaService();
  late Encomienda _encomienda; // CAMBIAR a Encomienda
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

  @override
  Widget build(BuildContext context) {
    final estado = _encomienda.estado; // CAMBIAR
    final codigo = _encomienda.codigoSeguimiento; // CAMBIAR
    final precio = _encomienda.precio; // CAMBIAR

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
                            'Bs. ${precio.toStringAsFixed(2)}', // CAMBIAR
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
                      _buildInfoItem('Nombre', _encomienda.remitenteNombre), // CAMBIAR
                      _buildInfoItem('Teléfono', _encomienda.remitenteTelefono), // CAMBIAR
                      if (_encomienda.remitenteDireccion != null)
                        _buildInfoItem('Dirección', _encomienda.remitenteDireccion!), // CAMBIAR
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Información del destinatario
                  _buildInfoSeccion(
                    'Destinatario',
                    Icons.person,
                    [
                      _buildInfoItem('Nombre', _encomienda.destinatarioNombre), // CAMBIAR
                      _buildInfoItem('Teléfono', _encomienda.destinatarioTelefono), // CAMBIAR
                      _buildInfoItem('Ciudad', _encomienda.destinoCiudad), // CAMBIAR
                      _buildInfoItem('Dirección', _encomienda.destinoDireccion), // CAMBIAR
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Detalles del paquete
                  _buildInfoSeccion(
                    'Detalles del Paquete',
                    Icons.inventory_2,
                    [
                      _buildInfoItem('Descripción', _encomienda.descripcion), // CAMBIAR
                      _buildInfoItem('Peso', '${_encomienda.peso} kg'), // CAMBIAR
                    ],
                  ),

                  const SizedBox(height: 20),

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

  Widget _buildSeguimientoItem(dynamic seguimiento) {
    // Manejar si seguimiento es Map o String
    final evento = seguimiento is Map ? seguimiento['evento'] ?? '' : seguimiento.toString();
    final descripcion = seguimiento is Map ? seguimiento['descripcion'] : null;
    final fecha = seguimiento is Map ? seguimiento['fecha'] : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            evento,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (descripcion != null) ...[
            const SizedBox(height: 4),
            Text(
              descripcion,
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
          ],
          if (fecha != null) ...[
            const SizedBox(height: 4),
            Text(
              _formatearFecha(fecha),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ],
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