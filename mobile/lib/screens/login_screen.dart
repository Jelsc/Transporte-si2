import 'package:flutter/material.dart';
import 'register_screen.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Logo y título
              Row(
                children: const [
                  CircleAvatar(
                    backgroundColor: Colors.green,
                    radius: 20,
                  ),
                  SizedBox(width: 8),
                  Text("TransBolivia", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  Spacer(),
                  Icon(Icons.language),
                ],
              ),
              const SizedBox(height: 20),

              // Imagen
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  "https://picsum.photos/400/200", // aquí va tu imagen
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 12),

              const Text("Viajes y encomiendas en un solo lugar",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text("Compra pasajes, envía paquetes y haz seguimiento en tiempo real.",
                  style: TextStyle(color: Colors.grey)),

              const SizedBox(height: 20),

              // Login form
              const Text("Bienvenido a Transporte-SI2"),
              const SizedBox(height: 8),
              TextField(
                decoration: InputDecoration(
                  hintText: "Email o Teléfono",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                obscureText: true,
                decoration: InputDecoration(
                  hintText: "Contraseña",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {},
                child: const Text("Iniciar sesión"),
              ),

              const SizedBox(height: 8),
              TextButton(
                onPressed: () {},
                child: const Text("¿Olvidaste tu contraseña?"),
              ),

              const Divider(height: 30),

              // Login con Google/Facebook
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  OutlinedButton(
                    onPressed: () {},
                    child: const Text("Google"),
                  ),
                  OutlinedButton(
                    onPressed: () {},
                    child: const Text("Facebook"),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Botón de registro
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const RegisterScreen()),
                  );
                },
                child: const Text("Crear cuenta"),
              ),

              const SizedBox(height: 20),

              // Cliente/Conductor
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  OutlinedButton(onPressed: () {}, child: const Text("Cliente")),
                  OutlinedButton(onPressed: () {}, child: const Text("Conductor")),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
