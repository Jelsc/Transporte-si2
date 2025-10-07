import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../../widgets/neumorphic_card.dart';
import '../../widgets/bottom_navigation_bar.dart';

class ConductorHomeScreen extends StatefulWidget {
  const ConductorHomeScreen({super.key});

  @override
  State<ConductorHomeScreen> createState() => _ConductorHomeScreenState();
}

class _ConductorHomeScreenState extends State<ConductorHomeScreen> {
  final _authService = AuthService();
  User? _currentUser;
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


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  // Header con información del conductor
                  _buildHeader(),
                  
                  // Contenido principal - Grid 2x3 con funcionalidades originales
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 20,
                        mainAxisSpacing: 20,
                        children: [
                          _buildNeumorphicCard(
                            icon: Icons.assignment,
                            title: 'Viajes Asignados',
                            subtitle: 'Ver viajes del día',
                            color: Colors.blue,
                            onTap: () => _showComingSoon('Viajes Asignados'),
                          ),
                          _buildNeumorphicCard(
                            icon: Icons.people,
                            title: 'Pasajeros',
                            subtitle: 'Gestionar pasajeros',
                            color: Colors.green,
                            onTap: () => _showComingSoon('Gestión de Pasajeros'),
                          ),
                          _buildNeumorphicCard(
                            icon: Icons.location_on,
                            title: 'Mi Ubicación',
                            subtitle: 'Compartir ubicación',
                            color: Colors.red,
                            onTap: () => _showComingSoon('Compartir Ubicación'),
                          ),
                          _buildNeumorphicCard(
                            icon: Icons.analytics,
                            title: 'Reportes',
                            subtitle: 'Reportes de viaje',
                            color: Colors.purple,
                            onTap: () => _showComingSoon('Reportes de Viaje'),
                          ),
                          _buildNeumorphicCard(
                            icon: Icons.car_repair,
                            title: 'Vehículo',
                            subtitle: 'Estado del vehículo',
                            color: Colors.orange,
                            onTap: () => _showComingSoon('Estado del Vehículo'),
                          ),
                          _buildNeumorphicCard(
                            icon: Icons.schedule,
                            title: 'Horarios',
                            subtitle: 'Ver horarios',
                            color: Colors.indigo,
                            onTap: () => _showComingSoon('Horarios de Trabajo'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: const CustomBottomNavigationBar(currentIndex: 2),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '¡Bienvenido!',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              Text(
                _currentUser?.firstName ?? 'Conductor',
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
          NeumorphicButton(
            onTap: () => _showComingSoon('Notificaciones'),
            width: 50,
            height: 50,
            padding: const EdgeInsets.all(12),
            child: const Icon(
              Icons.notifications_outlined,
              color: Colors.black87,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNeumorphicCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return NeumorphicButton(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 24,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Flexible(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 2),
            Flexible(
              child: Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 10,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }


  void _showComingSoon(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Próximamente disponible'),
        backgroundColor: Colors.blue,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
