import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../models/conductor_model.dart';
import '../auth/login_screen.dart';
import '../../widgets/conductor_bottom_navigation_bar.dart';

class PerfilConductorScreen extends StatefulWidget {
  const PerfilConductorScreen({super.key});

  @override
  State<PerfilConductorScreen> createState() => _PerfilConductorScreenState();
}

class _PerfilConductorScreenState extends State<PerfilConductorScreen> {
  final _authService = AuthService();
  User? _currentUser;
  Conductor? _conductor;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final response = await _authService.getCurrentUser();
      if (response.success && response.data != null) {
        setState(() {
          _currentUser = response.data;
          _conductor = response.data?.conductor;
          _isLoading = false;
        });
      } else {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar sesión'),
        content: const Text('¿Estás seguro de que quieres cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _authService.logout();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Mi Perfil'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Header con foto y nombre
                  _buildHeader(),

                  const SizedBox(height: 24),

                  // Información personal
                  _buildSeccion(
                    titulo: 'Información Personal',
                    children: [
                      _buildInfoRow(
                        Icons.person,
                        'Nombre Completo',
                        _conductor?.nombreCompleto ?? 'N/A',
                      ),
                      _buildInfoRow(
                        Icons.email,
                        'Email',
                        _conductor?.email ?? _currentUser?.email ?? 'N/A',
                      ),
                      _buildInfoRow(
                        Icons.phone,
                        'Teléfono',
                        _conductor?.telefono ?? 'N/A',
                      ),
                      _buildInfoRow(Icons.badge, 'CI', _conductor?.ci ?? 'N/A'),
                      if (_conductor?.fechaNacimiento != null)
                        _buildInfoRow(
                          Icons.cake,
                          'Fecha de Nacimiento',
                          '${_conductor!.fechaNacimiento!.day}/${_conductor!.fechaNacimiento!.month}/${_conductor!.fechaNacimiento!.year}',
                        ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Información de licencia
                  _buildSeccion(
                    titulo: 'Licencia de Conducir',
                    children: [
                      _buildInfoRow(
                        Icons.credit_card,
                        'Número',
                        _conductor?.nroLicencia ?? 'N/A',
                      ),
                      _buildInfoRow(
                        Icons.category,
                        'Tipo',
                        _conductor?.descripcionLicencia ?? 'N/A',
                      ),
                      _buildLicenciaVencimiento(),
                      _buildInfoRow(
                        Icons.trending_up,
                        'Experiencia',
                        '${_conductor?.experienciaAnios ?? 0} años',
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Estado actual
                  _buildEstadoCard(),

                  const SizedBox(height: 16),

                  // Contacto de emergencia
                  if (_conductor?.telefonoEmergencia != null)
                    _buildSeccion(
                      titulo: 'Contacto de Emergencia',
                      children: [
                        _buildInfoRow(
                          Icons.contact_emergency,
                          'Nombre',
                          _conductor?.contactoEmergencia ?? 'N/A',
                        ),
                        _buildInfoRow(
                          Icons.phone_in_talk,
                          'Teléfono',
                          _conductor?.telefonoEmergencia ?? 'N/A',
                        ),
                      ],
                    ),
                ],
              ),
            ),
      bottomNavigationBar: const ConductorBottomNavigationBar(currentIndex: 2),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.blue.shade100,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.shade300,
                offset: const Offset(4, 4),
                blurRadius: 10,
              ),
              const BoxShadow(
                color: Colors.white,
                offset: Offset(-4, -4),
                blurRadius: 10,
              ),
            ],
          ),
          child: Icon(Icons.person, size: 50, color: Colors.blue.shade700),
        ),
        const SizedBox(height: 16),
        Text(
          _conductor?.nombreCompleto ?? _currentUser?.firstName ?? 'Conductor',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Conductor Profesional',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildSeccion({
    required String titulo,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            offset: const Offset(2, 2),
            blurRadius: 5,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titulo,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLicenciaVencimiento() {
    if (_conductor == null) {
      return _buildInfoRow(Icons.event, 'Vencimiento', 'N/A');
    }

    final fechaVenc = _conductor!.fechaVencLicencia;
    final fechaStr = '${fechaVenc.day}/${fechaVenc.month}/${fechaVenc.year}';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            Icons.event,
            size: 20,
            color: _conductor!.licenciaVencida
                ? Colors.red
                : _conductor!.licenciaProximaVencer
                ? Colors.orange
                : Colors.blue,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Vencimiento',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    if (_conductor!.licenciaVencida ||
                        _conductor!.licenciaProximaVencer)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _conductor!.licenciaVencida
                                ? Colors.red.shade100
                                : Colors.orange.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _conductor!.licenciaVencida
                                ? 'VENCIDA'
                                : 'POR VENCER',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _conductor!.licenciaVencida
                                  ? Colors.red
                                  : Colors.orange,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  fechaStr,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _conductor!.licenciaVencida
                        ? Colors.red
                        : Colors.black87,
                  ),
                ),
                if (_conductor!.licenciaProximaVencer &&
                    !_conductor!.licenciaVencida)
                  Text(
                    'Vence en ${_conductor!.diasParaVencerLicencia} días',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.orange,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEstadoCard() {
    if (_conductor == null) return const SizedBox();

    final estadoColor = _getEstadoColor(_conductor!.estado);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: estadoColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: estadoColor, width: 2),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: estadoColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Estado Actual',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
              Text(
                _conductor!.estadoTexto,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: estadoColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getEstadoColor(String estado) {
    switch (estado) {
      case 'disponible':
        return Colors.green;
      case 'ocupado':
        return Colors.orange;
      case 'descanso':
        return Colors.blue;
      case 'inactivo':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}
