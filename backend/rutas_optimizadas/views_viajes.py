"""
Views específicas para integración de VRP con viajes comerciales
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from viajes.models import Viaje
from viajes.serializers import ViajeSerializer
from .models import SolicitudRuta
from .serializers import SolicitudRutaSerializer
from .services.viaje_converter import viaje_converter_service


class ViajeVRPViewSet(ModelViewSet):
    """
    ViewSet para manejar optimización VRP de viajes comerciales
    """
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer
    
    @action(detail=True, methods=['post'])
    def optimizar_ruta(self, request, pk=None):
        """
        Convierte un viaje comercial en solicitud VRP y la optimiza
        
        POST /api/viajes/{id}/optimizar-ruta/
        """
        viaje = self.get_object()
        
        # Validar que el viaje esté en estado programado
        if viaje.estado != 'programado':
            return Response(
                {'detail': 'Solo se pueden optimizar viajes programados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convertir viaje a solicitud de ruta
            solicitud = viaje_converter_service.convertir_viaje_a_solicitud_ruta(
                viaje=viaje,
                incluir_paradas_intermedias=request.data.get('incluir_paradas_intermedias', False),
                tiempo_servicio_minutos=request.data.get('tiempo_servicio_minutos', 15)
            )
            
            # Iniciar optimización automáticamente
            from .tasks import optimizar_ruta_task
            task = optimizar_ruta_task.delay(solicitud.id)
            
            return Response({
                'detail': 'Optimización de ruta iniciada',
                'viaje_id': viaje.id,
                'solicitud_id': solicitud.id,
                'task_id': task.id,
                'solicitud': SolicitudRutaSerializer(solicitud).data
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Error al optimizar ruta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def rutas_optimizadas(self, request, pk=None):
        """
        Obtiene las rutas optimizadas para un viaje
        
        GET /api/viajes/{id}/rutas-optimizadas/
        """
        viaje = self.get_object()
        
        # Buscar solicitudes de ruta relacionadas con este viaje
        solicitudes = SolicitudRuta.objects.filter(
            viaje_origen=viaje,
            estado='completado'
        ).prefetch_related('rutas_optimizadas__paradas')
        
        if not solicitudes.exists():
            return Response(
                {'detail': 'No hay rutas optimizadas para este viaje'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serializar todas las rutas optimizadas
        rutas_data = []
        for solicitud in solicitudes:
            for ruta in solicitud.rutas_optimizadas.all():
                rutas_data.append({
                    'id': ruta.id,
                    'solicitud_id': solicitud.id,
                    'vehiculo': {
                        'id': ruta.vehiculo.id,
                        'placa': ruta.vehiculo.placa,
                        'modelo': ruta.vehiculo.modelo
                    },
                    'distancia_total_km': ruta.distancia_total_km,
                    'duracion_total_minutos': ruta.duracion_total_minutos,
                    'paradas': [
                        {
                            'id': parada.id,
                            'ubicacion': {
                                'id': parada.ubicacion.id,
                                'nombre': parada.ubicacion.nombre,
                                'lat': float(parada.ubicacion.lat),
                                'lng': float(parada.ubicacion.lng)
                            },
                            'secuencia': parada.secuencia,
                            'tiempo_estimado_llegada': parada.tiempo_estimado_llegada,
                            'tiempo_estimado_salida': parada.tiempo_estimado_salida,
                            'tipo': parada.tipo
                        }
                        for parada in ruta.paradas.all().order_by('secuencia')
                    ]
                })
        
        return Response({
            'viaje_id': viaje.id,
            'rutas_optimizadas': rutas_data
        })
    
    @action(detail=True, methods=['post'])
    def aplicar_ruta_optimizada(self, request, pk=None):
        """
        Aplica una ruta optimizada al viaje original
        
        POST /api/viajes/{id}/aplicar-ruta-optimizada/
        Body: {"solicitud_id": 123}
        """
        viaje = self.get_object()
        solicitud_id = request.data.get('solicitud_id')
        
        if not solicitud_id:
            return Response(
                {'detail': 'Se requiere solicitud_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            solicitud = get_object_or_404(
                SolicitudRuta, 
                id=solicitud_id, 
                viaje_origen=viaje,
                estado='completado'
            )
            
            # Sincronizar resultado de optimización con el viaje
            viaje_actualizado = viaje_converter_service.sincronizar_resultado_optimizacion(
                solicitud, viaje
            )
            
            return Response({
                'detail': 'Ruta optimizada aplicada al viaje',
                'viaje': ViajeSerializer(viaje_actualizado).data
            })
            
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Error al aplicar ruta optimizada: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OptimizacionMultiplesViajesViewSet(ModelViewSet):
    """
    ViewSet para optimizar múltiples viajes juntos
    """
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer
    
    @action(detail=False, methods=['post'])
    def optimizar_multiples(self, request):
        """
        Optimiza múltiples viajes juntos usando VRP
        
        POST /api/viajes/optimizar-multiples/
        Body: {
            "viaje_ids": [1, 2, 3],
            "nombre_solicitud": "Optimización día 15/01"
        }
        """
        viaje_ids = request.data.get('viaje_ids', [])
        nombre_solicitud = request.data.get('nombre_solicitud')
        
        if not viaje_ids:
            return Response(
                {'detail': 'Se requiere al menos un viaje_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener viajes
            viajes = Viaje.objects.filter(
                id__in=viaje_ids,
                estado='programado'
            )
            
            if len(viajes) != len(viaje_ids):
                return Response(
                    {'detail': 'Algunos viajes no existen o no están programados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convertir múltiples viajes en una solicitud
            solicitud = viaje_converter_service.convertir_multiples_viajes_a_solicitud(
                viajes=list(viajes),
                nombre_solicitud=nombre_solicitud
            )
            
            # Iniciar optimización
            from .tasks import optimizar_ruta_task
            task = optimizar_ruta_task.delay(solicitud.id)
            
            return Response({
                'detail': 'Optimización múltiple iniciada',
                'viaje_ids': viaje_ids,
                'solicitud_id': solicitud.id,
                'task_id': task.id,
                'solicitud': SolicitudRutaSerializer(solicitud).data
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Error al optimizar múltiples viajes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

