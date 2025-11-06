import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/viaje_conductor_service.dart';

class VehiculoEstadoScreen extends StatefulWidget {
  const VehiculoEstadoScreen({Key? key}) : super(key: key);

  @override
  State<VehiculoEstadoScreen> createState() => _VehiculoEstadoScreenState();
}

class _VehiculoEstadoScreenState extends State<VehiculoEstadoScreen> {
  bool _isLoading = true;
  VehiculoConductor? _vehiculo;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cargarVehiculo();
  }

  Future<void> _cargarVehiculo() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await ViajeConductorService.obtenerMiVehiculo();

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _vehiculo = response.data;
      } else {
        _errorMessage = response.error ?? 'Error al cargar vehículo';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF2C3E50)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Mi Vehículo',
          style: TextStyle(
            color: Color(0xFF2C3E50),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF3498DB)),
            onPressed: _cargarVehiculo,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? _buildErrorWidget()
          : _vehiculo == null
          ? _buildNoVehiculoWidget()
          : _buildContent(),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Color(0xFFE74C3C)),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Error desconocido',
              style: const TextStyle(fontSize: 16, color: Color(0xFF7F8C8D)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _cargarVehiculo,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3498DB),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoVehiculoWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.directions_bus_outlined,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          const Text(
            'No tienes vehículo asignado',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF7F8C8D),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Contacta con tu supervisor',
            style: TextStyle(fontSize: 14, color: Color(0xFF95A5A6)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _cargarVehiculo,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVehiculoCard(),
            const SizedBox(height: 16),
            _buildEstadisticasCard(),
            const SizedBox(height: 16),
            _buildMantenimientoCard(),
            const SizedBox(height: 16),
            _buildEspecificacionesCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildVehiculoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3498DB).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.directions_bus,
                  size: 32,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _vehiculo!.nombre,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _vehiculo!.placa,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white.withOpacity(0.9),
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              _buildEstadoBadge(),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildVehiculoInfo(
                  icon: Icons.category,
                  label: 'Tipo',
                  value: _vehiculo!.tipo,
                ),
                _buildVehiculoInfo(
                  icon: Icons.event_seat,
                  label: 'Capacidad',
                  value: '${_vehiculo!.capacidadPasajeros} pasajeros',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadoBadge() {
    Color color;
    IconData icon;

    switch (_vehiculo!.estado.toLowerCase()) {
      case 'activo':
        color = const Color(0xFF2ECC71);
        icon = Icons.check_circle;
        break;
      case 'mantenimiento':
        color = const Color(0xFFF39C12);
        icon = Icons.build_circle;
        break;
      case 'baja':
        color = const Color(0xFFE74C3C);
        icon = Icons.cancel;
        break;
      default:
        color = const Color(0xFF95A5A6);
        icon = Icons.help_outline;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            _vehiculo!.estado,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehiculoInfo({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 20, color: Colors.white.withOpacity(0.9)),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.7)),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildEstadisticasCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.bar_chart, color: Color(0xFF3498DB)),
              SizedBox(width: 8),
              Text(
                'Estadísticas de Viajes',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildEstadistica(
                icon: Icons.today,
                label: 'Hoy',
                valor: '${_vehiculo!.estadisticas.viajesHoy}',
                color: const Color(0xFF3498DB),
              ),
              _buildEstadistica(
                icon: Icons.schedule,
                label: 'Programados',
                valor: '${_vehiculo!.estadisticas.viajesProgramados}',
                color: const Color(0xFFF39C12),
              ),
              _buildEstadistica(
                icon: Icons.directions_bus,
                label: 'En Curso',
                valor: '${_vehiculo!.estadisticas.viajesEnCurso}',
                color: const Color(0xFF2ECC71),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEstadistica({
    required IconData icon,
    required String label,
    required String valor,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          valor,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: Color(0xFF95A5A6)),
        ),
      ],
    );
  }

  Widget _buildMantenimientoCard() {
    final requiereAtencion = _vehiculo!.requiereMantenimiento;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: requiereAtencion
            ? Border.all(color: const Color(0xFFE74C3C), width: 2)
            : null,
        boxShadow: [
          BoxShadow(
            color: requiereAtencion
                ? const Color(0xFFE74C3C).withOpacity(0.1)
                : Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.build_circle,
                color: requiereAtencion
                    ? const Color(0xFFE74C3C)
                    : const Color(0xFF3498DB),
              ),
              const SizedBox(width: 8),
              const Text(
                'Mantenimiento',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              if (requiereAtencion) ...[
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE74C3C),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '⚠️ URGENTE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 20),
          if (_vehiculo!.kilometraje != null)
            _buildMantenimientoInfo(
              icon: Icons.speed,
              label: 'Kilometraje',
              value: '${_vehiculo!.kilometraje!.toStringAsFixed(0)} km',
            ),
          if (_vehiculo!.ultimoMantenimiento != null)
            _buildMantenimientoInfo(
              icon: Icons.history,
              label: 'Último Mantenimiento',
              value: _formatearFecha(_vehiculo!.ultimoMantenimiento!),
            ),
          if (_vehiculo!.proximoMantenimiento != null)
            _buildMantenimientoInfo(
              icon: Icons.event,
              label: 'Próximo Mantenimiento',
              value: _formatearFecha(_vehiculo!.proximoMantenimiento!),
              esProximo: true,
            ),
        ],
      ),
    );
  }

  Widget _buildMantenimientoInfo({
    required IconData icon,
    required String label,
    required String value,
    bool esProximo = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: esProximo && _vehiculo!.requiereMantenimiento
                  ? const Color(0xFFE74C3C).withOpacity(0.1)
                  : const Color(0xFF3498DB).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 20,
              color: esProximo && _vehiculo!.requiereMantenimiento
                  ? const Color(0xFFE74C3C)
                  : const Color(0xFF3498DB),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF95A5A6),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: esProximo && _vehiculo!.requiereMantenimiento
                        ? const Color(0xFFE74C3C)
                        : const Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEspecificacionesCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, color: Color(0xFF3498DB)),
              SizedBox(width: 8),
              Text(
                'Especificaciones',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildEspecificacion('Marca/Modelo', _vehiculo!.marcaModelo),
          if (_vehiculo!.anioFabricacion != null)
            _buildEspecificacion('Año', '${_vehiculo!.anioFabricacion}'),
          _buildEspecificacion('Tipo', _vehiculo!.tipo),
          _buildEspecificacion(
            'Capacidad Pasajeros',
            '${_vehiculo!.capacidadPasajeros} personas',
          ),
          if (_vehiculo!.capacidadCarga != null)
            _buildEspecificacion(
              'Capacidad Carga',
              '${_vehiculo!.capacidadCarga!.toStringAsFixed(2)} kg',
            ),
        ],
      ),
    );
  }

  Widget _buildEspecificacion(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, color: Color(0xFF7F8C8D)),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2C3E50),
            ),
          ),
        ],
      ),
    );
  }

  String _formatearFecha(DateTime fecha) {
    final diferencia = fecha.difference(DateTime.now()).inDays;
    final formatter = DateFormat('dd/MM/yyyy');

    if (diferencia == 0) {
      return 'Hoy (${formatter.format(fecha)})';
    } else if (diferencia == 1) {
      return 'Mañana (${formatter.format(fecha)})';
    } else if (diferencia > 0 && diferencia <= 7) {
      return 'En $diferencia días (${formatter.format(fecha)})';
    } else if (diferencia < 0) {
      return 'Hace ${-diferencia} días (${formatter.format(fecha)})';
    } else {
      return formatter.format(fecha);
    }
  }
}
