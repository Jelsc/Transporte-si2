// lib/screens/client/seleccion_asientos_screen.dart
import 'package:flutter/material.dart';
import '../../models/viaje_model.dart';
import '../../models/asiento_model.dart';
import '../../services/viajes_service.dart';
import '../../services/reserva_service.dart';
import '../../widgets/asiento_map_widget.dart'; // Lo crearemos después
import '../../models/reserva_model.dart';
import 'checkout_screen.dart';

class SeleccionAsientosScreen extends StatefulWidget {
  final Viaje viaje;

  const SeleccionAsientosScreen({Key? key, required this.viaje})
    : super(key: key);

  @override
  State<SeleccionAsientosScreen> createState() =>
      _SeleccionAsientosScreenState();
}

class _SeleccionAsientosScreenState extends State<SeleccionAsientosScreen> {
  final ViajesService _viajesService = ViajesService();
  final ReservaService _reservaService = ReservaService();

  List<Asiento> _asientos = [];
  List<Asiento> _asientosSeleccionados = [];
  bool _cargando = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _cargarAsientos();
  }

  Future<void> _cargarAsientos() async {
    try {
      final resultado = await _viajesService.getAsientos(widget.viaje.id);

      if (resultado['success'] == true) {
        setState(() {
          _asientos = resultado['data'];
          _cargando = false;
        });
      } else {
        setState(() {
          _error = resultado['error'] ?? 'Error al cargar asientos';
          _cargando = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _cargando = false;
      });
    }
  }

  void _onAsientosSeleccionadosCambiado(List<Asiento> asientos) {
    setState(() {
      _asientosSeleccionados = asientos;
    });
  }

  Future<void> _procederAlPago() async {
    if (_asientosSeleccionados.isEmpty) {
      _mostrarError('Selecciona al menos un asiento');
      return;
    }

    // Verificar disponibilidad antes de proceder
    final resultadoVerificacion = await _viajesService.verificarDisponibilidad(
      viajeId: widget.viaje.id,
      asientosIds: _asientosSeleccionados.map((a) => a.id).toList(),
    );

    if (resultadoVerificacion['success'] != true ||
        resultadoVerificacion['data']?['disponible'] != true) {
      _mostrarError(
        'Algunos asientos ya no están disponibles. Por favor, selecciona otros.',
      );
      await _cargarAsientos(); // Recargar asientos
      return;
    }

    // Crear reserva temporal
    final montoTotal = widget.viaje.precio * _asientosSeleccionados.length;

    try {
      final resultadoReserva = await _reservaService.crearReservaTemporal(
        viajeId: widget.viaje.id,
        asientosIds: _asientosSeleccionados.map((a) => a.id).toList(),
        montoTotal: montoTotal,
      );

      if (resultadoReserva['success'] == true) {
        final reserva = resultadoReserva['data'] as Reserva;

        // Navegar a la pantalla de checkout
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                CheckoutScreen(reserva: reserva, viaje: widget.viaje),
          ),
        );
      } else {
        _mostrarError(resultadoReserva['error'] ?? 'Error al crear reserva');
      }
    } catch (e) {
      _mostrarError('Error: $e');
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje), backgroundColor: Colors.red),
    );
  }

  double _calcularTotal() {
    return widget.viaje.precio * _asientosSeleccionados.length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Seleccionar Asientos'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _cargando
          ? _buildCargando()
          : _error.isNotEmpty
          ? _buildError()
          : _buildContenido(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildCargando() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Cargando asientos...'),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(
            _error,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
          SizedBox(height: 16),
          ElevatedButton(onPressed: _cargarAsientos, child: Text('Reintentar')),
        ],
      ),
    );
  }

  Widget _buildContenido() {
    return Column(
      children: [
        // Información del viaje
        _buildInfoViaje(),

        // Mapa de asientos
        Expanded(
          child: AsientoMapWidget(
            asientos: _asientos,
            onAsientosSeleccionadosCambiado: _onAsientosSeleccionadosCambiado,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoViaje() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Row(
        children: [
          Icon(Icons.directions_bus, color: Colors.blue),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.viaje.origen} → ${widget.viaje.destino}',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                SizedBox(height: 4),
                Text(
                  '${_formatearFecha(widget.viaje.fecha)} • ${widget.viaje.hora}',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                SizedBox(height: 4),
                Text(
                  'Bs. ${widget.viaje.precio.toStringAsFixed(2)} por asiento',
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[300]!)),
        boxShadow: [
          BoxShadow(
            offset: Offset(0, -2),
            blurRadius: 4,
            color: Colors.black12,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${_asientosSeleccionados.length} asiento(s) seleccionado(s)',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Total: Bs. ${_calcularTotal().toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _asientosSeleccionados.isNotEmpty
                ? _procederAlPago
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: Text('Continuar al Pago'),
          ),
        ],
      ),
    );
  }

  String _formatearFecha(DateTime fecha) {
    return '${fecha.day}/${fecha.month}/${fecha.year}';
  }
}
