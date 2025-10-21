from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import SolicitudRuta, Entrega, RutaOptimizada, Parada
from .serializers import (
    SolicitudRutaSerializer, SolicitudRutaCreateSerializer,
    EntregaSerializer, RutaOptimizadaSerializer, ParadaSerializer,
    OptimizarRutaSerializer
)


class SolicitudRutaViewSet(viewsets.ModelViewSet):
    """ViewSet para solicitudes de ruta"""
    queryset = SolicitudRuta.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'fecha_viaje']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SolicitudRutaCreateSerializer
        return SolicitudRutaSerializer
    
    @action(detail=True, methods=['post'])
    def optimizar(self, request, pk=None):
        """
        Endpoint para optimizar una solicitud de ruta usando Celery.
        POST /api/rutas-optimizadas/solicitudes/{id}/optimizar/
        """
        from .tasks import optimizar_ruta_task
        
        solicitud = self.get_object()
        
        # Validar que la solicitud no esté ya procesada
        if solicitud.estado == 'completado':
            return Response(
                {'detail': 'Esta solicitud ya ha sido optimizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if solicitud.estado == 'procesando':
            return Response(
                {'detail': 'Esta solicitud ya está siendo procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que haya entregas
        if not solicitud.entregas.exists():
            return Response(
                {'detail': 'La solicitud no tiene entregas asociadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que haya vehículos
        if not solicitud.vehiculos_disponibles.exists():
            return Response(
                {'detail': 'La solicitud no tiene vehículos disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que tenga depot
        if not solicitud.depot:
            return Response(
                {'detail': 'La solicitud debe tener un depot definido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Iniciar optimización asíncrona
        task = optimizar_ruta_task.delay(solicitud.id)
        
        return Response({
            'detail': 'Optimización iniciada',
            'solicitud_id': solicitud.id,
            'task_id': task.id,
            'estado': 'procesando'
        })
    
    @action(detail=True, methods=['get'])
    def resultados(self, request, pk=None):
        """
        Endpoint para obtener los resultados de la optimización.
        GET /api/rutas-optimizadas/solicitudes/{id}/resultados/
        """
        solicitud = self.get_object()
        
        if solicitud.estado != 'completado':
            return Response({
                'detail': 'La optimización aún no ha sido completada',
                'estado': solicitud.estado
            })
        
        rutas = solicitud.rutas_optimizadas.all()
        serializer = RutaOptimizadaSerializer(rutas, many=True)
        
        return Response({
            'solicitud_id': solicitud.id,
            'fecha_viaje': solicitud.fecha_viaje,
            'numero_rutas': rutas.count(),
            'rutas': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def estado_tarea(self, request, pk=None):
        """
        Endpoint para consultar el estado de la tarea de optimización.
        GET /api/rutas-optimizadas/solicitudes/{id}/estado-tarea/
        """
        from celery.result import AsyncResult
        
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'detail': 'Se requiere el parámetro task_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task_result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': task_result.status,
            'solicitud_id': pk
        }
        
        if task_result.status == 'SUCCESS':
            response_data['result'] = task_result.result
        elif task_result.status == 'FAILURE':
            response_data['error'] = str(task_result.info)
        elif task_result.status == 'PROGRESS':
            response_data['progress'] = task_result.info
        
        return Response(response_data)


class EntregaViewSet(viewsets.ModelViewSet):
    """ViewSet para entregas/recogidas"""
    queryset = Entrega.objects.all()
    serializer_class = EntregaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['solicitud', 'tipo', 'ubicacion']


class RutaOptimizadaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para rutas optimizadas"""
    queryset = RutaOptimizada.objects.all()
    serializer_class = RutaOptimizadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['solicitud', 'vehiculo', 'completada']
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar ruta como completada"""
        ruta = self.get_object()
        ruta.completada = True
        ruta.save()
        
        serializer = self.get_serializer(ruta)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def mapa(self, request, pk=None):
        """
        Obtener datos de la ruta optimizados para mostrar en el mapa.
        GET /api/rutas-optimizadas/rutas/{id}/mapa/
        """
        ruta = self.get_object()
        paradas = ruta.paradas.all().order_by('orden')
        
        # Preparar datos para el mapa
        coordenadas = []
        markers = []
        
        for parada in paradas:
            coord = {
                'lat': float(parada.ubicacion.lat),
                'lng': float(parada.ubicacion.lng)
            }
            coordenadas.append(coord)
            
            markers.append({
                'orden': parada.orden,
                'nombre': parada.ubicacion.nombre,
                'lat': float(parada.ubicacion.lat),
                'lng': float(parada.ubicacion.lng),
                'es_depot': parada.es_depot,
                'tiempo_llegada': parada.tiempo_llegada_estimado,
                'tiempo_servicio': parada.tiempo_servicio_min
            })
        
        return Response({
            'ruta_id': ruta.id,
            'vehiculo': ruta.vehiculo.nombre,
            'distancia_total_km': float(ruta.distancia_total_km),
            'tiempo_total_min': ruta.tiempo_total_min,
            'coordenadas': coordenadas,
            'markers': markers
        })


class ParadaViewSet(viewsets.ModelViewSet):
    """ViewSet para paradas"""
    queryset = Parada.objects.all()
    serializer_class = ParadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ruta', 'ubicacion', 'completada', 'es_depot']
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marcar parada como completada"""
        parada = self.get_object()
        
        from django.utils import timezone
        parada.completada = True
        parada.hora_llegada_real = timezone.now()
        parada.save()
        
        serializer = self.get_serializer(parada)
        return Response(serializer.data)
