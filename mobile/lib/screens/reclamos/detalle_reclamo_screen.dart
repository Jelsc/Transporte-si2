import 'package:flutter/material.dart';
import '../../services/reclamo_service.dart';
import '../../widgets/neumorphic_card.dart';

class DetalleReclamoScreen extends StatefulWidget {
  final int reclamoId;

  const DetalleReclamoScreen({super.key, required this.reclamoId});

  @override
  State<DetalleReclamoScreen> createState() => _DetalleReclamoScreenState();
}

class _DetalleReclamoScreenState extends State<DetalleReclamoScreen> {
  final ReclamoService _reclamoService = ReclamoService();
  Reclamo? _reclamo;
  bool _isLoading = true;
  bool _enviandoComentario = false;
  final _comentarioController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarReclamo();
  }

  @override
  void dispose() {
    _comentarioController.dispose();
    super.dispose();
  }

  Future<void> _cargarReclamo() async {
    final response = await _reclamoService.getReclamo(widget.reclamoId);
    if (response.success && response.data != null) {
      setState(() {
        _reclamo = response.data!;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
      _mostrarError(response.error ?? 'Error al cargar reclamo');
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.red,
      ),
    );
  }

  Future<void> _agregarComentario() async {
    final mensaje = _comentarioController.text.trim();
    if (mensaje.isEmpty) {
      _mostrarError('Por favor escribe un mensaje');
      return;
    }

    setState(() {
      _enviandoComentario = true;
    });

    final response = await _reclamoService.agregarComentario(
      widget.reclamoId,
      mensaje,
    );

    setState(() {
      _enviandoComentario = false;
    });

    if (response.success && response.data != null) {
      _comentarioController.clear();
      _cargarReclamo(); // Recargar para obtener el nuevo comentario
    } else {
      _mostrarError(response.error ?? 'Error al agregar comentario');
    }
  }

  // MÉTODO BUILD QUE FALTABA
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text(_reclamo?.numeroReclamo ?? 'Cargando...'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarReclamo,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _cargarReclamo,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildHeader(),
                  const SizedBox(height: 16),
                  _buildAdjuntos(),
                  const SizedBox(height: 16),
                  _buildComentarios(),
                  const SizedBox(height: 16),
                  _buildInputComentario(),
                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader() {
    if (_reclamo == null) return const SizedBox();

    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildEstadoBadge(_reclamo!.estado, _reclamo!.estadoColor),
                const Spacer(),
                _buildPrioridadBadge(_reclamo!.prioridad, _reclamo!.prioridadColor),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              _reclamo!.titulo,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _reclamo!.descripcion,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade700,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              icon: Icons.category,
              label: 'Categoria',
              value: _reclamo!.categoriaNombre,
            ),
            if (_reclamo!.numeroGuia != null)
              _buildInfoRow(
                icon: Icons.confirmation_number,
                label: 'Numero de Guia',
                value: _reclamo!.numeroGuia!,
              ),
            if (_reclamo!.servicioRelacionado != null)
              _buildInfoRow(
                icon: Icons.directions_bus,
                label: 'Servicio',
                value: _reclamo!.servicioRelacionado!,
              ),
            _buildInfoRow(
              icon: Icons.person,
              label: 'Creado por',
              value: _reclamo!.usuarioNombre,
            ),
            if (_reclamo!.agenteNombre != null)
              _buildInfoRow(
                icon: Icons.support_agent,
                label: 'Agente asignado',
                value: _reclamo!.agenteNombre!,
              ),
            _buildInfoRow(
              icon: Icons.calendar_today,
              label: 'Fecha de creacion',
              value: _formatearFechaCompleta(_reclamo!.fechaCreacion),
            ),
            if (_reclamo!.fechaCierre != null)
              _buildInfoRow(
                icon: Icons.check_circle,
                label: 'Fecha de cierre',
                value: _formatearFechaCompleta(_reclamo!.fechaCierre!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadoBadge(String estado, String color) {
    final colorMap = {
      'orange': Colors.orange,
      'blue': Colors.blue,
      'green': Colors.green,
      'red': Colors.red,
    };
    
    final backgroundColor = colorMap[color] ?? Colors.grey;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: backgroundColor.withOpacity(0.3)),
      ),
      child: Text(
        _reclamo?.estadoDisplay.toUpperCase() ?? '',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: backgroundColor,
        ),
      ),
    );
  }

  Widget _buildPrioridadBadge(String prioridad, String color) {
    final colorMap = {
      'gray': Colors.grey,
      'blue': Colors.blue,
      'orange': Colors.orange,
      'red': Colors.red,
    };
    
    final textColor = colorMap[color] ?? Colors.grey;
    final icon = _getPrioridadIcon(prioridad);
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: textColor),
        const SizedBox(width: 4),
        Text(
          _reclamo?.prioridadDisplay.toUpperCase() ?? '',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
    );
  }

  IconData _getPrioridadIcon(String prioridad) {
    switch (prioridad) {
      case 'urgente':
        return Icons.warning;
      case 'alta':
        return Icons.arrow_upward;
      case 'media':
        return Icons.remove;
      case 'baja':
        return Icons.arrow_downward;
      default:
        return Icons.circle;
    }
  }

  Widget _buildAdjuntos() {
    if (_reclamo == null || _reclamo!.adjuntos.isEmpty) {
      return const SizedBox();
    }

    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Archivos Adjuntos',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _reclamo!.adjuntos.map((adjunto) {
                return _buildAdjuntoCard(adjunto);
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdjuntoCard(ReclamoAdjunto adjunto) {
    final icon = _getIconoPorTipo(adjunto.tipoArchivo);
    final color = _getColorPorTipo(adjunto.tipoArchivo);

    return Container(
      width: 100,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 8),
          Text(
            _truncarNombre(adjunto.nombreArchivo),
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  IconData _getIconoPorTipo(String tipo) {
    switch (tipo) {
      case 'imagen':
        return Icons.image;
      case 'pdf':
        return Icons.picture_as_pdf;
      default:
        return Icons.insert_drive_file;
    }
  }

  Color _getColorPorTipo(String tipo) {
    switch (tipo) {
      case 'imagen':
        return Colors.green;
      case 'pdf':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  String _truncarNombre(String nombre) {
    if (nombre.length <= 15) return nombre;
    return '${nombre.substring(0, 12)}...';
  }

  Widget _buildComentarios() {
    if (_reclamo == null) return const SizedBox();

    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Historial de Comentarios',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            if (_reclamo!.detalles.isEmpty)
              const Center(
                child: Text(
                  'No hay comentarios aun',
                  style: TextStyle(color: Colors.grey),
                ),
              )
            else
              Column(
                children: _reclamo!.detalles.map((detalle) {
                  return _buildComentarioCard(detalle);
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildComentarioCard(ReclamoDetalle detalle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.blue.shade100,
                radius: 16,
                child: Text(
                  detalle.autorNombre[0].toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  detalle.autorNombre,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                detalle.fechaFormateada,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            detalle.mensaje,
            style: const TextStyle(fontSize: 14, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildInputComentario() {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Agregar Comentario',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _comentarioController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Escribe tu comentario...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _enviandoComentario ? null : _agregarComentario,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _enviandoComentario
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Enviar Comentario',
                        style: TextStyle(color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // MÉTODO QUE FALTABA: _formatearFechaCompleta
  String _formatearFechaCompleta(DateTime fecha) {
    return '${fecha.day}/${fecha.month}/${fecha.year} ${fecha.hour}:${fecha.minute.toString().padLeft(2, '0')}';
  }
}