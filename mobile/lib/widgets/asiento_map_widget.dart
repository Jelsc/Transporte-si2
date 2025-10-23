// lib/widgets/asiento_map_widget.dart
import 'package:flutter/material.dart';
import '../models/asiento_model.dart';

class AsientoMapWidget extends StatefulWidget {
  final List<Asiento> asientos;
  final Function(List<Asiento>) onAsientosSeleccionadosCambiado;

  const AsientoMapWidget({
    Key? key,
    required this.asientos,
    required this.onAsientosSeleccionadosCambiado,
  }) : super(key: key);

  @override
  State<AsientoMapWidget> createState() => _AsientoMapWidgetState();
}

class _AsientoMapWidgetState extends State<AsientoMapWidget> {
  final List<Asiento> _asientosSeleccionados = [];

  @override
  Widget build(BuildContext context) {
    // ✅ ORDENAR ASIENTOS POR NÚMERO
    final asientosOrdenados = _ordenarAsientos(widget.asientos);

    return Column(
      children: [
        // ✅ CABECERA DEL BUS
        _buildCabeceraBus(),

        // ✅ LEYENDA
        _buildLeyenda(),

        // ✅ MAPA DE ASIENTOS REALISTA
        Expanded(child: _buildLayoutBusRealista(asientosOrdenados)),

        // ✅ CONTADOR DE SELECCIONADOS
        _buildContadorSeleccionados(),
      ],
    );
  }

  // ✅ ORDENAR ASIENTOS POR NÚMERO
  List<Asiento> _ordenarAsientos(List<Asiento> asientos) {
    return asientos.toList()..sort((a, b) {
      final numA = int.tryParse(a.numero) ?? 0;
      final numB = int.tryParse(b.numero) ?? 0;
      return numA.compareTo(numB);
    });
  }

  Widget _buildCabeceraBus() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade700, Colors.blue.shade900],
        ),
      ),
      child: Column(
        children: [
          Icon(Icons.directions_bus, size: 40, color: Colors.white),
          SizedBox(height: 8),
          Text(
            'FRENTE DEL BUS',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeyenda() {
    return Container(
      padding: EdgeInsets.all(12),
      color: Colors.grey[50],
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildItemLeyenda(
            Colors.green.shade400,
            'Disponible',
            Icons.event_seat,
          ),
          _buildItemLeyenda(
            Colors.blue.shade400,
            'Seleccionado',
            Icons.check_circle,
          ),
          _buildItemLeyenda(Colors.red.shade400, 'Ocupado', Icons.block),
          _buildItemLeyenda(
            Colors.orange.shade400,
            'Pasillo',
            Icons.directions_walk,
          ),
        ],
      ),
    );
  }

  Widget _buildItemLeyenda(Color color, String texto, IconData icono) {
    return Row(
      children: [
        Icon(icono, color: color, size: 16),
        SizedBox(width: 4),
        Text(
          texto,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _buildLayoutBusRealista(List<Asiento> asientos) {
    // Dividir asientos en filas de 2 (disposición 2-2 típica de bus)
    final filas = <List<Asiento>>[];
    for (int i = 0; i < asientos.length; i += 2) {
      final fin = i + 2;
      if (fin <= asientos.length) {
        filas.add(asientos.sublist(i, fin));
      } else {
        filas.add([asientos[i]]);
      }
    }

    return Container(
      margin: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: ListView.builder(
        itemCount: filas.length,
        itemBuilder: (context, filaIndex) {
          final fila = filas[filaIndex];
          return _buildFilaBus(
            asientos: fila,
            numeroFila: filaIndex + 1,
            esUltimaFila: filaIndex == filas.length - 1,
          );
        },
      ),
    );
  }

  Widget _buildFilaBus({
    required List<Asiento> asientos,
    required int numeroFila,
    required bool esUltimaFila,
  }) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          // ✅ ASIENTO IZQUIERDO
          Expanded(
            child: asientos.length > 0
                ? _buildAsientoRealista(asientos[0], 'Izquierdo')
                : _buildEspacioVacio(),
          ),

          // ✅ PASILLO CON NÚMERO DE FILA
          Container(
            width: 50,
            margin: EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.orange.shade300, width: 2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'F$numeroFila',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade800,
                  ),
                ),
                Icon(
                  Icons.directions_walk,
                  color: Colors.orange.shade600,
                  size: 16,
                ),
              ],
            ),
          ),

          // ✅ ASIENTO DERECHO
          Expanded(
            child: asientos.length > 1
                ? _buildAsientoRealista(asientos[1], 'Derecho')
                : _buildEspacioVacio(),
          ),
        ],
      ),
    );
  }

  Widget _buildAsientoRealista(Asiento asiento, String posicion) {
    final bool seleccionado = _asientosSeleccionados.contains(asiento);
    final bool ocupado = !asiento.estaDisponible;

    return GestureDetector(
      onTap: ocupado ? null : () => _toggleAsiento(asiento),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 4),
        padding: EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: _obtenerColorAsientoRealista(asiento),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _obtenerBordeAsiento(asiento), width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 2,
              offset: Offset(1, 1),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icono según estado
            Icon(
              ocupado
                  ? Icons.block
                  : seleccionado
                  ? Icons.check_circle
                  : Icons.event_seat,
              color: _obtenerColorIcono(asiento),
              size: 20,
            ),

            SizedBox(height: 4),

            // Número del asiento
            Text(
              asiento.numero,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: _obtenerColorTexto(asiento),
              ),
            ),

            SizedBox(height: 2),

            // Indicador de posición (opcional)
            Text(
              posicion == 'Izquierdo' ? 'I' : 'D',
              style: TextStyle(
                fontSize: 10,
                color: _obtenerColorTexto(asiento).withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEspacioVacio() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(border: Border.all(color: Colors.transparent)),
      child: Center(
        child: Text('---', style: TextStyle(color: Colors.grey)),
      ),
    );
  }

  Widget _buildContadorSeleccionados() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        border: Border(top: BorderSide(color: Colors.blue.shade200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_seat, color: Colors.blue, size: 16),
          SizedBox(width: 8),
          Text(
            '${_asientosSeleccionados.length} asiento(s) seleccionado(s)',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade800,
            ),
          ),
        ],
      ),
    );
  }

  // ✅ MÉTODOS DE APOYO PARA COLORES
  Color _obtenerColorAsientoRealista(Asiento asiento) {
    if (!asiento.estaDisponible) {
      return Colors.red.shade100; // Ocupado
    } else if (_asientosSeleccionados.contains(asiento)) {
      return Colors.blue.shade100; // Seleccionado
    } else {
      return Colors.green.shade100; // Disponible
    }
  }

  Color _obtenerBordeAsiento(Asiento asiento) {
    if (!asiento.estaDisponible) {
      return Colors.red.shade400;
    } else if (_asientosSeleccionados.contains(asiento)) {
      return Colors.blue.shade400;
    } else {
      return Colors.green.shade400;
    }
  }

  Color _obtenerColorIcono(Asiento asiento) {
    if (!asiento.estaDisponible) {
      return Colors.red.shade600;
    } else if (_asientosSeleccionados.contains(asiento)) {
      return Colors.blue.shade600;
    } else {
      return Colors.green.shade600;
    }
  }

  Color _obtenerColorTexto(Asiento asiento) {
    if (!asiento.estaDisponible) {
      return Colors.red.shade800;
    } else if (_asientosSeleccionados.contains(asiento)) {
      return Colors.blue.shade800;
    } else {
      return Colors.green.shade800;
    }
  }

  void _toggleAsiento(Asiento asiento) {
    if (!asiento.estaDisponible) return;

    setState(() {
      if (_asientosSeleccionados.contains(asiento)) {
        _asientosSeleccionados.remove(asiento);
      } else {
        _asientosSeleccionados.add(asiento);
      }
      widget.onAsientosSeleccionadosCambiado(_asientosSeleccionados);
    });
  }
}
