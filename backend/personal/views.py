from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import date, timedelta

from .models import PersonalEmpresa, Departamento
from .serializers import (
    PersonalEmpresaSerializer,
    PersonalEmpresaCreateSerializer,
    PersonalEmpresaUpdateSerializer,
    PersonalEmpresaEstadoSerializer,
    DepartamentoSerializer
)
from users.decorators import requiere_permisos


class PersonalEmpresaViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de personal de empresa"""
    
    queryset = PersonalEmpresa.objects.all()
    serializer_class = PersonalEmpresaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_personal', 'departamento', 'estado', 'es_activo']
    search_fields = [
        'usuario__username',
        'usuario__first_name',
        'usuario__last_name',
        'usuario__email',
        'codigo_empleado',
        'departamento',
        'cargo'
    ]
    ordering_fields = ['fecha_creacion', 'fecha_ingreso', 'codigo_empleado']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return PersonalEmpresaCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PersonalEmpresaUpdateSerializer
        return PersonalEmpresaSerializer
    
    def get_queryset(self):
        """Filtra el queryset según los permisos del usuario"""
        queryset = super().get_queryset()
        
        # Si el usuario es personal de empresa, puede ver su propio perfil
        if (self.request.user.rol and 
            self.request.user.rol.nombre in ['administrador', 'supervisor', 'operador']):
            try:
                personal = queryset.get(usuario=self.request.user)
                # Si es supervisor o administrador, puede ver a sus subordinados
                if personal.tipo_personal in ['supervisor', 'administrador']:
                    subordinados = personal.get_subordinados()
                    return queryset.filter(
                        Q(usuario=self.request.user) | Q(id__in=subordinados.values_list('id', flat=True))
                    ).select_related('usuario', 'supervisor')
                else:
                    return queryset.filter(usuario=self.request.user)
            except PersonalEmpresa.DoesNotExist:
                return queryset.none()
        
        # Otros usuarios pueden ver todos los empleados
        return queryset.select_related('usuario', 'supervisor')
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo empleado"""
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar un empleado"""
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar un empleado"""
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def por_departamento(self, request):
        """Lista empleados por departamento"""
        departamento = request.query_params.get('departamento')
        if not departamento:
            return Response(
                {'error': 'Parámetro departamento requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(departamento=departamento)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Lista empleados por tipo de personal"""
        tipo = request.query_params.get('tipo')
        if not tipo:
            return Response(
                {'error': 'Parámetro tipo requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(tipo_personal=tipo)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def subordinados(self, request):
        """Lista subordinados del usuario actual"""
        try:
            personal = PersonalEmpresa.objects.get(usuario=request.user)
            subordinados = personal.get_subordinados()
            serializer = self.get_serializer(subordinados, many=True)
            return Response(serializer.data)
        except PersonalEmpresa.DoesNotExist:
            return Response(
                {'error': 'Usuario no es personal de empresa'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def jerarquia(self, request, pk=None):
        """Obtiene la jerarquía del empleado"""
        empleado = self.get_object()
        jerarquia = empleado.get_jerarquia()
        
        # Serializar la información
        data = {
            'empleado': self.get_serializer(empleado).data,
            'supervisor': self.get_serializer(empleado.supervisor).data if empleado.supervisor else None,
            'subordinados': self.get_serializer(empleado.get_subordinados(), many=True).data,
            'nivel': jerarquia['nivel']
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del empleado"""
        empleado = self.get_object()
        
        # Solo administradores o el propio empleado pueden cambiar estado
        if (empleado.usuario != request.user and 
            not request.user.tiene_permiso('gestionar_usuarios')):
            return Response(
                {'error': 'No tienes permisos para cambiar este estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = PersonalEmpresaEstadoSerializer(empleado, data=request.data)
        if serializer.is_valid():
            nuevo_estado = serializer.validated_data['estado']
            if empleado.cambiar_estado(nuevo_estado):
                return Response({'message': f'Estado cambiado a {nuevo_estado}'})
            else:
                return Response(
                    {'error': 'Estado inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de personal"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(es_activo=True).count(),
            'por_tipo': dict(queryset.values('tipo_personal').annotate(
                count=Count('id')
            ).values_list('tipo_personal', 'count')),
            'por_departamento': dict(queryset.values('departamento').annotate(
                count=Count('id')
            ).values_list('departamento', 'count')),
            'por_estado': dict(queryset.values('estado').annotate(
                count=Count('id')
            ).values_list('estado', 'count')),
            'nuevos_este_mes': queryset.filter(
                fecha_ingreso__gte=date.today().replace(day=1)
            ).count()
        }
        
        return Response(stats)


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para el CRUD de departamentos"""
    
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['es_activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo departamento"""
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar un departamento"""
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar un departamento"""
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def empleados(self, request, pk=None):
        """Lista empleados del departamento"""
        departamento = self.get_object()
        empleados = departamento.get_empleados()
        serializer = PersonalEmpresaSerializer(empleados, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de departamentos"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'activos': queryset.filter(es_activo=True).count(),
            'con_jefe': queryset.filter(jefe_departamento__isnull=False).count(),
            'sin_jefe': queryset.filter(jefe_departamento__isnull=True).count(),
            'empleados_por_departamento': [
                {
                    'departamento': dept.nombre,
                    'empleados': dept.get_empleados_count()
                }
                for dept in queryset.filter(es_activo=True)
            ]
        }
        
        return Response(stats)
