# reclamos/views.py
from rest_framework import viewsets, status, filters , serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import ReclamosCategoria, Reclamo, ReclamoDetalle, ReclamoAdjunto
from .serializers import (
    ReclamosCategoriaSerializer,
    ReclamoSerializer,
    ReclamoCreateSerializer,
    ReclamoUpdateSerializer,
    ReclamoDetalleSerializer,
    ReclamoAdjuntoSerializer
)

class ReclamosCategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReclamosCategoria.objects.all()
    serializer_class = ReclamosCategoriaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class ReclamoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'categoria', 'prioridad']
    search_fields = ['titulo', 'descripcion', 'numero_guia', 'usuario__first_name', 'usuario__last_name']
    ordering_fields = ['fecha_creacion', 'prioridad', 'estado']
    ordering = ['-fecha_creacion']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Reclamo.objects.all().select_related('usuario', 'agente', 'categoria').prefetch_related('detalles', 'adjuntos')
        
        if not user.is_staff:
            queryset = queryset.filter(usuario=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReclamoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReclamoUpdateSerializer
        return ReclamoSerializer
    
    def perform_create(self, serializer):
        reclamo = serializer.save(usuario=self.request.user)
        
        # Crear primer detalle con la descripción inicial
        ReclamoDetalle.objects.create(
            reclamo=reclamo,
            autor=self.request.user,
            mensaje=f"Reclamo creado: {reclamo.descripcion}"
        )
    
    def create(self, request, *args, **kwargs):
        # Generar título automáticamente si no se proporciona
        if not request.data.get('titulo') and request.data.get('descripcion'):
            descripcion = request.data['descripcion']
            request.data['titulo'] = descripcion[:97] + '...' if len(descripcion) > 100 else descripcion
        
        response = super().create(request, *args, **kwargs)
        
        # Procesar archivos adjuntos si existen
        archivos = request.FILES.getlist('adjuntos')
        for archivo in archivos:
            try:
                self._validar_archivo(archivo)
                ReclamoAdjunto.objects.create(
                    reclamo_id=response.data['id'],
                    nombre_archivo=archivo.name,
                    archivo=archivo
                )
            except Exception as e:
                # Si hay error con archivos, continuamos pero registramos el error
                print(f"Error al subir archivo {archivo.name}: {str(e)}")
        
        return response
    
    def _validar_archivo(self, archivo):
        """Valida el archivo antes de guardarlo"""
        max_size = 5 * 1024 * 1024  # 5MB
        if archivo.size > max_size:
            raise serializers.ValidationError("El archivo excede el tamaño máximo de 5MB")
        
        extension = archivo.name.split('.')[-1].lower()
        allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf']
        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                f"Tipo de archivo no permitido. Use: {', '.join(allowed_extensions)}"
            )
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        reclamo = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Reclamo.ESTADOS):
            return Response(
                {'error': 'Estado inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        estado_anterior = reclamo.estado
        reclamo.estado = nuevo_estado
        
        if nuevo_estado == 'cerrado':
            reclamo.fecha_cierre = timezone.now()
        elif nuevo_estado != 'cerrado' and reclamo.fecha_cierre:
            reclamo.fecha_cierre = None
        
        reclamo.save()
        
        # Registrar en el historial
        if estado_anterior != nuevo_estado:
            ReclamoDetalle.objects.create(
                reclamo=reclamo,
                autor=request.user,
                mensaje=f'Estado cambiado de "{estado_anterior}" a "{nuevo_estado}"'
            )
        
        serializer = self.get_serializer(reclamo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def asignar_agente(self, request, pk=None):
        reclamo = self.get_object()
        agente_id = request.data.get('agente_id')
        
        if not agente_id:
            return Response(
                {'error': 'Se requiere el ID del agente'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            User = get_user_model()
            agente = User.objects.get(id=agente_id, is_staff=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Agente no encontrado o no es staff'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        agente_anterior = reclamo.agente
        reclamo.agente = agente
        reclamo.save()
        
        # Registrar en el historial
        mensaje_asignacion = f'Asignado a {agente.get_full_name() or getattr(agente, "username", "Agente")}'
        if agente_anterior:
            mensaje_asignacion = f'Reasignado de {agente_anterior.get_full_name() or getattr(agente_anterior, "username", "Agente")} a {agente.get_full_name() or getattr(agente, "username", "Agente")}'
        
        ReclamoDetalle.objects.create(
            reclamo=reclamo,
            autor=request.user,
            mensaje=mensaje_asignacion
        )
        
        serializer = self.get_serializer(reclamo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def agregar_comentario(self, request, pk=None):
        reclamo = self.get_object()
        mensaje = request.data.get('mensaje')
        
        if not mensaje or not mensaje.strip():
            return Response(
                {'error': 'El mensaje es requerido y no puede estar vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comentario = ReclamoDetalle.objects.create(
            reclamo=reclamo,
            autor=request.user,
            mensaje=mensaje.strip()
        )
        
        serializer = ReclamoDetalleSerializer(comentario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def subir_adjuntos(self, request, pk=None):
        reclamo = self.get_object()
        archivos = request.FILES.getlist('adjuntos')
        
        if not archivos:
            return Response(
                {'error': 'No se proporcionaron archivos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        adjuntos_creados = []
        for archivo in archivos:
            try:
                self._validar_archivo(archivo)
                adjunto = ReclamoAdjunto.objects.create(
                    reclamo=reclamo,
                    nombre_archivo=archivo.name,
                    archivo=archivo
                )
                adjuntos_creados.append(adjunto)
                
                # Registrar en el historial
                ReclamoDetalle.objects.create(
                    reclamo=reclamo,
                    autor=request.user,
                    mensaje=f'Archivo adjuntado: {archivo.name}'
                )
            except Exception as e:
                return Response(
                    {'error': f'Error con archivo {archivo.name}: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = ReclamoAdjuntoSerializer(adjuntos_creados, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def eliminar_adjunto(self, request, pk=None):
        adjunto_id = request.data.get('adjunto_id')
        if not adjunto_id:
            return Response(
                {'error': 'Se requiere el ID del adjunto'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            adjunto = ReclamoAdjunto.objects.get(id=adjunto_id, reclamo_id=pk)
            nombre_archivo = adjunto.nombre_archivo
            adjunto.archivo.delete()  # Elimina el archivo físico
            adjunto.delete()  # Elimina el registro
            
            # Registrar en el historial
            ReclamoDetalle.objects.create(
                reclamo_id=pk,
                autor=request.user,
                mensaje=f'Archivo eliminado: {nombre_archivo}'
            )
            
            return Response({'message': 'Archivo eliminado correctamente'})
        except ReclamoAdjunto.DoesNotExist:
            return Response(
                {'error': 'Archivo no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ReclamoDetalleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReclamoDetalleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ReclamoDetalle.objects.filter(
            reclamo_id=self.kwargs['reclamo_pk']
        ).select_related('autor').order_by('fecha')