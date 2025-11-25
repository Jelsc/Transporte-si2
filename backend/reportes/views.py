from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
import time
import os

from .models import ReporteGenerado
from .serializers import ReporteGeneradoSerializer, GenerarReporteRequestSerializer
from .prompt_parser import interpretar_prompt, detectar_multiples_reportes
from .report_generator import ReporteGenerator
from .exporters import PDFExporter, ExcelExporter
# Mantener compatibilidad con servicios antiguos para el sistema de categorías
from .services.pdf_generator import PDFReportGenerator
from .services.excel_generator import ExcelReportGenerator
from .services.image_generator import ImageReportGenerator

# Importar servicios para obtener datos
from viajes.models import Viaje
from encomiendas.models import Encomienda
from conductores.models import Conductor
from vehiculos.models import Vehiculo
from pagos.models import Pago

# Importar funciones de bitácora para auditoría
from bitacora.utils import (
    registrar_generacion_reporte,
    registrar_descarga_reporte,
    registrar_eliminacion_reporte
)


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
            
            # Registrar en bitácora para auditoría
            try:
                registrar_generacion_reporte(
                    request=request,
                    reporte_id=reporte.id,
                    titulo=titulo,
                    tipo=tipo,
                    categoria=categoria,
                    tiempo_generacion=round(tiempo_generacion, 2),
                    tamaño_archivo=tamaño_archivo
                )
            except Exception as e:
                # No fallar si hay error en la bitácora
                print(f"Error al registrar en bitácora: {e}")
            
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


# ========== ENDPOINTS DE REPORTES INTELIGENTES ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_reporte(request):
    """
    POST /api/reportes/generar/
    
    Body:
    {
        "prompt": "Quiero un reporte de viajes del mes de septiembre, agrupado por origen, en PDF",
        "formato": "pdf"  // opcional, se puede detectar del prompt
    }
    
    Returns:
        - Si formato es 'pantalla': JSON con los datos (puede ser múltiple)
        - Si formato es 'pdf' o 'excel': Archivo para descarga
    """
    try:
        prompt = request.data.get('prompt', '')
        formato_forzado = request.data.get('formato')
        
        if not prompt:
            return Response(
                {'error': 'Debe proporcionar un prompt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Detectar si hay múltiples reportes en el prompt
        prompts_separados = detectar_multiples_reportes(prompt)
        
        # 2. Generar todos los reportes solicitados
        reportes_generados = []
        for sub_prompt in prompts_separados:
            # Interpretar cada sub-prompt
            parametros = interpretar_prompt(sub_prompt)
            
            # Forzar formato si se proporcionó
            if formato_forzado:
                parametros['formato'] = formato_forzado
            
            # Generar datos del reporte
            generator = ReporteGenerator()
            datos_reporte = generator.generar_datos(parametros)
            reportes_generados.append(datos_reporte)
        
        # 3. Determinar formato final
        if formato_forzado:
            formato = formato_forzado
        else:
            # Usar el formato del primer reporte
            formato = reportes_generados[0]['parametros'].get('formato', 'pantalla')
        
        # 4. Si es pantalla y hay múltiples reportes
        if formato == 'pantalla':
            if len(reportes_generados) > 1:
                return Response({
                    'success': True,
                    'reportes': reportes_generados,
                    'cantidad_reportes': len(reportes_generados)
                })
            else:
                # Un solo reporte
                return Response({
                    'success': True,
                    'parametros_interpretados': reportes_generados[0]['parametros'],
                    'reporte': reportes_generados[0]
                })
        
        # 5. Si es PDF o Excel (uno o múltiples reportes)
        if formato == 'pdf':
            from datetime import datetime
            start_time = time.time()
            exporter = PDFExporter()
            if len(reportes_generados) > 1:
                buffer = exporter.generar_multiple(reportes_generados)
                filename = f"reportes_combinados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                titulo = f"Reportes Combinados ({len(reportes_generados)} reportes)"
            else:
                buffer = exporter.generar(reportes_generados[0])
                titulo = reportes_generados[0].get('titulo', 'reporte')
                filename = f"{titulo.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            tiempo_generacion = time.time() - start_time
            tamaño_archivo = len(buffer.getvalue())
            
            # Registrar en bitácora
            try:
                registrar_generacion_reporte(
                    request=request,
                    reporte_id=0,  # No se guarda en BD para reportes inteligentes
                    titulo=titulo,
                    tipo='pdf',
                    categoria=reportes_generados[0]['parametros'].get('tipo', 'general'),
                    tiempo_generacion=tiempo_generacion,
                    tamaño_archivo=tamaño_archivo
                )
            except Exception as e:
                print(f"Error al registrar en bitácora: {e}")
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        elif formato == 'excel':
            from datetime import datetime
            start_time = time.time()
            exporter = ExcelExporter()
            if len(reportes_generados) > 1:
                buffer = exporter.generar_multiple(reportes_generados)
                filename = f"reportes_combinados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                titulo = f"Reportes Combinados ({len(reportes_generados)} reportes)"
            else:
                buffer = exporter.generar(reportes_generados[0])
                titulo = reportes_generados[0].get('titulo', 'reporte')
                filename = f"{titulo.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            tiempo_generacion = time.time() - start_time
            tamaño_archivo = len(buffer.getvalue())
            
            # Registrar en bitácora
            try:
                registrar_generacion_reporte(
                    request=request,
                    reporte_id=0,  # No se guarda en BD para reportes inteligentes
                    titulo=titulo,
                    tipo='excel',
                    categoria=reportes_generados[0]['parametros'].get('tipo', 'general'),
                    tiempo_generacion=tiempo_generacion,
                    tamaño_archivo=tamaño_archivo
                )
            except Exception as e:
                print(f"Error al registrar en bitácora: {e}")
            
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
    
    except Exception as e:
        return Response(
            {
                'error': str(e),
                'tipo': type(e).__name__
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interpretar_comando(request):
    """
    POST /api/reportes/interpretar/
    
    Endpoint auxiliar para solo interpretar el prompt sin generar el reporte.
    Útil para mostrar una vista previa de cómo se interpretó el comando.
    
    Body:
    {
        "prompt": "Quiero un reporte de viajes..."
    }
    
    Returns:
    {
        "parametros": {...},
        "interpretacion": "..."
    }
    """
    try:
        prompt = request.data.get('prompt', '')
        
        if not prompt:
            return Response(
                {'error': 'Debe proporcionar un prompt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parametros = interpretar_prompt(prompt)
        
        # Generar descripción legible de la interpretación
        interpretacion_partes = []
        interpretacion_partes.append(f"Tipo de reporte: {parametros['tipo'].upper()}")
        interpretacion_partes.append(f"Formato de salida: {parametros['formato'].upper()}")
        
        if parametros.get('fecha_inicio') and parametros.get('fecha_fin'):
            fecha_inicio = parametros['fecha_inicio']
            fecha_fin = parametros['fecha_fin']
            if isinstance(fecha_inicio, datetime):
                fecha_inicio = fecha_inicio.date()
            if isinstance(fecha_fin, datetime):
                fecha_fin = fecha_fin.date()
            interpretacion_partes.append(
                f"Periodo: del {fecha_inicio.strftime('%d/%m/%Y')} "
                f"al {fecha_fin.strftime('%d/%m/%Y')}"
            )
        
        if parametros.get('agrupacion'):
            interpretacion_partes.append(f"Agrupado por: {', '.join(parametros['agrupacion'])}")
        
        if parametros.get('campos'):
            interpretacion_partes.append(f"Campos solicitados: {', '.join(parametros['campos'])}")
        
        return Response({
            'success': True,
            'parametros': parametros,
            'interpretacion': interpretacion_partes,
            'prompt_original': prompt
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
