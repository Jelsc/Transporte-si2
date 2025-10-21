import 'package:flutter/material.dart';
import '../../widgets/neumorphic_card.dart';
import '../../services/viajes_service.dart';
import '../../widgets/bottom_navigation_bar.dart';

class ViajesDisponiblesScreen extends StatefulWidget {
  const ViajesDisponiblesScreen({super.key});

  @override
  State<ViajesDisponiblesScreen> createState() => _ViajesDisponiblesScreenState();
}

class _ViajesDisponiblesScreenState extends State<ViajesDisponiblesScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ViajesService _viajesService = ViajesService();
  String _origenFilter = 'all';
  String _destinoFilter = 'all';
  String _fechaFilter = '';
  bool _isLoading = false;
  List<Map<String, dynamic>> _viajes = [];
  String? _errorMessage;

  final List<String> _ciudades = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 
    'Potosi', 'Tarija', 'Beni', 'Pando'
  ];

  @override
  void initState() {
    super.initState();
    _cargarViajes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _cargarViajes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _viajesService.getViajes(
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        origen: _origenFilter != 'all' ? _origenFilter : null,
        destino: _destinoFilter != 'all' ? _destinoFilter : null,
        fechaDesde: _fechaFilter.isNotEmpty ? _fechaFilter : null,
        estado: 'programado',
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
          if (response['success']) {
            final data = response['data'];
            if (data != null && data['results'] != null) {
              _viajes = List<Map<String, dynamic>>.from(data['results']);
            } else {
              _viajes = [];
            }
            _errorMessage = null;
          } else {
            _errorMessage = response['error'] ?? 'Error desconocido';
            _viajes = [];
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error de conexión: $e';
          _viajes = [];
        });
      }
    }
  }

  String _formatearFecha(String fecha) {
    final date = DateTime.parse(fecha);
    final dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    final meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return '${dias[date.weekday - 1]}, ${date.day} ${meses[date.month - 1]}';
  }

  String _formatearPrecio(double precio) {
    return 'Bs. ${precio.toStringAsFixed(0)}';
  }

  List<Widget> _obtenerComodidades(List<String> comodidades) {
    return comodidades.map((comodidad) {
      IconData icon;
      switch (comodidad) {
        case 'A/C':
          icon = Icons.ac_unit;
          break;
        case 'WiFi':
          icon = Icons.wifi;
          break;
        case 'Snack':
          icon = Icons.local_cafe;
          break;
        default:
          icon = Icons.check;
      }
      
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: Colors.blue.shade700),
            const SizedBox(width: 4),
            Text(
              comodidad,
              style: TextStyle(
                fontSize: 10,
                color: Colors.blue.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  void _limpiarFiltros() {
    setState(() {
      _searchController.clear();
      _origenFilter = 'all';
      _destinoFilter = 'all';
      _fechaFilter = '';
    });
    _cargarViajes();
  }

  bool _tieneFiltrosActivos() {
    return _searchController.text.isNotEmpty ||
           _origenFilter != 'all' ||
           _destinoFilter != 'all' ||
           _fechaFilter.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),
            
            // Contenido con scroll
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    // Hero Section
                    _buildHeroSection(),
                    
                    const SizedBox(height: 20),
                    
                    // Filtros
                    _buildFiltros(),
                    
                    const SizedBox(height: 20),
                    
                    // Resultados
                    _buildResultados(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const CustomBottomNavigationBar(currentIndex: 1),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Viajes Disponibles',
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

  Widget _buildHeroSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blue.shade200,
            Colors.blue.shade100,
            Colors.blue.shade50,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Encuentra tu viaje perfecto',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Descubre las mejores opciones de transporte entre ciudades de Bolivia',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade700,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFiltros() {
    return NeumorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Buscar Viajes',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              if (_tieneFiltrosActivos())
                GestureDetector(
                  onTap: _limpiarFiltros,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: const Text(
                      'Limpiar',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.orange,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Búsqueda
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Buscar por destino, origen o vehículo...',
                border: InputBorder.none,
                prefixIcon: Icon(Icons.search, size: 20, color: Colors.grey),
              ),
              onChanged: (value) => _cargarViajes(),
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Filtros en fila
          Row(
            children: [
              // Origen
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _origenFilter,
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: 'all', child: Text('Desde')),
                        ..._ciudades.map((ciudad) => DropdownMenuItem(value: ciudad, child: Text(ciudad))),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _origenFilter = value ?? 'all';
                        });
                        _cargarViajes();
                      },
                    ),
                  ),
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Destino
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _destinoFilter,
                      isExpanded: true,
                      items: [
                        const DropdownMenuItem(value: 'all', child: Text('Hacia')),
                        ..._ciudades.map((ciudad) => DropdownMenuItem(value: ciudad, child: Text(ciudad))),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _destinoFilter = value ?? 'all';
                        });
                        _cargarViajes();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Fecha
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Fecha de viaje',
                border: InputBorder.none,
                prefixIcon: Icon(Icons.calendar_today, size: 20, color: Colors.grey),
              ),
              readOnly: true,
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                  setState(() {
                    _fechaFilter = date.toIso8601String().split('T')[0];
                  });
                  _cargarViajes();
                }
              },
              controller: TextEditingController(
                text: _fechaFilter.isNotEmpty 
                  ? _formatearFecha(_fechaFilter)
                  : '',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultados() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Viajes Disponibles',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _isLoading ? 'Buscando viajes...' : '${_viajes.length} viajes encontrados',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 16),
        
        if (_isLoading)
          _buildLoadingCards()
        else if (_errorMessage != null)
          _buildErrorState()
        else if (_viajes.isEmpty)
          _buildEmptyState()
        else
          _buildViajesList(),
      ],
    );
  }

  Widget _buildLoadingCards() {
    return Column(
      children: List.generate(3, (index) => 
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(height: 20, color: Colors.grey.shade200),
              const SizedBox(height: 8),
              Container(height: 16, color: Colors.grey.shade200),
              const SizedBox(height: 8),
              Container(height: 16, color: Colors.grey.shade200),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
          const SizedBox(height: 16),
          const Text(
            'Error al cargar viajes',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Error desconocido',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          NeumorphicButton(
            onTap: _cargarViajes,
            child: const Text(
              'Reintentar',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.blue,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(Icons.directions_bus, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          const Text(
            'No se encontraron viajes',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Intenta ajustar tus filtros de búsqueda',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          NeumorphicButton(
            onTap: _limpiarFiltros,
            child: const Text(
              'Limpiar filtros',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.blue,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViajesList() {
    return Column(
      children: _viajes.map((viaje) => _buildViajeCard(viaje)).toList(),
    );
  }

  Widget _buildViajeCard(Map<String, dynamic> viaje) {
    // Extraer datos del viaje
    final origen = viaje['origen'] ?? 'N/A';
    final destino = viaje['destino'] ?? 'N/A';
    final fecha = viaje['fecha'] ?? '';
    final hora = viaje['hora'] ?? '';
    
    // Manejar precio que puede venir como String, double, int o num
    double precio = 0.0;
    if (viaje['precio'] != null) {
      if (viaje['precio'] is String) {
        precio = double.tryParse(viaje['precio']) ?? 0.0;
      } else if (viaje['precio'] is double) {
        precio = viaje['precio'];
      } else if (viaje['precio'] is int) {
        precio = (viaje['precio'] as int).toDouble();
      } else if (viaje['precio'] is num) {
        // Manejar el caso de num (que puede ser int o double)
        precio = (viaje['precio'] as num).toDouble();
      } else {
        // Como último recurso, convertir a string y luego a double
        precio = double.tryParse(viaje['precio'].toString()) ?? 0.0;
      }
    }
    
    // Manejar asientos disponibles que puede venir como String, int, double o num
    int asientosDisponibles = 0;
    if (viaje['asientos_disponibles'] != null) {
      if (viaje['asientos_disponibles'] is String) {
        asientosDisponibles = int.tryParse(viaje['asientos_disponibles']) ?? 0;
      } else if (viaje['asientos_disponibles'] is int) {
        asientosDisponibles = viaje['asientos_disponibles'];
      } else if (viaje['asientos_disponibles'] is double) {
        asientosDisponibles = (viaje['asientos_disponibles'] as double).toInt();
      } else if (viaje['asientos_disponibles'] is num) {
        // Manejar el caso de num (que puede ser int o double)
        asientosDisponibles = (viaje['asientos_disponibles'] as num).toInt();
      } else {
        // Como último recurso, convertir a string y luego a int
        asientosDisponibles = int.tryParse(viaje['asientos_disponibles'].toString()) ?? 0;
      }
    }
    
    // Información del vehículo
    String vehiculoNombre = 'Vehículo';
    List<String> comodidades = [];
    
    if (viaje['vehiculo'] != null) {
      if (viaje['vehiculo'] is Map) {
        final vehiculo = viaje['vehiculo'] as Map<String, dynamic>;
        vehiculoNombre = vehiculo['nombre'] ?? 'Vehículo';
        final tipoVehiculo = vehiculo['tipo_vehiculo'] ?? '';
        
        // Asignar comodidades según el tipo de vehículo
        switch (tipoVehiculo) {
          case 'Bus Cama':
            comodidades = ['A/C', 'WiFi', 'Snack'];
            break;
          case 'Bus':
            comodidades = ['A/C', 'Snack'];
            break;
          case 'Minibús':
            comodidades = ['A/C'];
            break;
          default:
            comodidades = ['A/C'];
        }
      } else {
        vehiculoNombre = viaje['vehiculo'].toString();
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: NeumorphicCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header del viaje
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.blue.shade600),
                    const SizedBox(width: 4),
                    Text(
                      '$origen → $destino',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: const Text(
                    'Disponible',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Fecha y hora
            if (fecha.isNotEmpty)
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Text(
                    _formatearFecha(fecha),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  if (hora.isNotEmpty) ...[
                    const SizedBox(width: 16),
                    Icon(Icons.access_time, size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      hora,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ],
              ),
            
            const SizedBox(height: 8),
            
            // Vehículo
            Row(
              children: [
                Icon(Icons.directions_bus, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  vehiculoNombre,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Comodidades
            if (comodidades.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: _obtenerComodidades(comodidades),
              ),
            
            const SizedBox(height: 8),
            
            // Asientos disponibles
            Row(
              children: [
                Icon(Icons.people, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  '$asientosDisponibles asientos disponibles',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Precio y botón
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.attach_money, size: 20, color: Colors.green.shade600),
                    const SizedBox(width: 4),
                    Text(
                      _formatearPrecio(precio),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                NeumorphicButton(
                  onTap: () => _mostrarMensaje('Reserva no implementada aún'),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Reservar',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.arrow_forward, size: 16, color: Colors.blue.shade600),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }


  void _mostrarMensaje(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.blue.shade600,
      ),
    );
  }
}
