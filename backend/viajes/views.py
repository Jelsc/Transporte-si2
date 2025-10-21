from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import F, Q
from .models import Viaje, Asiento, Reserva, ItemReserva
from .serializers import (
    ViajeSerializer, 
    AsientoSerializer, 
    ReservaSerializer,
    ReservaSimpleSerializer,
    ItemReservaSerializer,
    CrearReservaTemporalSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny

class ViajeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Viaje.objects.all().order_by('fecha', 'hora')
    serializer_class = ViajeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['origen', 'destino', 'vehiculo__nombre', 'vehiculo__placa']
    filterset_fields = {
        'origen': ['exact'],
        'destino': ['exact'],
        'fecha': ['gte', 'lte'],
        'vehiculo': ['exact'],
        'estado': ['exact'],
    }

class AsientoViewSet(viewsets.ModelViewSet):
    queryset = Asiento.objects.all()
    serializer_class = AsientoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        viaje_id = self.request.query_params.get("viaje")
        if viaje_id:
            queryset = queryset.filter(viaje_id=viaje_id)
        return queryset

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'codigo_reserva', 
        'cliente__username', 
        'cliente__email',
        'cliente__first_name', 
        'cliente__last_name',
        'items__asiento__viaje__origen',
        'items__asiento__viaje__destino'
    ]
    filterset_fields = {
        'cliente': ['exact'],
        'estado': ['exact'],
        'pagado': ['exact'],
        'fecha_reserva': ['gte', 'lte', 'exact'],
        'viaje': ['exact'],
    }
    ordering_fields = ['fecha_reserva', 'total', 'codigo_reserva']
    ordering = ['-fecha_reserva']

    def get_queryset(self):
        queryset = Reserva.objects.all()
        
        viaje_id = self.request.query_params.get('viaje')
        if viaje_id:
            queryset = queryset.filter(viaje_id=viaje_id)
        
        codigo_reserva = self.request.query_params.get('codigo_reserva')
        if codigo_reserva:
            queryset = queryset.filter(codigo_reserva__icontains=codigo_reserva)
        
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset.order_by('-fecha_reserva')
        return queryset.filter(cliente=self.request.user).order_by('-fecha_reserva')

    def get_serializer_class(self):
        if self.action == 'crear_reserva_temporal':
            return CrearReservaTemporalSerializer
        elif self.action == 'create_simple':
            return ReservaSimpleSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)

    # ✅ CORREGIDO: Crear reserva temporal con LOCK atómico
    @action(detail=False, methods=['post'], url_path='crear-temporal')
    def crear_reserva_temporal(self, request):
        """
        Crear reserva temporal con expiración (15 minutos)
        POST /api/reservas/crear-temporal/
        {
            "viaje_id": 1,
            "asientos_ids": [1, 2, 3],
            "monto_total": 150.00
        }
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                viaje_id = serializer.validated_data['viaje_id']
                asientos_ids = serializer.validated_data['asientos_ids']
                monto_total = serializer.validated_data.get('monto_total', 0)
                
                # ✅ CORRECCIÓN CRÍTICA: Primero hacer LOCK de todos los asientos
                # Esto previene race conditions
                asientos = Asiento.objects.filter(
                    id__in=asientos_ids, 
                    viaje_id=viaje_id
                ).select_for_update()
                
                # ✅ Verificar disponibilidad DESPUÉS del lock (operación atómica)
                asientos_no_disponibles = []
                asientos_disponibles = []
                
                for asiento in asientos:
                    if asiento.estado == 'libre':
                        asientos_disponibles.append(asiento)
                    else:
                        asientos_no_disponibles.append(asiento.numero)
                
                # Si hay asientos no disponibles, retornar error
                if asientos_no_disponibles:
                    return Response({
                        'success': False,
                        'error': f'Algunos asientos ya no están disponibles: {", ".join(asientos_no_disponibles)}',
                        'detalles': {
                            'asientos_ocupados': asientos_no_disponibles,
                            'asientos_solicitados': asientos_ids,
                            'timestamp': timezone.now().isoformat()
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Verificar que encontramos todos los asientos solicitados
                if len(asientos_disponibles) != len(asientos_ids):
                    return Response({
                        'success': False,
                        'error': f'No se encontraron todos los asientos. Solicitados: {len(asientos_ids)}, Encontrados: {len(asientos_disponibles)}',
                        'detalles': {
                            'asientos_solicitados': asientos_ids,
                            'asientos_encontrados': [a.id for a in asientos_disponibles]
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # 2. Crear reserva temporal
                reserva = Reserva.objects.create(
                    cliente=request.user,
                    viaje_id=viaje_id,
                    estado='pendiente_pago',
                    fecha_expiracion=timezone.now() + timedelta(minutes=15),
                    total=monto_total
                )
                
                # 3. Crear items de reserva y marcar asientos como reservados
                items_reserva = []
                for asiento in asientos_disponibles:
                    items_reserva.append(
                        ItemReserva(
                            reserva=reserva,
                            asiento=asiento,
                            precio=asiento.viaje.precio
                        )
                    )
                    # Actualizar estado del asiento
                    asiento.estado = 'reservado'
                    asiento.reserva_temporal = reserva
                    asiento.save()
                
                # Crear todos los items de reserva
                ItemReserva.objects.bulk_create(items_reserva)
                
                # 4. Actualizar contadores del viaje
                try:
                    viaje = Viaje.objects.get(id=viaje_id)
                    asientos_ocupados = Asiento.objects.filter(
                        viaje=viaje, 
                        estado__in=['ocupado', 'reservado']
                    ).count()
                    
                    viaje.asientos_ocupados = asientos_ocupados
                    viaje.asientos_disponibles = viaje.vehiculo.capacidad_pasajeros - asientos_ocupados
                    viaje.save(update_fields=['asientos_ocupados', 'asientos_disponibles'])
                except Viaje.DoesNotExist:
                    # Si el viaje no existe, continuar sin actualizar contadores
                    pass
                
                # 5. Serializar respuesta
                reserva_data = ReservaSerializer(reserva, context={'request': request}).data
                
                return Response({
                    'success': True,
                    'message': 'Reserva temporal creada exitosamente. Tienes 15 minutos para completar el pago.',
                    'data': reserva_data,
                    'expiracion': reserva.fecha_expiracion.isoformat(),
                    'tiempo_restante': reserva.tiempo_restante,
                    'asientos_reservados': [a.numero for a in asientos_disponibles],
                    'reserva_id': reserva.id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            # Log del error para debugging
            import traceback
            error_details = traceback.format_exc()
            print(f"❌ Error en crear_reserva_temporal: {str(e)}")
            print(f"📋 Traceback: {error_details}")
            
            return Response({
                'success': False,
                'error': 'Error al crear reserva temporal',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ✅ NUEVO ENDPOINT: Verificar disponibilidad de asientos
    @action(detail=False, methods=['post'], url_path='verificar-disponibilidad')
    def verificar_disponibilidad(self, request):
        """
        Verificar disponibilidad de asientos antes de reservar
        POST /api/reservas/verificar-disponibilidad/
        {
            "viaje_id": 1,
            "asientos_ids": [1, 2, 3]
        }
        """
        viaje_id = request.data.get('viaje_id')
        asientos_ids = request.data.get('asientos_ids', [])
        
        if not viaje_id or not asientos_ids:
            return Response({
                'success': False,
                'error': 'Se requieren viaje_id y asientos_ids'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar disponibilidad sin lock (solo lectura)
            asientos = Asiento.objects.filter(
                id__in=asientos_ids,
                viaje_id=viaje_id
            )
            
            asientos_disponibles = []
            asientos_ocupados = []
            
            for asiento in asientos:
                if asiento.estado == 'libre':
                    asientos_disponibles.append({
                        'id': asiento.id,
                        'numero': asiento.numero,
                        'estado': asiento.estado
                    })
                else:
                    asientos_ocupados.append({
                        'id': asiento.id,
                        'numero': asiento.numero,
                        'estado': asiento.estado,
                        'reserva_temporal': asiento.reserva_temporal_id
                    })
            
            return Response({
                'success': True,
                'disponible': len(asientos_ocupados) == 0,
                'asientos_disponibles': asientos_disponibles,
                'asientos_ocupados': asientos_ocupados,
                'total_solicitados': len(asientos_ids),
                'total_encontrados': len(asientos),
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al verificar disponibilidad',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ✅ NUEVO ENDPOINT: Confirmar pago de reserva temporal
    @action(detail=True, methods=['post'], url_path='confirmar-pago')
    def confirmar_pago(self, request, pk=None):
        """
        Confirmar pago de reserva temporal
        POST /api/reservas/{id}/confirmar-pago/
        """
        try:
            reserva = self.get_object()
            
            if reserva.cliente != request.user and not (request.user.is_staff or request.user.is_superuser):
                return Response({
                    'success': False,
                    'error': 'No tiene permisos para confirmar esta reserva'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if reserva.estado != 'pendiente_pago':
                return Response({
                    'success': False,
                    'error': f'La reserva no está pendiente de pago. Estado actual: {reserva.estado}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if reserva.esta_expirada:
                return Response({
                    'success': False,
                    'error': 'La reserva ha expirado. Por favor, crea una nueva reserva.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                reserva.confirmar_pago()
            
            reserva_data = ReservaSerializer(reserva, context={'request': request}).data
            
            return Response({
                'success': True,
                'message': 'Pago confirmado exitosamente. Reserva activada.',
                'data': reserva_data
            })
            
        except Reserva.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Reserva no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al confirmar pago',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ✅ NUEVO ENDPOINT: Cancelar reserva temporal
    @action(detail=True, methods=['post'], url_path='cancelar-temporal')
    def cancelar_temporal(self, request, pk=None):
        """
        Cancelar reserva temporal (antes de que expire)
        POST /api/reservas/{id}/cancelar-temporal/
        """
        try:
            reserva = self.get_object()
            
            if reserva.cliente != request.user and not (request.user.is_staff or request.user.is_superuser):
                return Response({
                    'success': False,
                    'error': 'No tiene permisos para cancelar esta reserva'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if reserva.estado != 'pendiente_pago':
                return Response({
                    'success': False,
                    'error': f'Solo se pueden cancelar reservas temporales. Estado actual: {reserva.estado}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                reserva.estado = 'cancelada'
                reserva.save()
                reserva.liberar_asientos()
            
            return Response({
                'success': True,
                'message': 'Reserva temporal cancelada exitosamente. Los asientos han sido liberados.'
            })
            
        except Reserva.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Reserva no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al cancelar reserva',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ✅ NUEVO ENDPOINT: Verificar estado de reserva temporal
    @action(detail=True, methods=['get'], url_path='estado-temporal')
    def estado_temporal(self, request, pk=None):
        """
        Obtener estado de reserva temporal (incluyendo tiempo restante)
        GET /api/reservas/{id}/estado-temporal/
        """
        try:
            reserva = self.get_object()
            
            if reserva.cliente != request.user and not (request.user.is_staff or request.user.is_superuser):
                return Response({
                    'success': False,
                    'error': 'No tiene permisos para ver esta reserva'
                }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'success': True,
                'data': {
                    'id': reserva.id,
                    'codigo_reserva': reserva.codigo_reserva,
                    'estado': reserva.estado,
                    'esta_expirada': reserva.esta_expirada,
                    'tiempo_restante': reserva.tiempo_restante,
                    'fecha_expiracion': reserva.fecha_expiracion.isoformat() if reserva.fecha_expiracion else None,
                    'asientos': [item.asiento.numero for item in reserva.items.all()],
                    'viaje': {
                        'origen': reserva.viaje.origen,
                        'destino': reserva.viaje.destino,
                        'fecha': reserva.viaje.fecha,
                        'hora': reserva.viaje.hora
                    } if reserva.viaje else None
                }
            })
            
        except Reserva.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Reserva no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

    # ✅ ENDPOINT EXISTENTE: Crear reserva simple (compatibilidad)
    @action(detail=False, methods=['post'], url_path='simple')
    def create_simple(self, request):
        """
        Endpoint para crear reservas simples (compatibilidad)
        POST /api/reservas/simple/
        """
        serializer = ReservaSimpleSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ ENDPOINT EXISTENTE: Detalle completo
    @action(detail=True, methods=['get'], url_path='detalle-completo')
    def detalle_completo(self, request, pk=None):
        """
        Obtiene el detalle completo de una reserva con todos sus items
        GET /api/reservas/{id}/detalle-completo/
        """
        try:
            reserva = self.get_object()
            
            if not (request.user.is_staff or request.user.is_superuser) and reserva.cliente != request.user:
                return Response(
                    {"error": "No tiene permisos para ver esta reserva"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = ReservaSerializer(reserva, context={'request': request})
            return Response(serializer.data)
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    # ✅ ENDPOINT EXISTENTE: Agregar asientos
    @action(detail=True, methods=['post'], url_path='agregar-asientos')
    def agregar_asientos(self, request, pk=None):
        """
        Agrega asientos adicionales a una reserva existente
        POST /api/reservas/{id}/agregar-asientos/
        {
            "asientos_ids": [6, 7, 8]
        }
        """
        try:
            reserva = self.get_object()
            
            if reserva.cliente != request.user and not (request.user.is_staff or request.user.is_superuser):
                return Response(
                    {"error": "No tiene permisos para modificar esta reserva"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if reserva.estado not in ['pendiente_pago', 'confirmada']:
                return Response(
                    {"error": "No se puede modificar una reserva en estado: " + reserva.estado}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            asientos_ids = request.data.get('asientos_ids', [])
            
            if not asientos_ids:
                return Response(
                    {"error": "Debe proporcionar asientos_ids"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                asientos = Asiento.objects.filter(id__in=asientos_ids)
                
                if len(asientos) != len(asientos_ids):
                    return Response(
                        {"error": "Algunos asientos no existen"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                asientos_ocupados = asientos.filter(estado__in=['ocupado', 'reservado'])
                if asientos_ocupados.exists():
                    numeros_ocupados = list(asientos_ocupados.values_list('numero', flat=True))
                    return Response(
                        {"error": f"Los asientos {numeros_ocupados} no están disponibles"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                nuevos_items = []
                for asiento in asientos:
                    nuevos_items.append(
                        ItemReserva(
                            reserva=reserva,
                            asiento=asiento,
                            precio=asiento.viaje.precio
                        )
                    )
                
                ItemReserva.objects.bulk_create(nuevos_items)
            
            reserva.refresh_from_db()
            serializer = ReservaSerializer(reserva, context={'request': request})
            
            return Response({
                "success": True,
                "message": f"Se agregaron {len(nuevos_items)} asientos a la reserva",
                "reserva": serializer.data
            })
            
        except Reserva.DoesNotExist:
            return Response(
                {"error": "Reserva no encontrada"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ItemReservaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ItemReserva.objects.all()
    serializer_class = ItemReservaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return ItemReserva.objects.all()
        return ItemReserva.objects.filter(reserva__cliente=self.request.user)