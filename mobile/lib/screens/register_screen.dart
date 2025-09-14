import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'package:fluttertoast/fluttertoast.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController emailCtrl = TextEditingController();
  final TextEditingController passCtrl = TextEditingController();
  final TextEditingController pass2Ctrl = TextEditingController();
  String role = 'cliente';
  bool loading = false;

  @override
  void dispose() {
    nameCtrl.dispose();
    emailCtrl.dispose();
    passCtrl.dispose();
    pass2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (passCtrl.text != pass2Ctrl.text) {
      Fluttertoast.showToast(msg: 'Las contraseñas no coinciden');
      return;
    }
    setState(() => loading = true);

    // Llamada a servicio (ajusta URL en auth_service)
    final res = await AuthService.register(
      username: nameCtrl.text.trim(),
      email: emailCtrl.text.trim(),
      phone: null,
      role: role,
      password: passCtrl.text,
    );

    setState(() => loading = false);

    if (res.success) {
      Fluttertoast.showToast(msg: 'Registro exitoso');
      Navigator.pop(context); // volver al login
    } else {
      Fluttertoast.showToast(msg: 'Error: ${res.message}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(12.0);

    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta'), backgroundColor: Colors.green),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: radius,
                  child: Image.asset('assets/banner.jpg', height: 140, fit: BoxFit.cover),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: nameCtrl,
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.person), hintText: 'Nombre completo', border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                  validator: (v) => v == null || v.isEmpty ? 'Ingresa nombre' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: emailCtrl,
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.email), hintText: 'Email o Teléfono', border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                  validator: (v) => v == null || v.isEmpty ? 'Ingresa email o teléfono' : null,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: passCtrl,
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.lock), hintText: 'Contraseña', border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                  obscureText: true,
                  validator: (v) => v != null && v.length >= 6 ? null : 'Mínimo 6 caracteres',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: pass2Ctrl,
                  decoration: InputDecoration(prefixIcon: const Icon(Icons.lock_outline), hintText: 'Confirmar contraseña', border: OutlineInputBorder(borderRadius: BorderRadius.circular(10))),
                  obscureText: true,
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    const Text('Rol:'),
                    const SizedBox(width: 12),
                    DropdownButton<String>(
                      value: role,
                      items: const [
                        DropdownMenuItem(value: 'cliente', child: Text('Cliente')),
                        DropdownMenuItem(value: 'conductor', child: Text('Conductor')),
                      ],
                      onChanged: (v) => setState(() => role = v ?? 'cliente'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: loading ? null : _register,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Registrar'),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}