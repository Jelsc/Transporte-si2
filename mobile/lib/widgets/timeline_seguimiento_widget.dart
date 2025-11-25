import 'package:flutter/material.dart';
import '../models/encomienda_seguimiento_model.dart';
import '../models/encomienda_model.dart';

class TimelineSeguimientoWidget extends StatelessWidget {
  final List<dynamic> seguimientos;
  final String estadoActual;
  final bool mostrarEstadoActual;

  const TimelineSeguimientoWidget({
    super.key,
    required this.seguimientos,
    required this.estadoActual,
    this.mostrarEstadoActual = true,
  });

  @override
  Widget build(BuildContext context) {
    if (seguimientos.isEmpty && !mostrarEstadoActual) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'No hay seguimientos disponibles',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    final seguimientosOrdenados = _procesarSeguimientos();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (mostrarEstadoActual) ...[
          _buildEstadoActual(context),
          const SizedBox(height: 24),
        ],
        ...seguimientosOrdenados.map((item) => _buildTimelineItem(
          context,
          item['seguimiento'],
          item['esCompletado'],
          item['esActual'],
          item['esUltimo'],
        )),
      ],
    );
  }

  List<Map<String, dynamic>> _procesarSeguimientos() {
    final List<Map<String, dynamic>> procesados = [];
    
    for (var i = 0; i < seguimientos.length; i++) {
      final seguimientoData = seguimientos[i];
      EncomiendaSeguimiento? seguimiento;
      
      try {
        if (seguimientoData is Map<String, dynamic>) {
          seguimiento = EncomiendaSeguimiento.fromJson(seguimientoData);
        } else if (seguimientoData is Map) {
          final Map<String, dynamic> jsonCorregido = {};
          seguimientoData.forEach((key, value) {
            jsonCorregido[key.toString()] = value;
          });
          seguimiento = EncomiendaSeguimiento.fromJson(jsonCorregido);
        }
      } catch (e) {
        debugPrint('Error procesando seguimiento: $e');
      }

      if (seguimiento != null) {
        final tipoEvento = _determinarTipoEvento(seguimiento.evento, estadoActual);
        final esCompletado = _esEstadoCompletado(tipoEvento, estadoActual);
        final esActual = i == seguimientos.length - 1;
        final esUltimo = i == seguimientos.length - 1;

        procesados.add({
          'seguimiento': seguimiento,
          'tipoEvento': tipoEvento,
          'esCompletado': esCompletado,
          'esActual': esActual,
          'esUltimo': esUltimo,
        });
      }
    }

    return procesados;
  }

  String _determinarTipoEvento(String evento, String estadoActual) {
    final eventoLower = evento.toLowerCase();
    
    if (eventoLower.contains('entreg') || estadoActual == Encomienda.kEstadoEntregado) {
      return 'entrega';
    }
    if (eventoLower.contains('ruta') || eventoLower.contains('transit') || estadoActual == Encomienda.kEstadoEnRuta) {
      return 'transito';
    }
    if (eventoLower.contains('registr') || eventoLower.contains('cread') || estadoActual == Encomienda.kEstadoPendiente) {
      return 'registro';
    }
    if (eventoLower.contains('cancel') || estadoActual == Encomienda.kEstadoCancelado) {
      return 'cancelacion';
    }
    return 'general';
  }

  bool _esEstadoCompletado(String tipoEvento, String estadoActual) {
    switch (estadoActual) {
      case Encomienda.kEstadoEntregado:
        return true;
      case Encomienda.kEstadoEnRuta:
        return tipoEvento == 'registro';
      case Encomienda.kEstadoPendiente:
        return false;
      case Encomienda.kEstadoCancelado:
        return tipoEvento == 'cancelacion';
      default:
        return false;
    }
  }

  Widget _buildEstadoActual(BuildContext context) {
    final color = _getColorPorEstado(estadoActual);
    final icon = _getIconPorEstado(estadoActual);
    final texto = _getTextoEstado(estadoActual);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Estado Actual',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  texto,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(
    BuildContext context,
    EncomiendaSeguimiento seguimiento,
    bool esCompletado,
    bool esActual,
    bool esUltimo,
  ) {
    final tipoEvento = _determinarTipoEvento(seguimiento.evento, estadoActual);
    final color = _getColorPorTipo(tipoEvento);
    final icon = _getIconPorTipo(tipoEvento);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTimelineIndicator(color, esCompletado, esActual, esUltimo),
        const SizedBox(width: 16),
        Expanded(
          child: _buildTimelineContent(
            seguimiento,
            color,
            icon,
            esCompletado,
            esActual,
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineIndicator(Color color, bool esCompletado, bool esActual, bool esUltimo) {
    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: esCompletado || esActual ? color : Colors.grey.shade300,
            shape: BoxShape.circle,
            border: Border.all(
              color: esActual ? color : Colors.white,
              width: 3,
            ),
          ),
          child: esCompletado || esActual
              ? Icon(
                  Icons.check,
                  size: 14,
                  color: Colors.white,
                )
              : null,
        ),
        if (!esUltimo)
          Container(
            width: 2,
            height: 60,
            color: esCompletado ? color : Colors.grey.shade300,
            margin: const EdgeInsets.symmetric(vertical: 4),
          ),
      ],
    );
  }

  Widget _buildTimelineContent(
    EncomiendaSeguimiento seguimiento,
    Color color,
    IconData icon,
    bool esCompletado,
    bool esActual,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: esActual ? color.withOpacity(0.1) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: esActual ? color.withOpacity(0.3) : Colors.grey.shade200,
          width: esActual ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  seguimiento.evento,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: esActual ? FontWeight.bold : FontWeight.w600,
                    color: esActual ? color : Colors.grey.shade800,
                  ),
                ),
              ),
              if (esActual)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'ACTUAL',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          if (seguimiento.descripcion.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              seguimiento.descripcion,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
              ),
            ),
          ],
          if (seguimiento.tieneUbicacion) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    seguimiento.ubicacion!,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: Colors.grey.shade500),
              const SizedBox(width: 4),
              Text(
                seguimiento.fechaFormateada,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getColorPorEstado(String estado) {
    switch (estado.toLowerCase()) {
      case Encomienda.kEstadoPendiente:
        return Colors.orange;
      case Encomienda.kEstadoEnRuta:
        return Colors.blue;
      case Encomienda.kEstadoEntregado:
        return Colors.green;
      case Encomienda.kEstadoCancelado:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getIconPorEstado(String estado) {
    switch (estado.toLowerCase()) {
      case Encomienda.kEstadoPendiente:
        return Icons.pending;
      case Encomienda.kEstadoEnRuta:
        return Icons.local_shipping;
      case Encomienda.kEstadoEntregado:
        return Icons.check_circle;
      case Encomienda.kEstadoCancelado:
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }

  String _getTextoEstado(String estado) {
    switch (estado.toLowerCase()) {
      case Encomienda.kEstadoPendiente:
        return 'Pendiente';
      case Encomienda.kEstadoEnRuta:
        return 'En Ruta';
      case Encomienda.kEstadoEntregado:
        return 'Entregado';
      case Encomienda.kEstadoCancelado:
        return 'Cancelado';
      default:
        return estado;
    }
  }

  Color _getColorPorTipo(String tipo) {
    switch (tipo) {
      case 'entrega':
        return Colors.green;
      case 'transito':
        return Colors.blue;
      case 'registro':
        return Colors.orange;
      case 'cancelacion':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getIconPorTipo(String tipo) {
    switch (tipo) {
      case 'entrega':
        return Icons.check_circle;
      case 'transito':
        return Icons.local_shipping;
      case 'registro':
        return Icons.assignment;
      case 'cancelacion':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }
}

