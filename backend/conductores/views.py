from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Conductor
from .serializers import (
    ConductorSerializer,
    ConductorCreateSerializer,
    ConductorUpdateSerializer,
    ConductorUbicacionSerializer,
    ConductorEstadoSerializer
)
from users.decorators import requiere_permisos


class ConductorViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de conductores"""
    
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_licencia', 'es_activo']
    search_fields = [
        'usuario__username',
        'usuario__first_name',
        'usuario__last_name',
        'usuario__email',
        'numero_licencia'
    ]
    ordering_fields = ['fecha_creacion', 'experiencia_anos', 'numero_licencia']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return ConductorCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ConductorUpdateSerializer
        return ConductorSerializer
    
    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()
        
        # Si el usuario es conductor, solo puede ver su propio perfil
        if self.request.user.rol and self.request.user.rol.nombre == 'conductor':
            try:
                return queryset.filter(usuario=self.request.user)
            except Conductor.DoesNotExist:
                return queryset.none()
        
        # Otros usuarios pueden ver todos los conductores
        return queryset.select_related('usuario')
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo conductor"""
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar un conductor"""
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar un conductor"""
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Lista conductores disponibles"""
        queryset = self.get_queryset().filter(
            estado='disponible',
            es_activo=True,
            fecha_vencimiento_licencia__gt=timezone.now().date()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def licencias_por_vencer(self, request):
        """Lista conductores con licencias que vencen pronto"""
        dias = request.query_params.get('dias', 30)
        try:
            dias = int(dias)
        except ValueError:
            dias = 30
        
        fecha_limite = timezone.now().date() + timedelta(days=dias)
        queryset = self.get_queryset().filter(
            fecha_vencimiento_licencia__lte=fecha_limite,
            fecha_vencimiento_licencia__gt=timezone.now().date()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def licencias_vencidas(self, request):
        """Lista conductores con licencias vencidas"""
        queryset = self.get_queryset().filter(
            fecha_vencimiento_licencia__lt=timezone.now().date()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def actualizar_ubicacion(self, request, pk=None):
        """Actualizar ubicación del conductor"""
        conductor = self.get_object()
        
        # Solo el propio conductor puede actualizar su ubicación
        if conductor.usuario != request.user and not request.user.tiene_permiso('monitorear_conductores'):
            return Response(
                {'error': 'No tienes permisos para actualizar esta ubicación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ConductorUbicacionSerializer(conductor, data=request.data)
        if serializer.is_valid():
            conductor.actualizar_ubicacion(
                serializer.validated_data['ultima_ubicacion_lat'],
                serializer.validated_data['ultima_ubicacion_lng']
            )
            return Response({'message': 'Ubicación actualizada correctamente'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del conductor"""
        conductor = self.get_object()
        
        # Solo el propio conductor puede cambiar su estado (excepto inactivo)
        if (conductor.usuario != request.user and 
            not request.user.tiene_permiso('gestionar_conductores')):
            return Response(
                {'error': 'No tienes permisos para cambiar este estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ConductorEstadoSerializer(conductor, data=request.data)
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            if conductor.cambiar_estado(nuevo_estado):
                return Response({'message': f'Estado cambiado a {nuevo_estado}'})
            else:
                return Response(
                    {'error': 'Estado inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de conductores"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(es_activo=True).count(),
            'disponibles': queryset.filter(estado='disponible', es_activo=True).count(),
            'ocupados': queryset.filter(estado='ocupado', es_activo=True).count(),
            'en_descanso': queryset.filter(estado='descanso', es_activo=True).count(),
            'inactivos': queryset.filter(estado='inactivo').count(),
            'licencias_vencidas': queryset.filter(
                fecha_vencimiento_licencia__lt=timezone.now().date()
            ).count(),
            'licencias_por_vencer': queryset.filter(
                fecha_vencimiento_licencia__lte=timezone.now().date() + timedelta(days=30),
                fecha_vencimiento_licencia__gt=timezone.now().date()
            ).count()
        }
        
        return Response(stats)
