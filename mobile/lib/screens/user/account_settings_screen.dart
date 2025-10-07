import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../services/account_settings_service.dart';
import '../../widgets/neumorphic_card.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _authService = AuthService();
  final _accountSettingsService = AccountSettingsService();
  User? _currentUser;
  bool _isLoading = true;
  
  // Estados para cambio de email
  final _newEmailController = TextEditingController();
  bool _isEmailLoading = false;
  
  // Estados para cambio de contraseña
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordLoading = false;
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _newEmailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
      }
    }
  }

  Future<void> _changeEmail() async {
    if (_newEmailController.text.trim().isEmpty) {
      _showError('Por favor ingresa un email válido');
      return;
    }

    try {
      setState(() => _isEmailLoading = true);
      
      final response = await _accountSettingsService.addEmailAddress(_newEmailController.text.trim());
      
      if (mounted) {
        if (response['success']) {
          _showSuccess('Se ha enviado un email de verificación a la nueva dirección');
          _newEmailController.clear();
        } else {
          _showError(response['error'] ?? 'Error al cambiar el email');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Error al cambiar el email: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isEmailLoading = false);
      }
    }
  }

  Future<void> _changePassword() async {
    if (_currentPasswordController.text.isEmpty ||
        _newPasswordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      _showError('Todos los campos son requeridos');
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (_newPasswordController.text.length < 8) {
      _showError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validaciones adicionales para contraseñas más seguras
    if (_newPasswordController.text.toLowerCase() == 'password' ||
        _newPasswordController.text.toLowerCase() == '12345678' ||
        _newPasswordController.text.toLowerCase() == 'qwerty123' ||
        _newPasswordController.text.toLowerCase() == 'admin123' ||
        _newPasswordController.text.toLowerCase() == 'test1234') {
      _showError('Esta contraseña es demasiado común. Por favor elige una contraseña más segura');
      return;
    }

    // Verificar que no sea completamente numérica
    if (RegExp(r'^\d+$').hasMatch(_newPasswordController.text)) {
      _showError('La contraseña no puede ser completamente numérica');
      return;
    }

    try {
      setState(() => _isPasswordLoading = true);
      
      final response = await _accountSettingsService.changePassword(
        oldPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
        newPasswordConfirm: _confirmPasswordController.text,
      );
      
      if (mounted) {
        if (response['success']) {
          _showSuccess('Tu contraseña ha sido cambiada exitosamente');
          _currentPasswordController.clear();
          _newPasswordController.clear();
          _confirmPasswordController.clear();
        } else {
          _showError(response['error'] ?? 'Error al cambiar la contraseña');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Error al cambiar la contraseña: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isPasswordLoading = false);
      }
    }
  }

  Future<void> _requestPasswordReset() async {
    if (_currentUser?.email == null) {
      _showError('No se encontró un email asociado a la cuenta');
      return;
    }

    try {
      setState(() => _isPasswordLoading = true);
      
      final response = await _accountSettingsService.requestPasswordReset(_currentUser!.email);
      
      if (mounted) {
        if (response['success']) {
          _showSuccess('Se ha enviado un email con instrucciones para restablecer tu contraseña');
        } else {
          _showError(response['error'] ?? 'Error al enviar el email de restablecimiento');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Error al enviar el email de restablecimiento: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isPasswordLoading = false);
      }
    }
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
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
                  // Header
                  _buildHeader(),
                  
                  // Contenido principal con scroll
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Sección de Email
                          _buildSettingsSection(
                            title: 'Correo Electrónico',
                            icon: Icons.email,
                            color: Colors.blue,
                            children: [
                              _buildEmailChangeForm(),
                              const SizedBox(height: 12),
                              _buildSettingsItem(
                                title: 'Verificar correo',
                                subtitle: 'Reenviar email de verificación',
                                icon: Icons.verified_user,
                                onTap: () => _showComingSoon('Verificar Email'),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 20),
                          
                          // Sección de Contraseña
                          _buildSettingsSection(
                            title: 'Contraseña',
                            icon: Icons.lock,
                            color: Colors.green,
                            children: [
                              _buildPasswordChangeForm(),
                              const SizedBox(height: 12),
                              _buildSettingsItem(
                                title: 'Restablecer contraseña',
                                subtitle: 'Enviar email de restablecimiento',
                                icon: Icons.restore,
                                onTap: _requestPasswordReset,
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 20),
                          
                          // Sección de Privacidad
                          _buildSettingsSection(
                            title: 'Privacidad y Seguridad',
                            icon: Icons.security,
                            color: Colors.orange,
                            children: [
                              _buildSettingsItem(
                                title: 'Configuración de privacidad',
                                subtitle: 'Gestionar tu privacidad',
                                icon: Icons.privacy_tip,
                                onTap: () => _showComingSoon('Privacidad'),
                              ),
                              _buildSettingsItem(
                                title: 'Sesiones activas',
                                subtitle: 'Ver y cerrar sesiones',
                                icon: Icons.devices,
                                onTap: () => _showComingSoon('Sesiones Activas'),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 20),
                          
                          // Sección de Ayuda
                          _buildSettingsSection(
                            title: 'Ayuda y Soporte',
                            icon: Icons.help,
                            color: Colors.purple,
                            children: [
                              _buildSettingsItem(
                                title: 'Centro de ayuda',
                                subtitle: 'Encuentra respuestas a tus preguntas',
                                icon: Icons.help_center,
                                onTap: () => _showComingSoon('Centro de Ayuda'),
                              ),
                              _buildSettingsItem(
                                title: 'Contactar soporte',
                                subtitle: 'Obtener ayuda personalizada',
                                icon: Icons.support_agent,
                                onTap: () => _showComingSoon('Soporte'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Configuraciones de Cuenta',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          NeumorphicButton(
            onTap: () => Navigator.pop(context),
            width: 50,
            height: 50,
            padding: const EdgeInsets.all(12),
            child: const Icon(
              Icons.arrow_back,
              color: Colors.black87,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection({
    required String title,
    required IconData icon,
    required Color color,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  Widget _buildEmailChangeForm() {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cambiar correo electrónico',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _newEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Nuevo correo electrónico',
                hintText: 'Ingresa tu nuevo email',
                prefixIcon: const Icon(Icons.email, color: Colors.blue),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.blue),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isEmailLoading ? null : _changeEmail,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isEmailLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Cambiar Email'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordChangeForm() {
    return NeumorphicCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cambiar contraseña',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _currentPasswordController,
              obscureText: !_showCurrentPassword,
              decoration: InputDecoration(
                labelText: 'Contraseña actual',
                hintText: 'Ingresa tu contraseña actual',
                prefixIcon: const Icon(Icons.lock, color: Colors.green),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showCurrentPassword ? Icons.visibility_off : Icons.visibility,
                    color: Colors.grey.shade600,
                  ),
                  onPressed: () => setState(() => _showCurrentPassword = !_showCurrentPassword),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.green),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _newPasswordController,
              obscureText: !_showNewPassword,
              decoration: InputDecoration(
                labelText: 'Nueva contraseña',
                hintText: 'Ingresa tu nueva contraseña',
                prefixIcon: const Icon(Icons.lock_outline, color: Colors.green),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showNewPassword ? Icons.visibility_off : Icons.visibility,
                    color: Colors.grey.shade600,
                  ),
                  onPressed: () => setState(() => _showNewPassword = !_showNewPassword),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.green),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmPasswordController,
              obscureText: !_showConfirmPassword,
              decoration: InputDecoration(
                labelText: 'Confirmar nueva contraseña',
                hintText: 'Confirma tu nueva contraseña',
                prefixIcon: const Icon(Icons.lock_outline, color: Colors.green),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showConfirmPassword ? Icons.visibility_off : Icons.visibility,
                    color: Colors.grey.shade600,
                  ),
                  onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.green),
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '• La contraseña debe tener al menos 8 caracteres\n• No puede ser completamente numérica\n• No puede ser muy similar a tu información personal\n• No puede ser una contraseña común (password, 12345678, etc.)\n• Debe incluir letras y números',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isPasswordLoading ? null : _changePassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isPasswordLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Cambiar Contraseña'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return NeumorphicButton(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: Colors.grey.shade600, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.grey.shade400, size: 16),
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
