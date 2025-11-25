import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/ip_detection.dart';

// Modelos para Reclamos
class ReclamoCategoria {
  final int id;
  final String nombre;

  ReclamoCategoria({required this.id, required this.nombre});

  factory ReclamoCategoria.fromJson(Map<String, dynamic> json) {
    return ReclamoCategoria(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
    };
  }
}

class ReclamoAdjunto {
  final int id;
  final String nombreArchivo;
  final String archivo;
  final String tipoArchivo;
  final String urlArchivo;
  final DateTime fechaSubida;

  ReclamoAdjunto({
    required this.id,
    required this.nombreArchivo,
    required this.archivo,
    required this.tipoArchivo,
    required this.urlArchivo,
    required this.fechaSubida,
  });

  factory ReclamoAdjunto.fromJson(Map<String, dynamic> json) {
    return ReclamoAdjunto(
      id: json['id'] ?? 0,
      nombreArchivo: json['nombre_archivo'] ?? '',
      archivo: json['archivo'] ?? '',
      tipoArchivo: json['tipo_archivo'] ?? 'otro',
      urlArchivo: json['url_archivo'] ?? '',
      fechaSubida: DateTime.parse(json['fecha_subida'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class ReclamoDetalle {
  final int id;
  final int autor;
  final String autorNombre;
  final String mensaje;
  final DateTime fecha;
  final String fechaFormateada;

  ReclamoDetalle({
    required this.id,
    required this.autor,
    required this.autorNombre,
    required this.mensaje,
    required this.fecha,
    required this.fechaFormateada,
  });

  factory ReclamoDetalle.fromJson(Map<String, dynamic> json) {
    return ReclamoDetalle(
      id: json['id'] ?? 0,
      autor: json['autor'] ?? 0,
      autorNombre: json['autor_nombre'] ?? 'Usuario',
      mensaje: json['mensaje'] ?? '',
      fecha: DateTime.parse(json['fecha'] ?? DateTime.now().toIso8601String()),
      fechaFormateada: json['fecha_formateada'] ?? '',
    );
  }
}

class Reclamo {
  final int id;
  final String numeroReclamo;
  final String titulo;
  final String descripcion;
  final String? numeroGuia;
  final int categoria;
  final String categoriaNombre;
  final int usuario;
  final String usuarioNombre;
  final int? agente;
  final String? agenteNombre;
  final String estado;
  final String estadoDisplay;
  final String prioridad;
  final String prioridadDisplay;
  final DateTime fechaCreacion;
  final DateTime? fechaCierre;
  final String? servicioRelacionado;
  final List<ReclamoDetalle> detalles;
  final List<ReclamoAdjunto> adjuntos;

  Reclamo({
    required this.id,
    required this.numeroReclamo,
    required this.titulo,
    required this.descripcion,
    this.numeroGuia,
    required this.categoria,
    required this.categoriaNombre,
    required this.usuario,
    required this.usuarioNombre,
    this.agente,
    this.agenteNombre,
    required this.estado,
    required this.estadoDisplay,
    required this.prioridad,
    required this.prioridadDisplay,
    required this.fechaCreacion,
    this.fechaCierre,
    this.servicioRelacionado,
    required this.detalles,
    required this.adjuntos,
  });

  factory Reclamo.fromJson(Map<String, dynamic> json) {
    return Reclamo(
      id: json['id'] ?? 0,
      numeroReclamo: json['numero_reclamo'] ?? 'REC-0000',
      titulo: json['titulo'] ?? '',
      descripcion: json['descripcion'] ?? '',
      numeroGuia: json['numero_guia'],
      categoria: json['categoria'] ?? 0,
      categoriaNombre: json['categoria_nombre'] ?? 'Sin categoría',
      usuario: json['usuario'] ?? 0,
      usuarioNombre: json['usuario_nombre'] ?? 'Usuario',
      agente: json['agente'],
      agenteNombre: json['agente_nombre'],
      estado: json['estado'] ?? 'abierto',
      estadoDisplay: json['estado_display'] ?? 'Abierto',
      prioridad: json['prioridad'] ?? 'media',
      prioridadDisplay: json['prioridad_display'] ?? 'Media',
      fechaCreacion: DateTime.parse(json['fecha_creacion'] ?? DateTime.now().toIso8601String()),
      fechaCierre: json['fecha_cierre'] != null ? DateTime.parse(json['fecha_cierre']) : null,
      servicioRelacionado: json['servicio_relacionado'],
      detalles: List<ReclamoDetalle>.from(
        (json['detalles'] ?? []).map((x) => ReclamoDetalle.fromJson(x)),
      ),
      adjuntos: List<ReclamoAdjunto>.from(
        (json['adjuntos'] ?? []).map((x) => ReclamoAdjunto.fromJson(x)),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'categoria': categoria,
      'numero_guia': numeroGuia,
      'servicio_relacionado': servicioRelacionado,
      'prioridad': prioridad,
    };
  }

  // Propiedades calculadas
  bool get estaAbierto => estado == 'abierto';
  bool get estaEnProceso => estado == 'en_proceso';
  bool get estaCerrado => estado == 'cerrado';
  bool get estaCancelado => estado == 'cancelado';

  String get estadoColor {
    switch (estado) {
      case 'abierto':
        return 'orange';
      case 'en_proceso':
        return 'blue';
      case 'cerrado':
        return 'green';
      case 'cancelado':
        return 'red';
      default:
        return 'gray';
    }
  }

  String get prioridadColor {
    switch (prioridad) {
      case 'baja':
        return 'gray';
      case 'media':
        return 'blue';
      case 'alta':
        return 'orange';
      case 'urgente':
        return 'red';
      default:
        return 'gray';
    }
  }
}

// Datos para crear un reclamo
class ReclamoCreateData {
  final String titulo;
  final String descripcion;
  final int categoria;
  final String? numeroGuia;
  final String? servicioRelacionado;
  final String prioridad;

  ReclamoCreateData({
    required this.titulo,
    required this.descripcion,
    required this.categoria,
    this.numeroGuia,
    this.servicioRelacionado,
    this.prioridad = 'media',
  });

  Map<String, dynamic> toJson() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'categoria': categoria,
      if (numeroGuia != null && numeroGuia!.isNotEmpty) 'numero_guia': numeroGuia,
      if (servicioRelacionado != null && servicioRelacionado!.isNotEmpty) 
        'servicio_relacionado': servicioRelacionado,
      'prioridad': prioridad,
    };
  }
}

// Respuesta de la API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse({required this.success, this.data, this.error, this.message});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      error: json['error'],
      message: json['message'],
    );
  }
}

class ReclamoService {
  static final ReclamoService _instance = ReclamoService._internal();
  factory ReclamoService() => _instance;
  ReclamoService._internal();

  // Headers por defecto
  Map<String, String> get _defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers con autenticación
  Future<Map<String, String>> get _authHeaders async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final headers = Map<String, String>.from(_defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Función para hacer peticiones HTTP
  Future<ApiResponse<T>> _apiRequest<T>(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
  }) async {
    final baseUrl = await IPDetection.getBaseUrl();
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _authHeaders;

    try {
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: headers);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Método HTTP no soportado: $method');
      }

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson != null ? fromJson(responseData) : responseData,
          message: responseData['message'] ?? 'Operación exitosa',
        );
      } else {
        String errorMessage = 'Error en la petición';

        if (responseData['detail'] != null) {
          errorMessage = responseData['detail'];
        } else if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        } else if (responseData['non_field_errors'] != null) {
          errorMessage = responseData['non_field_errors'].join(', ');
        } else {
          List<String> fieldErrors = [];
          responseData.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              fieldErrors.add('$key: ${value.join(', ')}');
            }
          });
          if (fieldErrors.isNotEmpty) {
            errorMessage = fieldErrors.join('; ');
          }
        }

        return ApiResponse<T>(
          success: false,
          error: errorMessage,
          message: responseData['message'],
        );
      }
    } catch (e) {
      return ApiResponse<T>(success: false, error: 'Error de conexión: $e');
    }
  }

  // ===== MÉTODOS DE CATEGORÍAS =====

  // Obtener todas las categorías de reclamos
  Future<ApiResponse<List<ReclamoCategoria>>> getCategorias() async {
    try {
      return await _apiRequest<List<ReclamoCategoria>>(
        '/api/reclamos/categorias/',
        fromJson: (data) => List<ReclamoCategoria>.from(
          data.map((x) => ReclamoCategoria.fromJson(x)),
        ),
      );
    } catch (e) {
      return ApiResponse<List<ReclamoCategoria>>(
        success: false,
        error: 'Error al obtener categorías: $e',
      );
    }
  }

  // ===== MÉTODOS DE RECLAMOS =====

  // Obtener todos los reclamos del usuario
  Future<ApiResponse<List<Reclamo>>> getReclamos({
    String? estado,
    String? categoria,
    String? prioridad,
    String? search,
    String ordering = '-fecha_creacion',
  }) async {
    try {
      final params = <String, String>{};
      if (estado != null && estado.isNotEmpty) params['estado'] = estado;
      if (categoria != null && categoria.isNotEmpty) params['categoria'] = categoria;
      if (prioridad != null && prioridad.isNotEmpty) params['prioridad'] = prioridad;
      if (search != null && search.isNotEmpty) params['search'] = search;
      params['ordering'] = ordering;

      final queryString = Uri(queryParameters: params).query;
      final endpoint = '/api/reclamos/reclamos/${queryString.isNotEmpty ? '?$queryString' : ''}';

      return await _apiRequest<List<Reclamo>>(
        endpoint,
        fromJson: (data) => List<Reclamo>.from(
          data.map((x) => Reclamo.fromJson(x)),
        ),
      );
    } catch (e) {
      return ApiResponse<List<Reclamo>>(
        success: false,
        error: 'Error al obtener reclamos: $e',
      );
    }
  }

  // Obtener un reclamo específico
  Future<ApiResponse<Reclamo>> getReclamo(int id) async {
    try {
      return await _apiRequest<Reclamo>(
        '/api/reclamos/reclamos/$id/',
        fromJson: (data) => Reclamo.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Reclamo>(
        success: false,
        error: 'Error al obtener reclamo: $e',
      );
    }
  }

  // Crear un nuevo reclamo
  Future<ApiResponse<Reclamo>> createReclamo(ReclamoCreateData data) async {
    try {
      return await _apiRequest<Reclamo>(
        '/api/reclamos/reclamos/',
        method: 'POST',
        body: data.toJson(),
        fromJson: (data) => Reclamo.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Reclamo>(
        success: false,
        error: 'Error al crear reclamo: $e',
      );
    }
  }

  // Actualizar un reclamo
  Future<ApiResponse<Reclamo>> updateReclamo(int id, Map<String, dynamic> data) async {
    try {
      return await _apiRequest<Reclamo>(
        '/api/reclamos/reclamos/$id/',
        method: 'PUT',
        body: data,
        fromJson: (data) => Reclamo.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Reclamo>(
        success: false,
        error: 'Error al actualizar reclamo: $e',
      );
    }
  }

  // ===== ACCIONES SOBRE RECLAMOS =====

  // Cambiar estado de un reclamo
  Future<ApiResponse<Reclamo>> cambiarEstado(int reclamoId, String nuevoEstado) async {
    try {
      return await _apiRequest<Reclamo>(
        '/api/reclamos/reclamos/$reclamoId/cambiar_estado/',
        method: 'POST',
        body: {'estado': nuevoEstado},
        fromJson: (data) => Reclamo.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Reclamo>(
        success: false,
        error: 'Error al cambiar estado: $e',
      );
    }
  }

  // Asignar agente a un reclamo
  Future<ApiResponse<Reclamo>> asignarAgente(int reclamoId, int agenteId) async {
    try {
      return await _apiRequest<Reclamo>(
        '/api/reclamos/reclamos/$reclamoId/asignar_agente/',
        method: 'POST',
        body: {'agente_id': agenteId},
        fromJson: (data) => Reclamo.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Reclamo>(
        success: false,
        error: 'Error al asignar agente: $e',
      );
    }
  }

  // Agregar comentario a un reclamo
  Future<ApiResponse<ReclamoDetalle>> agregarComentario(int reclamoId, String mensaje) async {
    try {
      return await _apiRequest<ReclamoDetalle>(
        '/api/reclamos/reclamos/$reclamoId/agregar_comentario/',
        method: 'POST',
        body: {'mensaje': mensaje},
        fromJson: (data) => ReclamoDetalle.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<ReclamoDetalle>(
        success: false,
        error: 'Error al agregar comentario: $e',
      );
    }
  }

  // Subir archivos adjuntos
  Future<ApiResponse<List<ReclamoAdjunto>>> subirAdjuntos(
    int reclamoId, 
    List<http.MultipartFile> archivos
  ) async {
    try {
      final baseUrl = await IPDetection.getBaseUrl();
      final url = Uri.parse('$baseUrl/api/reclamos/reclamos/$reclamoId/subir_adjuntos/');
      final headers = await _authHeaders;
      
      final request = http.MultipartRequest('POST', url);
      
      // Agregar headers de autorización
      request.headers.addAll({
        'Authorization': headers['Authorization']!,
        'Accept': 'application/json',
      });
      
      // Agregar archivos
      for (var archivo in archivos) {
        request.files.add(archivo);
      }
      
      final response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final responseData = jsonDecode(responseBody);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final adjuntos = List<ReclamoAdjunto>.from(
          responseData.map((x) => ReclamoAdjunto.fromJson(x)),
        );
        return ApiResponse<List<ReclamoAdjunto>>(
          success: true,
          data: adjuntos,
          message: 'Archivos subidos exitosamente',
        );
      } else {
        String errorMessage = 'Error al subir archivos';
        if (responseData['error'] != null) {
          errorMessage = responseData['error'];
        }
        return ApiResponse<List<ReclamoAdjunto>>(
          success: false,
          error: errorMessage,
        );
      }
    } catch (e) {
      return ApiResponse<List<ReclamoAdjunto>>(
        success: false,
        error: 'Error al subir archivos: $e',
      );
    }
  }

  // Eliminar archivo adjunto
  Future<ApiResponse<Map<String, dynamic>>> eliminarAdjunto(int reclamoId, int adjuntoId) async {
    try {
      return await _apiRequest<Map<String, dynamic>>(
        '/api/reclamos/reclamos/$reclamoId/eliminar_adjunto/',
        method: 'DELETE',
        body: {'adjunto_id': adjuntoId},
      );
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al eliminar archivo: $e',
      );
    }
  }

  // ===== MÉTODOS DE DETALLES =====

  // Obtener detalles de un reclamo
  Future<ApiResponse<List<ReclamoDetalle>>> getDetallesReclamo(int reclamoId) async {
    try {
      return await _apiRequest<List<ReclamoDetalle>>(
        '/api/reclamos/reclamos/$reclamoId/detalles/',
        fromJson: (data) => List<ReclamoDetalle>.from(
          data.map((x) => ReclamoDetalle.fromJson(x)),
        ),
      );
    } catch (e) {
      return ApiResponse<List<ReclamoDetalle>>(
        success: false,
        error: 'Error al obtener detalles: $e',
      );
    }
  }

  // ===== MÉTODOS UTILITARIOS =====

  // Obtener estadísticas de reclamos
  Future<ApiResponse<Map<String, dynamic>>> getEstadisticas() async {
    try {
      final response = await getReclamos();
      if (response.success && response.data != null) {
        final reclamos = response.data!;
        final total = reclamos.length;
        final abiertos = reclamos.where((r) => r.estaAbierto).length;
        final enProceso = reclamos.where((r) => r.estaEnProceso).length;
        final cerrados = reclamos.where((r) => r.estaCerrado).length;

        return ApiResponse<Map<String, dynamic>>(
          success: true,
          data: {
            'total': total,
            'abiertos': abiertos,
            'en_proceso': enProceso,
            'cerrados': cerrados,
          },
        );
      } else {
        return ApiResponse<Map<String, dynamic>>(
          success: false,
          error: response.error,
        );
      }
    } catch (e) {
      return ApiResponse<Map<String, dynamic>>(
        success: false,
        error: 'Error al obtener estadísticas: $e',
      );
    }
  }

  // Validate file before uploading
static bool validarArchivo(String fileName, int fileSizeBytes) {
  // Validate extension
  final extension = fileName.split('.').last.toLowerCase();
  final allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
  if (!allowedExtensions.contains(extension)) {
    return false;
  }

  // Validate size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (fileSizeBytes > maxSize) {
    return false;
  }

  return true;
}
  // Crear MultipartFile desde archivo
  static Future<http.MultipartFile> crearMultipartFile(
    String filePath, 
    String fieldName
  ) async {
    final file = http.MultipartFile.fromPath(fieldName, filePath);
    return file;
  }
}