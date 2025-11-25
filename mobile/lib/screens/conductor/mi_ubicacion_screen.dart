import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../providers/ubicacion_provider.dart';
import '../../models/ubicacion_model.dart';
import '../../widgets/neumorphic_card.dart';
import '../../widgets/mapa_interactivo.dart';

/// Pantalla "Mi Ubicación" para el módulo de conductor
///
/// Muestra:
/// - Información del viaje en curso
/// - Ubicación actual vs origen/destino
/// - Distancia restante
/// - Progreso del viaje
/// - Preparada para integración futura con Google Maps
class MiUbicacionScreen extends StatefulWidget {
  const MiUbicacionScreen({super.key});

  @override
  State<MiUbicacionScreen> createState() => _MiUbicacionScreenState();
}

class _MiUbicacionScreenState extends State<MiUbicacionScreen> {
  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    final provider = Provider.of<UbicacionProvider>(context, listen: false);
    await provider.cargarViajeEnCurso();

    // Calcular ETA inicial si hay viaje en curso
    if (provider.viajeEnCurso != null) {
      // Obtener ubicación actual para calcular ETA
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        await provider.calcularETAActual(
          lat: position.latitude,
          lng: position.longitude,
        );
      } catch (e) {
        print('Error obteniendo ubicación inicial: $e');
      }
    }
  }

  Future<void> _refrescar() async {
    await _cargarDatos();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE8EDF2),
      appBar: AppBar(
        backgroundColor: const Color(0xFFE8EDF2),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF2C3E50)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Mi Ubicación',
          style: TextStyle(
            color: Color(0xFF2C3E50),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Consumer<UbicacionProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF5DADE2)),
              ),
            );
          }

          if (provider.error != null) {
            return _buildError(provider.error!);
          }

          if (provider.viajeEnCurso == null) {
            return _buildSinViaje();
          }

          return RefreshIndicator(
            onRefresh: _refrescar,
            color: const Color(0xFF5DADE2),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header con información del viaje
                  _buildViajeHeader(provider.viajeEnCurso!),
                  const SizedBox(height: 24),

                  // ETA Dinámico (si está disponible)
                  if (provider.etaActual != null)
                    _buildETAWidget(provider.etaActual!),
                  if (provider.etaActual != null) const SizedBox(height: 24),

                  // Mapa interactivo con tracking en tiempo real
                  _buildMapaInteractivo(provider),
                  const SizedBox(height: 24),

                  // Información de ubicaciones
                  _buildUbicacionesInfo(provider.viajeEnCurso!),
                  const SizedBox(height: 24),

                  // Progreso del viaje
                  if (provider.ubicacionActual != null)
                    _buildProgresoViaje(provider),
                  const SizedBox(height: 24),

                  // Información de pasajeros
                  _buildPasajerosInfo(provider.viajeEnCurso!),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildViajeHeader(ViajeEnCurso viaje) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5DADE2), Color(0xFF3498DB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.route, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Viaje en Curso',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF7F8C8D),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${viaje.origen.nombre} → ${viaje.destino.nombre}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C3E50),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFBDC3C7), height: 1),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildInfoPill(
                icon: Icons.schedule,
                label: 'Hora',
                value: viaje.hora,
              ),
              _buildInfoPill(
                icon: Icons.calendar_today,
                label: 'Fecha',
                value: _formatearFecha(viaje.fecha),
              ),
              _buildInfoPill(
                icon: Icons.people,
                label: 'Pasajeros',
                value: '${viaje.pasajeros.length}',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoPill({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF5DADE2)),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF7F8C8D)),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
      ],
    );
  }

  Widget _buildMapaInteractivo(UbicacionProvider provider) {
    final viaje = provider.viajeEnCurso!;

    return NeumorphicCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          height: 400,
          child: MapaInteractivo(
            latitudDestino: viaje.destino.lat,
            longitudDestino: viaje.destino.lng,
            nombreDestino: viaje.destino.nombre,
            destinoId: viaje.destino.id,
            geometriaRuta: provider.etaActual?.geometriaRuta,
            onLocationUpdate: (lat, lng) {
              // Callback cuando la ubicación se actualiza
              provider.actualizarUbicacion(lat: lat, lng: lng);
              provider.calcularETAActual(lat: lat, lng: lng);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildETAWidget(ETAResponse eta) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.access_time, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tiempo Estimado',
                  style: TextStyle(fontSize: 12, color: Color(0xFF7F8C8D)),
                ),
                const SizedBox(height: 4),
                Text(
                  eta.tiempoFormateado,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
                Text(
                  'Llegada: ${eta.tiempoLlegadaEstimado}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF7F8C8D),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${eta.distanciaKm.toStringAsFixed(1)} km',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF3498DB),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: eta.modoCalculo == 'osrm'
                      ? Colors.green.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  eta.modoCalculo.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: eta.modoCalculo == 'osrm'
                        ? Colors.green.shade700
                        : Colors.orange.shade700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUbicacionesInfo(ViajeEnCurso viaje) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ubicaciones',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
        const SizedBox(height: 16),
        // Origen
        _buildUbicacionCard(
          icon: Icons.trip_origin,
          titulo: 'Origen',
          ubicacion: viaje.origen,
          color: const Color(0xFF27AE60),
        ),
        const SizedBox(height: 16),
        // Destino
        _buildUbicacionCard(
          icon: Icons.location_on,
          titulo: 'Destino',
          ubicacion: viaje.destino,
          color: const Color(0xFFE74C3C),
        ),
      ],
    );
  }

  Widget _buildUbicacionCard({
    required IconData icon,
    required String titulo,
    required Ubicacion ubicacion,
    required Color color,
  }) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF7F8C8D),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ubicacion.nombre,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
                if (ubicacion.direccion != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    ubicacion.direccion!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF95A5A6),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.my_location,
                      size: 14,
                      color: Color(0xFF95A5A6),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${ubicacion.lat.toStringAsFixed(6)}, ${ubicacion.lng.toStringAsFixed(6)}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF95A5A6),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgresoViaje(UbicacionProvider provider) {
    final progreso = provider.calcularProgresoViaje() ?? 0.0;
    final distanciaRestante = provider.calcularDistanciaRestante();
    final cercaOrigen = provider.estaCercaDelOrigen();
    final cercaDestino = provider.estaCercaDelDestino();

    return NeumorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Progreso del Viaje',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              Text(
                '${(progreso * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF5DADE2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progreso,
              minHeight: 12,
              backgroundColor: const Color(0xFFD5DBE0),
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF5DADE2),
              ),
            ),
          ),
          if (distanciaRestante != null) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.straight, size: 20, color: Color(0xFF7F8C8D)),
                const SizedBox(width: 8),
                Text(
                  'Distancia restante: ${distanciaRestante.toStringAsFixed(1)} km',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF7F8C8D),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
          if (cercaOrigen || cercaDestino) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cercaDestino
                    ? const Color(0xFF27AE60).withOpacity(0.1)
                    : const Color(0xFFF39C12).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    cercaDestino ? Icons.celebration : Icons.info_outline,
                    color: cercaDestino
                        ? const Color(0xFF27AE60)
                        : const Color(0xFFF39C12),
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      cercaDestino
                          ? '¡Estás cerca del destino!'
                          : 'Estás cerca del punto de origen',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: cercaDestino
                            ? const Color(0xFF27AE60)
                            : const Color(0xFFF39C12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPasajerosInfo(ViajeEnCurso viaje) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Información de Pasajeros',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatPill(
                  label: 'Total',
                  value: '${viaje.totales.totalPasajeros}',
                  icon: Icons.people,
                  color: const Color(0xFF5DADE2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatPill(
                  label: 'Ocupados',
                  value: '${viaje.totales.asientosOcupados}',
                  icon: Icons.event_seat,
                  color: const Color(0xFF27AE60),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatPill(
                  label: 'Disponibles',
                  value: '${viaje.totales.asientosDisponibles}',
                  icon: Icons.event_available,
                  color: const Color(0xFF95A5A6),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color.withOpacity(0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String mensaje) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Color(0xFFE74C3C)),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C3E50),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFF7F8C8D)),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _refrescar,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF5DADE2),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSinViaje() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.location_off,
                size: 80,
                color: Color(0xFF95A5A6),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No hay viaje en curso',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C3E50),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Cuando inicies un viaje, podrás ver tu\nubicación y el progreso en tiempo real',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF7F8C8D),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _refrescar,
              icon: const Icon(Icons.refresh),
              label: const Text('Actualizar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF5DADE2),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatearFecha(DateTime fecha) {
    final meses = [
      '',
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return '${fecha.day} ${meses[fecha.month]}';
  }
}
