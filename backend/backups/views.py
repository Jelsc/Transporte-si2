# backups/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse
from django.db import models
from .models import BackupConfig, Backup
from .serializers import (
    BackupConfigSerializer,
    BackupSerializer,
    CreateBackupSerializer
)
from .services import BackupService
from bitacora.utils import registrar_bitacora


class BackupConfigViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de backups"""
    queryset = BackupConfig.objects.all()
    serializer_class = BackupConfigSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def perform_create(self, serializer):
        config = serializer.save(creado_por=self.request.user)
        
        # Calcular próximo backup
        if config.frecuencia != 'manual':
            backup_service = BackupService()
            config.proximo_backup = backup_service.calcular_proximo_backup(config)
            config.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Crear Configuración de Backup",
            descripcion=f"Configuración creada: {config.nombre}",
            modulo="BACKUPS"
        )
    
    def perform_update(self, serializer):
        config = serializer.save()
        
        # Recalcular próximo backup
        if config.frecuencia != 'manual' and config.activo:
            backup_service = BackupService()
            config.proximo_backup = backup_service.calcular_proximo_backup(config)
            config.save()
        
        registrar_bitacora(
            request=self.request,
            usuario=self.request.user,
            accion="Actualizar Configuración de Backup",
            descripcion=f"Configuración actualizada: {config.nombre}",
            modulo="BACKUPS"
        )


class BackupViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para backups realizados"""
    queryset = Backup.objects.all()
    serializer_class = BackupSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        tipo = self.request.query_params.get('tipo')
        config_id = self.request.query_params.get('config_id')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if config_id:
            queryset = queryset.filter(config_id=config_id)
        
        return queryset.order_by('-inicio')
    
    @action(detail=False, methods=['post'])
    def crear_backup(self, request):
        """
        Crear un backup manual
        POST /api/backups/backups/crear_backup/
        """
        serializer = CreateBackupSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            backup_service = BackupService()
            resultado = backup_service.crear_backup_database(
                usuario=request.user,
                config=None
            )
            
            if resultado['success']:
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Crear Backup Manual",
                    descripcion=f"Backup creado: {resultado['backup'].nombre_archivo}",
                    modulo="BACKUPS"
                )
                
                return Response({
                    'success': True,
                    'mensaje': resultado['mensaje'],
                    'backup': BackupSerializer(resultado['backup']).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': resultado['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def restaurar(self, request, pk=None):
        """
        Restaurar un backup
        POST /api/backups/backups/{id}/restaurar/
        """
        backup = self.get_object()
        
        # Confirmación requerida
        confirmacion = request.data.get('confirmacion', False)
        if not confirmacion:
            return Response({
                'success': False,
                'error': 'Se requiere confirmación explícita para restaurar un backup'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            backup_service = BackupService()
            resultado = backup_service.restaurar_backup(
                backup_id=backup.id,
                usuario=request.user
            )
            
            if resultado['success']:
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Restaurar Backup",
                    descripcion=f"Backup restaurado: {backup.nombre_archivo}",
                    modulo="BACKUPS"
                )
                
                return Response({
                    'success': True,
                    'mensaje': resultado['mensaje']
                })
            else:
                return Response({
                    'success': False,
                    'error': resultado['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        """
        Descargar un backup
        GET /api/backups/backups/{id}/descargar/
        """
        backup = self.get_object()
        
        try:
            backup_service = BackupService()
            ruta_archivo = backup_service.descargar_backup(backup.id)
            
            if ruta_archivo and ruta_archivo.exists():
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Descargar Backup",
                    descripcion=f"Backup descargado: {backup.nombre_archivo}",
                    modulo="BACKUPS"
                )
                
                response = FileResponse(
                    open(ruta_archivo, 'rb'),
                    content_type='application/octet-stream'
                )
                response['Content-Disposition'] = f'attachment; filename="{backup.nombre_archivo}"'
                return response
            else:
                return Response({
                    'success': False,
                    'error': 'Archivo de backup no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'])
    def eliminar_backup(self, request, pk=None):
        """
        Eliminar un backup
        DELETE /api/backups/backups/{id}/eliminar_backup/
        """
        backup = self.get_object()
        
        try:
            backup_service = BackupService()
            resultado = backup_service.eliminar_backup(backup.id)
            
            if resultado['success']:
                registrar_bitacora(
                    request=request,
                    usuario=request.user,
                    accion="Eliminar Backup",
                    descripcion=f"Backup eliminado: {backup.nombre_archivo}",
                    modulo="BACKUPS"
                )
                
                return Response({
                    'success': True,
                    'mensaje': resultado['mensaje']
                })
            else:
                return Response({
                    'success': False,
                    'error': resultado['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas de backups
        GET /api/backups/backups/estadisticas/
        """
        try:
            backup_service = BackupService()
            stats = backup_service.obtener_estadisticas()
            
            return Response({
                'success': True,
                'data': {
                    'total_backups': stats['total_backups'],
                    'completados': stats['completados'],
                    'fallidos': stats['fallidos'],
                    'tamanio_total': stats['tamanio_total'],
                    'ultimo_backup': BackupSerializer(stats['ultimo_backup']).data if stats['ultimo_backup'] else None
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
