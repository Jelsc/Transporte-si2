from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from django.utils import timezone
from .models import Encomienda, Seguimiento
from .serializers import (
    EncomiendaSerializer, CreateEncomiendaSerializer, UpdateEncomiendaSerializer,
    AsignarConductorSerializer, ActualizarEstadoSerializer, SeguimientoSerializer
)
from .filters import EncomiendaFilter
from conductores.models import Conductor
from pagos.models import Pago
import json

class EncomiendaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = EncomiendaFilter

    def get_queryset(self):
        user = self.request.user
        
        # Admin ve todas las encomiendas
        if user.is_staff:
            return Encomienda.objects.all().prefetch_related('seguimientos')
        
        # Conductores ven sus encomiendas asignadas
        if hasattr(user, 'conductor'):
            return Encomienda.objects.filter(
                conductor_asignado=user.conductor
            ).prefetch_related('seguimientos')
        
        # Usuarios normales ven solo sus encomiendas
        return Encomienda.objects.filter(
            creado_por=user
        ).prefetch_related('seguimientos')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateEncomiendaSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateEncomiendaSerializer
        return EncomiendaSerializer

    def perform_create(self, serializer):
        # Calcular precio automáticamente si no se proporciona
        instance = serializer.save(creado_por=self.request.user)
        
        # Si no tiene precio, calcularlo
        if not instance.precio or instance.precio == 0:
            instance.precio = self.calcular_precio(instance.peso, instance.destino_ciudad)
            instance.save()
        
        # Crear primer seguimiento
        Seguimiento.objects.create(
            encomienda=instance,
            evento="Encomienda registrada",
            descripcion="La encomienda ha sido registrada en el sistema y está pendiente de procesar."
        )

    def calcular_precio(self, peso, destino):
        precios_base = {
            'La Paz': 20, 'Santa Cruz': 25, 'Cochabamba': 22, 'Oruro': 18,
            'Potosi': 20, 'Tarija': 23, 'Beni': 30, 'Pando': 35,
        }
        base = precios_base.get(destino, 25)
        adicional_peso = peso > 1 and (peso - 1) * 5 or 0
        return base + adicional_peso

    @action(detail=False, methods=['get'])
    def mis_encomiendas(self, request):
        """Encomiendas del usuario autenticado"""
        encomiendas = Encomienda.objects.filter(creado_por=request.user)
        page = self.paginate_queryset(encomiendas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(encomiendas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def asignadas(self, request):
        """Encomiendas asignadas al conductor autenticado"""
        if not hasattr(request.user, 'conductor'):
            return Response(
                {'error': 'Usuario no es conductor'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        encomiendas = Encomienda.objects.filter(
            conductor_asignado=request.user.conductor
        )
        serializer = self.get_serializer(encomiendas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def asignar_conductor(self, request, pk=None):
        """Asignar conductor a encomienda"""
        encomienda = self.get_object()
        serializer = AsignarConductorSerializer(data=request.data)
        
        if serializer.is_valid():
            conductor_id = serializer.validated_data['conductor_id']
            
            try:
                conductor = Conductor.objects.get(id=conductor_id, activo=True)
                encomienda.conductor_asignado = conductor
                encomienda.save()
                
                # Crear seguimiento
                Seguimiento.objects.create(
                    encomienda=encomienda,
                    evento="Conductor asignado",
                    descripcion=f"Conductor {conductor.nombre} asignado a la encomienda."
                )
                
                return Response(EncomiendaSerializer(encomienda).data)
                
            except Conductor.DoesNotExist:
                return Response(
                    {'error': 'Conductor no encontrado o inactivo'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def actualizar_estado(self, request, pk=None):
        """Actualizar estado de la encomienda"""
        encomienda = self.get_object()
        serializer = ActualizarEstadoSerializer(data=request.data)
        
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            notas = serializer.validated_data.get('notas', '')
            
            # Actualizar estado
            encomienda.estado = nuevo_estado
            
            # Si se marca como entregado, establecer fecha de entrega
            if nuevo_estado == 'entregado' and not encomienda.fecha_entrega_real:
                encomienda.fecha_entrega_real = timezone.now()
            
            encomienda.save()
            
            # Crear seguimiento
            evento = f"Estado actualizado a {nuevo_estado}"
            descripcion = f"La encomienda ha sido marcada como {nuevo_estado}."
            if notas:
                descripcion += f" Notas: {notas}"
            
            Seguimiento.objects.create(
                encomienda=encomienda,
                evento=evento,
                descripcion=descripcion
            )
            
            return Response(EncomiendaSerializer(encomienda).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='seguimiento/(?P<codigo>[^/.]+)')
    def seguimiento(self, request, codigo=None):
        """Obtener encomienda por código de seguimiento (público)"""
        try:
            encomienda = Encomienda.objects.get(codigo_seguimiento=codigo)
            serializer = EncomiendaSerializer(encomienda)
            return Response(serializer.data)
        except Encomienda.DoesNotExist:
            return Response(
                {'error': 'Encomienda no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de encomiendas"""
        user = request.user
        
        if user.is_staff:
            # Estadísticas para admin
            total = Encomienda.objects.count()
            pendientes = Encomienda.objects.filter(estado='pendiente').count()
            en_ruta = Encomienda.objects.filter(estado='en_ruta').count()
            entregados = Encomienda.objects.filter(estado='entregado').count()
            cancelados = Encomienda.objects.filter(estado='cancelado').count()
            ingresos_totales = Encomienda.objects.aggregate(
                total=Sum('precio')
            )['total'] or 0
        else:
            # Estadísticas para usuario normal
            total = Encomienda.objects.filter(creado_por=user).count()
            pendientes = Encomienda.objects.filter(creado_por=user, estado='pendiente').count()
            en_ruta = Encomienda.objects.filter(creado_por=user, estado='en_ruta').count()
            entregados = Encomienda.objects.filter(creado_por=user, estado='entregado').count()
            cancelados = Encomienda.objects.filter(creado_por=user, estado='cancelado').count()
            ingresos_totales = Encomienda.objects.filter(creado_por=user).aggregate(
                total=Sum('precio')
            )['total'] or 0

        stats = {
            'total': total,
            'pendientes': pendientes,
            'en_ruta': en_ruta,
            'entregados': entregados,
            'cancelados': cancelados,
            'ingresos_totales': float(ingresos_totales),
        }
        
        return Response(stats)

    # Métodos para integración con pagos
    @action(detail=True, methods=['post'])
    def crear_pago_stripe(self, request, pk=None):
        """Crear pago en Stripe"""
        encomienda = self.get_object()
        
        # Verificar que no tenga pago completado
        if encomienda.estado_pago == 'completado':
            return Response(
                {'error': 'La encomienda ya tiene un pago completado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aquí integrar con la app de pagos
        # Por ahora simulamos la creación
        try:
            # Esta parte se integraría con tu app de pagos
            # payment_intent = stripe.PaymentIntent.create(...)
            
            # Simulación
            payment_intent = {
                'id': f"pi_{encomienda.codigo_seguimiento.lower()}",
                'client_secret': f"secret_{encomienda.codigo_seguimiento.lower()}",
                'amount': int(encomienda.precio * 100),  # En centavos
                'currency': 'bob'
            }
            
            # Actualizar encomienda
            encomienda.estado_pago = 'procesando'
            encomienda.pago_info = payment_intent
            encomienda.save()
            
            return Response(payment_intent)
            
        except Exception as e:
            return Response(
                {'error': f'Error al crear pago: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def confirmar_pago(self, request, pk=None):
        """Confirmar pago de Stripe"""
        encomienda = self.get_object()
        payment_intent_id = request.data.get('payment_intent_id')
        
        if not payment_intent_id:
            return Response(
                {'error': 'payment_intent_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aquí integrar con la app de pagos para confirmar
        try:
            # Simulación de confirmación exitosa
            encomienda.estado_pago = 'completado'
            encomienda.save()
            
            # Crear seguimiento
            Seguimiento.objects.create(
                encomienda=encomienda,
                evento="Pago confirmado",
                descripcion="El pago ha sido confirmado exitosamente."
            )
            
            return Response(EncomiendaSerializer(encomienda).data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al confirmar pago: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def marcar_pago_efectivo(self, request, pk=None):
        """Marcar pago en efectivo como completado (solo admin)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Solo administradores pueden realizar esta acción'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        encomienda = self.get_object()
        encomienda.estado_pago = 'completado'
        encomienda.save()
        
        # Crear seguimiento
        Seguimiento.objects.create(
            encomienda=encomienda,
            evento="Pago en efectivo confirmado",
            descripcion="El pago en efectivo ha sido marcado como completado por el administrador."
        )
        
        return Response(EncomiendaSerializer(encomienda).data)