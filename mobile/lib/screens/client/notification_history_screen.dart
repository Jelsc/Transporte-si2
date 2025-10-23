import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../utils/ip_detection.dart';
import '../../services/auth_service.dart';

class NotificationHistoryScreen extends StatefulWidget {
  const NotificationHistoryScreen({super.key});

  @override
  State<NotificationHistoryScreen> createState() =>
      _NotificationHistoryScreenState();
}

class _NotificationHistoryScreenState extends State<NotificationHistoryScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String? _error;
  int _unreadCount = 0;
  final _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final baseUrl = await IPDetection.getBaseUrl();
      final token = await _authService.getToken();

      print('🌐 Base URL: $baseUrl');
      print(
        '🔑 Token: ${token != null ? "Token encontrado (${token.length} chars)" : "Token NULL"}',
      );

      if (token == null) {
        setState(() {
          _error = 'No se encontró token de autenticación';
          _isLoading = false;
        });
        return;
      }

      // Obtener historial de notificaciones - usando endpoint específico
      final url = '$baseUrl/api/notificaciones/notificaciones/';
      print('📍 Intentando conectar a: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        // Soporta tanto array directo como objeto paginado con 'results'
        final notificaciones = data is List ? data : (data['results'] ?? []);
        setState(() {
          _notifications = List<Map<String, dynamic>>.from(notificaciones);
          _unreadCount = _notifications.where((n) => !n['fue_leida']).length;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Error al cargar notificaciones: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error de conexión: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(int notificationId, int index) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final token = await _authService.getToken();

      if (token == null) return;

      final response = await http.post(
        Uri.parse('$baseUrl/api/notificaciones/$notificationId/marcar_leida/'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          _notifications[index]['fue_leida'] = true;
          _notifications[index]['estado'] = 'leida';
          _unreadCount = _notifications.where((n) => !n['fue_leida']).length;
        });
      }
    } catch (e) {
      print('Error al marcar como leída: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final token = await _authService.getToken();

      if (token == null) return;

      final response = await http.post(
        Uri.parse('$baseUrl/api/notificaciones/marcar_todas_leidas/'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          for (var notification in _notifications) {
            notification['fue_leida'] = true;
            notification['estado'] = 'leida';
          }
          _unreadCount = 0;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Todas las notificaciones marcadas como leídas'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      print('Error al marcar todas como leídas: $e');
    }
  }

  String _formatDateTime(String? dateTimeStr) {
    if (dateTimeStr == null) return '';

    try {
      final dateTime = DateTime.parse(dateTimeStr);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 0) {
        return 'Hace ${difference.inDays} día${difference.inDays > 1 ? 's' : ''}';
      } else if (difference.inHours > 0) {
        return 'Hace ${difference.inHours} hora${difference.inHours > 1 ? 's' : ''}';
      } else if (difference.inMinutes > 0) {
        return 'Hace ${difference.inMinutes} minuto${difference.inMinutes > 1 ? 's' : ''}';
      } else {
        return 'Ahora mismo';
      }
    } catch (e) {
      return dateTimeStr;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'alta':
        return Colors.orange;
      case 'critica':
        return Colors.red;
      case 'baja':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'nuevo_viaje':
        return Icons.directions_car;
      case 'viaje_cancelado':
        return Icons.cancel;
      case 'recordatorio':
        return Icons.schedule;
      case 'sistema':
        return Icons.settings;
      default:
        return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de Notificaciones'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          if (_unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all),
              onPressed: _markAllAsRead,
              tooltip: 'Marcar todas como leídas',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNotifications,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadNotifications,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            )
          : _notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No tienes notificaciones',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Las notificaciones aparecerán aquí',
                    style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                if (_unreadCount > 0)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: Colors.blue[50],
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[700]),
                        const SizedBox(width: 8),
                        Text(
                          'Tienes $_unreadCount notificación${_unreadCount > 1 ? 'es' : ''} sin leer',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadNotifications,
                    child: ListView.separated(
                      itemCount: _notifications.length,
                      separatorBuilder: (context, index) =>
                          const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        final isRead = notification['fue_leida'] ?? false;
                        final priority = notification['prioridad'] ?? 'normal';
                        final typeCode = notification['tipo_info']?['codigo'];

                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _getPriorityColor(
                                priority,
                              ).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              _getNotificationIcon(typeCode),
                              color: _getPriorityColor(priority),
                              size: 24,
                            ),
                          ),
                          title: Text(
                            notification['titulo'] ?? 'Sin título',
                            style: TextStyle(
                              fontWeight: isRead
                                  ? FontWeight.normal
                                  : FontWeight.bold,
                              color: isRead ? Colors.grey[700] : Colors.black,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                notification['mensaje'] ?? 'Sin mensaje',
                                style: TextStyle(
                                  color: isRead
                                      ? Colors.grey[600]
                                      : Colors.grey[800],
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatDateTime(notification['fecha_creacion']),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!isRead)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              const SizedBox(width: 8),
                              if (priority == 'alta' || priority == 'critica')
                                Icon(
                                  Icons.priority_high,
                                  color: _getPriorityColor(priority),
                                  size: 16,
                                ),
                            ],
                          ),
                          onTap: !isRead
                              ? () => _markAsRead(notification['id'], index)
                              : null,
                          tileColor: isRead ? null : Colors.blue[25],
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
