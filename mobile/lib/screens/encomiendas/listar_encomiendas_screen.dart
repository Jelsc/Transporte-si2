import 'package:flutter/material.dart';
import 'package:mobile/services/encomienda_service.dart';
import 'package:mobile/models/encomienda_model.dart';
import 'package:mobile/widgets/neumorphic_card.dart';
import 'package:mobile/widgets/bottom_navigation_bar.dart';
import 'crear_encomienda_screen.dart';
import 'detalle_encomienda_screen.dart';

class ListarEncomiendasScreen extends StatefulWidget {
  const ListarEncomiendasScreen({super.key});

  @override
  State<ListarEncomiendasScreen> createState() => _ListarEncomiendasScreenState();
}

class _ListarEncomiendasScreenState extends State<ListarEncomiendasScreen> {
  final EncomiendaService _encomiendaService = EncomiendaService();
  List<Encomienda> _encomiendas = [];
  Map<String, dynamic> _estadisticas = {};
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final [encomiendasResponse, estadisticasResponse] = await Future.wait([
        _encomiendaService.getMisEncomiendas(),
        _encomiendaService.getEstadisticas(),
      ]);

      if (mounted) {
        setState(() {
          _isLoading = false;
          
          // ✅ CORREGIDO: Casting explícito de tipos
          if (encomiendasResponse.success) {
            _encomiendas = (encomiendasResponse.data as List<dynamic>?)
                ?.map((item) => Encomienda.fromJson(item as Map<String, dynamic>))
                .toList() ?? [];
          } else {
            _errorMessage = encomiendasResponse.error;
          }

          // ✅ CORREGIDO: Casting explícito de tipos
          if (estadisticasResponse.success) {
            _estadisticas = (estadisticasResponse.data as Map<String, dynamic>?) ?? {};
          } else {
            _errorMessage ??= estadisticasResponse.error;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error al cargar datos: $e';
        });
      }
    }
  }

  // ✅ AGREGADO: Método build requerido
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Mis Encomiendas'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarDatos,
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoading()
          : _errorMessage != null
              ? _buildError()
              : _encomiendas.isEmpty
                  ? _buildEmpty()
                  : _buildContent(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CrearEncomiendaScreen()),
          ).then((_) => _cargarDatos());
        },
        backgroundColor: Colors.blue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      bottomNavigationBar: const CustomBottomNavigationBar(currentIndex: 0),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Colors.blue.shade600),
          const SizedBox(height: 16),
          const Text('Cargando encomiendas...'),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
          const SizedBox(height: 16),
          Text(
            'Error al cargar',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage!,
            style: TextStyle(color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _cargarDatos,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          const Text(
            'No tienes encomiendas',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Crea tu primera encomienda',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CrearEncomiendaScreen()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: const Text('Crear Encomienda'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        // Estadísticas
        _buildEstadisticas(),
        
        // Lista de encomiendas
        Expanded(
          child: RefreshIndicator(
            onRefresh: _cargarDatos,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _encomiendas.length,
              itemBuilder: (context, index) {
                final encomienda = _encomiendas[index];
                return _buildEncomiendaCard(encomienda); // ✅ AHORA SÍ SE USA
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEstadisticas() {
    return Container(
      margin: const EdgeInsets.all(16),
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildEstadisticaItem('Total', _estadisticas['total']?.toString() ?? '0', Colors.blue),
          _buildEstadisticaItem('Pendientes', _estadisticas['pendientes']?.toString() ?? '0', Colors.orange),
          _buildEstadisticaItem('Entregados', _estadisticas['entregados']?.toString() ?? '0', Colors.green),
        ],
      ),
    );
  }

  Widget _buildEstadisticaItem(String titulo, String valor, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Text(
            valor,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          titulo,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  // ✅ AHORA SÍ SE USA este método
  Widget _buildEncomiendaCard(Encomienda encomienda) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: NeumorphicCard(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DetalleEncomiendaScreen(
                encomienda: encomienda,
              ),
            ),
          );
        },
        child: Padding( 
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header con estado y precio
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Estado y código
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(encomienda.estadoIcon, size: 20, color: encomienda.estadoColor),
                            const SizedBox(width: 8),
                            Text(
                              encomienda.estadoTexto,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: encomienda.estadoColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          encomienda.codigoSeguimiento,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Precio
                  Text(
                    encomienda.precioFormateado,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Destinatario
              Text(
                'Para: ${encomienda.destinatarioNombre}',
                style: TextStyle(
                  color: Colors.grey.shade600,
                ),
              ),
              
              const SizedBox(height: 8),
              
              // Destino
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      '${encomienda.destinoCiudad} - ${encomienda.destinoDireccion}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Fecha y estado de pago
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        encomienda.fechaCreacionFormateada,
                        style: TextStyle(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                  
                  // Estado de pago
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: encomienda.estadoPagoColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      encomienda.estadoPagoTexto,
                      style: TextStyle(
                        fontSize: 12,
                        color: encomienda.estadoPagoColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}