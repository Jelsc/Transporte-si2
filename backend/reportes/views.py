from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
import time
import os

from .models import ReporteGenerado
from .serializers import ReporteGeneradoSerializer, GenerarReporteRequestSerializer
from .services.pdf_generator import PDFReportGenerator
from .services.excel_generator import ExcelReportGenerator
from .services.image_generator import ImageReportGenerator

# Importar servicios para obtener datos
from viajes.models import Viaje
from encomiendas.models import Encomienda
from conductores.models import Conductor
from vehiculos.models import Vehiculo
from pagos.models import Pago


class ReporteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar reportes
    """
    queryset = ReporteGenerado.objects.all()
    serializer_class = ReporteGeneradoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar reportes por usuario si no es admin"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(usuario=self.request.user)
        
        # Filtros adicionales
        categoria = self.request.query_params.get('categoria')
        tipo = self.request.query_params.get('tipo')
        fecha_desde = self.request.query_params.get('fecha_desde')
        
        if categoria:
            queryset = queryset.filter(categoria=categoria)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if fecha_desde:
            queryset = queryset.filter(fecha_generacion__gte=fecha_desde)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generar(self, request):
        """
        Endpoint para generar un reporte nuevo
        POST /api/reportes/generar/
        """
        serializer = GenerarReporteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tipo = data['tipo']
        categoria = data['categoria']
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        filtros = data.get('filtros', {})
        titulo = data.get('titulo', f"Reporte de {categoria.capitalize()}")
        
        try:
            # Iniciar temporizador
            start_time = time.time()
            
            # Obtener datos según la categoría
            report_data = self._obtener_datos_reporte(categoria, fecha_inicio, fecha_fin, filtros)
            
            # Generar el reporte según el tipo
            if tipo == 'pdf':
                file_relative_path = PDFReportGenerator.generar_reporte(
                    titulo=titulo,
                    datos=report_data,
                    categoria=categoria
                )
            elif tipo == 'excel':
                file_relative_path = ExcelReportGenerator.generar_reporte(
                    titulo=titulo,
                    datos=report_data,
                    categoria=categoria
                )
            elif tipo == 'imagen':
                file_relative_path = ImageReportGenerator.generar_reporte(
                    titulo=titulo,
                    datos=report_data,
                    categoria=categoria
                )
            else:
                return Response(
                    {'error': 'Tipo de reporte no válido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Construir ruta completa del archivo
            from django.conf import settings
            file_path = os.path.join(settings.MEDIA_ROOT, file_relative_path)
            
            # Calcular tiempo de generación
            tiempo_generacion = time.time() - start_time
            
            # Obtener tamaño del archivo
            tamaño_archivo = os.path.getsize(file_path)
            
            # Guardar en el historial
            reporte = ReporteGenerado.objects.create(
                titulo=titulo,
                tipo=tipo,
                categoria=categoria,
                usuario=request.user,
                parametros={
                    'fecha_inicio': str(fecha_inicio) if fecha_inicio else None,
                    'fecha_fin': str(fecha_fin) if fecha_fin else None,
                    'filtros': filtros
                },
                tamaño_archivo=tamaño_archivo,
                tiempo_generacion=round(tiempo_generacion, 2)
            )
            
            # Devolver el archivo usando FileResponse que maneja mejor los archivos
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=self._get_content_type(tipo),
                as_attachment=True,
                filename=os.path.basename(file_path)
            )
            
            # Programar eliminación del archivo después de enviar la respuesta
            # En lugar de eliminar inmediatamente, dejamos que el sistema lo maneje
            # O podemos usar una tarea programada para limpiar archivos antiguos
            
            return response
        
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"Error al generar reporte: {str(e)}")
            print(f"Detalle del error:\n{error_detail}")
            return Response(
                {
                    'error': f'Error al generar el reporte: {str(e)}',
                    'detail': error_detail if request.user.is_staff else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def tipos_disponibles(self, request):
        """
        Obtener los tipos de reportes disponibles
        GET /api/reportes/tipos_disponibles/
        """
        return Response({
            'categorias': [
                {'value': 'viajes', 'label': 'Viajes'},
                {'value': 'encomiendas', 'label': 'Encomiendas'},
                {'value': 'conductores', 'label': 'Conductores'},
                {'value': 'vehiculos', 'label': 'Vehículos'},
                {'value': 'financiero', 'label': 'Financiero'},
                {'value': 'general', 'label': 'General'},
            ],
            'formatos': [
                {'value': 'pdf', 'label': 'PDF'},
                {'value': 'excel', 'label': 'Excel'},
                {'value': 'imagen', 'label': 'Imagen'},
            ]
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas de reportes generados
        GET /api/reportes/estadisticas/
        """
        queryset = self.get_queryset()
        
        # Últimos 30 días
        fecha_limite = timezone.now() - timedelta(days=30)
        reportes_recientes = queryset.filter(fecha_generacion__gte=fecha_limite)
        
        return Response({
            'total_reportes': queryset.count(),
            'reportes_mes': reportes_recientes.count(),
            'por_tipo': {
                'pdf': queryset.filter(tipo='pdf').count(),
                'excel': queryset.filter(tipo='excel').count(),
                'imagen': queryset.filter(tipo='imagen').count(),
            },
            'por_categoria': {
                'viajes': queryset.filter(categoria='viajes').count(),
                'encomiendas': queryset.filter(categoria='encomiendas').count(),
                'conductores': queryset.filter(categoria='conductores').count(),
                'vehiculos': queryset.filter(categoria='vehiculos').count(),
                'financiero': queryset.filter(categoria='financiero').count(),
                'general': queryset.filter(categoria='general').count(),
            }
        })
    
    def _obtener_datos_reporte(self, categoria, fecha_inicio, fecha_fin, filtros):
        """Obtener datos según la categoría del reporte"""
        
        # Establecer fechas por defecto
        if not fecha_fin:
            fecha_fin = timezone.now().date()
        if not fecha_inicio:
            fecha_inicio = fecha_fin - timedelta(days=30)
        
        if categoria == 'viajes':
            queryset = Viaje.objects.filter(
                fecha__gte=fecha_inicio,
                fecha__lte=fecha_fin
            )
            return list(queryset.values(
                'id', 'origen__nombre', 'destino__nombre', 'fecha',
                'hora', 'estado', 'precio', 'asientos_disponibles'
            ))
        
        elif categoria == 'encomiendas':
            queryset = Encomienda.objects.filter(
                fecha_creacion__gte=fecha_inicio,
                fecha_creacion__lte=fecha_fin
            )
            return list(queryset.values(
                'id', 'codigo_seguimiento', 'destinatario_nombre', 
                'destino_ciudad', 'estado', 'peso', 'precio', 'fecha_creacion'
            ))
        
        elif categoria == 'conductores':
            queryset = Conductor.objects.all()
            return list(queryset.values(
                'id', 'nombre', 'apellido', 'nro_licencia', 'tipo_licencia', 
                'telefono', 'estado', 'experiencia_anios'
            ))
        
        elif categoria == 'vehiculos':
            queryset = Vehiculo.objects.all()
            return list(queryset.values(
                'id', 'placa', 'marca', 'modelo', 'capacidad_pasajeros', 
                'capacidad_carga', 'estado', 'tipo_vehiculo', 'año_fabricacion'
            ))
        
        elif categoria == 'financiero':
            queryset = Pago.objects.filter(
                fecha_creacion__gte=fecha_inicio,
                fecha_creacion__lte=fecha_fin
            )
            return list(queryset.values(
                'id', 'monto', 'metodo_pago', 'estado',
                'fecha_creacion', 'usuario__username',
                'reserva__viaje__origen__nombre',
                'reserva__viaje__destino__nombre'
            ))
        
        else:  # general o dashboard
            return {
                'viajes_total': Viaje.objects.count(),
                'encomiendas_total': Encomienda.objects.count(),
                'conductores_total': Conductor.objects.count(),
                'vehiculos_total': Vehiculo.objects.count(),
            }
    
    def _get_content_type(self, tipo):
        """Obtener el content type según el tipo de reporte"""
        content_types = {
            'pdf': 'application/pdf',
            'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'imagen': 'image/png',
        }
        return content_types.get(tipo, 'application/octet-stream')
