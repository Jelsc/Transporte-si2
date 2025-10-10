import 'package:flutter/material.dart';
import '../screens/client/client_home_screen.dart';
import '../screens/user/user_settings_screen.dart';

class CustomBottomNavigationBar extends StatelessWidget {
  final int currentIndex;
  
  const CustomBottomNavigationBar({
    super.key,
    this.currentIndex = 2, // Por defecto, home está activo
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
          _buildNavItem(context, Icons.directions_car, 0),
          _buildNavItem(context, Icons.grid_view, 1),
          _buildNavItem(context, Icons.home, 2),
          _buildNavItem(context, Icons.arrow_back, 3),
          _buildNavItem(context, Icons.person, 4),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, IconData icon, int index) {
    final isActive = index == currentIndex;
    
    return GestureDetector(
      onTap: () => _handleNavigation(context, index),
      child: Container(
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
    );
  }

  void _handleNavigation(BuildContext context, int index) {
    switch (index) {
      case 2: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ClientHomeScreen()),
        );
        break;
      case 4: // Perfil
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const UserSettingsScreen()),
        );
        break;
      default:
        _showComingSoon(context, 'Navegación');
    }
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - Próximamente disponible'),
        backgroundColor: Colors.blue,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
