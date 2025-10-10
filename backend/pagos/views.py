import stripe
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from bitacora.utils import registrar_bitacora
from .models import Pago
from .serializers import PagoSerializer, CrearPagoSerializer, ConfirmarPagoSerializer

# Configurar Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PagoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de pagos"""
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar pagos según el usuario"""
        user = self.request.user
        
        # Si es admin o staff, ver todos los pagos
        if user.is_staff or user.is_superuser:
            return Pago.objects.all().select_related('usuario')
        
        # Si es cliente, solo ver sus propios pagos
        return Pago.objects.filter(usuario=user).select_related('usuario')
    
    def get_serializer_class(self):
        """Retornar el serializer apropiado"""
        if self.action == 'crear_pago':
            return CrearPagoSerializer
        elif self.action == 'confirmar':
            return ConfirmarPagoSerializer
        return PagoSerializer
    
    def list(self, request, *args, **kwargs):
        """
        Listar todos los pagos con filtros opcionales
        GET /api/pagos/pagos/
        """
        queryset = self.get_queryset()
        
        # Filtros opcionales
        estado = request.query_params.get('estado', None)
        metodo_pago = request.query_params.get('metodo_pago', None)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if metodo_pago:
            queryset = queryset.filter(metodo_pago=metodo_pago)
        
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'count': queryset.count(),
            'pagos': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def crear_pago(self, request):
        """
        Crear un nuevo pago con Stripe
        POST /api/pagos/pagos/crear_pago/
        """
        serializer = CrearPagoSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Crear el pago en la BD
            pago = serializer.save(usuario=request.user)
      
            # Si es pago con Stripe, crear Payment Intent
            if pago.metodo_pago == 'stripe':
                # Validar que Stripe esté configurado
                if not settings.STRIPE_SECRET_KEY:
                    pago.delete()
                    return Response({
                        'error': 'Stripe no está configurado correctamente'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Crear Payment Intent en Stripe
                intent = stripe.PaymentIntent.create(
                    amount=int(pago.monto * 100),  # Stripe usa centavos
                    currency='usd',
                    automatic_payment_methods={
                        'enabled': True,
                    },
                    metadata={
                        'pago_id': pago.id,
                        'usuario_id': request.user.id,
                        'usuario_email': request.user.email
                    }
                )
                
                # Guardar el Payment Intent ID
                pago.stripe_payment_intent_id = intent.id
                pago.estado = 'procesando'
                pago.save()
                
                # Registrar en bitácora
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Crear Pago Stripe",
                    descripcion=f"Pago #{pago.id} creado por ${pago.monto}",
                    modulo="PAGOS"
                )
                
                return Response({
                    'success': True,
                    'message': 'Pago creado exitosamente',
                    'pago_id': pago.id,
                    'client_secret': intent.client_secret,
                    'monto': float(pago.monto),
                    'estado': pago.estado,
                    'payment_intent_id': intent.id
                }, status=status.HTTP_201_CREATED)
            
            else:
                # Pago en efectivo o transferencia
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Crear Pago Manual",
                    descripcion=f"Pago #{pago.id} creado por ${pago.monto} - {pago.metodo_pago}",
                    modulo="PAGOS"
                )
                
                return Response({
                    'success': True,
                    'message': 'Pago creado exitosamente',
                    'pago_id': pago.id,
                    'monto': float(pago.monto),
                    'metodo_pago': pago.metodo_pago,
                    'estado': pago.estado
                }, status=status.HTTP_201_CREATED)
        
        except stripe.error.StripeError as e:
            if 'pago' in locals():
                pago.delete()
            
            return Response({
                'error': 'Error de Stripe',
                'detalles': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            if 'pago' in locals():
                pago.delete()
            
            return Response({
                'error': 'Error al crear pago',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """
        Confirmar un pago
        POST /api/pagos/pagos/{id}/confirmar/
        """
        pago = self.get_object()
        
        # Verificar que el pago pertenezca al usuario o sea admin
        if pago.usuario != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response({
                'error': 'No tienes permiso para confirmar este pago'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que el pago no esté ya completado
        if pago.estado == 'completado':
            return Response({
                'error': 'Este pago ya está completado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el pago no esté cancelado
        if pago.estado == 'cancelado':
            return Response({
                'error': 'Este pago está cancelado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ConfirmarPagoSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar el Payment Intent en Stripe
            payment_intent_id = serializer.validated_data['payment_intent_id']
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status == 'succeeded':
                # Marcar como completado
                pago.marcar_completado()
                if intent.latest_charge:
                    pago.stripe_charge_id = intent.latest_charge
                pago.save()
                
                # Registrar en bitácora
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Confirmar Pago",
                    descripcion=f"Pago #{pago.id} confirmado por ${pago.monto}",
                    modulo="PAGOS"
                )
                
                return Response({
                    'success': True,
                    'message': 'Pago confirmado exitosamente',
                    'pago': PagoSerializer(pago).data
                })
            
            else:
                pago.estado = 'fallido'
                pago.save()
                
                return Response({
                    'error': f'El pago no se completó. Estado: {intent.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except stripe.error.StripeError as e:
            return Response({
                'error': 'Error de Stripe',
                'detalles': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': 'Error al confirmar pago',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar un pago"""
        pago = self.get_object()
        
        if pago.usuario != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
        
        if pago.estado == 'completado':
            return Response({'error': 'No se puede cancelar un pago completado'}, status=status.HTTP_400_BAD_REQUEST)
        
        if pago.estado == 'cancelado':
            return Response({'error': 'Este pago ya está cancelado'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if pago.stripe_payment_intent_id:
                try:
                    stripe.PaymentIntent.cancel(pago.stripe_payment_intent_id)
                except stripe.error.InvalidRequestError:
                    pass
            
            pago.marcar_cancelado()
            
            registrar_bitacora(
                request=request,
                usuario=request.user,
                accion="Cancelar Pago",
                descripcion=f"Pago #{pago.id} cancelado",
                modulo="PAGOS"
            )
            
            return Response({
                'success': True,
                'message': 'Pago cancelado exitosamente',
                'pago': PagoSerializer(pago).data
            })
        
        except Exception as e:
            return Response({
                'error': 'Error al cancelar pago',
                'detalles': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def mis_pagos(self, request):
        """Obtener los pagos del usuario autenticado"""
        pagos = Pago.objects.filter(usuario=request.user).order_by('-fecha_creacion')
        total_pagado = pagos.filter(estado='completado').aggregate(total=Sum('monto'))['total'] or 0
        serializer = PagoSerializer(pagos, many=True)
        
        return Response({
            'count': pagos.count(),
            'total_pagado': float(total_pagado),
            'pagos': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de pagos (solo admins)"""
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
        
        total_pagos = Pago.objects.count()
        pagos_completados = Pago.objects.filter(estado='completado').count()
        pagos_pendientes = Pago.objects.filter(estado='pendiente').count()
        pagos_procesando = Pago.objects.filter(estado='procesando').count()
        pagos_cancelados = Pago.objects.filter(estado='cancelado').count()
        monto_total = Pago.objects.filter(estado='completado').aggregate(total=Sum('monto'))['total'] or 0
        
        por_metodo = {}
        for metodo, _ in Pago.METODOS_PAGO:
            count = Pago.objects.filter(metodo_pago=metodo).count()
            por_metodo[metodo] = count
        
        return Response({
            'total_pagos': total_pagos,
            'pagos_completados': pagos_completados,
            'pagos_pendientes': pagos_pendientes,
            'pagos_procesando': pagos_procesando,
            'pagos_cancelados': pagos_cancelados,
            'monto_total_recaudado': float(monto_total),
            'por_metodo': por_metodo
        })