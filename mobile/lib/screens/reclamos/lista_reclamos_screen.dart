import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/reclamo_service.dart';
import '../../widgets/neumorphic_card.dart';
import 'crear_reclamo_screen.dart';
import 'detalle_reclamo_screen.dart';

class ListaReclamosScreen extends StatefulWidget {
  const ListaReclamosScreen({super.key});

  @override
  State<ListaReclamosScreen> createState() => _ListaReclamosScreenState();
}

class _ListaReclamosScreenState extends State<ListaReclamosScreen> {
  final ReclamoService _reclamoService = ReclamoService();
  List<Reclamo> _reclamos = [];
  List<ReclamoCategoria> _categorias = [];
  bool _isLoading = true;
  String _filtroEstado = '';
  String _filtroCategoria = '';
  String _filtroPrioridad = '';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    await _cargarCategorias();
    await _cargarReclamos();
  }

  Future<void> _cargarCategorias() async {
    final response = await _reclamoService.getCategorias();
    if (response.success && response.data != null) {
      setState(() {
        _categorias = response.data!;
      });
    }
  }

  Future<void> _cargarReclamos() async {
    setState(() {
      _isLoading = true;
    });

    final response = await _reclamoService.getReclamos(
      estado: _filtroEstado,
      categoria: _filtroCategoria,
      prioridad: _filtroPrioridad,
      search: _searchQuery,
    );

    if (response.success && response.data != null) {
      setState(() {
        _reclamos = response.data!;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
      _mostrarError(response.error ?? 'Error al cargar reclamos');
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

  void _limpiarFiltros() {
    setState(() {
      _filtroEstado = '';
      _filtroCategoria = '';
      _filtroPrioridad = '';
      _searchQuery = '';
    });
    _cargarReclamos();
  }

  Widget _buildFiltros() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.filter_list, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              const Text(
                'Filtros',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              TextButton(
                onPressed: _limpiarFiltros,
                child: const Text(
                  'Limpiar',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // Filtro de Estado
              _buildFiltroDropdown(
                value: _filtroEstado,
                items: const [
                  {'value': '', 'label': 'Todos los estados'},
                  {'value': 'abierto', 'label': 'Abierto'},
                  {'value': 'en_proceso', 'label': 'En Proceso'},
                  {'value': 'cerrado', 'label': 'Cerrado'},
                  {'value': 'cancelado', 'label': 'Cancelado'},
                ],
                hint: 'Estado',
                onChanged: (value) {
                  setState(() {
                    _filtroEstado = value ?? '';
                  });
                  _cargarReclamos();
                },
              ),
              // Filtro de Categoría
              _buildFiltroDropdown(
                value: _filtroCategoria,
                items: [
                  {'value': '', 'label': 'Todas las categorías'},
                  ..._categorias.map((categoria) => {
                        'value': categoria.id.toString(),
                        'label': categoria.nombre,
                      }),
                ],
                hint: 'Categoría',
                onChanged: (value) {
                  setState(() {
                    _filtroCategoria = value ?? '';
                  });
                  _cargarReclamos();
                },
              ),
              // Filtro de Prioridad
              _buildFiltroDropdown(
                value: _filtroPrioridad,
                items: const [
                  {'value': '', 'label': 'Todas las prioridades'},
                  {'value': 'baja', 'label': 'Baja'},
                  {'value': 'media', 'label': 'Media'},
                  {'value': 'alta', 'label': 'Alta'},
                  {'value': 'urgente', 'label': 'Urgente'},
                ],
                hint: 'Prioridad',
                onChanged: (value) {
                  setState(() {
                    _filtroPrioridad = value ?? '';
                  });
                  _cargarReclamos();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFiltroDropdown({
    required String value,
    required List<Map<String, String>> items,
    required String hint,
    required Function(String?) onChanged,
  }) {
    return Container(
      width: 150,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value.isEmpty ? null : value,
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down, size: 20),
          hint: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              hint,
              style: const TextStyle(fontSize: 12),
            ),
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item['value'],
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  item['label']!,
                  style: const TextStyle(fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildReclamoCard(Reclamo reclamo) {
    return NeumorphicButton(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DetalleReclamoScreen(reclamoId: reclamo.id),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildEstadoBadge(reclamo.estado, reclamo.estadoColor),
                const Spacer(),
                _buildPrioridadBadge(reclamo.prioridad, reclamo.prioridadColor),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              reclamo.titulo,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              reclamo.descripcion,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.category, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  reclamo.categoriaNombre,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const Spacer(),
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  _formatearFecha(reclamo.fechaCreacion),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            if (reclamo.numeroGuia != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.confirmation_number, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Guía: ${reclamo.numeroGuia!}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEstadoBadge(String estado, String color) {
    final colorMap = {
      'orange': Colors.orange,
      'blue': Colors.blue,
      'green': Colors.green,
      'red': Colors.red,
      'gray': Colors.grey,
    };
    
    final backgroundColor = colorMap[color] ?? Colors.grey;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: backgroundColor.withOpacity(0.3)),
      ),
      child: Text(
        estado.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: backgroundColor,
        ),
      ),
    );
  }

  Widget _buildPrioridadBadge(String prioridad, String color) {
    final colorMap = {
      'gray': Colors.grey,
      'blue': Colors.blue,
      'orange': Colors.orange,
      'red': Colors.red,
    };
    
    final textColor = colorMap[color] ?? Colors.grey;
    final icon = _getPrioridadIcon(prioridad);
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: textColor),
        const SizedBox(width: 4),
        Text(
          prioridad.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
    );
  }

  IconData _getPrioridadIcon(String prioridad) {
    switch (prioridad) {
      case 'urgente':
        return Icons.warning;
      case 'alta':
        return Icons.arrow_upward;
      case 'media':
        return Icons.remove;
      case 'baja':
        return Icons.arrow_downward;
      default:
        return Icons.circle;
    }
  }

  String _formatearFecha(DateTime fecha) {
    final now = DateTime.now();
    final difference = now.difference(fecha);
    
    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return 'Hace ${difference.inMinutes} min';
      }
      return 'Hace ${difference.inHours} h';
    } else if (difference.inDays == 1) {
      return 'Ayer';
    } else if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} días';
    } else {
      return '${fecha.day}/${fecha.month}/${fecha.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Mis Reclamos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarReclamos,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CrearReclamoScreen()),
              ).then((_) => _cargarReclamos());
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de búsqueda
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar en reclamos...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          setState(() {
                            _searchQuery = '';
                          });
                          _cargarReclamos();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
                // Debounce search
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (_searchQuery == value) {
                    _cargarReclamos();
                  }
                });
              },
            ),
          ),
          // Filtros
          _buildFiltros(),
          const SizedBox(height: 16),
          // Lista de reclamos
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _reclamos.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _cargarReclamos,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _reclamos.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) =>
                              _buildReclamoCard(_reclamos[index]),
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CrearReclamoScreen()),
          ).then((_) => _cargarReclamos());
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.report_problem_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          const Text(
            'No hay reclamos',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty ||
                    _filtroEstado.isNotEmpty ||
                    _filtroCategoria.isNotEmpty ||
                    _filtroPrioridad.isNotEmpty
                ? 'Intenta con otros filtros'
                : 'Crea tu primer reclamo',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 20),
          if (_searchQuery.isEmpty &&
              _filtroEstado.isEmpty &&
              _filtroCategoria.isEmpty &&
              _filtroPrioridad.isEmpty)
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CrearReclamoScreen()),
                ).then((_) => _cargarReclamos());
              },
              icon: const Icon(Icons.add),
              label: const Text('Crear Reclamo'),
            ),
        ],
      ),
    );
  }
}