import 'package:flutter/material.dart';
import '../services/notification_service.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends State<NotificationSettingsScreen> {
  bool _notificationsEnabled = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkNotificationStatus();
  }

  Future<void> _checkNotificationStatus() async {
    try {
      final enabled = await NotificationService.areNotificationsEnabled();
      setState(() {
        _notificationsEnabled = enabled;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print('Error checking notification status: $e');
    }
  }

  Future<void> _toggleNotifications() async {
    if (_notificationsEnabled) {
      // No podemos desactivar desde la app, enviar a configuración
      _showSettingsDialog();
    } else {
      // Solicitar permisos
      final granted =
          await NotificationService.requestNotificationPermissions();
      setState(() => _notificationsEnabled = granted);

      if (granted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notificaciones habilitadas')),
        );
      }
    }
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Configuración de Notificaciones'),
        content: const Text(
          'Para desactivar las notificaciones, ve a Configuración > Aplicaciones > Transport App > Notificaciones',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Entendido'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración de Notificaciones'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Estado de las Notificaciones',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          SwitchListTile(
                            title: const Text('Notificaciones Push'),
                            subtitle: Text(
                              _notificationsEnabled
                                  ? 'Recibirás notificaciones sobre viajes y actualizaciones'
                                  : 'No recibirás notificaciones push',
                            ),
                            value: _notificationsEnabled,
                            onChanged: (_) => _toggleNotifications(),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Información',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildInfoItem(
                            Icons.info_outline,
                            'Token FCM',
                            NotificationService.fcmToken ?? 'No disponible',
                          ),
                          const SizedBox(height: 8),
                          _buildInfoItem(
                            Icons.notifications,
                            'Estado',
                            _notificationsEnabled
                                ? 'Habilitadas'
                                : 'Deshabilitadas',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Tipos de Notificaciones:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  _buildNotificationTypeCard(
                    Icons.directions_bus,
                    'Nuevos Viajes',
                    'Te notificamos cuando hay nuevos viajes disponibles',
                  ),
                  _buildNotificationTypeCard(
                    Icons.cancel,
                    'Cambios de Viaje',
                    'Recibe alertas sobre cancelaciones o cambios',
                  ),
                  _buildNotificationTypeCard(
                    Icons.schedule,
                    'Recordatorios',
                    'Recordatorios sobre tus viajes próximos',
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoItem(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
              Text(
                value,
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationTypeCard(
    IconData icon,
    String title,
    String description,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title),
        subtitle: Text(description),
        dense: true,
      ),
    );
  }
}
