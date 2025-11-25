import 'package:flutter/material.dart';
import '../screens/conductor/conductor_home_screen.dart';
import '../screens/conductor/viajes_asignados_screen.dart';
import '../screens/conductor/perfil_conductor_screen.dart';

class ConductorBottomNavigationBar extends StatelessWidget {
  final int currentIndex;

  const ConductorBottomNavigationBar({
    super.key,
    this.currentIndex = 0, // 0=Home por defecto
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade300,
            offset: const Offset(0, -2),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(context, Icons.home, 'Inicio', 0),
          _buildNavItem(context, Icons.assignment, 'Mis Viajes', 1),
          _buildNavItem(context, Icons.person, 'Perfil', 2),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    IconData icon,
    String label,
    int index,
  ) {
    final isActive = index == currentIndex;

    return GestureDetector(
      onTap: () => _handleNavigation(context, index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: Colors.grey.shade300,
                        offset: const Offset(4, 4),
                        blurRadius: 8,
                        spreadRadius: 0,
                      ),
                      BoxShadow(
                        color: Colors.white,
                        offset: const Offset(-4, -4),
                        blurRadius: 8,
                        spreadRadius: 0,
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              icon,
              color: isActive ? Colors.blue : Colors.black54,
              size: 24,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isActive ? Colors.blue : Colors.black54,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  void _handleNavigation(BuildContext context, int index) {
    // No navegar si ya estamos en esa pantalla
    if (index == currentIndex) return;

    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ConductorHomeScreen()),
        );
        break;
      case 1: // Mis Viajes
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const ViajesAsignadosScreen(),
          ),
        );
        break;
      case 2: // Perfil
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const PerfilConductorScreen(),
          ),
        );
        break;
    }
  }
}
