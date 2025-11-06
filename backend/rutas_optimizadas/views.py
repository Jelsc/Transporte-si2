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
        
        # Validar que tenga depot (salida o legacy)
        if not solicitud.depot_salida and not solicitud.depot:
            return Response(
                {'detail': 'La solicitud debe tener un depósito de salida definido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si no tiene depot_regreso, usar depot_salida
        if not solicitud.depot_regreso:
            if solicitud.depot_salida:
                solicitud.depot_regreso = solicitud.depot_salida
                solicitud.save()
            elif solicitud.depot:
                solicitud.depot_salida = solicitud.depot
                solicitud.depot_regreso = solicitud.depot
                solicitud.save()
        
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


class ETAViewSet(viewsets.ViewSet):
    """ViewSet para cálculo y seguimiento de ETAs"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='ruta/(?P<ruta_id>[^/.]+)')
    def obtener_eta_ruta(self, request, ruta_id=None):
        """
        Obtiene ETAs baseline y en tiempo real para una ruta.
        GET /api/rutas-optimizadas/eta/ruta/{ruta_id}/
        
        Query params:
        - incluir_completadas: bool (default: false)
        - lat: float (posición actual del vehículo)
        - lng: float (posición actual del vehículo)
        """
        from .services.eta_calculator import ETACalculator
        from django.utils import timezone
        
        try:
            ruta = RutaOptimizada.objects.get(id=ruta_id)
        except RutaOptimizada.DoesNotExist:
            return Response(
                {'detail': 'Ruta no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        incluir_completadas = request.query_params.get('incluir_completadas', 'false').lower() == 'true'
        lat_actual = request.query_params.get('lat')
        lng_actual = request.query_params.get('lng')
        
        # Obtener paradas
        paradas_query = ruta.paradas.all().order_by('orden')
        
        if not incluir_completadas:
            paradas_query = paradas_query.filter(completada=False)
        
        # Serializar paradas
        paradas_data = []
        for parada in paradas_query:
            paradas_data.append({
                'id': parada.id,
                'orden': parada.orden,
                'ubicacion_detalle': {
                    'id': parada.ubicacion.id,
                    'nombre': parada.ubicacion.nombre,
                    'lat': float(parada.ubicacion.lat),
                    'lng': float(parada.ubicacion.lng),
                },
                'tiempo_llegada_estimado': parada.tiempo_llegada_estimado,
                'tiempo_servicio_min': parada.tiempo_servicio_min,
                'distancia_desde_anterior_km': float(parada.distancia_desde_anterior_km),
                'completada': parada.completada,
                'hora_llegada_real': parada.hora_llegada_real,
                'es_depot': parada.es_depot,
            })
        
        # Calcular ETAs en tiempo real si hay ubicación actual
        calculator = ETACalculator()
        
        if lat_actual and lng_actual:
            try:
                lat_actual = float(lat_actual)
                lng_actual = float(lng_actual)
                
                paradas_data = calculator.actualizar_eta_tiempo_real(
                    ruta_id=ruta.id,
                    ubicacion_actual=(lat_actual, lng_actual),
                    paradas_restantes=paradas_data,
                    hora_actual=timezone.now()
                )
            except (ValueError, TypeError) as e:
                return Response(
                    {'detail': f'Coordenadas inválidas: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Calcular estadísticas de demora
        paradas_completadas = list(ruta.paradas.filter(completada=True))
        stats_demora = calculator.calcular_demora_acumulada([
            {
                'tiempo_llegada_estimado': p.tiempo_llegada_estimado,
                'hora_llegada_real': p.hora_llegada_real
            }
            for p in paradas_completadas
        ])
        
        return Response({
            'ruta_id': ruta.id,
            'vehiculo': {
                'id': ruta.vehiculo.id,
                'placa': ruta.vehiculo.placa,
                'nombre': ruta.vehiculo.nombre,
            },
            'distancia_total_km': float(ruta.distancia_total_km),
            'tiempo_total_min': ruta.tiempo_total_min,
            'paradas': paradas_data,
            'estadisticas_demora': stats_demora,
            'timestamp': timezone.now().isoformat(),
        })
    
    @action(detail=False, methods=['get'], url_path='solicitud/(?P<solicitud_id>[^/.]+)')
    def obtener_eta_solicitud(self, request, solicitud_id=None):
        """
        Obtiene ETAs de todas las rutas de una solicitud.
        GET /api/rutas-optimizadas/eta/solicitud/{solicitud_id}/
        """
        from django.utils import timezone
        
        try:
            solicitud = SolicitudRuta.objects.get(id=solicitud_id)
        except SolicitudRuta.DoesNotExist:
            return Response(
                {'detail': 'Solicitud no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        rutas = solicitud.rutas.all()
        
        rutas_data = []
        for ruta in rutas:
            paradas = ruta.paradas.filter(completada=False).order_by('orden')
            
            paradas_data = []
            for parada in paradas:
                paradas_data.append({
                    'orden': parada.orden,
                    'ubicacion': parada.ubicacion.nombre,
                    'eta_baseline': parada.tiempo_llegada_estimado,
                    'completada': parada.completada,
                })
            
            rutas_data.append({
                'ruta_id': ruta.id,
                'vehiculo': ruta.vehiculo.placa,
                'distancia_total_km': float(ruta.distancia_total_km),
                'tiempo_total_min': ruta.tiempo_total_min,
                'paradas_restantes': len(paradas),
                'paradas': paradas_data,
            })
        
        return Response({
            'solicitud_id': solicitud.id,
            'estado': solicitud.estado,
            'fecha_viaje': solicitud.fecha_viaje,
            'rutas': rutas_data,
            'timestamp': timezone.now().isoformat(),
        })
    
    @action(detail=False, methods=['post'], url_path='actualizar-ubicacion')
    def actualizar_ubicacion_vehiculo(self, request):
        """
        Actualiza la ubicación del vehículo y recalcula ETAs.
        POST /api/rutas-optimizadas/eta/actualizar-ubicacion/
        
        Body:
        {
            "ruta_id": int,
            "lat": float,
            "lng": float,
            "timestamp": string (ISO format, optional)
        }
        """
        from .services.eta_calculator import ETACalculator
        from django.utils import timezone
        
        ruta_id = request.data.get('ruta_id')
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        
        if not all([ruta_id, lat, lng]):
            return Response(
                {'detail': 'Se requieren ruta_id, lat y lng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ruta = RutaOptimizada.objects.get(id=ruta_id)
            lat = float(lat)
            lng = float(lng)
        except RutaOptimizada.DoesNotExist:
            return Response(
                {'detail': 'Ruta no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Coordenadas inválidas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener paradas restantes
        paradas_restantes = ruta.paradas.filter(completada=False).order_by('orden')
        
        paradas_data = []
        for parada in paradas_restantes:
            paradas_data.append({
                'id': parada.id,
                'orden': parada.orden,
                'ubicacion_detalle': {
                    'lat': float(parada.ubicacion.lat),
                    'lng': float(parada.ubicacion.lng),
                },
                'tiempo_llegada_estimado': parada.tiempo_llegada_estimado,
                'tiempo_servicio_min': parada.tiempo_servicio_min,
                'distancia_desde_anterior_km': float(parada.distancia_desde_anterior_km),
            })
        
        # Calcular ETAs actualizados
        calculator = ETACalculator()
        paradas_actualizadas = calculator.actualizar_eta_tiempo_real(
            ruta_id=ruta.id,
            ubicacion_actual=(lat, lng),
            paradas_restantes=paradas_data,
            hora_actual=timezone.now()
        )
        
        return Response({
            'ruta_id': ruta.id,
            'ubicacion_actual': {'lat': lat, 'lng': lng},
            'paradas_actualizadas': paradas_actualizadas,
            'timestamp': timezone.now().isoformat(),
        })
