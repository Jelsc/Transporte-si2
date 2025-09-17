from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from bitacora.utils import registrar_bitacora
from .models import Conductor
from .serializers import (
    ConductorSerializer,
    ConductorCreateSerializer,
    ConductorUpdateSerializer,
    ConductorUbicacionSerializer,
    ConductorEstadoSerializer
)


class ConductorViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de conductores"""
    
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'es_activo', 'tipo_licencia']
    search_fields = [
        'nombre',
        'apellido',
        'email',
        'ci',
        'nro_licencia'
    ]
    ordering_fields = ['nombre', 'fecha_creacion', 'fecha_venc_licencia']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ConductorCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ConductorUpdateSerializer
        elif self.action == 'actualizar_ubicacion':
            return ConductorUbicacionSerializer
        elif self.action == 'cambiar_estado':
            return ConductorEstadoSerializer
        return ConductorSerializer
    
    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()
        
        # Si el usuario no tiene permisos para gestionar conductores, solo puede ver su propio perfil
        if not self.request.user.tiene_permiso('gestionar_conductores'):
            if hasattr(self.request.user, 'conductor_profile'):
                return queryset.filter(id=self.request.user.conductor_profile.id)
            else:
                return queryset.none()
        
        return queryset.select_related('usuario')
    
    def perform_create(self, serializer):
        """Crear un nuevo conductor"""
        if not self.request.user.tiene_permiso('gestionar_conductores'):
            raise permissions.PermissionDenied("No tienes permisos para crear conductores")
        
        conductor = serializer.save()
        
        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Crear",
            descripcion=f"Se creó el conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES"
        )
    
    def perform_update(self, serializer):
        """Actualizar un conductor"""
        if not self.request.user.tiene_permiso('gestionar_conductores'):
            raise permissions.PermissionDenied("No tienes permisos para actualizar conductores")
        
        conductor = serializer.save()
        
        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualizar",
            descripcion=f"Se actualizó el conductor {conductor.nombre_completo}",
            modulo="CONDUCTORES"
        )
    
    def perform_destroy(self, instance):
        """Eliminar un conductor"""
        if not self.request.user.tiene_permiso('gestionar_conductores'):
            raise permissions.PermissionDenied("No tienes permisos para eliminar conductores")
        
        nombre_conductor = instance.nombre_completo
        instance.delete()
        
        # Registrar en bitácora
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Eliminar",
            descripcion=f"Se eliminó el conductor {nombre_conductor}",
            modulo="CONDUCTORES"
        )
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del conductor"""
        if not request.user.tiene_permiso('gestionar_conductores'):
            return Response(
                {'error': 'No tienes permisos para cambiar el estado de conductores'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        conductor = self.get_object()
        serializer = self.get_serializer(conductor, data=request.data)
        
        if serializer.is_valid():
            conductor = serializer.save()
            
            # Registrar en bitácora
            registrar_bitacora(
                request=request,
                usuario=request.user,
                accion="Cambiar Estado",
                descripcion=f"Se cambió el estado del conductor {conductor.nombre_completo} a {conductor.estado}",
                modulo="CONDUCTORES"
            )
            
            return Response({
                'message': f'Estado del conductor {conductor.nombre_completo} actualizado a {conductor.estado}',
                'conductor': ConductorSerializer(conductor).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def actualizar_ubicacion(self, request, pk=None):
        """Actualizar ubicación del conductor"""
        conductor = self.get_object()
        serializer = self.get_serializer(conductor, data=request.data)
        
        if serializer.is_valid():
            conductor = serializer.save()
            conductor.actualizar_ubicacion(
                serializer.validated_data['ultima_ubicacion_lat'],
                serializer.validated_data['ultima_ubicacion_lng']
            )
            
            return Response({
                'message': 'Ubicación actualizada correctamente',
                'conductor': ConductorSerializer(conductor).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de conductores"""
        if not request.user.tiene_permiso('gestionar_conductores'):
            return Response(
                {'error': 'No tienes permisos para ver estadísticas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(es_activo=True).count(),
            'inactivos': queryset.filter(es_activo=False).count(),
            'por_estado': dict(queryset.values('estado').annotate(
                count=models.Count('id')
            ).values_list('estado', 'count')),
            'por_tipo_licencia': dict(queryset.values('tipo_licencia').annotate(
                count=models.Count('id')
            ).values_list('tipo_licencia', 'count')),
            'licencias_vencidas': queryset.filter(
                fecha_venc_licencia__lt=timezone.now().date()
            ).count(),
            'licencias_por_vencer': queryset.filter(
                fecha_venc_licencia__lte=timezone.now().date() + timezone.timedelta(days=30),
                fecha_venc_licencia__gte=timezone.now().date()
            ).count(),
            'nuevos_este_mes': queryset.filter(
                fecha_creacion__gte=timezone.now().replace(day=1)
            ).count()
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def disponibles_para_usuario(self, request):
        """Lista conductores disponibles para vincular con usuarios"""
        if not request.user.tiene_permiso('gestionar_usuarios'):
            return Response(
                {'error': 'No tienes permisos para ver conductores disponibles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Conductores que no tienen usuario vinculado
        conductores_disponibles = Conductor.objects.filter(
            usuario__isnull=True,
            es_activo=True
        ).values(
            'id',
            'nombre',
            'apellido',
            'email',
            'ci',
            'telefono',
            'nro_licencia'
        )
        
        return Response(list(conductores_disponibles))
    
    @action(detail=False, methods=['get'])
    def licencias_por_vencer(self, request):
        """Lista conductores con licencias próximas a vencer"""
        if not request.user.tiene_permiso('gestionar_conductores'):
            return Response(
                {'error': 'No tienes permisos para ver licencias por vencer'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Conductores con licencias que vencen en los próximos 30 días
        conductores = Conductor.objects.filter(
            fecha_venc_licencia__lte=timezone.now().date() + timezone.timedelta(days=30),
            fecha_venc_licencia__gte=timezone.now().date(),
            es_activo=True
        )
        
        serializer = self.get_serializer(conductores, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def licencias_vencidas(self, request):
        """Lista conductores con licencias vencidas"""
        if not request.user.tiene_permiso('gestionar_conductores'):
            return Response(
                {'error': 'No tienes permisos para ver licencias vencidas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Conductores con licencias vencidas
        conductores = Conductor.objects.filter(
            fecha_venc_licencia__lt=timezone.now().date(),
            es_activo=True
        )
        
        serializer = self.get_serializer(conductores, many=True)
        return Response(serializer.data)