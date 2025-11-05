import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../services/auth_service.dart';
import '../../services/viaje_conductor_service.dart';
import '../auth/login_screen.dart';
import '../../widgets/conductor_bottom_navigation_bar.dart';
import 'pasajeros_screen.dart';
import 'vehiculo_estado_screen.dart';

class ViajesAsignadosScreen extends StatefulWidget {
  const ViajesAsignadosScreen({super.key});

  @override
  State<ViajesAsignadosScreen> createState() => _ViajesAsignadosScreenState();
}

class _ViajesAsignadosScreenState extends State<ViajesAsignadosScreen> {
  final _authService = AuthService();
  User? _currentUser;
  bool _isLoading = true;
  String _filtroEstado = 'todos';
  List<ViajeResumen> _viajes = [];
  String? _errorMessage;

  final Map<String, String> _estadosLabels = {
    'todos': 'Todos',
    'programado': 'Programados',
    'en_curso': 'En Curso',
    'completado': 'Completados',
    'cancelado': 'Cancelados',
  };

  final Map<String, Color> _estadosColores = {
    'programado': Colors.blue,
    'en_curso': Colors.orange,
    'completado': Colors.green,
    'cancelado': Colors.red,
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final userResponse = await _authService.getCurrentUser();
      if (!userResponse.success || userResponse.data == null) {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
        return;
      }

      setState(() {
        _currentUser = userResponse.data;
      });

      await _loadViajes();
    } catch (e) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  Future<void> _loadViajes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔍 [ViajesAsignados] Cargando viajes con filtro: $_filtroEstado');
      print(
        '👤 [ViajesAsignados] Usuario actual: ${_currentUser?.firstName} ${_currentUser?.lastName}',
      );
      print('🎯 [ViajesAsignados] Rol: ${_currentUser?.rol}');

      final response = await ViajeConductorService.obtenerViajesAsignados(
        estado: _filtroEstado,
      );

      print(
        '📦 [ViajesAsignados] Respuesta recibida - Success: ${response.success}',
      );

      if (response.success && response.data != null) {
        setState(() {
          _viajes = response.data!;
          _isLoading = false;
        });
        print(
          '✅ [ViajesAsignados] ${_viajes.length} viajes cargados exitosamente',
        );

        if (_viajes.isEmpty) {
          print(
            'ℹ️ [ViajesAsignados] No hay viajes para el filtro: $_filtroEstado',
          );
        } else {
          for (var viaje in _viajes) {
            print(
              '  📍 Viaje: ${viaje.origen} → ${viaje.destino} | Estado: ${viaje.estado}',
            );
          }
        }
      } else {
        final errorMsg = response.error ?? 'Error desconocido al cargar viajes';
        setState(() {
          _viajes = [];
          _isLoading = false;
          _errorMessage = errorMsg;
        });
        print('❌ [ViajesAsignados] Error: $errorMsg');

        // Mostrar toast con el error
        if (mounted) {
          Fluttertoast.showToast(
            msg: errorMsg,
            toastLength: Toast.LENGTH_LONG,
            gravity: ToastGravity.BOTTOM,
            backgroundColor: Colors.red,
            textColor: Colors.white,
          );
        }
      }
    } catch (e, stackTrace) {
      setState(() {
        _viajes = [];
        _isLoading = false;
        _errorMessage = 'Error: $e';
      });
      print('❌ [ViajesAsignados] Excepción capturada: $e');
      print('📚 [ViajesAsignados] Stack trace: $stackTrace');

      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Error al cargar viajes: $e',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
          textColor: Colors.white,
        );
      }
    }
  }

  Future<void> _cambiarEstadoViaje(
    ViajeResumen viaje,
    String nuevoEstado,
  ) async {
    // Mostrar diálogo de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar cambio'),
        content: Text(
          '¿Cambiar el estado del viaje a "${_estadosLabels[nuevoEstado]}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: _estadosColores[nuevoEstado],
            ),
            child: const Text(
              'Confirmar',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    // Mostrar indicador de carga
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final response = await ViajeConductorService.actualizarEstadoViaje(
        viaje.id,
        nuevoEstado,
      );

      if (mounted) {
        Navigator.pop(context); // Cerrar diálogo de carga

        if (response.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                response.message ?? 'Estado actualizado correctamente',
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
          // Recargar viajes
          _loadViajes();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.error ?? 'Error al actualizar estado'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Cerrar diálogo de carga
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Mis Viajes',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            if (_currentUser != null)
              Text(
                _currentUser!.conductor?.nombreCompleto ?? 'Conductor',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.normal,
                ),
              ),
          ],
        ),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          // Botón para ver estado del vehículo
          IconButton(
            icon: const Icon(Icons.directions_bus),
            tooltip: 'Mi Vehículo',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const VehiculoEstadoScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filtros
                _buildFiltros(),

                // Contador de viajes
                if (_viajes.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    color: Colors.blue.shade50,
                    width: double.infinity,
                    child: Text(
                      '${_viajes.length} viaje${_viajes.length != 1 ? 's' : ''} ${_estadosLabels[_filtroEstado]?.toLowerCase() ?? ''}',
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                // Lista de viajes
                Expanded(
                  child: _viajes.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadViajes,
                          color: Colors.blue,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _viajes.length,
                            itemBuilder: (context, index) {
                              final viaje = _viajes[index];
                              return _buildViajeCard(viaje);
                            },
                          ),
                        ),
                ),
              ],
            ),
      bottomNavigationBar: const ConductorBottomNavigationBar(currentIndex: 1),
    );
  }

  Widget _buildFiltros() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFiltroChip('Todos', 'todos', Icons.list),
            const SizedBox(width: 8),
            _buildFiltroChip('Programados', 'programado', Icons.schedule),
            const SizedBox(width: 8),
            _buildFiltroChip('En Curso', 'en_curso', Icons.directions_bus),
            const SizedBox(width: 8),
            _buildFiltroChip('Completados', 'completado', Icons.check_circle),
            const SizedBox(width: 8),
            _buildFiltroChip('Cancelados', 'cancelado', Icons.cancel),
          ],
        ),
      ),
    );
  }

  Widget _buildFiltroChip(String label, String valor, IconData icon) {
    final isSelected = _filtroEstado == valor;
    final color = _estadosColores[valor] ?? Colors.grey;

    return GestureDetector(
      onTap: () {
        setState(() {
          _filtroEstado = valor;
        });
        _loadViajes();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.black54,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildViajeCard(ViajeResumen viaje) {
    final estadoColor = _estadosColores[viaje.estado] ?? Colors.grey;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade300,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            _mostrarOpcionesViaje(viaje);
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header con fecha y estado
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 16,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${viaje.fecha.day}/${viaje.fecha.month}/${viaje.fecha.year}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          viaje.hora,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: estadoColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        viaje.estadoTexto,
                        style: TextStyle(
                          color: estadoColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Ruta
                Row(
                  children: [
                    Icon(Icons.trip_origin, size: 16, color: Colors.green),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        viaje.origen,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                Padding(
                  padding: const EdgeInsets.only(left: 7),
                  child: Container(
                    width: 2,
                    height: 20,
                    color: Colors.grey.shade300,
                  ),
                ),

                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        viaje.destino,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),

                // Información adicional
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.people, size: 16, color: Colors.blue),
                        const SizedBox(width: 4),
                        Text(
                          '${viaje.asientosOcupados}/${viaje.asientosDisponibles}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'pasajeros',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Icon(Icons.attach_money, size: 16, color: Colors.green),
                        Text(
                          '\$${viaje.precio.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                // Botones de acción según estado
                if (viaje.estado == 'programado' || viaje.estado == 'en_curso')
                  Column(
                    children: [
                      const SizedBox(height: 12),
                      const Divider(),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (viaje.estado == 'programado')
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () =>
                                    _cambiarEstadoViaje(viaje, 'en_curso'),
                                icon: const Icon(Icons.play_arrow, size: 18),
                                label: const Text('Iniciar Viaje'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                          if (viaje.estado == 'en_curso')
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () =>
                                    _cambiarEstadoViaje(viaje, 'completado'),
                                icon: const Icon(Icons.check_circle, size: 18),
                                label: const Text('Finalizar Viaje'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => _mostrarOpcionesViaje(viaje),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade200,
                              foregroundColor: Colors.black87,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Icon(Icons.more_vert),
                          ),
                        ],
                      ),
                      // Botón para ver pasajeros
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PasajerosScreen(
                                  viajeId: viaje.id,
                                  origenNombre: viaje.origen,
                                  destinoNombre: viaje.destino,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.people, size: 18),
                          label: const Text('Ver Pasajeros'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blue,
                            side: const BorderSide(color: Colors.blue),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _mostrarOpcionesViaje(ViajeResumen viaje) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle indicator
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Título
            Text(
              'Opciones del Viaje',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '${viaje.origen} → ${viaje.destino}',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Opciones
            _buildOpcionItem(
              icon: Icons.info_outline,
              label: 'Ver Detalles',
              onTap: () {
                Navigator.pop(context);
                _mostrarDetallesViaje(viaje);
              },
            ),

            if (viaje.estado == 'programado')
              _buildOpcionItem(
                icon: Icons.play_arrow,
                label: 'Iniciar Viaje',
                color: Colors.orange,
                onTap: () {
                  Navigator.pop(context);
                  _cambiarEstadoViaje(viaje, 'en_curso');
                },
              ),

            if (viaje.estado == 'en_curso')
              _buildOpcionItem(
                icon: Icons.check_circle,
                label: 'Finalizar Viaje',
                color: Colors.green,
                onTap: () {
                  Navigator.pop(context);
                  _cambiarEstadoViaje(viaje, 'completado');
                },
              ),

            if (viaje.estado == 'programado')
              _buildOpcionItem(
                icon: Icons.cancel,
                label: 'Cancelar Viaje',
                color: Colors.red,
                onTap: () {
                  Navigator.pop(context);
                  _cambiarEstadoViaje(viaje, 'cancelado');
                },
              ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildOpcionItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final itemColor = color ?? Colors.blue;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: itemColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: itemColor, size: 24),
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: itemColor,
              ),
            ),
            const Spacer(),
            Icon(Icons.chevron_right, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }

  void _mostrarDetallesViaje(ViajeResumen viaje) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Detalles del Viaje'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetalleRow('Origen:', viaje.origen),
            _buildDetalleRow('Destino:', viaje.destino),
            _buildDetalleRow(
              'Fecha:',
              '${viaje.fecha.day}/${viaje.fecha.month}/${viaje.fecha.year}',
            ),
            _buildDetalleRow('Hora:', viaje.hora),
            _buildDetalleRow('Estado:', viaje.estadoTexto),
            _buildDetalleRow('Precio:', '\$${viaje.precio.toStringAsFixed(2)}'),
            _buildDetalleRow(
              'Pasajeros:',
              '${viaje.asientosOcupados}/${viaje.asientosDisponibles}',
            ),
            _buildDetalleRow('Vehículo:', viaje.vehiculo),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetalleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No hay viajes ${_filtroEstado == "todos" ? "" : _getFiltroLabel()}',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Cuando se te asignen viajes, aparecerán aquí',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _getFiltroLabel() {
    switch (_filtroEstado) {
      case 'programado':
        return 'programados';
      case 'en_curso':
        return 'en curso';
      case 'completado':
        return 'completados';
      case 'cancelado':
        return 'cancelados';
      default:
        return '';
    }
  }
}
