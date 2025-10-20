# encomiendas/views.py - VERSIÓN CORREGIDA
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser  # ✅ Importar ambos
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Encomienda, EncomiendaSeguimiento, TarifaEncomienda
from .serializers import (
    EncomiendaSerializer, CreateEncomiendaSerializer, UpdateEncomiendaSerializer,
    EncomiendaSeguimientoSerializer, AsignarConductorSerializer,
    ActualizarEstadoSerializer, TarifaEncomiendaSerializer, EncomiendaStatsSerializer
)
from .filters import EncomiendaFilter

User = get_user_model()

class EncomiendaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EncomiendaFilter
    search_fields = ['codigo_seguimiento', 'destinatario_nombre', 'remitente_nombre']
    ordering_fields = ['fecha_creacion', 'peso', 'precio']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        user = self.request.user
        queryset = Encomienda.objects.select_related('conductor_asignado', 'creado_por').prefetch_related('seguimientos')
        
        if user.groups.filter(name='Conductores').exists():
            return queryset.filter(conductor_asignado=user)
        elif not user.is_staff:
            return queryset.filter(creado_por=user)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateEncomiendaSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateEncomiendaSerializer
        return EncomiendaSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='seguimiento/(?P<codigo>[^/.]+)')
    def seguimiento(self, request, codigo=None):
        try:
            encomienda = Encomienda.objects.get(codigo_seguimiento=codigo)
            serializer = EncomiendaSerializer(encomienda)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Encomienda.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Encomienda no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def mis_encomiendas(self, request):
      encomiendas = self.get_queryset().filter(creado_por=request.user)
    
      page = self.paginate_queryset(encomiendas)
      if page is not None:
        serializer = self.get_serializer(page, many=True)
        return Response({
            'success': True,
            'data': {
                'count': self.paginator.page.paginator.count,
                'results': serializer.data
            }
        })
    
      serializer = self.get_serializer(encomiendas, many=True)
      return Response({
        'success': True,
        'data': {
            'count': encomiendas.count(),
            'results': serializer.data
        }
    })



    @action(detail=False, methods=['get'])
    def asignadas(self, request):
       if not request.user.groups.filter(name='Conductores').exists():
         return Response({
            'success': False,
            'error': 'No tienes permisos de conductor'
         }, status=status.HTTP_403_FORBIDDEN)
    
       encomiendas = self.get_queryset().filter(conductor_asignado=request.user)
    
       page = self.paginate_queryset(encomiendas)
       if page is not None:
        serializer = self.get_serializer(page, many=True)
        return Response({
            'success': True,
            'data': {
                'count': self.paginator.page.paginator.count,
                'results': serializer.data
            }
        })
    
       serializer = self.get_serializer(encomiendas, many=True)
       return Response({
        'success': True,
        'data': {
            'count': encomiendas.count(),
            'results': serializer.data
        }
    })


    @action(detail=True, methods=['post'])
    def asignar_conductor(self, request, pk=None):
        encomienda = self.get_object()
        serializer = AsignarConductorSerializer(data=request.data)
        
        if serializer.is_valid():
            conductor_id = serializer.validated_data['conductor_id']
            
            try:
                conductor = User.objects.get(id=conductor_id, groups__name='Conductores')
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Conductor no encontrado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            encomienda.conductor_asignado = conductor
            encomienda.save()
            
            EncomiendaSeguimiento.objects.create(
                encomienda=encomienda,
                evento='Conductor asignado',
                descripcion=f'Conductor {conductor.get_full_name()} asignado a la encomienda',
                usuario=request.user
            )
            
            return Response({
                'success': True,
                'data': EncomiendaSerializer(encomienda).data
            })
        
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def actualizar_estado(self, request, pk=None):
        encomienda = self.get_object()
        serializer = ActualizarEstadoSerializer(data=request.data)
        
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            notas = serializer.validated_data.get('notas', '')
            fecha_entrega_real = serializer.validated_data.get('fecha_entrega_real')
            
            if (request.user.groups.filter(name='Conductores').exists() and 
                encomienda.conductor_asignado != request.user):
                return Response({
                    'success': False,
                    'error': 'No tienes permisos para actualizar esta encomienda'
                }, status=status.HTTP_403_FORBIDDEN)
            
            estado_anterior = encomienda.estado
            encomienda.estado = nuevo_estado
            
            if fecha_entrega_real:
                encomienda.fecha_entrega_real = fecha_entrega_real
            elif nuevo_estado == 'entregado' and not encomienda.fecha_entrega_real:
                encomienda.fecha_entrega_real = timezone.now()
            
            if notas:
                encomienda.notas = notas
            
            encomienda.save()
            
            evento_descripcion = {
                'pendiente': 'Encomienda marcada como pendiente',
                'en_ruta': 'Encomienda puesta en ruta',
                'entregado': 'Encomienda entregada al destinatario',
                'cancelado': 'Encomienda cancelada'
            }
            
            EncomiendaSeguimiento.objects.create(
                encomienda=encomienda,
                evento=f'Estado actualizado: {nuevo_estado}',
                descripcion=evento_descripcion.get(nuevo_estado, f'Estado cambiado de {estado_anterior} a {nuevo_estado}'),
                usuario=request.user,
                ubicacion=encomienda.destino_ciudad
            )
            
            return Response({
                'success': True,
                'data': EncomiendaSerializer(encomienda).data
            })
        
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        user = request.user
        queryset = self.get_queryset()
        
        total = queryset.count()
        pendientes = queryset.filter(estado='pendiente').count()
        en_ruta = queryset.filter(estado='en_ruta').count()
        entregados = queryset.filter(estado='entregado').count()
        cancelados = queryset.filter(estado='cancelado').count()
        
        ingresos_totales = queryset.aggregate(
            total_ingresos=Sum('precio')
        )['total_ingresos'] or 0
        
        stats = {
            'total': total,
            'pendientes': pendientes,
            'en_ruta': en_ruta,
            'entregados': entregados,
            'cancelados': cancelados,
            'ingresos_totales': float(ingresos_totales)
        }
        
        return Response({
            'success': True,
            'data': stats
        })

    @action(detail=False, methods=['get'])
    def generar_reporte(self, request):
        filters = request.GET.dict()
        reporte_id = f"reporte_{int(timezone.now().timestamp())}"
        
        return Response({
            'success': True,
            'data': {
                'url': f'/media/reportes/{reporte_id}.pdf'
            }
        })

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'data': {
                'count': response.data.get('count', 0),
                'next': response.data.get('next'),
                'previous': response.data.get('previous'),
                'results': response.data.get('results', [])
            }
        })

class TarifaEncomiendaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = TarifaEncomienda.objects.filter(activo=True)
    serializer_class = TarifaEncomiendaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ciudad']
    ordering_fields = ['ciudad', 'precio_base']
    ordering = ['ciudad']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # ✅ Ya está importado
        return [IsAuthenticated()]  # ✅ Permiso por defecto
    
    def perform_create(self, serializer):
        tarifa = serializer.save()
    
    def perform_update(self, serializer):
        tarifa = serializer.save()
    
    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'data': {
                'count': response.data.get('count', 0),
                'next': response.data.get('next'),
                'previous': response.data.get('previous'),
                'results': response.data.get('results', [])
            }
        })
    
    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return Response({
            'success': True,
            'data': response.data
        })