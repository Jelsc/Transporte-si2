import 'package:flutter/material.dart';
import '../../services/viaje_conductor_service.dart';

class PasajerosScreen extends StatefulWidget {
  final int viajeId;
  final String origenNombre;
  final String destinoNombre;

  const PasajerosScreen({
    Key? key,
    required this.viajeId,
    required this.origenNombre,
    required this.destinoNombre,
  }) : super(key: key);

  @override
  State<PasajerosScreen> createState() => _PasajerosScreenState();
}

class _PasajerosScreenState extends State<PasajerosScreen> {
  bool _isLoading = true;
  ListaPasajeros? _listaPasajeros;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cargarPasajeros();
  }

  Future<void> _cargarPasajeros() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await ViajeConductorService.obtenerPasajerosViaje(
      widget.viajeId,
    );

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _listaPasajeros = response.data;
      } else {
        _errorMessage = response.error ?? 'Error al cargar pasajeros';
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pasajeros del Viaje',
              style: TextStyle(
                color: Color(0xFF2C3E50),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${widget.origenNombre} → ${widget.destinoNombre}',
              style: const TextStyle(
                color: Color(0xFF7F8C8D),
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? _buildErrorWidget()
          : _listaPasajeros == null || _listaPasajeros!.pasajeros.isEmpty
          ? _buildEmptyWidget()
          : _buildContent(),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
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
            onPressed: _cargarPasajeros,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3498DB),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No hay pasajeros registrados',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF7F8C8D),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Aún no se han realizado reservas para este viaje',
            style: TextStyle(fontSize: 14, color: Color(0xFF95A5A6)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _cargarPasajeros,
      child: Column(
        children: [
          _buildEstadisticas(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _listaPasajeros!.pasajeros.length,
              itemBuilder: (context, index) {
                return _buildPasajeroCard(_listaPasajeros!.pasajeros[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadisticas() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildEstadisticaItem(
            icon: Icons.people,
            label: 'Pasajeros',
            valor: '${_listaPasajeros!.totalPasajeros}',
            color: const Color(0xFF3498DB),
          ),
          _buildEstadisticaItem(
            icon: Icons.event_seat,
            label: 'Ocupados',
            valor: '${_listaPasajeros!.asientosOcupados}',
            color: const Color(0xFF2ECC71),
          ),
          _buildEstadisticaItem(
            icon: Icons.event_available,
            label: 'Disponibles',
            valor: '${_listaPasajeros!.asientosDisponibles}',
            color: const Color(0xFFE67E22),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadisticaItem({
    required IconData icon,
    required String label,
    required String valor,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          valor,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF95A5A6)),
        ),
      ],
    );
  }

  Widget _buildPasajeroCard(Pasajero pasajero) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _mostrarDetallePasajero(pasajero),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar con iniciales
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      _getIniciales(pasajero.nombre, pasajero.apellido),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Información del pasajero
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pasajero.nombreCompleto,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2C3E50),
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (pasajero.ci != null)
                        Row(
                          children: [
                            const Icon(
                              Icons.badge,
                              size: 14,
                              color: Color(0xFF95A5A6),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'CI: ${pasajero.ci}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF7F8C8D),
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.event_seat,
                            size: 14,
                            color: Color(0xFF3498DB),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Asientos: ${pasajero.asientosTexto}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF3498DB),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Badge de cantidad de asientos
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3498DB).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${pasajero.cantidadAsientos}',
                    style: const TextStyle(
                      color: Color(0xFF3498DB),
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getIniciales(String nombre, String apellido) {
    final inicial1 = nombre.isNotEmpty ? nombre[0].toUpperCase() : '';
    final inicial2 = apellido.isNotEmpty ? apellido[0].toUpperCase() : '';
    return '$inicial1$inicial2';
  }

  void _mostrarDetallePasajero(Pasajero pasajero) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Información del Pasajero',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C3E50),
              ),
            ),
            const SizedBox(height: 24),
            _buildInfoRow(Icons.person, 'Nombre', pasajero.nombreCompleto),
            if (pasajero.ci != null)
              _buildInfoRow(Icons.badge, 'CI', pasajero.ci!),
            _buildInfoRow(Icons.email, 'Email', pasajero.email),
            _buildInfoRow(Icons.phone, 'Teléfono', pasajero.telefono),
            _buildInfoRow(Icons.event_seat, 'Asientos', pasajero.asientosTexto),
            if (pasajero.codigoReserva != null)
              _buildInfoRow(
                Icons.confirmation_number,
                'Código',
                pasajero.codigoReserva!,
              ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3498DB),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Cerrar',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF3498DB).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: const Color(0xFF3498DB)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF95A5A6),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
