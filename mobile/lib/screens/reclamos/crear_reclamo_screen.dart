import 'package:flutter/material.dart';
import '../../services/reclamo_service.dart';
import '../../widgets/neumorphic_card.dart';

class CrearReclamoScreen extends StatefulWidget {
  const CrearReclamoScreen({super.key});

  @override
  State<CrearReclamoScreen> createState() => _CrearReclamoScreenState();
}

class _CrearReclamoScreenState extends State<CrearReclamoScreen> {
  final ReclamoService _reclamoService = ReclamoService();
  final _formKey = GlobalKey<FormState>();

  List<ReclamoCategoria> _categorias = [];
  bool _isLoading = false;
  bool _cargandoCategorias = true;

  // Controladores
  final _tituloController = TextEditingController();
  final _descripcionController = TextEditingController();
  final _numeroGuiaController = TextEditingController();
  final _servicioController = TextEditingController();

  // Valores del formulario
  int? _categoriaSeleccionada;
  String _prioridadSeleccionada = 'media';

  @override
  void initState() {
    super.initState();
    _cargarCategorias();
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _descripcionController.dispose();
    _numeroGuiaController.dispose();
    _servicioController.dispose();
    super.dispose();
  }

  Future<void> _cargarCategorias() async {
    final response = await _reclamoService.getCategorias();
    if (response.success && response.data != null) {
      setState(() {
        _categorias = response.data!;
        _cargandoCategorias = false;
      });
    } else {
      setState(() {
        _cargandoCategorias = false;
      });
      _mostrarError(response.error ?? 'Error al cargar categorias');
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _mostrarExito(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _crearReclamo() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_categoriaSeleccionada == null) {
      _mostrarError('Por favor selecciona una categoria');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final reclamoData = ReclamoCreateData(
      titulo: _tituloController.text.trim(),
      descripcion: _descripcionController.text.trim(),
      categoria: _categoriaSeleccionada!,
      numeroGuia: _numeroGuiaController.text.trim().isNotEmpty
          ? _numeroGuiaController.text.trim()
          : null,
      servicioRelacionado: _servicioController.text.trim().isNotEmpty
          ? _servicioController.text.trim()
          : null,
      prioridad: _prioridadSeleccionada,
    );

    final response = await _reclamoService.createReclamo(reclamoData);

    setState(() {
      _isLoading = false;
    });

    if (response.success && response.data != null) {
      _mostrarExito('Reclamo creado exitosamente');
      Navigator.pop(context, true); // Retornar exito
    } else {
      _mostrarError(response.error ?? 'Error al crear reclamo');
    }
  }

  Widget _buildCampoTexto({
    required String label,
    required TextEditingController controller,
    required String? Function(String?) validator,
    int maxLines = 1,
    int? maxLength,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          maxLines: maxLines,
          maxLength: maxLength,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSelectorCategoria() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Categoria *',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        _cargandoCategorias
            ? const CircularProgressIndicator()
            : Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonFormField<int>(
                  value: _categoriaSeleccionada,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: _categorias.map((categoria) {
                    return DropdownMenuItem<int>(
                      value: categoria.id,
                      child: Text(categoria.nombre),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _categoriaSeleccionada = value;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Por favor selecciona una categoria';
                    }
                    return null;
                  },
                  hint: const Text('Selecciona una categoria'),
                ),
              ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSelectorPrioridad() {
  const prioridades = [
    {'value': 'baja', 'label': 'Baja', 'color': Colors.grey},
    {'value': 'media', 'label': 'Media', 'color': Colors.blue},
    {'value': 'alta', 'label': 'Alta', 'color': Colors.orange},
    {'value': 'urgente', 'label': 'Urgente', 'color': Colors.red},
  ];

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text(
        'Prioridad',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
      ),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        children: prioridades.map((prioridad) {
          // CASTING EXPLÍCITO EN TODAS LAS PROPIEDADES
          final String prioridadValue = prioridad['value'] as String;
          final String prioridadLabel = prioridad['label'] as String;
          final Color prioridadColor = prioridad['color'] as Color;
          
          final isSelected = _prioridadSeleccionada == prioridadValue;
          
          return ChoiceChip(
            label: Text(prioridadLabel),  // ✅ Ya no necesita !
            selected: isSelected,
            onSelected: (selected) {
              setState(() {
                _prioridadSeleccionada = prioridadValue;  // ✅ Ya no necesita !
              });
            },
            backgroundColor: Colors.white,
            selectedColor: prioridadColor.withOpacity(0.2),  // ✅ Usa variable casteada
            labelStyle: TextStyle(
              color: isSelected ? prioridadColor : Colors.grey,  // ✅ Usa variable casteada
              fontWeight: FontWeight.w600,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: BorderSide(
                color: isSelected ? prioridadColor : Colors.grey.shade300,  // ✅ Usa variable casteada
              ),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 16),
    ],
  );
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Nuevo Reclamo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _isLoading ? null : _crearReclamo,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ListView(
                  children: [
                    NeumorphicCard(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Informacion del Reclamo',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 20),
                            // Titulo
                            _buildCampoTexto(
                              label: 'Titulo *',
                              controller: _tituloController,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'El titulo es requerido';
                                }
                                if (value.trim().length < 5) {
                                  return 'El titulo debe tener al menos 5 caracteres';
                                }
                                return null;
                              },
                              maxLength: 200,
                            ),
                            // Descripcion
                            _buildCampoTexto(
                              label: 'Descripcion *',
                              controller: _descripcionController,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'La descripcion es requerida';
                                }
                                if (value.trim().length < 10) {
                                  return 'La descripcion debe tener al menos 10 caracteres';
                                }
                                return null;
                              },
                              maxLines: 4,
                              maxLength: 1000,
                            ),
                            // Categoria
                            _buildSelectorCategoria(),
                            // Prioridad
                            _buildSelectorPrioridad(),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    NeumorphicCard(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Informacion Adicional (Opcional)',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Numero de guia
                            _buildCampoTexto(
                              label: 'Numero de Guia',
                              controller: _numeroGuiaController,
                              validator: (value) => null,
                              maxLength: 50,
                            ),
                            // Servicio relacionado
                            _buildCampoTexto(
                              label: 'Servicio Relacionado',
                              controller: _servicioController,
                              validator: (value) => null,
                              maxLength: 100,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Boton de crear
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _crearReclamo,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Crear Reclamo',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }
}