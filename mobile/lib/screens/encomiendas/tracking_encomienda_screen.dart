import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../services/encomienda_service.dart';
import '../../models/encomienda_model.dart';
import '../../widgets/neumorphic_card.dart';
import '../../widgets/timeline_seguimiento_widget.dart';
import '../../widgets/mapa_tracking_encomienda.dart';

class TrackingEncomiendaScreen extends StatefulWidget {
  final String? codigoInicial;

  const TrackingEncomiendaScreen({super.key, this.codigoInicial});

  @override
  State<TrackingEncomiendaScreen> createState() =>
      _TrackingEncomiendaScreenState();
}

class _TrackingEncomiendaScreenState extends State<TrackingEncomiendaScreen> {
  final EncomiendaService _encomiendaService = EncomiendaService();
  final TextEditingController _codigoController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  Encomienda? _encomienda;
  bool _isLoading = false;
  String? _errorMessage;
  double? _latDestino;
  double? _lngDestino;
  bool _geocodificando = false;
  Timer? _autoRefreshTimer;
  bool _autoRefreshActivo = false;

  @override
  void initState() {
    super.initState();
    if (widget.codigoInicial != null && widget.codigoInicial!.isNotEmpty) {
      _codigoController.text = widget.codigoInicial!;
      _buscarEncomienda();
    }
  }

  @override
  void dispose() {
    _codigoController.dispose();
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _buscarEncomienda() async {
    final codigo = _codigoController.text.trim().toUpperCase();

    if (codigo.isEmpty) {
      setState(() {
        _errorMessage = 'Por favor ingresa un código de seguimiento';
      });
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _encomienda = null;
    });

    try {
      final result = await _encomiendaService.getSeguimiento(codigo);

      if (mounted) {
        setState(() {
          _isLoading = false;
          if (result.success && result.data != null) {
            _encomienda = result.data;
            _errorMessage = null;
            // Geocodificar dirección de destino
            _geocodificarDestino();
            // Iniciar auto-refresh si hay viaje asignado y está en curso
            _iniciarAutoRefresh();
          } else {
            _errorMessage = result.error ?? 'Encomienda no encontrada';
            _encomienda = null;
            _latDestino = null;
            _lngDestino = null;
            _detenerAutoRefresh();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error al buscar encomienda: $e';
          _encomienda = null;
        });
      }
    }
  }

  Future<void> _actualizarSeguimiento({bool mostrarMensaje = true}) async {
    if (_encomienda == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _encomiendaService.getSeguimiento(
        _encomienda!.codigoSeguimiento,
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
          if (result.success && result.data != null) {
            _encomienda = result.data;
            // Verificar si sigue habiendo viaje en curso para auto-refresh
            _iniciarAutoRefresh();
            if (mostrarMensaje) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Seguimiento actualizado'),
                  backgroundColor: Colors.green,
                  duration: Duration(seconds: 2),
                ),
              );
            }
          } else {
            _detenerAutoRefresh();
            if (mostrarMensaje) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(result.error ?? 'Error al actualizar'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _detenerAutoRefresh();
        if (mostrarMensaje) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  void _iniciarAutoRefresh() {
    // Solo iniciar si hay viaje asignado y está en curso
    final tieneViajeEnCurso =
        _encomienda?.trackingInfo != null &&
        _encomienda!.trackingInfo!['viaje_en_curso'] == true;

    if (tieneViajeEnCurso && !_autoRefreshActivo) {
      _autoRefreshActivo = true;
      _autoRefreshTimer?.cancel();
      // Actualizar cada 30 segundos (igual que el módulo de conductor)
      _autoRefreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
        if (mounted && _encomienda != null) {
          _actualizarSeguimiento(mostrarMensaje: false);
        } else {
          timer.cancel();
          _autoRefreshActivo = false;
        }
      });
    } else if (!tieneViajeEnCurso) {
      _detenerAutoRefresh();
    }
  }

  void _detenerAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshActivo = false;
  }

  Future<void> _geocodificarDestino() async {
    if (_encomienda == null) return;

    // Prioridad 1: Usar destino del viaje si está disponible (más confiable)
    if (_encomienda!.trackingInfo != null) {
      final destinoViaje = _encomienda!.trackingInfo!['destino_viaje'];
      if (destinoViaje is Map) {
        final lat = destinoViaje['lat'];
        final lng = destinoViaje['lng'];
        if (lat != null && lng != null) {
          setState(() {
            _latDestino = double.tryParse(lat.toString());
            _lngDestino = double.tryParse(lng.toString());
            _geocodificando = false;
          });
          return; // Usar coordenadas del viaje, no geocodificar
        }
      }
    }

    // Prioridad 2: Intentar geocodificar la dirección
    final direccion =
        '${_encomienda!.destinoDireccion}, ${_encomienda!.destinoCiudad}';

    setState(() {
      _geocodificando = true;
    });

    try {
      final result = await _encomiendaService.geocodificarDireccion(direccion);

      if (mounted) {
        setState(() {
          _geocodificando = false;
          if (result.success && result.data != null) {
            final lat = result.data!['lat'];
            final lng = result.data!['lng'];
            if (lat != null && lng != null) {
              _latDestino = double.tryParse(lat.toString());
              _lngDestino = double.tryParse(lng.toString());
            }
          } else {
            // Si falla la geocodificación, intentar usar solo la ciudad
            _geocodificarSoloCiudad();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _geocodificando = false;
        });
        // Si falla, intentar geocodificar solo la ciudad
        _geocodificarSoloCiudad();
      }
    }
  }

  Future<void> _geocodificarSoloCiudad() async {
    if (_encomienda == null || _latDestino != null) return;

    try {
      final result = await _encomiendaService.geocodificarDireccion(
        _encomienda!.destinoCiudad,
      );

      if (mounted && result.success && result.data != null) {
        final lat = result.data!['lat'];
        final lng = result.data!['lng'];
        if (lat != null && lng != null) {
          setState(() {
            _latDestino = double.tryParse(lat.toString());
            _lngDestino = double.tryParse(lng.toString());
          });
        }
      }
    } catch (e) {
      // Si falla, dejar que el mapa muestre el mensaje de error
    }
  }

  void _compartirCodigo() {
    if (_encomienda == null) return;

    Clipboard.setData(ClipboardData(text: _encomienda!.codigoSeguimiento));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Código copiado al portapapeles'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Rastrear Encomienda'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: _encomienda != null
            ? [
                IconButton(
                  icon: const Icon(Icons.share),
                  onPressed: _compartirCodigo,
                  tooltip: 'Compartir código',
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _actualizarSeguimiento,
                  tooltip: 'Actualizar',
                ),
              ]
            : null,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildBuscador(),
            const SizedBox(height: 24),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_errorMessage != null)
              _buildError()
            else if (_encomienda != null)
              _buildDetalleEncomienda()
            else
              _buildPlaceholder(),
          ],
        ),
      ),
    );
  }

  Widget _buildBuscador() {
    return NeumorphicCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Código de Seguimiento',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _codigoController,
              decoration: InputDecoration(
                hintText: 'Ingresa el código de seguimiento',
                prefixIcon: const Icon(Icons.qr_code_scanner),
                suffixIcon: _codigoController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _codigoController.clear();
                          setState(() {
                            _encomienda = null;
                            _errorMessage = null;
                          });
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              textCapitalization: TextCapitalization.characters,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Ingresa un código de seguimiento';
                }
                return null;
              },
              onChanged: (value) {
                setState(() {});
              },
              onFieldSubmitted: (_) => _buscarEncomienda(),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _buscarEncomienda,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search),
                        SizedBox(width: 8),
                        Text(
                          'Buscar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return NeumorphicCard(
      backgroundColor: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Error desconocido',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.red.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _buscarEncomienda,
              icon: const Icon(Icons.refresh),
              label: const Text('Intentar de nuevo'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          children: [
            Icon(
              Icons.local_shipping_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 24),
            Text(
              'Rastrea tu encomienda',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Ingresa el código de seguimiento para ver el estado de tu encomienda',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetalleEncomienda() {
    if (_encomienda == null) return const SizedBox.shrink();

    final encomienda = _encomienda!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeaderEncomienda(encomienda),
        const SizedBox(height: 24),
        _buildInformacionBasica(encomienda),
        const SizedBox(height: 24),
        if (encomienda.trackingInfo != null &&
            encomienda.trackingInfo!['eta'] != null)
          _buildETAWidget(encomienda),
        if (encomienda.trackingInfo != null &&
            encomienda.trackingInfo!['eta'] != null)
          const SizedBox(height: 24),
        _buildMapa(),
        const SizedBox(height: 24),
        // Indicador de tracking en tiempo real
        if (_autoRefreshActivo &&
            encomienda.trackingInfo != null &&
            encomienda.trackingInfo!['viaje_en_curso'] == true)
          _buildIndicadorTracking(),
        if (_autoRefreshActivo &&
            encomienda.trackingInfo != null &&
            encomienda.trackingInfo!['viaje_en_curso'] == true)
          const SizedBox(height: 16),
        _buildTimeline(encomienda),
      ],
    );
  }

  Widget _buildHeaderEncomienda(Encomienda encomienda) {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: encomienda.estadoColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    encomienda.estadoIcon,
                    color: encomienda.estadoColor,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        encomienda.codigoSeguimiento,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        encomienda.estadoTexto,
                        style: TextStyle(
                          fontSize: 16,
                          color: encomienda.estadoColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Precio:',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  Text(
                    encomienda.precioFormateado,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInformacionBasica(Encomienda encomienda) {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Información de Envío',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Destinatario', encomienda.destinatarioNombre),
            _buildInfoRow('Ciudad', encomienda.destinoCiudad),
            _buildInfoRow('Dirección', encomienda.destinoDireccion),
            if (encomienda.conductorNombre != null)
              _buildInfoRow('Conductor', encomienda.conductorNombre!),
            if (encomienda.fechaEntregaEstimada != null)
              _buildInfoRow(
                'Entrega Estimada',
                DateFormat(
                  'dd/MM/yyyy',
                ).format(encomienda.fechaEntregaEstimada!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildETAWidget(Encomienda encomienda) {
    final eta = encomienda.trackingInfo!['eta'] as Map<String, dynamic>?;
    if (eta == null) return const SizedBox.shrink();

    final distanciaKm = eta['distancia_km'] as double? ?? 0.0;
    final tiempoMinutos = eta['tiempo_minutos'] as int? ?? 0;
    final tiempoLlegadaStr = eta['tiempo_llegada_estimado'] as String?;

    DateTime? tiempoLlegada;
    if (tiempoLlegadaStr != null) {
      try {
        tiempoLlegada = DateTime.parse(tiempoLlegadaStr);
      } catch (e) {
        // Ignorar error de parsing
      }
    }

    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.access_time, color: Colors.blue.shade700),
                const SizedBox(width: 8),
                const Text(
                  'Tiempo Estimado de Llegada',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildETAItem(
                  icon: Icons.timer,
                  label: 'Tiempo',
                  value: '$tiempoMinutos min',
                  color: Colors.blue,
                ),
                _buildETAItem(
                  icon: Icons.straighten,
                  label: 'Distancia',
                  value: '${distanciaKm.toStringAsFixed(1)} km',
                  color: Colors.green,
                ),
                if (tiempoLlegada != null)
                  _buildETAItem(
                    icon: Icons.schedule,
                    label: 'Llegada',
                    value: DateFormat('HH:mm').format(tiempoLlegada),
                    color: Colors.orange,
                  ),
              ],
            ),
            if (encomienda.viajeInfo != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.directions_bus,
                      size: 20,
                      color: Colors.blue.shade700,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Asignada al viaje #${encomienda.viajeInfo!['id']}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.blue.shade900,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildETAItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildMapa() {
    if (_encomienda == null) return const SizedBox.shrink();

    return NeumorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Icon(
                  _encomienda!.trackingInfo != null &&
                          _encomienda!.trackingInfo!['viaje_en_curso'] == true
                      ? Icons.my_location
                      : Icons.map,
                  color:
                      _encomienda!.trackingInfo != null &&
                          _encomienda!.trackingInfo!['viaje_en_curso'] == true
                      ? Colors.green
                      : Colors.blue.shade700,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _encomienda!.trackingInfo != null &&
                                _encomienda!.trackingInfo!['viaje_en_curso'] ==
                                    true
                            ? 'Tracking en Tiempo Real'
                            : 'Ubicación de Destino',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_encomienda!.trackingInfo != null &&
                          _encomienda!.trackingInfo!['viaje_en_curso'] == true)
                        Text(
                          'Ubicación del conductor y ruta',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_geocodificando)
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Center(child: CircularProgressIndicator()),
            )
          else
            MapaTrackingEncomienda(
              encomienda: _encomienda!,
              latDestino: _latDestino,
              lngDestino: _lngDestino,
            ),
        ],
      ),
    );
  }

  Widget _buildIndicadorTracking() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tracking en Tiempo Real',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Actualizando ubicación cada 30 segundos',
                  style: TextStyle(fontSize: 12, color: Colors.blue.shade700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(Encomienda encomienda) {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Historial de Seguimiento',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TimelineSeguimientoWidget(
              seguimientos: encomienda.seguimientos,
              estadoActual: encomienda.estado,
              mostrarEstadoActual: true,
            ),
          ],
        ),
      ),
    );
  }
}
