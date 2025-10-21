import 'package:flutter/material.dart';
import 'package:mobile/services/encomienda_service.dart';
import 'package:mobile/models/crear_encomienda_model.dart';

class CrearEncomiendaScreen extends StatefulWidget {
  const CrearEncomiendaScreen({super.key});

  @override
  State<CrearEncomiendaScreen> createState() => _CrearEncomiendaScreenState();
}

class _CrearEncomiendaScreenState extends State<CrearEncomiendaScreen> {
  final _formKey = GlobalKey<FormState>();
  final EncomiendaService _encomiendaService = EncomiendaService();
  
  // Controladores
  final TextEditingController _remitenteNombreController = TextEditingController();
  final TextEditingController _remitenteTelefonoController = TextEditingController();
  final TextEditingController _remitenteDireccionController = TextEditingController();
  final TextEditingController _destinatarioNombreController = TextEditingController();
  final TextEditingController _destinatarioTelefonoController = TextEditingController();
  final TextEditingController _destinoCiudadController = TextEditingController();
  final TextEditingController _destinoDireccionController = TextEditingController();
  final TextEditingController _descripcionController = TextEditingController();
  final TextEditingController _pesoController = TextEditingController();
  
  final double _precioCalculado = 0.0;
  bool _creando = false;

  final List<String> _ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  // MÉTODOS DE CONSTRUCCIÓN
  Widget _buildLoading() {
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildSeccion(String titulo, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titulo, 
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
        ),
        const SizedBox(height: 10),
        ...children,
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String? Function(String?) validator,
    IconData? icon,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        prefixIcon: icon != null ? Icon(icon) : null,
      ),
      validator: validator,
    );
  }

  Widget _buildDropdownCiudad() {
    return DropdownButtonFormField<String>(
      value: _destinoCiudadController.text.isEmpty ? null : _destinoCiudadController.text,
      decoration: const InputDecoration(
        labelText: 'Ciudad de destino *',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.location_city),
      ),
      items: _ciudades.map((String ciudad) {
        return DropdownMenuItem<String>(
          value: ciudad,
          child: Text(ciudad),
        );
      }).toList(),
      onChanged: (String? newValue) {
        setState(() {
          _destinoCiudadController.text = newValue ?? '';
        });
      },
      validator: _validarRequerido,
    );
  }

  Widget _buildPrecioWidget() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.attach_money, color: Colors.green),
          const SizedBox(width: 8),
          const Text(
            'Precio estimado:',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const Spacer(),
          Text(
            'Bs. ${_precioCalculado.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcciones() {
    return Column(
      children: [
        ElevatedButton(
          onPressed: _calcularPrecio,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
          ),
          child: const Text('Calcular Precio'),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _crearEncomienda,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
          ),
          child: const Text('Crear Encomienda'),
        ),
      ],
    );
  }

  // MÉTODOS DE LÓGICA
  String? _validarRequerido(String? value) {
    if (value == null || value.isEmpty) return 'Este campo es requerido';
    return null;
  }

  String? _validarPeso(String? value) {
    if (value == null || value.isEmpty) return 'El peso es requerido';
    final peso = double.tryParse(value);
    if (peso == null || peso <= 0) return 'Ingrese un peso válido';
    return null;
  }

  void _calcularPrecio() {
    if (_formKey.currentState!.validate()) {
      // Lógica para calcular precio basado en peso y destino
      final peso = double.tryParse(_pesoController.text) ?? 0;
      final precioCalculado = 10.0 + (peso * 5.0);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Precio calculado: Bs. ${precioCalculado.toStringAsFixed(2)}'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _crearEncomienda() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _creando = true;
      });

      try {
        // Crear el objeto request usando el modelo
        final request = CrearEncomiendaRequest(
          remitenteNombre: _remitenteNombreController.text,
          remitenteTelefono: _remitenteTelefonoController.text,
          remitenteDireccion: _remitenteDireccionController.text.isEmpty ? null : _remitenteDireccionController.text,
          destinatarioNombre: _destinatarioNombreController.text,
          destinatarioTelefono: _destinatarioTelefonoController.text,
          destinoCiudad: _destinoCiudadController.text,
          destinoDireccion: _destinoDireccionController.text,
          descripcion: _descripcionController.text,
          peso: double.parse(_pesoController.text),
        );

        // Validar el request
        final error = request.validar();
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error),
              backgroundColor: Colors.red,
            ),
          );
          setState(() {
            _creando = false;
          });
          return;
        }

        final result = await _encomiendaService.crearEncomienda(request);

        if (mounted) {
          setState(() {
            _creando = false;
          });

          if (result.success) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(result.message ?? 'Encomienda creada exitosamente'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(result.error ?? 'Error al crear encomienda'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _creando = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nueva Encomienda'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: _creando
          ? _buildLoading()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Información del remitente
                    _buildSeccion(
                      'Información del Remitente',
                      [
                        _buildTextField(
                          controller: _remitenteNombreController,
                          label: 'Nombre completo *',
                          icon: Icons.person,
                          validator: _validarRequerido,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _remitenteTelefonoController,
                          label: 'Teléfono *',
                          icon: Icons.phone,
                          keyboardType: TextInputType.phone,
                          validator: _validarRequerido,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _remitenteDireccionController,
                          label: 'Dirección (opcional)',
                          icon: Icons.location_on,
                          maxLines: 2,
                          validator: (value) => null,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Información del destinatario
                    _buildSeccion(
                      'Información del Destinatario',
                      [
                        _buildTextField(
                          controller: _destinatarioNombreController,
                          label: 'Nombre completo *',
                          icon: Icons.person,
                          validator: _validarRequerido,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _destinatarioTelefonoController,
                          label: 'Teléfono *',
                          icon: Icons.phone,
                          keyboardType: TextInputType.phone,
                          validator: _validarRequerido,
                        ),
                        const SizedBox(height: 12),
                        _buildDropdownCiudad(),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _destinoDireccionController,
                          label: 'Dirección de entrega *',
                          icon: Icons.location_on,
                          maxLines: 3,
                          validator: _validarRequerido,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Detalles del paquete
                    _buildSeccion(
                      'Detalles del Paquete',
                      [
                        _buildTextField(
                          controller: _descripcionController,
                          label: 'Descripción del contenido *',
                          icon: Icons.description,
                          maxLines: 3,
                          validator: _validarRequerido,
                        ),
                        const SizedBox(height: 12),
                        _buildTextField(
                          controller: _pesoController,
                          label: 'Peso (kg) *',
                          icon: Icons.fitness_center,
                          keyboardType: TextInputType.number,
                          validator: _validarPeso,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Precio calculado
                    if (_precioCalculado > 0) ...[
                      _buildPrecioWidget(),
                      const SizedBox(height: 20),
                    ],
                    
                    // Botones de acción
                    _buildAcciones(),
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _remitenteNombreController.dispose();
    _remitenteTelefonoController.dispose();
    _remitenteDireccionController.dispose();
    _destinatarioNombreController.dispose();
    _destinatarioTelefonoController.dispose();
    _destinoCiudadController.dispose();
    _destinoDireccionController.dispose();
    _descripcionController.dispose();
    _pesoController.dispose();
    super.dispose();
  }
}